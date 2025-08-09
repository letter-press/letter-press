"use server";

/**
 * Plugin Manager for Letter-Press CMS
 * 
 * Handles plugin loading, lifecycle management, and hook execution.
 * Uses the Letter-Press Plugin SDK for type safety and consistent API.
 * 
 * ARCHITECTURE:
 * - Plugin Discovery: Scans plugins directory for main.js files
 * - Plugin Lifecycle: Discovery → Loading → Installation → Activation → Hook Registration
 * - Hook System: Priority-based execution with error isolation
 * - Database Integration: Plugin metadata and state persistence
 * - Error Handling: Comprehensive error tracking and recovery
 * - Hot Reload: Dynamic enable/disable without restart
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { db } from './db';

// Import types from the Letter-Press Plugin SDK
import type { Plugin, PluginHooks, PluginContext } from '@letter-press/plugin-sdk/types';
import { TypeSafeEventEmitter, PluginEventSystemImpl } from '@letter-press/plugin-sdk/hooks';

interface PluginError {
  pluginId: string;
  message: string;
  timestamp: Date;
  context?: string;
  stack?: string;
}

interface PluginInstance {
  id: string;
  plugin: Plugin;
  enabled: boolean;
  installedAt: Date;
  version: string;
  settings: Record<string, any>;
}

interface HookRegistration {
  callback: (...args: unknown[]) => unknown | Promise<unknown>;
  priority: number;
  pluginId: string;
}

class PluginManager {
  private plugins = new Map<string, PluginInstance>();
  private hooks = new Map<string, HookRegistration[]>();
  private errors: PluginError[] = [];
  private initialized = false;
  private eventEmitter = new TypeSafeEventEmitter({
    maxListeners: 100,
    enableTiming: true,
    enableLogging: true
  });
  private pluginContexts = new Map<string, PluginContext>();

  async initialize(plugins: Plugin[]): Promise<void> {
    if (this.initialized) return;

    console.log('🔌 Initializing plugin system...');
    
    try {
      for (const plugin of plugins) {
        try {
          await this.loadPlugin(plugin);
        } catch (error) {
          console.error(`❌ Failed to load plugin ${plugin.config.name}:`, error);
        }
      }
      await this.executeHook('init');

      this.initialized = true;
      console.log(`✅ Plugin system initialized. Loaded ${this.plugins.size} plugins.`);
      
      // Debug: List all loaded plugins
      console.log('Loaded plugins:', Array.from(this.plugins.keys()));
    } catch (error) {
      console.error('❌ Failed to initialize plugin system:', error);
      throw error;
    }
  }

  /**
   * Discover and load plugins from a directory
   * 
   * Scans the plugins directory for valid plugin structures and loads them.
   * Looks for main.js, main.ts, or index.js files as entry points.
   * 
   * @param pluginsDir - Directory to scan for plugins
   */
  async loadPluginsFromDirectory(pluginsDir: string): Promise<void> {
    try {
      const pluginDirs = await fs.readdir(pluginsDir, { withFileTypes: true });
      const plugins: Plugin[] = [];

      for (const dirent of pluginDirs) {
        if (!dirent.isDirectory()) continue;

        const pluginDir = path.join(pluginsDir, dirent.name);
        const plugin = await this.loadPluginFromDirectory(pluginDir);
        
        if (plugin) {
          plugins.push(plugin);
        }
      }

      await this.initialize(plugins);
    } catch (error) {
      console.error('Failed to load plugins from directory:', error);
      throw error;
    }
  }

  /**
   * Load a single plugin from its directory
   * 
   * Tries to load main.js, main.ts, or index.js in order of preference.
   * 
   * @param pluginDir - Plugin directory path
   * @returns Plugin instance or null if loading fails
   */
  private async loadPluginFromDirectory(pluginDir: string): Promise<Plugin | null> {
    const entryPoints = ['main.js', 'main.ts', 'index.js'];
    
    for (const entryPoint of entryPoints) {
      const pluginFile = path.join(pluginDir, entryPoint);
      
        try {
          await fs.access(pluginFile);
          // Use @vite-ignore to suppress analysis warning during SSR
          const pluginModule = await import(/* @vite-ignore */ pluginFile);
          const plugin = pluginModule.default || pluginModule;
        
        if (!plugin || !plugin.config?.name) {
          console.warn(`Invalid plugin structure in ${pluginFile}`);
          continue;
        }

        console.log(`📁 Discovered plugin: ${plugin.config.name} at ${pluginFile}`);
        return plugin;
        
      } catch (error) {
        // File doesn't exist or failed to load, try next entry point
        continue;
      }
    }

    console.warn(`No valid plugin entry point found in ${pluginDir}`);
    return null;
  }

  /**
   * Reload a plugin without restarting the system
   * 
   * Safely unloads and reloads a plugin, preserving its settings.
   * Useful for development and plugin updates.
   * 
   * @param pluginId - Plugin to reload
   * @param pluginDir - Optional plugin directory path
   */
  async reloadPlugin(pluginId: string, pluginDir?: string): Promise<void> {
    console.log(`🔄 Reloading plugin: ${pluginId}`);
    
    try {
      // Get current state
      const currentInstance = this.plugins.get(pluginId);
      const wasEnabled = currentInstance?.enabled || false;
      
      // Unload current version
      if (currentInstance) {
        await this.unloadPlugin(pluginId);
      }

      // Load new version
      if (pluginDir) {
        const plugin = await this.loadPluginFromDirectory(pluginDir);
        if (plugin) {
          await this.loadPlugin(plugin);
          
          // Restore enabled state if it was previously enabled
          if (wasEnabled) {
            await this.enablePlugin(pluginId);
          }
        }
      }

      console.log(`✅ Plugin ${pluginId} reloaded successfully`);
    } catch (error) {
      await this.recordError(pluginId, error as Error, 'Plugin reload');
      throw error;
    }
  }

  /**
   * Check for plugin updates and reload if changed
   * 
   * Compares file modification times to detect changes.
   * 
   * @param pluginsDir - Directory to check for updates
   */
  async checkForUpdates(pluginsDir: string): Promise<string[]> {
    const updatedPlugins: string[] = [];
    
    try {
      const pluginDirs = await fs.readdir(pluginsDir, { withFileTypes: true });
      
      for (const dirent of pluginDirs) {
        if (!dirent.isDirectory()) continue;
        
        const pluginDir = path.join(pluginsDir, dirent.name);
        const instance = this.plugins.get(dirent.name);
        
        if (!instance) continue;
        
        // Check if main file was modified
        const entryPoints = ['main.js', 'main.ts', 'index.js'];
        
        for (const entryPoint of entryPoints) {
          const pluginFile = path.join(pluginDir, entryPoint);
          
          try {
            const stats = await fs.stat(pluginFile);
            
            if (stats.mtime > instance.installedAt) {
              console.log(`🔄 Plugin ${dirent.name} has been updated`);
              await this.reloadPlugin(dirent.name, pluginDir);
              updatedPlugins.push(dirent.name);
              break;
            }
          } catch (error) {
            // File doesn't exist, continue
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for plugin updates:', error);
    }
    
    return updatedPlugins;
  }

  /**
   * Create plugin context with event system
   */
  private createPluginContext(pluginId: string): PluginContext {
    const eventSystem = new PluginEventSystemImpl(this.eventEmitter, pluginId);
    
    const context: PluginContext = {
      db,
      config: {},
      logger: {
        info: (message: string, meta?: any) => console.log(`[${pluginId}] ${message}`, meta),
        warn: (message: string, meta?: any) => console.warn(`[${pluginId}] ${message}`, meta),
        error: (message: string, meta?: any) => console.error(`[${pluginId}] ${message}`, meta),
        debug: (message: string, meta?: any) => console.debug(`[${pluginId}] ${message}`, meta)
      },
      utils: {
        validateSlug: (slug: string) => /^[a-z0-9-]+$/.test(slug),
        sanitizeHtml: (content: string) => content.replace(/<script[^>]*>.*?<\/script>/gi, ''),
        generateExcerpt: (content: string, length = 150) => content.substring(0, length) + (content.length > length ? '...' : '')
      },
      hooks: {
        addAction: (name: string, callback: (...args: any[]) => any, priority = 10) => {
          this.addHook(pluginId, name, callback, priority);
        },
        addFilter: (name: string, callback: (...args: any[]) => any, priority = 10) => {
          this.addHook(pluginId, name, callback, priority);
        },
        doAction: async (name: string, ...args: any[]) => {
          await this.executeHook(name, ...args);
        },
        applyFilters: async (name: string, value: any, ...args: any[]) => {
          const results = await this.executeHook(name, value, ...args);
          return results.length > 0 ? results[results.length - 1] : value;
        }
      },
      events: eventSystem
    };

    this.pluginContexts.set(pluginId, context);
    return context;
  }

  /**
   * Get plugin context
   */
  getPluginContext(pluginId: string): PluginContext | undefined {
    return this.pluginContexts.get(pluginId);
  }

  /**
   * Emit system-wide events
   */
  async emitEvent(eventName: string, data?: any, meta?: Record<string, any>) {
    return await this.eventEmitter.emit(eventName, data, { source: 'system', ...meta });
  }

  /**
   * Listen to system-wide events
   */
  onEvent(eventName: string, listener: any, options?: any) {
    this.eventEmitter.on(eventName, listener, { pluginId: 'system', ...options });
  }

  /**
   * Get event emitter for direct access
   */
  getEventEmitter() {
    return this.eventEmitter;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down plugin system...');
    await this.executeHook('shutdown');
    await this.emitEvent('system:shutdown');

    for (const pluginId of this.plugins.keys()) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        console.error(`Error unloading plugin ${pluginId}:`, error);
      }
    }

    // Clean up event system
    this.eventEmitter.removeAllListeners();
    this.pluginContexts.clear();

    this.initialized = false;
    console.log('🔌 Plugin system shut down');
  }

  

  /**
   * Validate plugin configuration and structure
   * 
   * Performs comprehensive validation of plugin before loading.
   * 
   * @param plugin - Plugin to validate
   * @returns Validation result with errors if any
   */
  validatePlugin(plugin: Plugin): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!plugin.config) {
      errors.push('Plugin must have a config object');
    } else {
      if (!plugin.config.name) {
        errors.push('Plugin must have a name');
      } else if (typeof plugin.config.name !== 'string') {
        errors.push('Plugin name must be a string');
      } else if (!/^[a-z0-9-]+$/.test(plugin.config.name)) {
        errors.push('Plugin name must contain only lowercase letters, numbers, and hyphens');
      }

      if (!plugin.config.version) {
        errors.push('Plugin must have a version');
      } else if (!/^\d+\.\d+\.\d+/.test(plugin.config.version)) {
        errors.push('Plugin version must follow semantic versioning (x.y.z)');
      }
    }

    // Validate hook functions
    if (plugin.hooks) {
      for (const [hookName, callback] of Object.entries(plugin.hooks)) {
        if (callback !== null && callback !== undefined && typeof callback !== 'function') {
          errors.push(`Hook ${hookName} must be a function or null/undefined`);
        }
      }
    }

    // Validate lifecycle methods
    const lifecycleMethods = ['install', 'uninstall', 'activate', 'deactivate'];
    for (const method of lifecycleMethods) {
      if ((plugin as any)[method] && typeof (plugin as any)[method] !== 'function') {
        errors.push(`Lifecycle method ${method} must be a function`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Perform health check on a plugin
   * 
   * Tests if plugin is functioning correctly and can execute hooks.
   * 
   * @param pluginId - Plugin to check
   * @returns Health check result
   */
  async healthCheck(pluginId: string): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    const instance = this.plugins.get(pluginId);

    if (!instance) {
      return { healthy: false, issues: ['Plugin not found'] };
    }

    try {
      // Check if plugin is properly loaded
      if (!instance.plugin) {
        issues.push('Plugin object is missing');
      }

      // Check if configuration is valid
      const validation = this.validatePlugin(instance.plugin);
      if (!validation.isValid) {
        issues.push(...validation.errors.map(err => `Config: ${err}`));
      }

      // Test hook execution if plugin has hooks
      if (instance.enabled && instance.plugin.hooks) {
        try {
          // Try a safe test hook execution
          await this.executeHook('healthCheck', { pluginId, timestamp: Date.now() });
        } catch (error) {
          issues.push(`Hook execution failed: ${(error as Error).message}`);
        }
      }

      // Check database consistency
      try {
        const dbPlugin = await db.plugin.findUnique({ where: { pluginId } });
        if (!dbPlugin) {
          issues.push('Plugin not found in database');
        } else if (dbPlugin.status === 'ERROR') {
          issues.push(`Plugin in error state: ${dbPlugin.lastError || 'Unknown error'}`);
        }
      } catch (error) {
        issues.push(`Database check failed: ${(error as Error).message}`);
      }

    } catch (error) {
      issues.push(`Health check failed: ${(error as Error).message}`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  /**
   * Run health checks on all plugins
   * 
   * @returns Map of plugin health results
   */
  async healthCheckAll(): Promise<Map<string, { healthy: boolean; issues: string[] }>> {
    const results = new Map();
    
    for (const pluginId of this.plugins.keys()) {
      const result = await this.healthCheck(pluginId);
      results.set(pluginId, result);
    }

    return results;
  }

  private async loadPlugin(plugin: Plugin): Promise<void> {
    // Validate plugin before loading
    const validation = this.validatePlugin(plugin);
    if (!validation.isValid) {
      throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
    }

    const pluginId = plugin.config.name;
    console.log(`📦 Loading plugin: ${pluginId}`);

    if (this.plugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} already loaded, skipping`);
      return;
    }

    // Create plugin context with event system
    this.createPluginContext(pluginId);

      // Get or create database record
      let dbPlugin = await db.plugin.findUnique({ where: { pluginId } });
      
      const currentVersion = plugin.config.version || '1.0.0';
      const { description, author } = plugin.config;

      if (!dbPlugin) {
        dbPlugin = await db.plugin.create({
          data: {
            pluginId,
            name: plugin.config.name,
            version: currentVersion,
            description,
            author,
            status: 'DISABLED',
            installed: false,
            installedVersion: currentVersion,
            settings: {}
          }
        });
        console.log(`📝 Plugin ${pluginId} registered in database`);
      } else {
        // Update metadata
        dbPlugin = await db.plugin.update({
          where: { pluginId },
          data: {
            name: plugin.config.name,
            version: currentVersion,
            description,
            author,
            lastVersion: dbPlugin.version !== currentVersion ? dbPlugin.version : dbPlugin.lastVersion,
            lastError: null,
            errorAt: null
          }
        });
      }

      // Create plugin instance
      const instance: PluginInstance = {
        id: pluginId,
        plugin,
        enabled: dbPlugin.status === 'ENABLED',
        installedAt: dbPlugin.installedAt || new Date(),
        version: currentVersion,
        settings: (dbPlugin.settings as Record<string, any>) || {}
      };

      // Install if needed
      if (!dbPlugin.installed && plugin.install) {
        try {
          await plugin.install();
          await db.plugin.update({
            where: { pluginId },
            data: { installed: true, installedAt: new Date() }
          });
          console.log(`📦 Plugin ${pluginId} installed`);
          await this.emitEvent('plugin:installed', { pluginId, version: currentVersion });
        } catch (error) {
          await this.recordError(pluginId, error as Error, 'Plugin installation');
          throw error;
        }
      }

      // Activate if enabled
      if (dbPlugin.status === 'ENABLED') {
        try {
          if (plugin.activate) await plugin.activate();
          if (plugin.hooks) this.registerPluginHooks(pluginId, plugin.hooks);
          console.log(`🟢 Plugin ${pluginId} activated`);
          await this.emitEvent('plugin:activated', { pluginId, version: currentVersion });
        } catch (error) {
          await this.recordError(pluginId, error as Error, 'Plugin activation');
          await db.plugin.update({
            where: { pluginId },
            data: { status: 'ERROR' }
          });
          instance.enabled = false;
        }
      }

      // Store in memory
      this.plugins.set(pluginId, instance);
      console.log(`✅ Plugin ${pluginId} v${currentVersion} loaded (${dbPlugin.status})`);
      await this.emitEvent('plugin:loaded', { pluginId, version: currentVersion, status: dbPlugin.status });
  }

  private registerPluginHooks(pluginId: string, pluginHooks: PluginHooks): void {
    for (const [hookName, callback] of Object.entries(pluginHooks)) {
      if (typeof callback === 'function') {
        this.addHook(pluginId, hookName, callback as (...args: unknown[]) => unknown | Promise<unknown>);
      } else if (callback !== null && callback !== undefined) {
        console.warn(`Plugin ${pluginId}: Hook ${hookName} is not a function, skipping`);
      }
    }
  }

  private addHook(pluginId: string, hookName: string, callback: (...args: unknown[]) => unknown | Promise<unknown>, priority: number = 10): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookList = this.hooks.get(hookName)!;
    hookList.push({ callback, priority, pluginId });
    hookList.sort((a, b) => a.priority - b.priority);
  }

  private removeHooksForPlugin(pluginId: string): void {
    for (const [hookName, hookList] of this.hooks) {
      const filtered = hookList.filter(hook => hook.pluginId !== pluginId);
      this.hooks.set(hookName, filtered);
    }
  }

  async executeHook(hookName: string, ...args: unknown[]): Promise<unknown[]> {
    const hookList = this.hooks.get(hookName);
    if (!hookList?.length) return [];

    const results: unknown[] = [];
    for (const hook of hookList) {
      const instance = this.plugins.get(hook.pluginId);
      if (!instance?.enabled) continue;

      try {
        const result = await hook.callback(...args);
        if (result !== undefined) results.push(result);
      } catch (error) {
        this.logError(hook.pluginId, error as Error, `Hook: ${hookName}`);
      }
    }
    return results;
  }

  private logError(pluginId: string, error: Error, context?: string): void {
    this.errors.push({
      pluginId,
      message: error.message,
      timestamp: new Date(),
      context,
      stack: error.stack
    });

    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  private async recordError(pluginId: string, error: Error, context?: string): Promise<void> {
    this.logError(pluginId, error, context);

    try {
      await db.plugin.update({
        where: { pluginId },
        data: {
          status: 'ERROR',
          lastError: `${error.message} ${context ? `(${context})` : ''}`,
          errorAt: new Date()
        }
      });
    } catch (dbError) {
      console.error('Failed to save plugin error to database:', dbError);
    }
  }

  /**
   * Unload a plugin
   * 
   * Deactivates, uninstalls, and removes a plugin from the system.
   * Updates database status but preserves the plugin record.
   * 
   * @param pluginId - The plugin identifier to unload
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // Deactivate plugin
      if (instance.plugin.deactivate) {
        await instance.plugin.deactivate();
      }

      // Uninstall plugin
      if (instance.plugin.uninstall) {
        await instance.plugin.uninstall();
      }

      // Remove hooks
      this.removeHooksForPlugin(pluginId);

      // Remove event listeners
      this.eventEmitter.removePluginListeners(pluginId);

      // Remove plugin context
      this.pluginContexts.delete(pluginId);

      // Remove from registry
      this.plugins.delete(pluginId);

      // Update database status (but don't delete the record)
      await db.plugin.update({
        where: { pluginId },
        data: { status: 'DISABLED' }
      });

      console.log(`🗑️  Plugin ${pluginId} unloaded successfully`);
      await this.emitEvent('plugin:unloaded', { pluginId, version: instance.version });
    } catch (error) {
      await this.recordError(pluginId, error as Error, 'Plugin unloading');
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    console.log(`🔄 Attempting to enable plugin: ${pluginId}`);
    console.log('Available plugins:', Array.from(this.plugins.keys()));
    
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      // Try to reload plugins if not found
      console.log(`Plugin ${pluginId} not found in memory, trying to reload plugins...`);
      await this.loadPluginsFromDirectory(path.join(process.cwd(), 'plugins'));
      
      const reloadedInstance = this.plugins.get(pluginId);
      if (!reloadedInstance) {
        const availablePlugins = Array.from(this.plugins.keys()).join(', ');
        throw new Error(`Plugin ${pluginId} not found. Available plugins: ${availablePlugins}`);
      }
    }

    const plugin = this.plugins.get(pluginId)!;
    if (plugin.enabled) {
      console.log(`Plugin ${pluginId} is already enabled`);
      return;
    }

    try {
      // Activate plugin
      if (plugin.plugin.activate) {
        await plugin.plugin.activate();
      }

      // Register hooks
      if (plugin.plugin.hooks) {
        this.registerPluginHooks(pluginId, plugin.plugin.hooks);
      }

      // Update in-memory state
      plugin.enabled = true;

      // Update database
      await db.plugin.update({
        where: { pluginId },
        data: {
          status: 'ENABLED',
          lastError: null,
          errorAt: null
        }
      });

      console.log(`🟢 Plugin ${pluginId} enabled successfully`);
      await this.emitEvent('plugin:enabled', { pluginId, version: plugin.version });
    } catch (error) {
      await this.recordError(pluginId, error as Error, 'Plugin enabling');
      throw error;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!instance.enabled) return;

    try {
      if (instance.plugin.deactivate) {
        await instance.plugin.deactivate();
      }

      this.removeHooksForPlugin(pluginId);
      instance.enabled = false;

      await db.plugin.update({
        where: { pluginId },
        data: { status: 'DISABLED' }
      });

      console.log(`🔴 Plugin ${pluginId} disabled`);
      await this.emitEvent('plugin:disabled', { pluginId, version: instance.version });
    } catch (error) {
      await this.recordError(pluginId, error as Error, 'Plugin disabling');
      throw error;
    }
  }

  // Public API methods
  getPlugin(pluginId: string) { return this.plugins.get(pluginId); }
  getAllPlugins() { return Array.from(this.plugins.values()); }
  getEnabledPlugins() { return this.getAllPlugins().filter(p => p.enabled); }
  getErrors(pluginId?: string) { 
    return pluginId ? this.errors.filter(e => e.pluginId === pluginId) : [...this.errors]; 
  }
  isInitialized() { return this.initialized; }

  /**
   * Get comprehensive plugin system diagnostics
   * 
   * Provides detailed information about the plugin system state,
   * including loaded plugins, hook registrations, and system health.
   * 
   * @returns Detailed plugin system diagnostics
   */
  getDiagnostics() {
    const hookStats = new Map<string, number>();
    for (const [hookName, registrations] of this.hooks) {
      hookStats.set(hookName, registrations.length);
    }

    return {
      initialized: this.initialized,
      pluginCount: this.plugins.size,
      enabledPluginCount: this.getEnabledPlugins().length,
      hookCount: this.hooks.size,
      totalHookRegistrations: Array.from(this.hooks.values()).reduce((sum, regs) => sum + regs.length, 0),
      errorCount: this.errors.length,
      hookStats: Object.fromEntries(hookStats),
      memoryUsage: {
        plugins: this.plugins.size,
        hooks: this.hooks.size,
        errors: this.errors.length
      }
    };
  }

  /**
   * Get plugin system summary
   * 
   * Provides a comprehensive overview of all plugins, their status,
   * and any errors. Useful for admin dashboards and monitoring.
   * 
   * @returns Plugin system summary with counts, lists, and errors
   */
  async getSummary() {
    try {
      // Get all plugins from database
      const dbPlugins = await db.plugin.findMany({
        orderBy: { name: 'asc' }
      });

      // Get current errors from memory
      const errors = this.getErrors();

      return {
        all: dbPlugins.map(plugin => ({
          id: plugin.pluginId,
          name: plugin.name,
          version: plugin.version,
          description: plugin.description || '',
          enabled: plugin.status === 'ENABLED',
          installedAt: plugin.installedAt || plugin.createdAt
        })),
        enabled: dbPlugins
          .filter(plugin => plugin.status === 'ENABLED')
          .map(plugin => ({
            id: plugin.pluginId,
            name: plugin.name,
            version: plugin.version,
            description: plugin.description || '',
            enabled: true,
            installedAt: plugin.installedAt || plugin.createdAt
          })),
        errors: [
          // Memory errors
          ...errors.map(err =>
            `${err.pluginId}: ${err.message} ${err.context ? `(${err.context})` : ''}`
          ),
          // Database errors
          ...dbPlugins
            .filter(plugin => plugin.status === 'ERROR' && plugin.lastError)
            .map(plugin => `${plugin.pluginId}: ${plugin.lastError}`)
        ]
      };
    } catch (error) {
      console.error('Failed to get plugin summary from database:', error);
      
      // Fallback to memory-only data when database is unavailable
      const allPlugins = this.getAllPlugins();
      const enabledPlugins = this.getEnabledPlugins();
      const memoryErrors = this.getErrors();

      return {
        all: allPlugins.map(plugin => this.safePluginSummary(plugin)),
        enabled: enabledPlugins.map(plugin => this.safePluginSummary(plugin)),
        errors: [
          `Database unavailable - showing memory-only data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ...memoryErrors.map(err =>
            `${err.pluginId}: ${err.message} ${err.context ? `(${err.context})` : ''}`
          )
        ]
      };
    }
  }

  /**
   * Safely extract plugin summary information from a plugin instance
   * 
   * @param plugin - Plugin instance
   * @returns Safe plugin summary object
   */
  private safePluginSummary(plugin: PluginInstance) {
    return {
      id: plugin.id,
      name: plugin.plugin?.config?.name || plugin.id,
      version: plugin.version || 'unknown',
      description: plugin.plugin?.config?.description || '',
      enabled: plugin.enabled,
      installedAt: plugin.installedAt
    };
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();

// Convenience exports with proper this binding
export const initializePlugins = (plugins: Plugin[]) => pluginManager.initialize(plugins);
export const shutdownPlugins = () => pluginManager.shutdown();
export const executePluginHook = (name: string, ...args: unknown[]) => pluginManager.executeHook(name, ...args);
export const enablePlugin = (id: string) => pluginManager.enablePlugin(id);
export const disablePlugin = (id: string) => pluginManager.disablePlugin(id);
export const getPlugin = (id: string) => pluginManager.getPlugin(id);
export const getAllPlugins = () => pluginManager.getAllPlugins();
export const getEnabledPlugins = () => pluginManager.getEnabledPlugins();
export const getPluginErrors = (id?: string) => pluginManager.getErrors(id);
export const isPluginSystemInitialized = () => pluginManager.isInitialized();
export const getPluginsSummary = () => pluginManager.getSummary();
export const getPluginDiagnostics = () => pluginManager.getDiagnostics();

// Event system exports
export const emitSystemEvent = (eventName: string, data?: any, meta?: Record<string, any>) => 
  pluginManager.emitEvent(eventName, data, meta);
export const onSystemEvent = (eventName: string, listener: any, options?: any) => 
  pluginManager.onEvent(eventName, listener, options);
export const getEventEmitter = () => pluginManager.getEventEmitter();
export const getPluginContext = (pluginId: string) => pluginManager.getPluginContext(pluginId);
