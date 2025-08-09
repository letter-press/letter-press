"use server";

/**
 * Enhanced Plugin System CLI Commands
 * 
 * Provides comprehensive command-line interface for plugin management operations
 * with support for enhanced loading, sandbox monitoring, and advanced diagnostics.
 */

import { pluginManager } from './plugin-manager';
import { pluginSandbox } from './plugin-sandbox';
import { pluginWatcher } from './plugin-watcher';
import { loadAllPlugins, hotReloadPlugin, getPluginCacheStats, clearPluginCache } from './plugin-loader';
import * as path from 'node:path';

interface CLICommand {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
}

/**
 * List all plugins with their status
 */
async function listPlugins(args: string[]): Promise<void> {
  console.log('\n🔌 Enhanced Plugin System Status\n');
  
  const summary = await pluginManager.getSummary();
  const diagnostics = pluginManager.getDiagnostics();
  const sandboxStats = pluginSandbox.getStats();
  const cacheStats = getPluginCacheStats();
  
  console.log(`📊 System Overview:`);
  console.log(`   Total Plugins: ${summary.all.length}`);
  console.log(`   Enabled: ${summary.enabled.length}`);
  console.log(`   Hooks Registered: ${diagnostics.totalHookRegistrations}`);
  console.log(`   Errors: ${summary.errors.length}`);
  console.log(`   Sandbox Executions: ${sandboxStats.totalExecutions}`);
  console.log(`   Cache Hits: ${cacheStats.manifestsCached}`);
  console.log('');
  
  if (summary.all.length === 0) {
    console.log('❌ No plugins found\n');
    return;
  }
  
  console.log('📋 Plugin List:\n');
  
  for (const plugin of summary.all) {
    const status = plugin.enabled ? '🟢 ENABLED' : '🔴 DISABLED';
    const sandboxState = pluginSandbox.getPluginState(plugin.id);
    const quarantined = sandboxState?.quarantined ? ' 🚫 QUARANTINED' : '';
    
    console.log(`   ${status}${quarantined} ${plugin.name} v${plugin.version}`);
    if (plugin.description) {
      console.log(`      ${plugin.description}`);
    }
    console.log(`      Installed: ${plugin.installedAt.toLocaleDateString()}`);
    
    if (sandboxState) {
      console.log(`      Executions: ${sandboxState.executions}, Errors: ${sandboxState.errorCount}`);
      if (sandboxState.quarantined) {
        console.log(`      Quarantine Reason: ${sandboxState.quarantineReason}`);
      }
    }
    console.log('');
  }
  
  if (summary.errors.length > 0) {
    console.log('❌ System Errors:\n');
    for (const error of summary.errors) {
      console.log(`   ${error}`);
    }
    console.log('');
  }
  }
/**
 * Enable a plugin
 */
async function enablePlugin(args: string[]): Promise<void> {
  const pluginId = args[0];
  if (!pluginId) {
    console.error('❌ Plugin ID required');
    console.log('Usage: enable <plugin-id>');
    return;
  }
  
  try {
    await pluginManager.enablePlugin(pluginId);
    console.log(`✅ Plugin ${pluginId} enabled successfully`);
  } catch (error) {
    console.error(`❌ Failed to enable plugin ${pluginId}:`, (error as Error).message);
  }
}

/**
 * Disable a plugin
 */
async function disablePlugin(args: string[]): Promise<void> {
  const pluginId = args[0];
  if (!pluginId) {
    console.error('❌ Plugin ID required');
    console.log('Usage: disable <plugin-id>');
    return;
  }
  
  try {
    await pluginManager.disablePlugin(pluginId);
    console.log(`✅ Plugin ${pluginId} disabled successfully`);
  } catch (error) {
    console.error(`❌ Failed to disable plugin ${pluginId}:`, (error as Error).message);
  }
}

/**
 * Reload plugins from directory
 */
async function reloadPlugins(args: string[]): Promise<void> {
  const pluginsDir = args[0] || path.join(process.cwd(), 'plugins');
  
  try {
    console.log(`🔄 Reloading plugins from ${pluginsDir}...`);
    await pluginManager.loadPluginsFromDirectory(pluginsDir);
    console.log('✅ Plugins reloaded successfully');
  } catch (error) {
    console.error('❌ Failed to reload plugins:', (error as Error).message);
  }
}

/**
 * Check plugin health
 */
