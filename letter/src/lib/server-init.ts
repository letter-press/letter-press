import { loadPlugins } from './plugin-loader';
import { pluginManager } from './plugin-manager';

// Server startup initialization
let initialized = false;

export async function initializeServer() {
    if (initialized) return;

    console.log('🚀 Starting CMS server initialization...');

    try {
        // Initialize plugin system
        const plugins = await loadPlugins();
        await pluginManager.initialize(plugins);

        console.log('✅ Server initialized successfully');
        initialized = true;
    } catch (error) {
        console.error('❌ Server initialization failed:', error);
        // Don't throw - allow server to continue without plugins
        initialized = true;
    }
}

export async function isServerInitialized(): Promise<boolean> {
    return initialized;
}
