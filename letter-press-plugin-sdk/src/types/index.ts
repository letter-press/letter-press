import type { JSX } from 'solid-js';

// ====== CORE PLUGIN TYPES ======

/**
 * Plugin configuration that defines metadata and requirements
 */
export interface PluginConfig {
  /** Unique plugin identifier */
  name: string;
  /** Semantic version */
  version: string;
  /** Human-readable description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** License identifier */
  license?: string;
  
  // Dependencies
  /** Plugin dependencies with version constraints */
  dependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  
  // Plugin requirements
  /** Minimum CMS version required */
  minCmsVersion?: string;
  /** Maximum compatible CMS version */
  maxCmsVersion?: string;
  
  // Feature flags
  /** Whether this plugin requires database access */
  requiresDatabase?: boolean;
  /** Whether this plugin requires authentication */
  requiresAuth?: boolean;
  
  // Settings schema
  /** Plugin settings configuration schema */
  settings?: PluginSettingsSchema;
}

/**
 * Plugin lifecycle and content hooks
 */
export interface PluginHooks {
  // Server lifecycle
  /** Called when the server starts */
  onServerStart?: () => Promise<void> | void;
  /** Called when the server stops */
  onServerStop?: () => Promise<void> | void;
  
  // Database hooks
  /** Called when database connects */
  onDatabaseConnect?: () => Promise<void> | void;
  /** Called before database query execution */
  beforeQuery?: (query: string, params?: any[]) => Promise<void> | void;
  /** Called after database query execution */
  afterQuery?: (query: string, params?: any[], result?: any) => Promise<void> | void;
  
  // Content hooks
  /** Called before creating a new post */
  beforePostCreate?: (data: any) => Promise<any> | any;
  /** Called after creating a new post */
  afterPostCreate?: (post: any) => Promise<void> | void;
  /** Called before updating a post */
  beforePostUpdate?: (id: number, data: any) => Promise<any> | any;
  /** Called after updating a post */
  afterPostUpdate?: (post: any) => Promise<void> | void;
  /** Called before deleting a post */
  beforePostDelete?: (id: number) => Promise<void> | void;
  /** Called after deleting a post */
  afterPostDelete?: (id: number) => Promise<void> | void;
  
  // Request/Response hooks
  /** Called before processing a request */
  beforeRequest?: (event: any) => Promise<void> | void;
  /** Called after processing a request */
  afterRequest?: (event: any, response?: Response) => Promise<void> | void;
  
  // Auth hooks
  /** Called before user login */
  beforeLogin?: (credentials: any) => Promise<any> | any;
  /** Called after user login */
  afterLogin?: (user: any) => Promise<void> | void;
  /** Called before user logout */
  beforeLogout?: (user: any) => Promise<void> | void;
  /** Called after user logout */
  afterLogout?: (user: any) => Promise<void> | void;
  
  // Registration hooks
  /** Register custom post types */
  registerPostTypes?: () => string[];
  /** Register custom meta fields */
  registerMetaFields?: () => PluginMetaField[];
  /** Register admin pages */
  registerAdminPages?: () => PluginAdminPage[];
  /** Register shortcodes */
  registerShortcodes?: () => PluginShortcode[];
  /** Register widgets */
  registerWidgets?: () => PluginWidget[];
  /** Register editor blocks */
  registerBlocks?: () => PluginBlock[];
}

/**
 * Main plugin interface that all plugins must implement
 */
export interface Plugin {
  /** Plugin configuration */
  config: PluginConfig;
  /** Plugin hooks */
  hooks?: PluginHooks;
  
  // Plugin lifecycle methods
  /** Called when plugin is installed */
  install?: () => Promise<void> | void;
  /** Called when plugin is uninstalled */
  uninstall?: () => Promise<void> | void;
  /** Called when plugin is activated */
  activate?: () => Promise<void> | void;
  /** Called when plugin is deactivated */
  deactivate?: () => Promise<void> | void;
  
  // Settings management
  /** Get plugin settings */
  getSettings?: () => Promise<Record<string, any>> | Record<string, any>;
  /** Update plugin settings */
  updateSettings?: (settings: Record<string, any>) => Promise<void> | void;
}

