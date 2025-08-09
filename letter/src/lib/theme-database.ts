import { db } from "~/lib/db";
import type { ThemeConfig, ThemeColors } from "~/lib/types";

// Default fallback colors
export const defaultColors: ThemeColors = {
    // Primary colors
    primary: "#3b82f6",
    secondary: "#6b7280", 
    accent: "#10b981",
    
    // Text colors
    text: "#1f2937",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    
    // Background colors
    background: "#ffffff",
    surface: "#f9fafb",
    surfaceSecondary: "#f3f4f6",
    
    // Border colors
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    
    // State colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    
    // Semantic colors for blocks
    highlight: "#fef3c7",
    quote: "#e5e7eb",
    code: "#1f2937",
    codeBackground: "#f3f4f6",
};

export const defaultDarkColors: ThemeColors = {
    // Primary colors
    primary: "#60a5fa",
    secondary: "#9ca3af",
    accent: "#34d399",
    
    // Text colors
    text: "#f9fafb",
    textSecondary: "#d1d5db",
    textMuted: "#9ca3af",
    
    // Background colors
    background: "#111827",
    surface: "#1f2937",
    surfaceSecondary: "#374151",
    
    // Border colors
    border: "#374151",
    borderLight: "#4b5563",
    
    // State colors
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
    
    // Semantic colors for blocks
    highlight: "#365314",
    quote: "#4b5563",
    code: "#f9fafb",
    codeBackground: "#374151",
};

// Get theme colors with fallbacks
export function getThemeColors(theme: any, isDark: boolean = false): ThemeColors {
    if (isDark && theme.darkColors) {
        return {
            ...defaultDarkColors,
            ...theme.darkColors,
        };
    }
    
    if (theme.colors) {
        return {
            ...defaultColors,
            ...theme.colors,
        };
    }
    
    return isDark ? defaultDarkColors : defaultColors;
}

// Database operations
export async function getThemeById(id: number) {
    return await db.theme.findUnique({
        where: { id },
    });
}

export async function getThemeByName(name: string) {
    return await db.theme.findUnique({
        where: { name },
    });
}

export async function getAllThemes() {
    return await db.theme.findMany({
        orderBy: [
            { isBuiltIn: 'desc' },
            { name: 'asc' },
        ],
    });
}

export async function getActiveTheme() {
    const activeTheme = await db.theme.findFirst({
        where: { isActive: true },
    });
    
    // Return default theme if no active theme found
    if (!activeTheme) {
        return getThemeByName('default');
    }
    
    return activeTheme;
}

export async function createTheme(config: Omit<ThemeConfig, 'id'>) {
    return await db.theme.create({
        data: {
            name: config.name,
            displayName: config.displayName,
            description: config.description,
            author: config.author,
            version: config.version,
            supportsDarkMode: config.supportsDarkMode,
            isBuiltIn: config.isBuiltIn || false,
            colors: config.colors,
            darkColors: config.darkColors,
            layouts: config.layouts,
            customCSS: config.customCSS,
        },
    });
}

export async function updateTheme(id: number, config: Partial<ThemeConfig>) {
    return await db.theme.update({
        where: { id },
        data: {
            displayName: config.displayName,
            description: config.description,
            author: config.author,
            version: config.version,
            supportsDarkMode: config.supportsDarkMode,
            colors: config.colors,
            darkColors: config.darkColors,
            layouts: config.layouts,
            customCSS: config.customCSS,
        },
    });
}

export async function setActiveTheme(id: number) {
    // First, deactivate all themes
    await db.theme.updateMany({
        where: { isActive: true },
        data: { isActive: false },
    });
    
    // Then activate the selected theme
    return await db.theme.update({
        where: { id },
        data: { isActive: true },
    });
}

export async function deleteTheme(id: number) {
    // Don't allow deletion of built-in themes or active themes
    const theme = await getThemeById(id);
    if (!theme) {
        throw new Error('Theme not found');
    }
    
    if (theme.isBuiltIn) {
        throw new Error('Cannot delete built-in theme');
    }
    
    if (theme.isActive) {
        throw new Error('Cannot delete active theme');
    }
    
    return await db.theme.delete({
        where: { id },
    });
}

// Convert database theme to ThemeConfig
export function databaseThemeToConfig(dbTheme: any): ThemeConfig {
    return {
        id: dbTheme.id,
        name: dbTheme.name,
        displayName: dbTheme.displayName,
        description: dbTheme.description,
        author: dbTheme.author,
        version: dbTheme.version,
        supportsDarkMode: dbTheme.supportsDarkMode,
        isActive: dbTheme.isActive,
        isBuiltIn: dbTheme.isBuiltIn,
        colors: dbTheme.colors || defaultColors,
        darkColors: dbTheme.darkColors,
        layouts: dbTheme.layouts,
        customCSS: dbTheme.customCSS,
    };
}