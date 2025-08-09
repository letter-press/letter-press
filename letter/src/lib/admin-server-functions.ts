"use server";

import { getPluginsSummary, enablePlugin, disablePlugin, getPlugin } from './plugin-manager';
import { getUsers, getCustomFieldsForPostType } from './queries';
import { createPost } from './mutations';
import { tryCatch } from './try-catch';
import { db } from './db';
import type { PostStatus } from '@prisma/client';
import { type } from 'arktype';
import { 
  ThemeSaveRequestSchema,
  ThemeActivationRequestSchema, 
  ThemeDeletionRequestSchema,
  PluginToggleSchema,
  PostCreateSchema,
  PositiveIntegerSchema,
  type ThemeSaveRequest,
  type ThemeActivationRequest,
  type ThemeDeletionRequest,
  type PluginToggle,
  type PostCreate
} from './validation-schemas';
import { withValidation, createValidatedAction } from './validation-utils';

// Server functions for admin routes
export async function getPluginData() {
  return getPluginsSummary();
}

export const togglePluginStatus = createValidatedAction(
  PluginToggleSchema,
  async (data: PluginToggle) => {
    const { pluginName, enabled } = data;
    return tryCatch(async () => {
      if (enabled) {
        await enablePlugin(pluginName);
      } else {
        await disablePlugin(pluginName);
      }
    });
  }
);

export const getPluginDetails = createValidatedAction(
  type("string"),
  async (pluginId: string) => {
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
);

export const updatePluginSettings = createValidatedAction(
  type("string"),
  async (pluginName: string) => {
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
);

// Page creation function with validation
export const createPage = createValidatedAction(
  PostCreateSchema,
  async (data: PostCreate) => {
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
);

export async function getThemesData() {
  return tryCatch(async () => {
    // Get all themes from database
    const themes = await db.theme.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Get active theme
    const activeTheme = await db.theme.findFirst({
      where: { isActive: true }
    });

    return {
      themes: themes.map(theme => ({
        id: theme.id,
        name: theme.name,
        displayName: theme.displayName,
        description: theme.description,
        author: theme.author,
        version: theme.version,
        supportsDarkMode: theme.supportsDarkMode,
        isActive: theme.isActive,
        isBuiltIn: theme.isBuiltIn,
        layouts: theme.layouts as Record<string, string> || {
          default: "DefaultLayout",
          home: "HomeLayout", 
          page: "PageLayout",
          post: "PostLayout",
        },
        colors: theme.colors as Record<string, string> || {},
        darkColors: theme.darkColors as Record<string, string> || {},
        customCSS: theme.customCSS,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      })),
      activeTheme: activeTheme?.name || 'default'
    };
  });
}

// Theme management functions with validation (already implemented)
export const saveTheme = createValidatedAction(
  ThemeSaveRequestSchema,
  async (themeData: ThemeSaveRequest) => {
    const data = {
      name: themeData.name,
      displayName: themeData.displayName,
      description: themeData.description,
      author: themeData.author,
      version: themeData.version,
      supportsDarkMode: themeData.supportsDarkMode,
      isBuiltIn: themeData.isBuiltIn || false,
      layouts: themeData.layouts,
      colors: themeData.colors,
      darkColors: themeData.darkColors,
      customCSS: themeData.customCSS,
    };

    if (themeData.id) {
      // Validate that theme exists and is not built-in if updating
      const existing = await db.theme.findUnique({
        where: { id: themeData.id }
      });
      
      if (!existing) {
        throw new Error('Theme not found');
      }
      
      if (existing.isBuiltIn && !themeData.isBuiltIn) {
        throw new Error('Cannot modify built-in theme properties');
      }

      // Update existing theme
      const theme = await db.theme.update({
        where: { id: themeData.id },
        data
      });
      return { success: true, theme };
    } else {
      // Check for name conflicts
      const existing = await db.theme.findUnique({
        where: { name: themeData.name }
      });
      
      if (existing) {
        throw new Error(`Theme with name "${themeData.name}" already exists`);
      }

      // Create new theme
      const theme = await db.theme.create({
        data
      });
      return { success: true, theme };
    }
  }
);

export const activateTheme = createValidatedAction(
  ThemeActivationRequestSchema,
  async (request: ThemeActivationRequest) => {
    // Verify theme exists
    const theme = await db.theme.findUnique({
      where: { name: request.themeName }
    });
    
    if (!theme) {
      throw new Error(`Theme "${request.themeName}" not found`);
    }
    
    // Deactivate all themes
    await db.theme.updateMany({
      data: { isActive: false }
    });
    
    // Activate the selected theme
    await db.theme.updateMany({
      where: { name: request.themeName },
      data: { isActive: true }
    });
    
    return { success: true };
  }
);

export const deleteTheme = createValidatedAction(
  ThemeDeletionRequestSchema,
  async (request: ThemeDeletionRequest) => {
    // Get theme details with validation
    const theme = await db.theme.findUnique({
      where: { id: request.themeId }
    });
    
    if (!theme) {
      throw new Error('Theme not found');
    }
    
    if (theme.isBuiltIn) {
      throw new Error('Cannot delete built-in themes');
    }
    
    if (theme.isActive) {
      throw new Error('Cannot delete active theme. Please activate a different theme first.');
    }
    
    await db.theme.delete({
      where: { id: request.themeId }
    });
    
    return { success: true };
  }
);

// Re-export user functions for admin
export { getUsers, getCustomFieldsForPostType };
