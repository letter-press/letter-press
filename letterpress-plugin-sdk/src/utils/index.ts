/**
 * Utility functions for plugin development
 */

/**
 * Validates a URL slug
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  
  // Check if slug contains only allowed characters: lowercase letters, numbers, hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
}

/**
 * Sanitizes HTML content
 */
export function sanitizeHtml(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // Basic HTML sanitization - remove dangerous tags and attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Generates an excerpt from content
 */
export function generateExcerpt(content: string, length: number = 150): string {
  if (!content || typeof content !== 'string') return '';
  
  // Strip HTML tags
  const textContent = content.replace(/<[^>]+>/g, '');
  
  if (textContent.length <= length) return textContent;
  
  // Find the last complete word within the length limit
  const truncated = textContent.substring(0, length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {} as any, source[key] as any);
    } else {
      result[key] = source[key] as any;
    }
  }
  
  return result;
}

/**
 * Validate plugin configuration
 */
export function validatePluginConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config) {
    errors.push('Plugin config is required');
    return { isValid: false, errors };
  }
  
  if (!config.name || typeof config.name !== 'string') {
    errors.push('Plugin name is required and must be a string');
  }
  
  if (!config.version || typeof config.version !== 'string') {
    errors.push('Plugin version is required and must be a string');
  }
  
  // Validate version format (semantic versioning)
  if (config.version && !/^\d+\.\d+\.\d+(-[\w.-]+)?$/i.test(config.version)) {
    errors.push('Plugin version must follow semantic versioning (e.g., 1.0.0)');
  }
  
  // Validate plugin name format
  if (config.name && !/^[a-z0-9-_]+$/i.test(config.name)) {
    errors.push('Plugin name must contain only letters, numbers, hyphens, and underscores');
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Create a plugin logger
 */
export function createLogger(pluginName: string) {
  const prefix = `[${pluginName.toUpperCase()}]`;
  
  return {
    info: (message: string, meta?: any) => {
      console.log(`${prefix} INFO: ${message}`, meta || '');
    },
    warn: (message: string, meta?: any) => {
      console.warn(`${prefix} WARN: ${message}`, meta || '');
    },
    error: (message: string, meta?: any) => {
      console.error(`${prefix} ERROR: ${message}`, meta || '');
    },
    debug: (message: string, meta?: any) => {
      if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development') {
        console.debug(`${prefix} DEBUG: ${message}`, meta || '');
      }
    }
  };
}

/**
 * Async error wrapper for plugin methods
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  pluginName: string,
  methodName: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const logger = createLogger(pluginName);
      logger.error(`Error in ${methodName}:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Check if a version satisfies a constraint
 */
export function satisfiesVersion(version: string, constraint: string): boolean {
  // Simple version checking - in production, use a library like semver
  const versionParts = version.split('.').map(Number);
  const constraintParts = constraint.split('.').map(Number);
  
  for (let i = 0; i < Math.max(versionParts.length, constraintParts.length); i++) {
    const v = versionParts[i] || 0;
    const c = constraintParts[i] || 0;
    
    if (v > c) return true;
    if (v < c) return false;
  }
  
  return true; // Equal versions
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Create a simple event emitter
 */
export function createEventEmitter() {
  const events: Record<string, Function[]> = {};
  
  return {
    on(event: string, callback: Function) {
      if (!events[event]) events[event] = [];
      events[event].push(callback);
    },
    
    off(event: string, callback: Function) {
      if (!events[event]) return;
      events[event] = events[event].filter(cb => cb !== callback);
    },
    
    emit(event: string, ...args: any[]) {
      if (!events[event]) return;
      events[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    },
    
    once(event: string, callback: Function) {
      const onceCallback = (...args: any[]) => {
        callback(...args);
        this.off(event, onceCallback);
      };
      this.on(event, onceCallback);
    }
  };
}