async function healthCheck(args: string[]): Promise<void> {
  const pluginId = args[0];
  
  if (pluginId) {
    // Check specific plugin
    const result = await pluginManager.healthCheck(pluginId);
    console.log(`\n🏥 Health Check: ${pluginId}\n`);
    console.log(`Status: ${result.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    if (result.issues.length > 0) {
      console.log('\nIssues:');
      for (const issue of result.issues) {
        console.log(`   ❌ ${issue}`);
      }
    }
  } else {
    // Check all plugins
    const results = await pluginManager.healthCheckAll();
    console.log('\n🏥 System Health Check\n');
    
    let healthyCount = 0;
    for (const [id, result] of results) {
      const status = result.healthy ? '✅' : '❌';
      console.log(`${status} ${id} - ${result.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      if (!result.healthy && result.issues.length > 0) {
        for (const issue of result.issues) {
          console.log(`     • ${issue}`);
        }
      }
      
      if (result.healthy) healthyCount++;
    }
    
    console.log(`\n📊 Summary: ${healthyCount}/${results.size} plugins healthy`);
  }
  console.log('');
}

/**
 * Show plugin diagnostics
 */
async function diagnostics(args: string[]): Promise<void> {
  const diag = pluginManager.getDiagnostics();
  
  console.log('\n🔍 Plugin System Diagnostics\n');
  console.log(`System Status: ${diag.initialized ? '✅ INITIALIZED' : '❌ NOT INITIALIZED'}`);
  console.log(`Total Plugins: ${diag.pluginCount}`);
  console.log(`Enabled Plugins: ${diag.enabledPluginCount}`);
  console.log(`Registered Hooks: ${diag.hookCount}`);
  console.log(`Total Hook Registrations: ${diag.totalHookRegistrations}`);
  console.log(`Memory Errors: ${diag.errorCount}\n`);
  
  if (Object.keys(diag.hookStats).length > 0) {
    console.log('📊 Hook Statistics:');
    for (const [hookName, count] of Object.entries(diag.hookStats)) {
      console.log(`   ${hookName}: ${count} registrations`);
    }
    console.log('');
  }
  
  console.log('💾 Memory Usage:');
  console.log(`   Plugins in memory: ${diag.memoryUsage.plugins}`);
  console.log(`   Hook maps: ${diag.memoryUsage.hooks}`);
  console.log(`   Cached errors: ${diag.memoryUsage.errors}\n`);
}

/**
 * Check for plugin updates
 */
async function checkUpdates(args: string[]): Promise<void> {
  const pluginsDir = args[0] || path.join(process.cwd(), 'plugins');
  
  try {
    console.log(`🔍 Checking for plugin updates in ${pluginsDir}...`);
    const updated = await pluginManager.checkForUpdates(pluginsDir);
    
    if (updated.length === 0) {
      console.log('✅ All plugins are up to date');
    } else {
      console.log(`🔄 Updated ${updated.length} plugin(s):`);
      for (const pluginId of updated) {
        console.log(`   ✅ ${pluginId}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to check for updates:', (error as Error).message);
  }
}

/**
 * Show plugin errors
 */
async function showErrors(args: string[]): Promise<void> {
  const pluginId = args[0];
  const errors = pluginManager.getErrors(pluginId);
  
  console.log(`\n🚨 Plugin Errors ${pluginId ? `for ${pluginId}` : '(All)'}\n`);
  
  if (errors.length === 0) {
    console.log('✅ No errors found\n');
    return;
  }
  
  for (const error of errors) {
    console.log(`❌ ${error.pluginId} - ${error.timestamp.toISOString()}`);
    console.log(`   ${error.message}`);
    if (error.context) {
      console.log(`   Context: ${error.context}`);
    }
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n')[0]}`);
    }
    console.log('');
  }
}

/**
 * Enhanced sandbox diagnostics
 */
async function sandboxStatus(args: string[]): Promise<void> {
  const stats = pluginSandbox.getStats();
  const healthReport = pluginSandbox.generateHealthReport();
  
  console.log('\n🔒 Plugin Sandbox Status\n');
  console.log(`Total Plugins: ${stats.totalPlugins}`);
  console.log(`Active Plugins: ${stats.activePlugins}`);
  console.log(`Quarantined: ${stats.quarantinedPlugins}`);
  console.log(`Total Executions: ${stats.totalExecutions}`);
  console.log(`Average Execution Time: ${stats.averageExecutionTime.toFixed(2)}ms`);
  console.log(`Memory Peak: ${Math.round(stats.memoryPeak / 1024 / 1024)}MB`);
  console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(2)}%\n`);
  
  if (healthReport.issues.quarantinedPlugins.length > 0) {
    console.log('🚫 Quarantined Plugins:');
    for (const plugin of healthReport.issues.quarantinedPlugins) {
      console.log(`   ❌ ${plugin.id}: ${plugin.reason}`);
    }
    console.log('');
  }
  
  if (healthReport.issues.highErrorPlugins.length > 0) {
    console.log('⚠️ High Error Rate Plugins:');
    for (const plugin of healthReport.issues.highErrorPlugins) {
      console.log(`   ⚠️ ${plugin.id}: ${plugin.errorRate} error rate`);
    }
    console.log('');
  }
  
  if (healthReport.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    for (const rec of healthReport.recommendations) {
      console.log(`   • ${rec}`);
    }
    console.log('');
  }
}

/**
 * Cache management
 */
async function cacheInfo(args: string[]): Promise<void> {
  const command = args[0];
  
  if (command === 'clear') {
    clearPluginCache();
    console.log('✅ Plugin cache cleared');
    return;
  }
  
  const stats = getPluginCacheStats();
  
  console.log('\n💾 Plugin Cache Status\n');
  console.log(`Manifests Cached: ${stats.manifestsCached}`);
  console.log(`Load Results Cached: ${stats.loadResultsCached}`);
  console.log(`Last Scan: ${stats.lastScan}`);
  console.log(`Memory Usage:`);
  console.log(`   Manifests: ${stats.memoryUsage.manifests}`);
  console.log(`   Load Results: ${stats.memoryUsage.loadResults}`);
  console.log(`   Dependency Graph: ${stats.memoryUsage.dependencyGraph}\n`);
  
  console.log('Usage: pnpm plugin cache clear   - Clear all cache');
}

/**
 * Hot reload specific plugin
 */
async function hotReload(args: string[]): Promise<void> {
  const pluginName = args[0];
  
  if (!pluginName) {
    console.error('❌ Plugin name required');
    console.log('Usage: hot-reload <plugin-name>');
    return;
  }
  
  try {
    console.log(`🔄 Hot reloading plugin: ${pluginName}`);
    const success = await hotReloadPlugin(pluginName);
    
    if (success) {
      console.log(`✅ Successfully hot reloaded: ${pluginName}`);
    } else {
      console.error(`❌ Failed to hot reload: ${pluginName}`);
    }
  } catch (error) {
    console.error(`❌ Hot reload error:`, (error as Error).message);
  }
}

/**
 * Watcher management
 */
async function watcherControl(args: string[]): Promise<void> {
  const command = args[0];
  
  if (command === 'start') {
    try {
      await pluginWatcher.startWatching();
      console.log('✅ Plugin watcher started');
    } catch (error) {
      console.error('❌ Failed to start watcher:', (error as Error).message);
    }
  } else if (command === 'stop') {
    try {
      await pluginWatcher.stopWatching();
      console.log('✅ Plugin watcher stopped');
    } catch (error) {
      console.error('❌ Failed to stop watcher:', (error as Error).message);
    }
  } else if (command === 'status') {
    const stats = pluginWatcher.getWatcherStats();
    
    console.log('\n👀 Plugin Watcher Status\n');
    console.log(`Status: ${stats.isWatching ? '🟢 ACTIVE' : '🔴 STOPPED'}`);
    console.log(`Watched Directory: ${stats.watchedDirectory}`);
    console.log(`Plugin Count: ${stats.pluginCount}`);
    console.log(`Total Watched Files: ${stats.totalWatchedFiles}`);
    console.log(`Total Reloads: ${stats.totalReloads}`);
    console.log(`Active Timers: ${stats.activeTimers}\n`);
    
    if (stats.plugins.length > 0) {
      console.log('📋 Plugin Watch Status:');
      for (const plugin of stats.plugins) {
        const status = plugin.hasPendingChanges ? '⏳ PENDING' : '✅ WATCHING';
        console.log(`   ${status} ${plugin.name} (${plugin.watchedFileCount} files)`);
        if (plugin.lastReload) {
          console.log(`      Last reload: ${plugin.lastReload.toLocaleString()}`);
        }
      }
    }
  } else if (command === 'reload-all') {
    try {
      const results = await pluginWatcher.forceReloadAll();
      console.log(`✅ Force reload complete: ${results.success.length} success, ${results.failed.length} failed`);
      
      if (results.failed.length > 0) {
        console.log('❌ Failed plugins:', results.failed.join(', '));
      }
    } catch (error) {
      console.error('❌ Force reload failed:', (error as Error).message);
    }
  } else {
    console.log('Usage:');
    console.log('   pnpm plugin watcher start      - Start file watcher');
    console.log('   pnpm plugin watcher stop       - Stop file watcher');
    console.log('   pnpm plugin watcher status     - Show watcher status');
    console.log('   pnpm plugin watcher reload-all - Force reload all plugins');
  }
}

/**
 * Release plugin from quarantine
 */
async function quarantineControl(args: string[]): Promise<void> {
  const command = args[0];
  const pluginName = args[1];
  
  if (command === 'release' && pluginName) {
    pluginSandbox.releaseFromQuarantine(pluginName);
    console.log(`🔓 Released ${pluginName} from quarantine`);
  } else if (command === 'list') {
    const states = pluginSandbox.getAllStates();
    const quarantined = Array.from(states.entries())
      .filter(([_, state]) => state.quarantined);
    
    if (quarantined.length === 0) {
      console.log('✅ No plugins are quarantined');
    } else {
      console.log('\n🚫 Quarantined Plugins:\n');
      for (const [id, state] of quarantined) {
        console.log(`   ❌ ${id}: ${state.quarantineReason}`);
      }
    }
  } else {
    console.log('Usage:');
    console.log('   pnpm plugin quarantine list              - List quarantined plugins');
    console.log('   pnpm plugin quarantine release <plugin>  - Release plugin from quarantine');
  }
}

/**
 * Available CLI commands
 */
const commands: CLICommand[] = [
  {
    name: 'list',
    description: 'List all plugins and their status',
    execute: listPlugins
  },
  {
    name: 'enable',
    description: 'Enable a plugin',
    execute: enablePlugin
  },
  {
    name: 'disable',
    description: 'Disable a plugin',
    execute: disablePlugin
  },
  {
    name: 'reload',
    description: 'Reload plugins from directory',
    execute: reloadPlugins
  },
  {
    name: 'health',
    description: 'Run health check on plugins',
    execute: healthCheck
  },
  {
    name: 'diagnostics',
    description: 'Show system diagnostics',
    execute: diagnostics
  },
  {
    name: 'updates',
    description: 'Check for plugin updates',
    execute: checkUpdates
  },
  {
    name: 'errors',
    description: 'Show plugin errors',
    execute: showErrors
  },
  {
    name: 'sandbox',
    description: 'Show sandbox status and health',
    execute: sandboxStatus
  },
  {
    name: 'cache',
    description: 'Manage plugin cache (info, clear)',
    execute: cacheInfo
  },
  {
    name: 'hot-reload',
    description: 'Hot reload a specific plugin',
    execute: hotReload
  },
  {
    name: 'watcher',
    description: 'Control file watcher (start, stop, status, reload-all)',
    execute: watcherControl
  },
  {
    name: 'quarantine',
    description: 'Manage quarantined plugins (list, release)',
    execute: quarantineControl
  }
];

/**
 * Show help for available commands
 */
function showHelp(): void {
  console.log('\n🔌 Plugin CLI Help\n');
  console.log('Available commands:\n');
  
  for (const cmd of commands) {
    console.log(`   ${cmd.name.padEnd(12)} - ${cmd.description}`);
  }
  
  console.log('\nExamples:');
  console.log('   pnpm plugin list');
  console.log('   pnpm plugin enable example-plugin');
  console.log('   pnpm plugin health');
  console.log('   pnpm plugin diagnostics\n');
}

/**
 * Execute a plugin CLI command
 */
export async function executeCommand(commandName: string, args: string[] = []): Promise<void> {
  if (!commandName || commandName === 'help') {
    showHelp();
    return;
  }
  
  const command = commands.find(cmd => cmd.name === commandName);
  
  if (!command) {
    console.error(`❌ Unknown command: ${commandName}`);
    showHelp();
    return;
  }
  
  try {
    await command.execute(args);
  } catch (error) {
    console.error(`❌ Command failed:`, (error as Error).message);
  }
}

/**
 * Plugin CLI entry point
 */
export async function runPluginCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);
  
  await executeCommand(command, commandArgs);
}

// Export individual commands for programmatic use
export {
  listPlugins,
  enablePlugin,
  disablePlugin,
  reloadPlugins,
  healthCheck,
  diagnostics,
  checkUpdates,
  showErrors,
  showHelp
};