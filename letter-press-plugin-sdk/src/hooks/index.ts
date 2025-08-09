import type { 
  HookCallback, 
  HookName, 
  PluginHooks,
  Plugin,
  EventName,
  EventListener,
  EventListenerOptions,
  EventPayload,
  EventRegistration,
  EventEmissionResult,
  EventEmitter,
  EventEmitterOptions,
  PluginEventSystem
} from '../types/index.js';

/**
 * Hook priority constants
 */
export const HOOK_PRIORITIES = {
  HIGHEST: 1,
  HIGH: 5,
  NORMAL: 10,
  LOW: 15,
  LOWEST: 20
} as const;

// ====== EVENT SYSTEM IMPLEMENTATION ======

/**
 * TypeSafe Event Emitter Implementation
 */
export class TypeSafeEventEmitter implements EventEmitter {
  private eventListeners: Map<EventName, EventRegistration[]> = new Map();
  private options: EventEmitterOptions;
  private eventTimings: Map<string, number[]> = new Map();

  constructor(options: EventEmitterOptions = {}) {
    this.options = {
      maxListeners: 50,
      enableTiming: false,
      enableLogging: false,
      ...options
    };
  }

  /**
   * Register an event listener
   */
  on<T = any>(eventName: EventName, listener: EventListener<T>, options: EventListenerOptions = {}): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    const listenerList = this.eventListeners.get(eventName)!;
    
    // Check max listeners limit
    if (this.options.maxListeners && listenerList.length >= this.options.maxListeners) {
      console.warn(`Maximum listeners (${this.options.maxListeners}) exceeded for event: ${eventName}`);
    }

    const registration: EventRegistration<T> = {
      eventName,
      listener: listener as EventListener,
      options: {
        priority: 10,
        once: false,
        ...options
      },
      registeredAt: new Date(),
      pluginId: options.pluginId || 'unknown'
    };

    listenerList.push(registration);
    
    // Sort by priority (lower = higher priority)
    listenerList.sort((a, b) => (a.options.priority || 10) - (b.options.priority || 10));

