"use server";

import { loadAllPlugins, getLoadedPlugins } from './plugin-loader';
import { pluginManager } from './plugin-manager';
import { pluginSandbox } from './plugin-sandbox';
import { pluginWatcher } from './plugin-watcher';
import { initializeBuiltInThemes } from './theme-init';

// Server startup initialization
let initialized = false;

export async function initializeServer() {
    if (initialized) return;

    console.log('🚀 Starting enhanced CMS server initialization...');

    try {
        // Initialize built-in themes
        console.log('📄 Initializing themes...');
        await initializeBuiltInThemes();
        console.log('✅ Themes initialized');

        // Initialize enhanced plugin system
        console.log('🔌 Loading plugins with enhanced loader...');
        const pluginResults = await loadAllPlugins();
        
        // Initialize plugin manager with loaded plugins
        const loadedPlugins = getLoadedPlugins();
        if (loadedPlugins.length > 0) {
            await pluginManager.initialize(loadedPlugins);
        }
        
        console.log(`✅ Enhanced plugin loading complete:`);
        console.log(`   📦 Loaded: ${pluginResults.loaded.length} plugins`);
        console.log(`   ❌ Failed: ${pluginResults.failed.length} plugins`);
        console.log(`   ⏭️ Skipped: ${pluginResults.skipped.length} plugins`);
        console.log(`   ⏱️ Total time: ${pluginResults.metrics.totalTime.toFixed(2)}ms`);
        console.log(`   💾 Cache hits: ${pluginResults.metrics.cacheHits}, misses: ${pluginResults.metrics.cacheMisses}`);
        
        // Start plugin watcher in development
        if (process.env.NODE_ENV === 'development') {
            console.log('👀 Starting plugin file watcher for development...');
            await pluginWatcher.startWatching();
        }
        
        // Generate initial sandbox health report
        const sandboxReport = pluginSandbox.generateHealthReport();
        console.log(`🔒 Plugin sandbox initialized with ${sandboxReport.summary.totalPlugins} plugins`);
        
        if (sandboxReport.issues.quarantinedPlugins.length > 0) {
            console.warn(`⚠️ ${sandboxReport.issues.quarantinedPlugins.length} plugins are quarantined`);
        }
        
        console.log('✅ Enhanced server initialized successfully');
        initialized = true;
    } catch (error) {
        console.error('❌ Enhanced server initialization failed:', error);
        // Don't throw - allow server to continue
        initialized = true;
    }
}

export async function isServerInitialized(): Promise<boolean> {
    return initialized;
}

export async function getServerStatus() {
    return {
        initialized,
        pluginManager: {
            initialized: pluginManager.isInitialized(),
            diagnostics: pluginManager.getDiagnostics(),
            summary: await pluginManager.getSummary()
        },
        sandbox: pluginSandbox.getStats(),
        watcher: pluginWatcher.getWatcherStats()
    };
}