// ====== PLUGIN EXTENSIONS ======

/**
 * Custom meta field definition
 */
export interface PluginMetaField {
  /** Field identifier */
  key: string;
  /** Display label */
  label: string;
  /** Field type */
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'json' | 'url' | 'email' | 'date' | 'datetime';
  /** Field description */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Default value */
  defaultValue?: any;
  /** Options for select fields */
  options?: Array<{ label: string; value: any }>;
  /** Custom validation function */
  validation?: (value: any) => boolean | string;
  /** Field group */
  group?: string;
  /** Display order */
  order?: number;
}

/**
 * Admin page definition
 */
export interface PluginAdminPage {
  /** Page route path */
  path: string;
  /** Page title */
  title: string;
  /** Page icon */
  icon?: string;
  /** Page component */
  component: () => JSX.Element;
  /** Required permission */
  permission?: string;
  /** Menu position */
  menuPosition?: number;
  /** Parent menu item */
  parent?: string;
}

/**
 * Shortcode definition
 */
export interface PluginShortcode {
  /** Shortcode name */
  name: string;
  /** Shortcode handler function */
  handler: (attributes: Record<string, string>, content?: string) => string | JSX.Element;
  /** Shortcode description */
  description?: string;
  /** Shortcode attributes schema */
  attributes?: Record<string, {
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: any;
    description?: string;
  }>;
  /** Whether shortcode has closing tag */
  hasClosingTag?: boolean;
  /** Shortcode category */
  category?: string;
}

/**
 * Widget definition
 */
export interface PluginWidget {
  /** Widget name */
  name: string;
  /** Widget title */
  title: string;
  /** Widget description */
  description?: string;
  /** Widget component */
  component: (props: any) => JSX.Element;
  /** Widget configuration schema */
  configSchema?: PluginSettingsSchema;
  /** Default widget configuration */
  defaultConfig?: Record<string, any>;
  /** Widget category */
  category?: string;
  /** Widget icon */
  icon?: string;
}

/**
 * Editor block definition
 */
export interface PluginBlock {
  /** Block name */
  name: string;
  /** Block title */
  title: string;
  /** Block category */
  category?: string;
  /** Block icon */
  icon?: string;
  /** Block description */
  description?: string;
  /** Block component */
  component: (props: any) => JSX.Element;
  /** Block edit component */
  editComponent?: (props: any) => JSX.Element;
  /** Block attributes schema */
  attributes?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    default?: any;
  }>;
  /** Block supports */
  supports?: {
    html?: boolean;
    align?: boolean;
    color?: boolean;
  };
}

/**
 * Plugin settings schema
 */
export interface PluginSettingsSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'json' | 'url' | 'email' | 'color';
    label: string;
    description?: string;
    required?: boolean;
    default?: any;
    options?: Array<{ label: string; value: any }>;
    validation?: (value: any) => boolean | string;
    group?: string;
    order?: number;
    placeholder?: string;
    min?: number;
    max?: number;
  };
}

// ====== RUNTIME TYPES ======

/**
 * Plugin instance in the registry
 */
export interface PluginInstance {
  /** Plugin ID */
  id: string;
  /** Plugin implementation */
  plugin: Plugin;
  /** Whether plugin is enabled */
  enabled: boolean;
  /** Installation timestamp */
  installedAt: Date;
  /** Plugin version */
  version: string;
  /** Plugin settings */
  settings: Record<string, any>;
}

/**
 * Plugin error information
 */
export interface PluginError {
  /** Plugin ID */
  pluginId: string;
  /** Error message */
  message: string;
  /** Error context */
  context?: string;
  /** Error timestamp */
  timestamp: Date;
  /** Error stack trace */
  stack?: string;
}

/**
 * Plugin execution context
 */
