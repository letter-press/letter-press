/**
 * Letter-Press Plugin SDK
 * 
 * A comprehensive toolkit for developing plugins for Letter-Press CMS
 */

// Re-export all types
export type * from './types/index.js';
export type {
    Plugin,
    PluginConfig,
    PluginHooks,
    PluginSettingsSchema,
    PluginMetaField,
    PluginAdminPage,
    PluginShortcode,
    PluginWidget,
    PluginBlock
} from './types/index.js';

// Re-export utilities
export * from './utils/index.js';

// Re-export hook utilities
export * from './hooks/index.js';

// Core SDK class
import type {
    Plugin,
    PluginConfig,
    PluginHooks,
    PluginSettingsSchema,
    PluginMetaField,
    PluginAdminPage,
    PluginShortcode,
    PluginWidget,
    PluginBlock
} from './types/index.js';

import {
    validatePluginConfig,
    createLogger,
    deepMerge
} from './utils/index.js';

import {
    HookHelper,
    ContentFilter,
    HOOK_PRIORITIES,
    validateHooks
} from './hooks/index.js';

/**
 * Plugin SDK class that provides a fluent API for plugin development
 */
export class PluginSDK {
    private config: Partial<PluginConfig> = {};
    private hooks: Partial<PluginHooks> = {};
    private settings: PluginSettingsSchema = {};
    private metaFields: PluginMetaField[] = [];
    private adminPages: PluginAdminPage[] = [];
    private shortcodes: PluginShortcode[] = [];
    private widgets: PluginWidget[] = [];
    private blocks: PluginBlock[] = [];

    private hookHelper = new HookHelper();
    private contentFilter = new ContentFilter();
    private logger?: ReturnType<typeof createLogger>;

    /**
     * Set plugin configuration
     */
    configure(config: PluginConfig): this {
        const validation = validatePluginConfig(config);
        if (!validation.isValid) {
            throw new Error(`Invalid plugin configuration: ${validation.errors.join(', ')}`);
        }

        this.config = config;
        this.logger = createLogger(config.name);
        return this;
    }

    /**
     * Add a lifecycle hook
     */
    addHook<K extends keyof PluginHooks>(
        hookName: K,
        callback: NonNullable<PluginHooks[K]>
    ): this {
        this.hooks[hookName] = callback;
        return this;
    }

    /**
     * Add server lifecycle hooks
     */
    onServerStart(callback: NonNullable<PluginHooks['onServerStart']>): this {
        return this.addHook('onServerStart', callback);
    }

    onServerStop(callback: NonNullable<PluginHooks['onServerStop']>): this {
        return this.addHook('onServerStop', callback);
    }

    /**
     * Add content hooks
     */
    beforePostCreate(callback: NonNullable<PluginHooks['beforePostCreate']>): this {
        return this.addHook('beforePostCreate', callback);
    }

    afterPostCreate(callback: NonNullable<PluginHooks['afterPostCreate']>): this {
        return this.addHook('afterPostCreate', callback);
    }

    beforePostUpdate(callback: NonNullable<PluginHooks['beforePostUpdate']>): this {
        return this.addHook('beforePostUpdate', callback);
    }

    afterPostUpdate(callback: NonNullable<PluginHooks['afterPostUpdate']>): this {
        return this.addHook('afterPostUpdate', callback);
    }

    beforePostDelete(callback: NonNullable<PluginHooks['beforePostDelete']>): this {
        return this.addHook('beforePostDelete', callback);
    }

    afterPostDelete(callback: NonNullable<PluginHooks['afterPostDelete']>): this {
        return this.addHook('afterPostDelete', callback);
    }

    /**
     * Add auth hooks
     */
    beforeLogin(callback: NonNullable<PluginHooks['beforeLogin']>): this {
        return this.addHook('beforeLogin', callback);
    }

    afterLogin(callback: NonNullable<PluginHooks['afterLogin']>): this {
        return this.addHook('afterLogin', callback);
    }

    beforeLogout(callback: NonNullable<PluginHooks['beforeLogout']>): this {
        return this.addHook('beforeLogout', callback);
    }

    afterLogout(callback: NonNullable<PluginHooks['afterLogout']>): this {
        return this.addHook('afterLogout', callback);
    }

    /**
     * Register custom post types
     */
    registerPostTypes(postTypes: string[]): this {
        this.hooks.registerPostTypes = () => postTypes;
        return this;
    }

    /**
     * Add meta fields
     */
    addMetaField(field: PluginMetaField): this {
        this.metaFields.push(field);
        this.hooks.registerMetaFields = () => this.metaFields;
        return this;
    }

    /**
     * Add multiple meta fields
     */
    addMetaFields(fields: PluginMetaField[]): this {
        this.metaFields.push(...fields);
        this.hooks.registerMetaFields = () => this.metaFields;
        return this;
    }

    /**
     * Add admin page
     */
    addAdminPage(page: PluginAdminPage): this {
        this.adminPages.push(page);
        this.hooks.registerAdminPages = () => this.adminPages;
        return this;
    }

    /**
     * Add shortcode
     */
    addShortcode(shortcode: PluginShortcode): this {
        this.shortcodes.push(shortcode);
        this.hooks.registerShortcodes = () => this.shortcodes;
        return this;
    }

    /**
     * Add widget
     */
    addWidget(widget: PluginWidget): this {
        this.widgets.push(widget);
        this.hooks.registerWidgets = () => this.widgets;
        return this;
    }

