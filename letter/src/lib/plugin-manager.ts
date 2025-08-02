/**
 * Plugin Manager for LetterPress CMS
 * 
 * Handles plugin loading, lifecycle management, and hook execution.
 * Uses the LetterPress Plugin SDK for type safety and consistent API.
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
import { PluginError, PluginInstance, Plugin, PluginHooks } from '@letterpress/plugin-sdk';

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

  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    console.log('🛑 Shutting down plugin system...');
    await this.executeHook('shutdown');

    for (const pluginId of this.plugins.keys()) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        console.error(`Error unloading plugin ${pluginId}:`, error);
      }
    }

    this.initialized = false;
    console.log('🔌 Plugin system shut down');
  }

  

  private async loadPlugin(plugin: Plugin): Promise<void> {
    

      // Validate plugin structure
      if (!plugin?.config?.name) {
        throw new Error('Plugin must export a Plugin object with config.name (use definePlugin from SDK)');
      }

      const pluginId = plugin.config.name;
      console.log(`📦 Loading plugin: ${pluginId}`);

      if (this.plugins.has(pluginId)) {
        console.warn(`Plugin ${pluginId} already loaded, skipping`);
        return;
      }

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

      // Remove from registry
      this.plugins.delete(pluginId);

      // Update database status (but don't delete the record)
      await db.plugin.update({
        where: { pluginId },
        data: { status: 'DISABLED' }
      });

      console.log(`🗑️  Plugin ${pluginId} unloaded successfully`);
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
