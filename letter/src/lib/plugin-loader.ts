"use server";

/**
 * Plugin Loader
 * 
 * Handles automatic plugin discovery and loading from the filesystem.
 * Provides hot-reload capabilities during development with enhanced caching,
 * dependency resolution, validation, and performance monitoring.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pluginManager } from './plugin-manager';
import type { Plugin } from '@letter-press/plugin-sdk/types';

interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  peerDependencies?: string[];
  entryPoint: string;
  checksum?: string;
  lastModified: number;
  loadTime?: number;
  loadAttempts: number;
  lastError?: string;
}

interface PluginLoadResult {
  plugin: Plugin | null;
  manifest: PluginManifest;
  success: boolean;
  error?: Error;
  loadTime: number;
}

interface PluginCache {
  manifests: Map<string, PluginManifest>;
  loadResults: Map<string, PluginLoadResult>;
  dependencyGraph: Map<string, string[]>;
  lastScan: number;
}

class PluginLoader {
  private cache: PluginCache = {
    manifests: new Map(),
    loadResults: new Map(),
    dependencyGraph: new Map(),
    lastScan: 0
  };
  
  private loadingQueue: Set<string> = new Set();
  private failureRetryDelay = 5000; // 5 seconds
  private maxRetryAttempts = 3;

  /**
   * Load all plugins with enhanced caching and dependency resolution
   */
  async loadAllPlugins(pluginsDir?: string): Promise<{
    loaded: string[];
    failed: string[];
    skipped: string[];
    metrics: {
      totalTime: number;
      scanTime: number;
      loadTime: number;
      cacheHits: number;
      cacheMisses: number;
    };
  }> {
    const startTime = performance.now();
    const dir = pluginsDir || path.join(process.cwd(), 'plugins');
    
    console.log(`🔍 Loading plugins from: ${dir}`);
    
    try {
      // Scan for plugins and build manifests
      const scanStart = performance.now();
      const discovered = await this.scanPluginsDirectory(dir);
      const scanTime = performance.now() - scanStart;
      
      // Resolve dependencies and create load order
      const loadOrder = this.resolveDependencyOrder(discovered);
      
      // Load plugins in dependency order
      const loadStart = performance.now();
      const results = await this.loadPluginsInOrder(loadOrder, dir);
      const loadTime = performance.now() - loadStart;
      
      const totalTime = performance.now() - startTime;
      
      // DON'T initialize plugin manager here - let it be done externally
      // This maintains compatibility with existing plugin-manager interface
      
      // Generate metrics
      const cacheHits = results.filter(r => r.loadTime < 1).length; // Cached loads are very fast
      const cacheMisses = results.length - cacheHits;
      
      const loaded = results.filter(r => r.success).map(r => r.manifest.name);
      const failed = results.filter(r => !r.success).map(r => r.manifest.name);
      const skipped: string[] = []; // Plugins skipped due to dependency issues
      
      console.log(`✅ Plugin loading complete: ${loaded.length} loaded, ${failed.length} failed in ${totalTime.toFixed(2)}ms`);
      
      return {
        loaded,
        failed,
        skipped,
        metrics: {
          totalTime,
          scanTime,
          loadTime,
          cacheHits,
          cacheMisses
        }
      };
    } catch (error) {
      console.error('❌ Failed to load plugins:', error);
      throw error;
    }
  }

  /**
   * Get successfully loaded plugins for plugin manager initialization
   */
  getLoadedPlugins(): Plugin[] {
    const results = Array.from(this.cache.loadResults.values());
    return results
      .filter(result => result.success && result.plugin)
      .map(result => result.plugin!);
  }

  /**
   * Scan plugins directory and build/update manifests
   */
  private async scanPluginsDirectory(pluginsDir: string): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];
    
    try {
      const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const pluginDir = path.join(pluginsDir, entry.name);
        const manifest = await this.buildPluginManifest(pluginDir, entry.name);
        
        if (manifest) {
          manifests.push(manifest);
          this.cache.manifests.set(manifest.name, manifest);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan plugins directory: ${error}`);
    }
    
    this.cache.lastScan = Date.now();
    return manifests;
  }

  /**
   * Build or update plugin manifest
   */
  private async buildPluginManifest(pluginDir: string, dirName: string): Promise<PluginManifest | null> {
    const entryPoints = ['main.js', 'main.ts', 'index.js'];
    
    // Find entry point
    let entryPoint = '';
    for (const entry of entryPoints) {
      const fullPath = path.join(pluginDir, entry);
      try {
        await fs.access(fullPath);
        entryPoint = entry;
        break;
      } catch {
        continue;
      }
    }
    
    if (!entryPoint) {
      console.warn(`⚠️ No valid entry point found for plugin in ${pluginDir}`);
      return null;
    }
    
    const entryPath = path.join(pluginDir, entryPoint);
    
    // Get file stats for caching
    const stats = await fs.stat(entryPath);
    const lastModified = stats.mtime.getTime();
    
    // Check if we have a cached manifest that's still valid
    const existingManifest = this.cache.manifests.get(dirName);
    if (existingManifest && existingManifest.lastModified >= lastModified) {
      return existingManifest;
    }
    
    // Try to read package.json for metadata
    let packageInfo: Record<string, unknown> = {};
    try {
      const packagePath = path.join(pluginDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      packageInfo = JSON.parse(packageContent);
    } catch {
      // No package.json or invalid, continue with defaults
    }
    
    // Create manifest
    const manifest: PluginManifest = {
      name: (packageInfo.name as string) || dirName,
      version: (packageInfo.version as string) || '1.0.0',
      description: packageInfo.description as string,
      author: packageInfo.author as string,
      dependencies: (packageInfo['letter-press'] as Record<string, unknown>)?.dependencies as string[] || [],
      peerDependencies: (packageInfo['letter-press'] as Record<string, unknown>)?.peerDependencies as string[] || [],
      entryPoint,
      lastModified,
      loadAttempts: existingManifest?.loadAttempts || 0
    };
    
    // Generate checksum for change detection
    try {
      const content = await fs.readFile(entryPath, 'utf-8');
      manifest.checksum = await this.generateChecksum(content);
    } catch (error) {
      console.warn(`⚠️ Could not generate checksum for ${manifest.name}: ${error}`);
    }
    
    return manifest;
  }

  /**
   * Resolve plugin dependency order
   */
  private resolveDependencyOrder(manifests: PluginManifest[]): PluginManifest[] {
    const nameToManifest = new Map(manifests.map(m => [m.name, m]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const ordered: PluginManifest[] = [];
    
    const visit = (manifest: PluginManifest): void => {
      if (visited.has(manifest.name)) return;
      
      if (visiting.has(manifest.name)) {
        console.warn(`⚠️ Circular dependency detected involving ${manifest.name}`);
        return;
      }
      
      visiting.add(manifest.name);
      
      // Visit dependencies first
      for (const depName of manifest.dependencies || []) {
        const depManifest = nameToManifest.get(depName);
        if (depManifest) {
          visit(depManifest);
        } else {
          console.warn(`⚠️ Missing dependency ${depName} for plugin ${manifest.name}`);
        }
      }
      
      visiting.delete(manifest.name);
      visited.add(manifest.name);
      ordered.push(manifest);
    };
    
    // Visit all manifests
    for (const manifest of manifests) {
      visit(manifest);
    }
    
    // Update dependency graph cache
    this.cache.dependencyGraph.clear();
    for (const manifest of manifests) {
      this.cache.dependencyGraph.set(manifest.name, manifest.dependencies || []);
    }
    
    return ordered;
  }

  /**
   * Load plugins in resolved order
   */
  private async loadPluginsInOrder(
    manifests: PluginManifest[], 
    pluginsDir: string
  ): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    for (const manifest of manifests) {
      // Skip if already loading or recently failed
      if (this.loadingQueue.has(manifest.name)) {
        console.log(`⏭️ Skipping ${manifest.name} - already loading`);
        continue;
      }
      
      if (this.shouldSkipFailedPlugin(manifest)) {
        console.log(`⏭️ Skipping ${manifest.name} - too many recent failures`);
        continue;
      }
      
      const result = await this.loadSinglePlugin(manifest, pluginsDir);
      results.push(result);
      
      // Cache the result
      this.cache.loadResults.set(manifest.name, result);
    }
    
    return results;
  }

  /**
   * Load a single plugin with enhanced error handling
   */
  private async loadSinglePlugin(
    manifest: PluginManifest, 
    pluginsDir: string
  ): Promise<PluginLoadResult> {
    const startTime = performance.now();
    
    this.loadingQueue.add(manifest.name);
    
    try {
      console.log(`📦 Loading plugin: ${manifest.name} v${manifest.version}`);
      
      // Check cache first
      const cached = this.cache.loadResults.get(manifest.name);
      if (cached && this.isCacheValid(cached, manifest)) {
        console.log(`💾 Using cached version of ${manifest.name}`);
        return {
          ...cached,
          loadTime: performance.now() - startTime
        };
      }
      
      // Validate dependencies are loaded
      const missingDeps = await this.validateDependencies(manifest);
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Load the plugin module
      const pluginPath = path.join(pluginsDir, manifest.name, manifest.entryPoint);
      const pluginModule = await this.loadPluginModule(pluginPath);
      
      if (!pluginModule) {
        throw new Error('Plugin module export is null or undefined');
      }
      
      // Validate plugin structure
      const plugin = await this.validatePlugin(pluginModule, manifest);
      
      const loadTime = performance.now() - startTime;
      manifest.loadTime = loadTime;
      
      console.log(`✅ Successfully loaded ${manifest.name} in ${loadTime.toFixed(2)}ms`);
      
      return {
        plugin,
        manifest,
        success: true,
        loadTime
      };
      
    } catch (error) {
      const loadTime = performance.now() - startTime;
      manifest.loadAttempts++;
      manifest.lastError = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Failed to load plugin ${manifest.name}: ${error}`);
      
      return {
        plugin: null,
        manifest,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        loadTime
      };
    } finally {
      this.loadingQueue.delete(manifest.name);
    }
  }

  /**
   * Load plugin module with import cache busting
   */
  private async loadPluginModule(pluginPath: string): Promise<Plugin | null> {
    try {
      // Clear import cache in development
      if (process.env.NODE_ENV === 'development') {
        delete require.cache[require.resolve(pluginPath)];
      }
      
      // Use regular import without timestamp in production to avoid SSR issues
      // In development, use timestamp for cache busting
      const importPath = process.env.NODE_ENV === 'development' 
        ? `${pluginPath}?t=${Date.now()}`
        : pluginPath;
      
      const pluginModule = await import(/* @vite-ignore */ importPath);
      
      return pluginModule.default || pluginModule;
    } catch (error) {
      console.error(`Failed to import plugin module from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Validate plugin structure and configuration
   */
  private async validatePlugin(pluginModule: unknown, manifest: PluginManifest): Promise<Plugin> {
    if (!pluginModule || typeof pluginModule !== 'object') {
      throw new Error('Plugin must export an object');
    }
    
    const plugin = pluginModule as Record<string, unknown>;
    
    if (!plugin.config) {
      throw new Error('Plugin must have a config object');
    }
    
    const config = plugin.config as Record<string, unknown>;
    if (!config.name) {
      throw new Error('Plugin config must have a name');
    }
    
    // Validate version matches manifest
    if (config.version !== manifest.version) {
      console.warn(`⚠️ Version mismatch for ${manifest.name}: manifest=${manifest.version}, config=${config.version}`);
    }
    
    // Validate hooks if present
    if (plugin.hooks) {
      const hooks = plugin.hooks as Record<string, unknown>;
      for (const [hookName, callback] of Object.entries(hooks)) {
        if (callback !== null && callback !== undefined && typeof callback !== 'function') {
          throw new Error(`Hook ${hookName} must be a function`);
        }
      }
    }
    
    return pluginModule as Plugin;
  }

  /**
   * Validate plugin dependencies are loaded
   */
  private async validateDependencies(manifest: PluginManifest): Promise<string[]> {
    const missing: string[] = [];
    
    for (const depName of manifest.dependencies || []) {
      const depResult = this.cache.loadResults.get(depName);
      if (!depResult || !depResult.success) {
        missing.push(depName);
      }
    }
    
    return missing;
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cached: PluginLoadResult, manifest: PluginManifest): boolean {
    return cached.manifest.checksum === manifest.checksum && 
           cached.manifest.lastModified >= manifest.lastModified;
  }

  /**
   * Check if plugin should be skipped due to recent failures
   */
  private shouldSkipFailedPlugin(manifest: PluginManifest): boolean {
    return manifest.loadAttempts >= this.maxRetryAttempts;
  }

  /**
   * Generate content checksum for change detection
   */
  private async generateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      manifestsCached: this.cache.manifests.size,
      loadResultsCached: this.cache.loadResults.size,
      lastScan: new Date(this.cache.lastScan),
      memoryUsage: {
        manifests: this.cache.manifests.size,
        loadResults: this.cache.loadResults.size,
        dependencyGraph: this.cache.dependencyGraph.size
      }
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.manifests.clear();
    this.cache.loadResults.clear();
    this.cache.dependencyGraph.clear();
    this.cache.lastScan = 0;
  }

  /**
   * Hot reload a specific plugin
   */
  async hotReload(pluginName: string, pluginsDir?: string): Promise<boolean> {
    const dir = pluginsDir || path.join(process.cwd(), 'plugins');
    const pluginDir = path.join(dir, pluginName);
    
    console.log(`🔄 Hot reloading plugin: ${pluginName}`);
    
    try {
      // Remove from cache
      this.cache.manifests.delete(pluginName);
      this.cache.loadResults.delete(pluginName);
      
      // Rebuild manifest
      const manifest = await this.buildPluginManifest(pluginDir, pluginName);
      if (!manifest) {
        throw new Error('Failed to build plugin manifest');
      }
      
      // Reload plugin
      const result = await this.loadSinglePlugin(manifest, dir);
      
      if (result.success && result.plugin) {
        // Reload in plugin manager
        await pluginManager.reloadPlugin(pluginName, pluginDir);
        console.log(`✅ Hot reloaded ${pluginName} successfully`);
        return true;
      } else {
        console.error(`❌ Failed to hot reload ${pluginName}: ${result.error?.message}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Hot reload failed for ${pluginName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
const pluginLoader = new PluginLoader();

/**
 * Load all plugins from the plugins directory
 * 
 * This is the main entry point for plugin system initialization.
 * Call this at server startup to discover and load all plugins.
 * 
 * @param pluginsDir - Directory containing plugins (defaults to ./plugins)
 */
export async function loadAllPlugins(pluginsDir?: string) {
  return pluginLoader.loadAllPlugins(pluginsDir);
}

/**
 * Get loaded plugins for plugin manager initialization
 */
export function getLoadedPlugins(): Plugin[] {
  return pluginLoader.getLoadedPlugins();
}

/**
 * Hot reload a specific plugin
 */
export async function hotReloadPlugin(pluginName: string, pluginsDir?: string) {
  return pluginLoader.hotReload(pluginName, pluginsDir);
}

/**
 * Get plugin cache statistics
 */
export function getPluginCacheStats() {
  return pluginLoader.getCacheStats();
}

/**
 * Clear plugin cache (useful for testing)
 */
export function clearPluginCache() {
  pluginLoader.clearCache();
}

/**
 * Create a new plugin from template
 * 
 * Scaffolds a new plugin directory with boilerplate code.
 * 
 * @param pluginName - Name of the plugin to create
 * @param pluginsDir - Directory to create plugin in
 * @param template - Template type to use
 */
export async function createPlugin(
  pluginName: string,
  pluginsDir?: string,
  template: 'basic' | 'advanced' = 'basic'
): Promise<void> {
  const dir = pluginsDir || path.join(process.cwd(), 'plugins');
  const pluginDir = path.join(dir, pluginName);
  
  // Check if plugin already exists
  try {
    await fs.access(pluginDir);
    throw new Error(`Plugin ${pluginName} already exists`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Create plugin directory
  await fs.mkdir(pluginDir, { recursive: true });
  
  // Generate plugin files based on template
  if (template === 'basic') {
    await createBasicPlugin(pluginDir, pluginName);
  } else {
    await createAdvancedPlugin(pluginDir, pluginName);
  }
  
  console.log(`✅ Plugin ${pluginName} created at ${pluginDir}`);
}

/**
 * Create a basic plugin template
 */
async function createBasicPlugin(pluginDir: string, pluginName: string): Promise<void> {
  const mainJs = `import { definePlugin } from '@letter-press/plugin-sdk';

export default definePlugin({
  name: '${pluginName}',
  version: '1.0.0',
  description: 'A new plugin for Letter-Press CMS',
  author: 'Your Name',

  hooks: {
    beforePostCreate: (data) => {
      console.log(\`📝 \${data.title} is about to be created\`);
      return data;
    },

    afterPostCreate: (post) => {
      console.log(\`✅ Post created: \${post.title}\`);
    }
  },

  settings: {
    enabled: {
      type: 'boolean',
      label: 'Enable Plugin',
      description: 'Enable or disable this plugin',
      default: true
    }
  }
});
`;

  const packageJson = `{
  "name": "${pluginName}",
  "version": "1.0.0",
  "description": "A new plugin for Letter-Press CMS",
  "main": "main.js",
  "keywords": ["letter-press", "plugin"],
  "author": "Your Name",
  "license": "MIT"
}
`;

  const readme = `# ${pluginName}

A new plugin for Letter-Press CMS.

## Description

This plugin demonstrates basic functionality.

## Configuration

The plugin includes the following settings:

- **enabled**: Enable or disable the plugin

## Hooks

- \`beforePostCreate\`: Called before a post is created
- \`afterPostCreate\`: Called after a post is created

## Installation

This plugin is automatically loaded from the plugins directory.

## Development

To modify this plugin:

1. Edit \`main.js\`
2. Restart the server or use hot reload
3. Test your changes

## License

MIT
`;

  await fs.writeFile(path.join(pluginDir, 'main.js'), mainJs);
  await fs.writeFile(path.join(pluginDir, 'package.json'), packageJson);
  await fs.writeFile(path.join(pluginDir, 'README.md'), readme);
}

/**
 * Create an advanced plugin template
 */
async function createAdvancedPlugin(pluginDir: string, pluginName: string): Promise<void> {
  const mainJs = `import { createPlugin } from '@letter-press/plugin-sdk';

export default createPlugin()
  .configure({
    name: '${pluginName}',
    version: '1.0.0',
    description: 'An advanced plugin for Letter-Press CMS',
    author: 'Your Name'
  })
  .addSettings({
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'Your API key for external service',
      required: true
    },
    enableLogging: {
      type: 'boolean',
      label: 'Enable Logging',
      description: 'Enable debug logging',
      default: false
    }
  })
  .beforePostCreate(async (data) => {
    // Advanced post processing
    if (data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\\s-]/g, '')
        .replace(/\\s+/g, '-');
    }
    return data;
  })
  .afterPostCreate(async (post) => {
    // Send notification or trigger external service
    console.log(\`📬 Notifying external service about: \${post.title}\`);
  })
  .addMetaField({
    key: 'external_id',
    label: 'External ID',
    type: 'text',
    description: 'ID from external system'
  })
  .addShortcode({
    name: 'custom-widget',
    handler: (attributes) => {
      const title = attributes.title || 'Default Title';
      return \`<div class="custom-widget"><h3>\${title}</h3></div>\`;
    },
    attributes: {
      title: {
        type: 'string',
        required: false,
        default: 'Default Title'
      }
    }
  })
  .onInstall(async () => {
    console.log('🔧 Installing plugin...');
    // Perform installation tasks
  })
  .onUninstall(async () => {
    console.log('🗑️ Uninstalling plugin...');
    // Cleanup tasks
  })
  .build();
`;

  const packageJson = `{
  "name": "${pluginName}",
  "version": "1.0.0",
  "description": "An advanced plugin for Letter-Press CMS",
  "main": "main.js",
  "keywords": ["letter-press", "plugin", "advanced"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@letter-press/plugin-sdk": "^1.0.0"
  }
}
`;

  const readme = `# ${pluginName}

An advanced plugin for Letter-Press CMS.

## Features

- ✅ Post processing with automatic slug generation
- ✅ External service notifications
- ✅ Custom meta fields
- ✅ Shortcode support
- ✅ Configurable settings
- ✅ Installation/uninstallation hooks

## Configuration

This plugin supports the following settings:

- **apiKey**: Your API key for external service integration
- **enableLogging**: Enable debug logging for troubleshooting

## Meta Fields

- **external_id**: Links posts to external system records

## Shortcodes

### [custom-widget]

Creates a custom widget with configurable title.

\`\`\`
[custom-widget title="My Widget"]
\`\`\`

## Installation

1. Place this plugin in the \`plugins/\` directory
2. Restart the server
3. Configure settings in the admin panel
4. Enable the plugin

## Development

This plugin uses the advanced SDK features:

- Fluent API for configuration
- Type-safe hook definitions
- Built-in validation
- Error handling

To modify:

1. Edit \`main.js\`
2. Use hot reload for testing
3. Run health checks to verify functionality

## License

MIT
`;

  const typesTs = `// TypeScript definitions for this plugin

export interface PluginSettings {
  apiKey: string;
  enableLogging: boolean;
}

export interface ExternalService {
  notify(postId: number, title: string): Promise<void>;
  validateApiKey(key: string): Promise<boolean>;
}
`;

  await fs.writeFile(path.join(pluginDir, 'main.js'), mainJs);
  await fs.writeFile(path.join(pluginDir, 'package.json'), packageJson);
  await fs.writeFile(path.join(pluginDir, 'README.md'), readme);
  await fs.writeFile(path.join(pluginDir, 'types.ts'), typesTs);
}

/**
 * Watch plugins directory for changes and hot reload
 * 
 * Only use this in development mode.
 */
export async function watchPlugins(pluginsDir?: string): Promise<void> {
  const dir = pluginsDir || path.join(process.cwd(), 'plugins');
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Plugin watching is disabled in production');
    return;
  }
  
  console.log(`👀 Watching plugins directory: ${dir}`);
  
  // Simple polling-based watcher (in production use fs.watch or chokidar)
  setInterval(async () => {
    try {
      await pluginManager.checkForUpdates(dir);
    } catch (error) {
      console.error('Error during plugin update check:', error);
    }
  }, 5000); // Check every 5 seconds
}

/**
 * List all available plugins in directory
 */
export async function listAvailablePlugins(pluginsDir?: string): Promise<string[]> {
  const dir = pluginsDir || path.join(process.cwd(), 'plugins');
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    console.error('Failed to list plugins:', error);
    return [];
  }
}

/**
 * Export all plugin management functions
 */
export { pluginManager } from './plugin-manager';