export interface PluginContext {
  /** Database instance */
  db: any;
  /** Plugin configuration */
  config: Record<string, any>;
  /** Logger instance */
  logger: {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
  };
  /** Utility functions */
  utils: {
    validateSlug: (slug: string) => boolean;
    sanitizeHtml: (content: string) => string;
    generateExcerpt: (content: string, length?: number) => string;
  };
  /** Hook system interface */
  hooks: {
    addAction: (name: string, callback: (...args: any[]) => any, priority?: number) => void;
    addFilter: (name: string, callback: (...args: any[]) => any, priority?: number) => void;
    doAction: (name: string, ...args: any[]) => Promise<void>;
    applyFilters: (name: string, value: any, ...args: any[]) => Promise<any>;
  };
  /** Event system interface */
  events: PluginEventSystem;
}

// ====== MANAGER TYPES ======

/**
 * Plugin manager interface
 */
export interface PluginManager {
  /** Loaded plugins */
  plugins: Map<string, PluginInstance>;
  /** Hook registry */
  hooks: Map<string, Array<{ callback: (...args: any[]) => any; priority: number; pluginId: string }>>;
  /** Plugin errors */
  errors: PluginError[];
  
  // Plugin management
  /** Load a plugin from directory */
  loadPlugin: (pluginPath: string) => Promise<void>;
  /** Unload a plugin */
  unloadPlugin: (pluginId: string) => Promise<void>;
  /** Enable a plugin */
  enablePlugin: (pluginId: string) => Promise<void>;
  /** Disable a plugin */
  disablePlugin: (pluginId: string) => Promise<void>;
  
  // Hook system
  /** Add a hook */
  addHook: (pluginId: string, hookName: string, callback: (...args: any[]) => any, priority?: number) => void;
  /** Remove a hook */
  removeHook: (pluginId: string, hookName: string) => void;
  /** Execute hooks */
  executeHook: (hookName: string, ...args: any[]) => Promise<any[]>;
  
  // Plugin queries
  /** Get plugin by ID */
  getPlugin: (pluginId: string) => PluginInstance | undefined;
  /** Get enabled plugins */
  getEnabledPlugins: () => PluginInstance[];
  /** Get all plugins */
  getAllPlugins: () => PluginInstance[];
  
  // Error handling
  /** Log plugin error */
  logError: (pluginId: string, error: Error, context?: string) => void;
  /** Get plugin errors */
  getErrors: (pluginId?: string) => PluginError[];
}

// ====== HOOK SYSTEM TYPES ======

/**
 * Hook callback function
 */
export type HookCallback<T = any> = (...args: any[]) => T | Promise<T>;

/**
 * Hook registration
 */
export interface HookRegistration {
  /** Hook callback */
  callback: HookCallback;
  /** Hook priority (lower = higher priority) */
  priority: number;
  /** Plugin ID that registered this hook */
  pluginId: string;
}

/**
 * Available hook names
 */
export type HookName = 
  // Server lifecycle
  | 'onServerStart'
  | 'onServerStop'
  | 'onDatabaseConnect'
  | 'beforeQuery'
  | 'afterQuery'
  
  // Content lifecycle
  | 'beforePostCreate'
  | 'afterPostCreate'
  | 'beforePostUpdate'
  | 'afterPostUpdate'
  | 'beforePostDelete'
  | 'afterPostDelete'
  
  // Request lifecycle
  | 'beforeRequest'
  | 'afterRequest'
  
  // Auth lifecycle
  | 'beforeLogin'
  | 'afterLogin'
  | 'beforeLogout'
  | 'afterLogout'
  
  // Registration hooks
  | 'registerPostTypes'
  | 'registerMetaFields'
  | 'registerAdminPages'
  | 'registerShortcodes'
  | 'registerWidgets'
  | 'registerBlocks';

// ====== EVENT SYSTEM TYPES ======

/**
 * Core event names with extensible string literals
 * This pattern allows plugins to define custom events while providing autocompletion for built-in events
 */
export type EventName = 
  // Content events
  | 'content:created'
  | 'content:updated' 
  | 'content:deleted'
  | 'content:published'
  | 'content:draft'
  // User events
  | 'user:login'
  | 'user:logout'
  | 'user:registered'
  | 'user:updated'
  // System events
  | 'system:startup'
  | 'system:shutdown'
  | 'system:error'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  // Theme events
  | 'theme:changed'
  | 'theme:activated'
  // Media events
  | 'media:uploaded'
  | 'media:deleted'
  // SEO events
  | 'seo:analyzed'
  | 'seo:optimized'
  // Allow custom events with string literal fallback
  | ({} & string);