    /**
     * Add editor block
     */
    addBlock(block: PluginBlock): this {
        this.blocks.push(block);
        this.hooks.registerBlocks = () => this.blocks;
        return this;
    }

    /**
     * Add settings schema
     */
    addSettings(settings: PluginSettingsSchema): this {
        this.settings = deepMerge(this.settings, settings);
        if (this.config) {
            this.config.settings = this.settings;
        }
        return this;
    }

    /**
     * Add content filter
     */
    addFilter(filterName: string, callback: (content: any, ...args: any[]) => any): this {
        this.contentFilter.addFilter(filterName, callback);
        return this;
    }

    /**
     * Create install lifecycle method
     */
    onInstall(callback: () => Promise<void> | void): this {
        (this as any).install = async () => {
            try {
                await callback();
            } catch (error) {
                this.getLogger().error('Error in install:', error);
                throw error;
            }
        };
        return this;
    }

    /**
     * Create uninstall lifecycle method
     */
    onUninstall(callback: () => Promise<void> | void): this {
        (this as any).uninstall = async () => {
            try {
                await callback();
            } catch (error) {
                this.getLogger().error('Error in uninstall:', error);
                throw error;
            }
        };
        return this;
    }

    /**
     * Create activate lifecycle method
     */
    onActivate(callback: () => Promise<void> | void): this {
        (this as any).activate = async () => {
            try {
                await callback();
            } catch (error) {
                this.getLogger().error('Error in activate:', error);
                throw error;
            }
        };
        return this;
    }

    /**
     * Create deactivate lifecycle method
     */
    onDeactivate(callback: () => Promise<void> | void): this {
        (this as any).deactivate = async () => {
            try {
                await callback();
            } catch (error) {
                this.getLogger().error('Error in deactivate:', error);
                throw error;
            }
        };
        return this;
    }

    /**
     * Build the final plugin
     */
    build(): Plugin {
        if (!this.config.name || !this.config.version) {
            throw new Error('Plugin name and version are required');
        }

        // Validate hooks
        const hookValidation = validateHooks(this.hooks as PluginHooks);
        if (!hookValidation.isValid) {
            throw new Error(`Invalid hooks: ${hookValidation.errors.join(', ')}`);
        }

        const plugin: Plugin = {
            config: {
                ...this.config,
                settings: this.settings
            } as PluginConfig,
            hooks: this.hooks as PluginHooks
        };

        // Add lifecycle methods if they exist
        if ((this as any).install) plugin.install = (this as any).install;
        if ((this as any).uninstall) plugin.uninstall = (this as any).uninstall;
        if ((this as any).activate) plugin.activate = (this as any).activate;
        if ((this as any).deactivate) plugin.deactivate = (this as any).deactivate;

        return plugin;
    }

    /**
     * Get logger instance
     */
    getLogger(): ReturnType<typeof createLogger> {
        if (!this.logger) {
            throw new Error('Logger not available. Call configure() first.');
        }
        return this.logger;
    }

    /**
     * Get hook helper
     */
    getHookHelper(): HookHelper {
        return this.hookHelper;
    }

    /**
     * Get content filter
     */
    getContentFilter(): ContentFilter {
        return this.contentFilter;
    }
}

/**
 * Create a new plugin using the fluent API
 */
export function createPlugin(): PluginSDK {
    return new PluginSDK();
}

/**
 * Define a plugin with a simple object-based configuration
 */
export function definePlugin(config: {
    name: string;
    version: string;
    description?: string;
    author?: string;
    hooks?: PluginHooks;
    install?: () => Promise<void> | void;
    uninstall?: () => Promise<void> | void;
    activate?: () => Promise<void> | void;
    deactivate?: () => Promise<void> | void;
    settings?: PluginSettingsSchema;
    metaFields?: PluginMetaField[];
    adminPages?: PluginAdminPage[];
    shortcodes?: PluginShortcode[];
    widgets?: PluginWidget[];
    blocks?: PluginBlock[];
}): Plugin {
    const pluginConfig: PluginConfig = {
        name: config.name,
        version: config.version,
        ...(config.description && { description: config.description }),
        ...(config.author && { author: config.author }),
        ...(config.settings && { settings: config.settings })
    };

    const sdk = createPlugin().configure(pluginConfig);

    // Add hooks
    if (config.hooks) {
        Object.entries(config.hooks).forEach(([hookName, callback]) => {
            if (callback) {
                sdk.addHook(hookName as keyof PluginHooks, callback as any);
            }
        });
    }

    // Add lifecycle methods
    if (config.install) sdk.onInstall(config.install);
    if (config.uninstall) sdk.onUninstall(config.uninstall);
    if (config.activate) sdk.onActivate(config.activate);
    if (config.deactivate) sdk.onDeactivate(config.deactivate);

    // Add extensions
    if (config.metaFields) sdk.addMetaFields(config.metaFields);
    if (config.adminPages) config.adminPages.forEach(page => sdk.addAdminPage(page));
    if (config.shortcodes) config.shortcodes.forEach(shortcode => sdk.addShortcode(shortcode));
    if (config.widgets) config.widgets.forEach(widget => sdk.addWidget(widget));
    if (config.blocks) config.blocks.forEach(block => sdk.addBlock(block));

    return sdk.build();
}

// Export constants
export { HOOK_PRIORITIES };

// Export version
export const SDK_VERSION = '1.0.0';
