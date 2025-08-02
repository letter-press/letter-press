
import { promises as fs } from 'fs';
import path from 'path';
import { Plugin } from './types';

const PLUGINS_DIR = path.join(process.cwd(), 'plugins');

async function loadPlugins(): Promise<Plugin[]> {
  try {
    const pluginFolders = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    const plugins: Plugin[] = [];

    for (const folder of pluginFolders) {
      if (folder.isDirectory()) {
        const pluginPath = path.join(PLUGINS_DIR, folder.name, 'main.js');
        try {
          const pluginModule = await import(/* @vite-ignore */ pluginPath);
          if (pluginModule.default) {
            plugins.push(pluginModule.default);
          }
        } catch (error) {
          console.error(`Error loading plugin from ${pluginPath}:`, error);
        }
      }
    }

    return plugins;
  } catch (error) {
    console.error('Error reading plugins directory:', error);
    return [];
  }
}

export { loadPlugins };
