"use server";

/**
 * Advanced Plugin File Watcher
 * 
 * Provides intelligent file watching for plugin hot reload with:
 * - Debounced change detection
 * - Selective reloading based on file types
 * - Dependency tracking
 * - Performance monitoring
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { hotReloadPlugin } from './plugin-loader';

interface WatchConfig {
  debounceMs: number;
  watchExtensions: string[];
  ignorePatterns: string[];
  maxReloadFrequency: number; // Max reloads per minute per plugin
  enableDependencyTracking: boolean;
}

interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: number;
  pluginName: string;
}

interface PluginWatchState {
  pluginName: string;
  watchedFiles: Set<string>;
  lastReload: number;
  reloadCount: number;
  pendingChanges: FileChange[];
  debounceTimer?: NodeJS.Timeout;
}

export class AdvancedPluginWatcher {
  private watchers = new Map<string, AbortController>();
  private pluginStates = new Map<string, PluginWatchState>();
  private isWatching = false;
  private watchedDirectory: string = '';
  
  private config: WatchConfig = {
    debounceMs: 500,
    watchExtensions: ['.js', '.ts', '.json'],
    ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
    maxReloadFrequency: 6, // 6 reloads per minute max
    enableDependencyTracking: true
  };

  /**
   * Start watching plugins directory
   */
  async startWatching(
    pluginsDir?: string, 
    config?: Partial<WatchConfig>
  ): Promise<void> {
    if (this.isWatching) {
      console.log('🔍 Plugin watcher already running');
      return;
    }

    this.config = { ...this.config, ...config };
    this.watchedDirectory = pluginsDir || path.join(process.cwd(), 'plugins');

    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Plugin watching is disabled in production');
      return;
    }

    console.log(`👀 Starting advanced plugin watcher on: ${this.watchedDirectory}`);

    try {
      // Ensure directory exists
      await fs.access(this.watchedDirectory);
      
      // Discover plugins and setup watching
      await this.discoverAndWatchPlugins();
      
      this.isWatching = true;
      console.log(`✅ Plugin watcher started with ${this.pluginStates.size} plugins`);
      
    } catch (error) {
      console.error('❌ Failed to start plugin watcher:', error);
      throw error;
    }
  }

  /**
   * Stop watching
   */
  async stopWatching(): Promise<void> {
    if (!this.isWatching) return;

    console.log('🛑 Stopping plugin watcher');

    // Close all watchers
    for (const [path, controller] of this.watchers) {
      try {
        controller.abort();
      } catch (error) {
        console.warn(`Warning: Failed to abort watcher for ${path}:`, error);
      }
    }

    // Clear timers
    for (const state of this.pluginStates.values()) {
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
    }

    this.watchers.clear();
    this.pluginStates.clear();
    this.isWatching = false;

    console.log('✅ Plugin watcher stopped');
  }

  /**
   * Discover plugins and setup file watchers
   */
  private async discoverAndWatchPlugins(): Promise<void> {
    try {
      const entries = await fs.readdir(this.watchedDirectory, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const pluginDir = path.join(this.watchedDirectory, entry.name);
        await this.setupPluginWatcher(entry.name, pluginDir);
      }
    } catch (error) {
      console.error('Failed to discover plugins for watching:', error);
    }
  }

  /**
   * Setup watcher for a specific plugin
   */
  private async setupPluginWatcher(pluginName: string, pluginDir: string): Promise<void> {
    try {
      // Initialize plugin state
      const state: PluginWatchState = {
        pluginName,
        watchedFiles: new Set(),
        lastReload: 0,
        reloadCount: 0,
        pendingChanges: []
      };
      this.pluginStates.set(pluginName, state);

      // Recursively find files to watch
      const filesToWatch = await this.findWatchableFiles(pluginDir);
      
      for (const filePath of filesToWatch) {
        state.watchedFiles.add(filePath);
        await this.watchFile(filePath, pluginName);
      }

      console.log(`🔍 Watching ${filesToWatch.length} files for plugin: ${pluginName}`);
      
    } catch (error) {
      console.error(`Failed to setup watcher for plugin ${pluginName}:`, error);
    }
  }

  /**
   * Find files that should be watched
   */
  private async findWatchableFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip ignored patterns
        if (this.shouldIgnorePath(entry.name)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.findWatchableFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file extension should be watched
          const ext = path.extname(entry.name);
          if (this.config.watchExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Watch a specific file
   */
  private async watchFile(filePath: string, pluginName: string): Promise<void> {
    try {
      const controller = new AbortController();
      this.watchers.set(filePath, controller);

      const watcher = fs.watch(filePath, { signal: controller.signal });

      for await (const event of watcher) {
        await this.handleFileChange(filePath, event.eventType, pluginName);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.warn(`Warning: Could not watch file ${filePath}:`, error);
      }
    }
  }

  /**
   * Handle file change event
   */
  private async handleFileChange(
    filePath: string, 
    eventType: string, 
    pluginName: string
  ): Promise<void> {
    const state = this.pluginStates.get(pluginName);
    if (!state) return;

    // Determine change type
    let changeType: FileChange['type'] = 'modified';
    try {
      await fs.access(filePath);
    } catch {
      changeType = 'deleted';
    }

    const change: FileChange = {
      path: filePath,
      type: changeType,
      timestamp: Date.now(),
      pluginName
    };

    // Add to pending changes
    state.pendingChanges.push(change);

    // Clear existing debounce timer
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    // Setup new debounce timer
    state.debounceTimer = setTimeout(() => {
      this.processPluginChanges(pluginName);
    }, this.config.debounceMs);
  }

  /**
   * Process accumulated changes for a plugin
   */
  private async processPluginChanges(pluginName: string): Promise<void> {
    const state = this.pluginStates.get(pluginName);
    if (!state || state.pendingChanges.length === 0) return;

    console.log(`🔄 Processing ${state.pendingChanges.length} changes for plugin: ${pluginName}`);

    // Check reload frequency limits
    const now = Date.now();
    const timeSinceLastReload = now - state.lastReload;
    const recentReloads = state.reloadCount;
    
    if (timeSinceLastReload < 60000 && recentReloads >= this.config.maxReloadFrequency) {
      console.warn(`⚠️ Rate limiting reload for ${pluginName} - too many recent reloads`);
      state.pendingChanges = [];
      return;
    }

    try {
      // Analyze changes
      const hasSignificantChanges = this.analyzeChanges(state.pendingChanges);
      
      if (hasSignificantChanges) {
        console.log(`🔄 Significant changes detected, reloading plugin: ${pluginName}`);
        
        // Attempt hot reload
        const success = await hotReloadPlugin(
          pluginName, 
          this.watchedDirectory
        );
        
        if (success) {
          state.lastReload = now;
          state.reloadCount++;
          
          // Reset reload count after a minute
          setTimeout(() => {
            if (state.reloadCount > 0) state.reloadCount--;
          }, 60000);
          
          console.log(`✅ Successfully hot reloaded: ${pluginName}`);
        } else {
          console.error(`❌ Failed to hot reload: ${pluginName}`);
        }
      } else {
        console.log(`ℹ️ Non-significant changes detected for ${pluginName}, skipping reload`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing changes for ${pluginName}:`, error);
    } finally {
      // Clear pending changes
      state.pendingChanges = [];
      state.debounceTimer = undefined;
    }
  }

  /**
   * Analyze changes to determine if reload is needed
   */
  private analyzeChanges(changes: FileChange[]): boolean {
    // Always reload if main entry files changed
    const hasMainFileChanges = changes.some(change => {
      const filename = path.basename(change.path);
      return ['main.js', 'main.ts', 'index.js', 'package.json'].includes(filename);
    });

    if (hasMainFileChanges) {
      return true;
    }

    // Reload if any JavaScript/TypeScript files changed
    const hasCodeChanges = changes.some(change => {
      const ext = path.extname(change.path);
      return ['.js', '.ts'].includes(ext);
    });

    return hasCodeChanges;
  }

  /**
   * Check if path should be ignored
   */
  private shouldIgnorePath(pathName: string): boolean {
    return this.config.ignorePatterns.some(pattern => 
      pathName.includes(pattern) || pathName.startsWith('.')
    );
  }

  /**
   * Add new plugin to watch list
   */
  async addPluginToWatch(pluginName: string): Promise<void> {
    if (!this.isWatching) return;

    const pluginDir = path.join(this.watchedDirectory, pluginName);
    
    try {
      await fs.access(pluginDir);
      await this.setupPluginWatcher(pluginName, pluginDir);
      console.log(`➕ Added plugin to watch list: ${pluginName}`);
    } catch (error) {
      console.error(`Failed to add plugin ${pluginName} to watch list:`, error);
    }
  }

  /**
   * Remove plugin from watch list
   */
  async removePluginFromWatch(pluginName: string): Promise<void> {
    const state = this.pluginStates.get(pluginName);
    if (!state) return;

    // Clear debounce timer
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    // Close watchers for this plugin's files
    for (const filePath of state.watchedFiles) {
      const controller = this.watchers.get(filePath);
      if (controller) {
        try {
          controller.abort();
        } catch (error) {
          console.warn(`Warning: Failed to abort watcher for ${filePath}:`, error);
        }
        this.watchers.delete(filePath);
      }
    }

    this.pluginStates.delete(pluginName);
    console.log(`➖ Removed plugin from watch list: ${pluginName}`);
  }

  /**
   * Get watcher statistics
   */
  getWatcherStats() {
    const states = Array.from(this.pluginStates.values());
    
    return {
      isWatching: this.isWatching,
      watchedDirectory: this.watchedDirectory,
      pluginCount: states.length,
      totalWatchedFiles: states.reduce((sum, state) => sum + state.watchedFiles.size, 0),
      totalReloads: states.reduce((sum, state) => sum + state.reloadCount, 0),
      activeTimers: states.filter(state => state.debounceTimer).length,
      config: this.config,
      plugins: states.map(state => ({
        name: state.pluginName,
        watchedFileCount: state.watchedFiles.size,
        reloadCount: state.reloadCount,
        lastReload: state.lastReload ? new Date(state.lastReload) : null,
        hasPendingChanges: state.pendingChanges.length > 0
      }))
    };
  }

  /**
   * Force reload all plugins
   */
  async forceReloadAll(): Promise<{ success: string[]; failed: string[] }> {
    console.log('🔄 Force reloading all plugins');
    
    const results: { success: string[], failed: string[] } = { success: [], failed: [] };
    
    for (const pluginName of this.pluginStates.keys()) {
      try {
        const success = await hotReloadPlugin(
          pluginName, 
          this.watchedDirectory
        );
        
        if (success) {
          results.success.push(pluginName);
        } else {
          results.failed.push(pluginName);
        }
      } catch (error) {
        console.error(`Failed to force reload ${pluginName}:`, error);
        results.failed.push(pluginName);
      }
    }
    
    console.log(`✅ Force reload complete: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }
}

// Export singleton instance
export const pluginWatcher = new AdvancedPluginWatcher();