/**
 * Event payload interface for type safety
 */
export interface EventPayload {
  /** Event timestamp */
  timestamp: Date;
  /** Plugin that emitted the event */
  source?: string;
  /** Unique event ID */
  eventId: string;
  /** Event data */
  data?: any;
  /** Event metadata */
  meta?: Record<string, any>;
}

/**
 * Event listener callback function
 */
export type EventListener<T = any> = (payload: EventPayload & { data: T }) => Promise<void> | void;

/**
 * Event emitter options
 */
export interface EventEmitterOptions {
  /** Maximum number of listeners per event */
  maxListeners?: number;
  /** Enable event timing metrics */
  enableTiming?: boolean;
  /** Enable event logging */
  enableLogging?: boolean;
}

/**
 * Event listener options
 */
export interface EventListenerOptions {
  /** Listener priority (lower = higher priority) */
  priority?: number;
  /** Execute listener only once */
  once?: boolean;
  /** Plugin ID that registered this listener */
  pluginId?: string;
  /** Conditional execution function */
  condition?: (payload: EventPayload) => boolean | Promise<boolean>;
}

/**
 * Event registration information
 */
export interface EventRegistration<T = any> {
  /** Event name */
  eventName: EventName;
  /** Event listener */
  listener: EventListener<T>;
  /** Listener options */
  options: EventListenerOptions;
  /** Registration timestamp */
  registeredAt: Date;
  /** Plugin ID */
  pluginId: string;
}

/**
 * Event emission result
 */
export interface EventEmissionResult {
  /** Event name */
  eventName: EventName;
  /** Number of listeners that handled the event */
  listenerCount: number;
  /** Event execution time in milliseconds */
  executionTime?: number;
  /** Any errors that occurred during emission */
  errors: Error[];
  /** Event payload */
  payload: EventPayload;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  /** Register an event listener */
  on<T = any>(eventName: EventName, listener: EventListener<T>, options?: EventListenerOptions): void;
  /** Register a one-time event listener */
  once<T = any>(eventName: EventName, listener: EventListener<T>, options?: Omit<EventListenerOptions, 'once'>): void;
  /** Remove an event listener */
  off(eventName: EventName, listener: EventListener): void;
  /** Remove all listeners for an event */
  removeAllListeners(eventName?: EventName): void;
  /** Emit an event */
  emit<T = any>(eventName: EventName, data?: T, meta?: Record<string, any>): Promise<EventEmissionResult>;
  /** Get listener count for an event */
  listenerCount(eventName: EventName): number;
  /** Get all event names */
  eventNames(): EventName[];
  /** Get listeners for an event */
  listeners(eventName: EventName): EventRegistration[];
  /** Check if event has listeners */
  hasListeners(eventName: EventName): boolean;
  /** Wait for a specific event with timeout */
  waitForEvent?<T = any>(eventName: EventName, timeout?: number): Promise<EventPayload & { data: T }>;
}

/**
 * Plugin event system interface - extends the existing PluginContext
 */
export interface PluginEventSystem {
  /** Event emitter instance */
  events: EventEmitter;
  /** Create namespaced event names */
  createEvent: (name: string) => EventName;
  /** Emit plugin-specific events */
  emitPluginEvent: <T = any>(eventName: string, data?: T, meta?: Record<string, any>) => Promise<EventEmissionResult>;
  /** Listen to plugin-specific events */
  onPluginEvent: <T = any>(eventName: string, listener: EventListener<T>, options?: EventListenerOptions) => void;
}

// ====== UTILITY TYPES ======

/**
 * Deep partial type for configuration
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Plugin factory function
 */
export type PluginFactory = () => Plugin;

/**
 * Plugin with metadata
 */
export interface PluginWithMeta extends Plugin {
  /** Plugin file path */
  __filePath?: string;
  /** Plugin directory */
  __directory?: string;
  /** Plugin load timestamp */
  __loadedAt?: Date;
}