    if (this.options.enableLogging) {
      console.log(`Event listener registered: ${eventName} (plugin: ${registration.pluginId})`);
    }
  }

  /**
   * Register a one-time event listener
   */
  once<T = any>(eventName: EventName, listener: EventListener<T>, options: Omit<EventListenerOptions, 'once'> = {}): void {
    this.on(eventName, listener, { ...options, once: true });
  }

  /**
   * Remove an event listener
   */
  off(eventName: EventName, listener: EventListener): void {
    const listenerList = this.eventListeners.get(eventName);
    if (!listenerList) return;

    const index = listenerList.findIndex(reg => reg.listener === listener);
    if (index > -1) {
      const removed = listenerList.splice(index, 1)[0];
      if (removed && this.options.enableLogging) {
        console.log(`Event listener removed: ${eventName} (plugin: ${removed.pluginId})`);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName?: EventName): void {
    if (eventName) {
      this.eventListeners.delete(eventName);
      if (this.options.enableLogging) {
        console.log(`All listeners removed for event: ${eventName}`);
      }
    } else {
      this.eventListeners.clear();
      if (this.options.enableLogging) {
        console.log('All event listeners removed');
      }
    }
  }

  /**
   * Emit an event
   */
  async emit<T = any>(eventName: EventName, data?: T, meta: Record<string, any> = {}): Promise<EventEmissionResult> {
    const startTime = this.options.enableTiming ? performance.now() : 0;
    const listenerList = this.eventListeners.get(eventName) || [];
    const errors: Error[] = [];
    
    const payload: EventPayload & { data: T } = {
      timestamp: new Date(),
      eventId: this.generateEventId(),
      data: data as T,
      meta,
      source: meta.source
    };

    let handledCount = 0;

    // Execute listeners in priority order
    for (const registration of listenerList) {
      try {
        // Check condition if present
        if (registration.options.condition) {
          const shouldExecute = await registration.options.condition(payload);
          if (!shouldExecute) continue;
        }

        await registration.listener(payload);
        handledCount++;

        // Remove one-time listeners
        if (registration.options.once) {
          this.off(eventName, registration.listener);
        }
      } catch (error) {
        errors.push(error as Error);
        console.error(`Error in event listener for ${eventName} (plugin: ${registration.pluginId}):`, error);
      }
    }

    const executionTime = this.options.enableTiming ? performance.now() - startTime : undefined;

    // Store timing data
    if (this.options.enableTiming && executionTime !== undefined) {
      if (!this.eventTimings.has(eventName)) {
        this.eventTimings.set(eventName, []);
      }
      this.eventTimings.get(eventName)!.push(executionTime);
    }

    const result: EventEmissionResult = {
      eventName,
      listenerCount: handledCount,
      ...(executionTime !== undefined && { executionTime }),
      errors,
      payload
    };

    if (this.options.enableLogging) {
      console.log(`Event emitted: ${eventName} (listeners: ${handledCount}, time: ${executionTime?.toFixed(2)}ms)`);
    }

    return result;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(eventName: EventName): number {
    const listenerList = this.eventListeners.get(eventName);
    return listenerList ? listenerList.length : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): EventName[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Get listeners for an event
   */
  listeners(eventName: EventName): EventRegistration[] {
    return this.eventListeners.get(eventName) || [];
  }

  /**
   * Check if event has listeners
   */
  hasListeners(eventName: EventName): boolean {
    const listenerList = this.eventListeners.get(eventName);
    return listenerList !== undefined && listenerList.length > 0;
  }

  /**
   * Get event timing statistics
   */
  getEventStats(): Record<string, { count: number; average: number; total: number }> {
    const stats: Record<string, { count: number; average: number; total: number }> = {};
    
    for (const [eventName, times] of this.eventTimings) {
      const total = times.reduce((a, b) => a + b, 0);
      stats[eventName] = {
        count: times.length,
        average: total / times.length,
        total
      };
    }
    
    return stats;
  }

  /**
   * Remove all listeners for a specific plugin
   */
  removePluginListeners(pluginId: string): void {
    for (const [eventName, listenerList] of this.eventListeners) {
      const filtered = listenerList.filter(reg => reg.pluginId !== pluginId);
      this.eventListeners.set(eventName, filtered);
    }
    
    if (this.options.enableLogging) {
      console.log(`All listeners removed for plugin: ${pluginId}`);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Plugin Event System Implementation
 */
export class PluginEventSystemImpl implements PluginEventSystem {
  public events: EventEmitter;
  private pluginId: string;

  constructor(eventEmitter: EventEmitter, pluginId: string) {
    this.events = eventEmitter;
    this.pluginId = pluginId;
  }

  /**
   * Create namespaced event names
   */
  createEvent(name: string): EventName {
    return `plugin:${this.pluginId}:${name}` as EventName;
  }

  /**
   * Emit plugin-specific events
   */
  async emitPluginEvent<T = any>(eventName: string, data?: T, meta: Record<string, any> = {}): Promise<EventEmissionResult> {
    const namespacedEvent = this.createEvent(eventName);
    return await this.events.emit(namespacedEvent, data, { 
      ...meta, 
      source: this.pluginId 
    });
  }

  /**
   * Listen to plugin-specific events
   */
  onPluginEvent<T = any>(eventName: string, listener: EventListener<T>, options: EventListenerOptions = {}): void {
    const namespacedEvent = this.createEvent(eventName);
    this.events.on(namespacedEvent, listener, { 
      ...options, 
      pluginId: this.pluginId 
    });
  }
}

/**
 * Event helper utilities
 */
export const EventHelpers = {
  /**
   * Create event listener with error handling
   */
  createSafeListener<T = any>(
    listener: EventListener<T>, 
    errorHandler?: (error: Error) => void
  ): EventListener<T> {
    return async (payload: EventPayload & { data: T }) => {
      try {
        await listener(payload);
      } catch (error) {
        if (errorHandler) {
          errorHandler(error as Error);
        } else {
          console.error('Event listener error:', error);
        }
      }
    };
  },

  /**
   * Create conditional event listener
   */
  createConditionalListener<T = any>(
    condition: (payload: EventPayload & { data: T }) => boolean | Promise<boolean>,
    listener: EventListener<T>
  ): EventListener<T> {
    return async (payload: EventPayload & { data: T }) => {
      const shouldExecute = await condition(payload);
      if (shouldExecute) {
        await listener(payload);
      }
    };
  },

  /**
   * Create throttled event listener
   */
  createThrottledListener<T = any>(
    listener: EventListener<T>,
    delay: number
  ): EventListener<T> {
    let lastExecution = 0;
    
    return async (payload: EventPayload & { data: T }) => {
      const now = Date.now();
      if (now - lastExecution >= delay) {
        lastExecution = now;
        await listener(payload);
      }
    };
  },

  /**
   * Create debounced event listener
   */
  createDebouncedListener<T = any>(
    listener: EventListener<T>,
    delay: number
  ): EventListener<T> {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return async (payload: EventPayload & { data: T }) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        await listener(payload);
      }, delay);
    };
  },

  /**
   * Wait for a specific event
   */
  waitForEvent<T = any>(
    eventEmitter: EventEmitter, 
    eventName: EventName, 
    timeout?: number
  ): Promise<EventPayload & { data: T }> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;
      
      const listener: EventListener<T> = (payload) => {
        if (timeoutId) clearTimeout(timeoutId);
        eventEmitter.off(eventName, listener);
        resolve(payload);
      };
      
      eventEmitter.once(eventName, listener);
      
      if (timeout) {
        timeoutId = setTimeout(() => {
          eventEmitter.off(eventName, listener);
          reject(new Error(`Event ${eventName} timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }
};

/**
 * Hook utilities for plugin development
 */
export class HookHelper {
  private hooks: Map<string, Array<{ callback: HookCallback; priority: number; pluginId: string }>> = new Map();

  /**
   * Add a hook with priority
   */
  addHook(pluginId: string, hookName: string, callback: HookCallback, priority: number = HOOK_PRIORITIES.NORMAL): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookList = this.hooks.get(hookName)!;
    hookList.push({ callback, priority, pluginId });

    // Sort by priority (lower numbers = higher priority)
    hookList.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a specific hook
   */
  removeHook(pluginId: string, hookName: string): void {
    const hookList = this.hooks.get(hookName);
    if (!hookList) return;

    const filtered = hookList.filter(hook => hook.pluginId !== pluginId);
    this.hooks.set(hookName, filtered);
  }

  /**
   * Remove all hooks for a plugin
   */
  removeAllHooksForPlugin(pluginId: string): void {
    for (const [hookName] of this.hooks) {
      this.removeHook(pluginId, hookName);
    }
  }

  /**
   * Execute hooks and return results
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const hookList = this.hooks.get(hookName);
    if (!hookList || hookList.length === 0) return [];

    const results: any[] = [];

    for (const hook of hookList) {
      try {
        const result = await hook.callback(...args);
        if (result !== undefined) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error executing hook ${hookName} for plugin ${hook.pluginId}:`, error);
      }
    }

    return results;
  }

  /**
   * Check if a hook exists
   */
  hasHook(hookName: string): boolean {
    const hookList = this.hooks.get(hookName);
    return hookList !== undefined && hookList.length > 0;
  }

  /**
   * Get hook count for a specific hook name
   */
  getHookCount(hookName: string): number {
    const hookList = this.hooks.get(hookName);
    return hookList ? hookList.length : 0;
  }

  /**
   * Get all hook names
   */
  getAllHookNames(): string[] {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get hooks for a specific plugin
   */
  getPluginHooks(pluginId: string): { hookName: string; priority: number }[] {
    const pluginHooks: { hookName: string; priority: number }[] = [];
    
    for (const [hookName, hookList] of this.hooks) {
      const pluginHooksInList = hookList.filter(hook => hook.pluginId === pluginId);
      pluginHooksInList.forEach(hook => {
        pluginHooks.push({ hookName, priority: hook.priority });
      });
    }
    
    return pluginHooks;
  }
}

/**
 * Content filter helper
 */
export class ContentFilter {
  private filters: Map<string, HookCallback[]> = new Map();

  /**
   * Add a content filter
   */
  addFilter(filterName: string, callback: HookCallback): void {
    if (!this.filters.has(filterName)) {
      this.filters.set(filterName, []);
    }
    this.filters.get(filterName)!.push(callback);
  }

  /**
   * Apply filters to content
   */
  async applyFilters(filterName: string, content: any, ...args: any[]): Promise<any> {
    const filterList = this.filters.get(filterName);
    if (!filterList || filterList.length === 0) return content;

    let filteredContent = content;
    
    for (const filter of filterList) {
      try {
        filteredContent = await filter(filteredContent, ...args);
      } catch (error) {
        console.error(`Error applying filter ${filterName}:`, error);
      }
    }

    return filteredContent;
  }

  /**
   * Remove a filter
   */
  removeFilter(filterName: string, callback: HookCallback): void {
    const filterList = this.filters.get(filterName);
    if (!filterList) return;

    const index = filterList.indexOf(callback);
    if (index > -1) {
      filterList.splice(index, 1);
    }
  }
}

/**
 * Hook registration decorator
 */
export function hookDecorator(hookName: HookName, priority: number = HOOK_PRIORITIES.NORMAL) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor._hooks) {
      target.constructor._hooks = [];
    }
    
    target.constructor._hooks.push({
      hookName,
      method: propertyKey,
      priority
    });
    
    return descriptor;
  };
}

/**
 * Auto-register hooks from decorated methods
 */
export function registerDecoratedHooks(plugin: Plugin, hookHelper: HookHelper, pluginId: string): void {
  const constructor = (plugin as any).constructor;
  const hooks = constructor._hooks || [];
  
  hooks.forEach((hookConfig: any) => {
    const method = (plugin as any)[hookConfig.method];
    if (typeof method === 'function') {
      hookHelper.addHook(
        pluginId,
        hookConfig.hookName,
        method.bind(plugin),
        hookConfig.priority
      );
    }
  });
}

/**
 * Hook timing utilities
 */
export class HookTimer {
  private timings: Map<string, number[]> = new Map();

  /**
   * Start timing a hook
   */
  start(hookName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.timings.has(hookName)) {
        this.timings.set(hookName, []);
      }
      
      this.timings.get(hookName)!.push(duration);
    };
  }

  /**
   * Get average execution time for a hook
   */
  getAverageTime(hookName: string): number {
    const times = this.timings.get(hookName);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  /**
   * Get performance stats for all hooks
   */
  getStats(): Record<string, { count: number; average: number; total: number }> {
    const stats: Record<string, { count: number; average: number; total: number }> = {};
    
    for (const [hookName, times] of this.timings) {
      const total = times.reduce((a, b) => a + b, 0);
      stats[hookName] = {
        count: times.length,
        average: total / times.length,
        total
      };
    }
    
    return stats;
  }

  /**
   * Clear timing data
   */
  clear(): void {
    this.timings.clear();
  }
}

/**
 * Hook validation utilities
 */
export function validateHooks(hooks: PluginHooks): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // List of valid hook names
  const validHooks: HookName[] = [
    'onServerStart', 'onServerStop', 'onDatabaseConnect', 'beforeQuery', 'afterQuery',
    'beforePostCreate', 'afterPostCreate', 'beforePostUpdate', 'afterPostUpdate',
    'beforePostDelete', 'afterPostDelete', 'beforeRequest', 'afterRequest',
    'beforeLogin', 'afterLogin', 'beforeLogout', 'afterLogout',
    'registerPostTypes', 'registerMetaFields', 'registerAdminPages',
    'registerShortcodes', 'registerWidgets', 'registerBlocks'
  ];
  
  for (const [hookName, callback] of Object.entries(hooks)) {
    // Check if hook name is valid
    if (!validHooks.includes(hookName as HookName)) {
      errors.push(`Invalid hook name: ${hookName}`);
    }
    
    // Check if callback is a function
    if (typeof callback !== 'function') {
      errors.push(`Hook ${hookName} must be a function`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Create a hook execution context
 */
export function createHookContext(pluginId: string) {
  return {
    pluginId,
    timestamp: new Date(),
    executionId: Math.random().toString(36).substr(2, 9)
  };
}

/**
 * Middleware-style hook execution
 */
export async function executeMiddleware(
  middlewares: HookCallback[],
  initialValue: any,
  ...args: any[]
): Promise<any> {
  let result = initialValue;
  
  for (const middleware of middlewares) {
    try {
      const newResult = await middleware(result, ...args);
      if (newResult !== undefined) {
        result = newResult;
      }
    } catch (error) {
      console.error('Middleware execution error:', error);
      throw error;
    }
  }
  
  return result;
}

/**
 * Conditional hook execution
 */
export async function executeConditionalHook(
  condition: () => boolean | Promise<boolean>,
  hook: HookCallback,
  ...args: any[]
): Promise<any> {
  const shouldExecute = await condition();
  
  if (shouldExecute) {
    return await hook(...args);
  }
  
  return undefined;
}

/**
 * Parallel hook execution
 */
export async function executeHooksParallel(
  hooks: HookCallback[],
  ...args: any[]
): Promise<any[]> {
  const promises = hooks.map(hook => hook(...args).catch((error: Error) => {
    console.error('Parallel hook execution error:', error);
    return undefined;
  }));
  
  return await Promise.all(promises);
}

/**
 * Sequential hook execution with short-circuit
 */
export async function executeHooksSequential(
  hooks: HookCallback[],
  shortCircuit: (result: any) => boolean,
  ...args: any[]
): Promise<any> {
  for (const hook of hooks) {
    try {
      const result = await hook(...args);
      if (shortCircuit(result)) {
        return result;
      }
    } catch (error) {
      console.error('Sequential hook execution error:', error);
    }
  }
  
  return undefined;
}
