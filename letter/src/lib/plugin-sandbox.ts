"use server";

/**
 * Plugin Sandbox
 * 
 * Provides isolated execution environment for plugins with error handling,
 * resource monitoring, and security controls.
 */

import type { Plugin, PluginContext } from '@letter-press/plugin-sdk/types';

interface SandboxConfig {
  maxExecutionTime: number;
  maxMemoryMB: number;
  allowedModules: string[];
  enableLogging: boolean;
  enableProfiling: boolean;
}

interface ExecutionResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  metrics: {
    executionTime: number;
    memoryUsed: number;
    cpuTime?: number;
  };
}

interface PluginState {
  pluginId: string;
  isActive: boolean;
  errorCount: number;
  lastError?: Error;
  executions: number;
  totalExecutionTime: number;
  memoryPeak: number;
  quarantined: boolean;
  quarantineReason?: string;
}

export class PluginSandbox {
  private states = new Map<string, PluginState>();
  private defaultConfig: SandboxConfig = {
    maxExecutionTime: 5000, // 5 seconds
    maxMemoryMB: 50,
    allowedModules: ['fs', 'path', 'crypto', 'url'],
    enableLogging: true,
    enableProfiling: false
  };

  /**
   * Execute plugin hook in sandboxed environment
   */
  async executeHook<T = any>(
    pluginId: string, 
    hookName: string, 
    callback: (...args: any[]) => T | Promise<T>,
    args: any[],
    config?: Partial<SandboxConfig>
  ): Promise<ExecutionResult<T>> {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const state = this.getOrCreateState(pluginId);
    
    if (state.quarantined) {
      return {
        success: false,
        error: new Error(`Plugin ${pluginId} is quarantined: ${state.quarantineReason}`),
        metrics: { executionTime: 0, memoryUsed: 0 }
      };
    }

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      state.executions++;
      
      // Create execution timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin ${pluginId} hook ${hookName} timed out after ${effectiveConfig.maxExecutionTime}ms`));
        }, effectiveConfig.maxExecutionTime);
      });

      // Execute the hook with timeout
      const result = await Promise.race([
        this.wrapHookExecution(callback, args, state),
        timeoutPromise
      ]);

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      const executionTime = endTime - startTime;
      const memoryUsed = endMemory - startMemory;

      // Update state
      state.totalExecutionTime += executionTime;
      state.memoryPeak = Math.max(state.memoryPeak, memoryUsed);
      
      // Check memory limits
      if (memoryUsed > effectiveConfig.maxMemoryMB * 1024 * 1024) {
        this.quarantinePlugin(pluginId, `Memory limit exceeded: ${Math.round(memoryUsed / 1024 / 1024)}MB`);
      }

      if (effectiveConfig.enableLogging) {
        console.log(`🔧 Plugin ${pluginId} hook ${hookName} executed in ${executionTime.toFixed(2)}ms`);
      }

      return {
        success: true,
        result,
        metrics: {
          executionTime,
          memoryUsed
        }
      };

    } catch (error) {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      const executionTime = endTime - startTime;
      const memoryUsed = endMemory - startMemory;

      state.errorCount++;
      state.lastError = error instanceof Error ? error : new Error(String(error));

      // Auto-quarantine on repeated failures
      if (state.errorCount >= 5) {
        this.quarantinePlugin(pluginId, `Too many errors (${state.errorCount})`);
      }

      console.error(`❌ Plugin ${pluginId} hook ${hookName} failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: {
          executionTime,
          memoryUsed
        }
      };
    }
  }

  /**
   * Wrap hook execution with additional safety measures
   */
  private async wrapHookExecution<T>(
    callback: (...args: any[]) => T | Promise<T>,
    args: any[],
    state: PluginState
  ): Promise<T> {
    try {
      const result = await callback(...args);
      
      // Reset error count on successful execution
      if (state.errorCount > 0) {
        state.errorCount = Math.max(0, state.errorCount - 1);
      }
      
      return result;
    } catch (error) {
      // Enhance error with plugin context
      if (error instanceof Error) {
        error.message = `[Plugin: ${state.pluginId}] ${error.message}`;
      }
      throw error;
    }
  }

  /**
   * Initialize plugin in sandbox
   */
  async initializePlugin(plugin: Plugin, context: PluginContext): Promise<ExecutionResult<void>> {
    const pluginId = plugin.config.name;
    console.log(`🔒 Initializing plugin ${pluginId} in sandbox`);
    
    const state = this.getOrCreateState(pluginId);
    state.isActive = true;

    // Execute install hook if present
    if (plugin.install) {
      return this.executeHook(
        pluginId,
        'install',
        plugin.install.bind(plugin),
        [],
        { maxExecutionTime: 10000 } // Allow longer time for installation
      );
    }

    return {
      success: true,
      metrics: { executionTime: 0, memoryUsed: 0 }
    };
  }

  /**
   * Safely activate plugin
   */
  async activatePlugin(plugin: Plugin, context: PluginContext): Promise<ExecutionResult<void>> {
    const pluginId = plugin.config.name;
    
    if (plugin.activate) {
      return this.executeHook(
        pluginId,
        'activate',
        plugin.activate.bind(plugin),
        [context]
      );
    }

    return {
      success: true,
      metrics: { executionTime: 0, memoryUsed: 0 }
    };
  }

  /**
   * Safely deactivate plugin
   */
  async deactivatePlugin(plugin: Plugin, context: PluginContext): Promise<ExecutionResult<void>> {
    const pluginId = plugin.config.name;
    const state = this.states.get(pluginId);
    
    if (state) {
      state.isActive = false;
    }

    if (plugin.deactivate) {
      return this.executeHook(
        pluginId,
        'deactivate',
        plugin.deactivate.bind(plugin),
        [context]
      );
    }

    return {
      success: true,
      metrics: { executionTime: 0, memoryUsed: 0 }
    };
  }

  /**
   * Quarantine a problematic plugin
   */
  quarantinePlugin(pluginId: string, reason: string): void {
    const state = this.getOrCreateState(pluginId);
    state.quarantined = true;
    state.quarantineReason = reason;
    state.isActive = false;
    
    console.warn(`⚠️ Plugin ${pluginId} quarantined: ${reason}`);
  }

  /**
   * Release plugin from quarantine
   */
  releaseFromQuarantine(pluginId: string): void {
    const state = this.states.get(pluginId);
    if (state) {
      state.quarantined = false;
      state.quarantineReason = undefined;
      state.errorCount = 0;
      console.log(`🔓 Plugin ${pluginId} released from quarantine`);
    }
  }

  /**
   * Get plugin state
   */
  getPluginState(pluginId: string): PluginState | undefined {
    return this.states.get(pluginId);
  }

  /**
   * Get all plugin states
   */
  getAllStates(): Map<string, PluginState> {
    return new Map(this.states);
  }

  /**
   * Get sandbox statistics
   */
  getStats() {
    const states = Array.from(this.states.values());
    
    return {
      totalPlugins: states.length,
      activePlugins: states.filter(s => s.isActive).length,
      quarantinedPlugins: states.filter(s => s.quarantined).length,
      totalExecutions: states.reduce((sum, s) => sum + s.executions, 0),
      totalExecutionTime: states.reduce((sum, s) => sum + s.totalExecutionTime, 0),
      averageExecutionTime: states.length > 0 
        ? states.reduce((sum, s) => sum + s.totalExecutionTime, 0) / states.reduce((sum, s) => sum + s.executions, 1)
        : 0,
      memoryPeak: Math.max(...states.map(s => s.memoryPeak), 0),
      errorRate: states.length > 0
        ? states.reduce((sum, s) => sum + s.errorCount, 0) / states.reduce((sum, s) => sum + s.executions, 1)
        : 0
    };
  }

  /**
   * Clean up plugin state
   */
  cleanupPlugin(pluginId: string): void {
    this.states.delete(pluginId);
  }

  /**
   * Get or create plugin state
   */
  private getOrCreateState(pluginId: string): PluginState {
    let state = this.states.get(pluginId);
    if (!state) {
      state = {
        pluginId,
        isActive: false,
        errorCount: 0,
        executions: 0,
        totalExecutionTime: 0,
        memoryPeak: 0,
        quarantined: false
      };
      this.states.set(pluginId, state);
    }
    return state;
  }

  /**
   * Get current memory usage (simplified)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Create sandbox health report
   */
  generateHealthReport() {
    const stats = this.getStats();
    const quarantinedPlugins = Array.from(this.states.entries())
      .filter(([_, state]) => state.quarantined)
      .map(([id, state]) => ({ id, reason: state.quarantineReason }));

    const highErrorPlugins = Array.from(this.states.entries())
      .filter(([_, state]) => state.executions > 0 && (state.errorCount / state.executions) > 0.1)
      .map(([id, state]) => ({ 
        id, 
        errorRate: (state.errorCount / state.executions * 100).toFixed(1) + '%' 
      }));

    return {
      summary: stats,
      issues: {
        quarantinedPlugins,
        highErrorPlugins
      },
      recommendations: this.generateRecommendations(stats, quarantinedPlugins, highErrorPlugins)
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    stats: any, 
    quarantined: any[], 
    highError: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (stats.averageExecutionTime > 100) {
      recommendations.push('Consider optimizing plugin hooks - average execution time is high');
    }

    if (stats.errorRate > 0.05) {
      recommendations.push('High error rate detected - review plugin implementations');
    }

    if (quarantined.length > 0) {
      recommendations.push(`${quarantined.length} plugins are quarantined - review and fix issues`);
    }

    if (highError.length > 0) {
      recommendations.push(`${highError.length} plugins have high error rates - investigate stability`);
    }

    if (stats.memoryPeak > 100 * 1024 * 1024) {
      recommendations.push('High memory usage detected - optimize plugin memory consumption');
    }

    return recommendations;
  }
}

// Export singleton instance
export const pluginSandbox = new PluginSandbox();