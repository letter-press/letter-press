import type { 
  HookCallback, 
  HookName, 
  PluginHooks,
  Plugin
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
