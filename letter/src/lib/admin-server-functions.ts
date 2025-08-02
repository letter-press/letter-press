"use server";

import { getPluginsSummary, enablePlugin, disablePlugin, getPlugin } from './plugin-manager';
import { getUsers } from './queries';
import { createPost } from './mutations';
import { tryCatch } from './try-catch';
import type { PostStatus } from '@prisma/client';

// Server functions for admin routes
export async function getPluginData() {
  return getPluginsSummary();
}

export async function togglePluginStatus(pluginName: string, enabled: boolean) {
  return tryCatch(async () => {
    if (enabled) {
      await enablePlugin(pluginName);
    } else {
      await disablePlugin(pluginName);
    }
  });
}

export async function getPluginDetails(pluginId: string) {
  return tryCatch(() => {
    const plugin = getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    return {
      id: plugin.id,
      name: plugin.plugin.config?.name || plugin.id,
      version: plugin.version,
      description: plugin.plugin.config?.description,
      enabled: plugin.enabled,
      installedAt: plugin.installedAt,
      settings: plugin.settings
    };
  });
}

export async function updatePluginSettings(pluginName: string) {
  return tryCatch(() => {
    const plugin = getPlugin(pluginName);

    if (!plugin) {
      throw new Error('Plugin not found');
    }

    // Update plugin settings (this would need to be implemented in the plugin manager)
    // For now, just return undefined (success)
    return undefined;
  });
}

// Page creation function
export async function createPage(data: {
  title: string;
  content?: string;
  excerpt?: string;
  slug: string;
  status?: PostStatus;
  authorId: number;
  parentId?: number;
  menuOrder?: number;
  publishedAt?: Date;
}) {
  return tryCatch(async () => {
    const result = await createPost({
      ...data,
      type: 'PAGE' as const
    });

    if (result.error) {
      throw result.error;
    }

    return result.data;
  });
}

// Re-export user functions for admin
export { getUsers };
