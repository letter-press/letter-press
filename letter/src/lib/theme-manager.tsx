import { createSignal, createContext, useContext, JSX, ParentComponent, onMount, createEffect, createMemo } from "solid-js";
import type { Component } from "solid-js";
import { 
  type DarkModePreference, 
  getDarkModePreference, 
  setDarkModePreference, 
  shouldUseDarkMode, 
  applyDarkModeToDocument,
  getSystemDarkModePreference,
  initializeDarkModeForHydration
} from "./dark-mode";
import type { ThemeConfig, ThemeColors } from "./types";
import { getThemeColors, defaultColors, defaultDarkColors } from "./theme-database";
import { isServer } from "solid-js/web";

// Layout component props
export interface LayoutProps {
  children: JSX.Element;
  title?: string;
  description?: string;
  theme?: string;
  layoutType?: 'default' | 'home' | 'page' | 'post' | 'archive';
}

// Navigation item interface
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  external?: boolean;
}

// Site configuration
export interface SiteConfig {
  title: string;
  description: string;
  logo?: string;
  navigation: NavItem[];
  footer: {
    copyright: string;
    links?: NavItem[];
    social?: {
      platform: string;
      url: string;
      icon: string;
    }[];
  };
}

// Theme context
interface ThemeContextValue {
  currentTheme: () => string;
  setTheme: (theme: string) => void;
  availableThemes: () => ThemeConfig[];
  getThemeConfig: (themeName?: string) => ThemeConfig | null;
  getThemeColors: (isDark?: boolean) => ThemeColors;
  siteConfig: () => SiteConfig;
  setSiteConfig: (config: Partial<SiteConfig>) => void;
  // Dark mode
  darkModePreference: () => DarkModePreference;
  setDarkModePreference: (preference: DarkModePreference) => void;
  isDarkMode: () => boolean;
  toggleDarkMode: () => void;
  // Hydration
  isHydrated: () => boolean;
}

const ThemeContext = createContext<ThemeContextValue>();

// Default site configuration
const defaultSiteConfig: SiteConfig = {
  title: "Letter-Press CMS",
  description: "A powerful content management system built with modern web technologies.",
  navigation: [
    { label: "Home", href: "/" },
    { label: "Pages", href: "/pages" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
  ],
  footer: {
    copyright: "© 2025 Letter-Press CMS. Built with SolidStart.",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
    social: [
      { platform: "GitHub", url: "https://github.com", icon: "🐙" },
      { platform: "Twitter", url: "https://twitter.com", icon: "🐦" },
    ],
  },
};

// Default theme configuration
const defaultTheme: ThemeConfig = {
  name: "default",
  displayName: "Default",
  version: "1.0.0",
  description: "Default Letter-Press theme with clean, responsive design",
  author: "Letter-Press Team",
  supportsDarkMode: true,
  isBuiltIn: true,
  layouts: {
    default: "DefaultLayout",
    home: "HomeLayout", 
    page: "PageLayout",
    post: "PostLayout",
  },
  colors: defaultColors,
  darkColors: defaultDarkColors,
};

// Theme manager class
export class ThemeManager {
  private themes = new Map<string, ThemeConfig>();
  private currentThemeName = "default";
  private siteConfiguration: SiteConfig = { ...defaultSiteConfig };

  constructor() {
    this.registerTheme(defaultTheme);
  }

  registerTheme(config: ThemeConfig) {
    this.themes.set(config.name, config);
  }

  getTheme(name?: string): ThemeConfig | null {
    const themeName = name || this.currentThemeName;
    return this.themes.get(themeName) || null;
  }

  getCurrentTheme(): string {
    return this.currentThemeName;
  }

  setCurrentTheme(name: string) {
    if (this.themes.has(name)) {
      this.currentThemeName = name;
      return true;
    }
    return false;
  }

  getAvailableThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  getSiteConfig(): SiteConfig {
    return this.siteConfiguration;
  }

  updateSiteConfig(config: Partial<SiteConfig>) {
    this.siteConfiguration = { ...this.siteConfiguration, ...config };
  }

  // Get theme colors for current theme
  getThemeColors(isDark: boolean = false): ThemeColors {
    const theme = this.getTheme();
    return getThemeColors(theme, isDark);
  }

  // Apply theme styles - only on client after hydration
  applyThemeStyles(themeName: string, isDark?: boolean) {
    if (isServer) return;
    
    const theme = this.getTheme(themeName);
    if (!theme) return;

    // Use requestAnimationFrame to avoid hydration issues
    requestAnimationFrame(() => {
      const root = document.documentElement;
      const colors = getThemeColors(theme, isDark);
      
      // Apply color variables to CSS custom properties
      this.applyColorVariables(root, colors);

      // Apply custom CSS if present
      if (theme.customCSS) {
        this.injectCustomCSS(theme.customCSS);
      }
    });
  }

  private applyColorVariables(root: HTMLElement, colors: ThemeColors) {
    // Map theme colors to CSS custom properties
    const colorMapping: Record<keyof ThemeColors, string> = {
      primary: '--color-primary',
      secondary: '--color-secondary',
      accent: '--color-accent',
      text: '--color-text',
      textSecondary: '--color-text-secondary',
      textMuted: '--color-text-muted',
      background: '--color-background',
      surface: '--color-surface',
      surfaceSecondary: '--color-surface-secondary',
      border: '--color-border',
      borderLight: '--color-border-light',
      success: '--color-success',
      warning: '--color-warning',
      error: '--color-error',
      info: '--color-info',
      highlight: '--color-highlight',
      quote: '--color-quote',
      code: '--color-code',
      codeBackground: '--color-code-background',
    };

    // Apply all color variables
    Object.entries(colorMapping).forEach(([colorKey, cssVar]) => {
      const colorValue = colors[colorKey as keyof ThemeColors];
      root.style.setProperty(cssVar, colorValue);
    });

    // Legacy support for existing CSS
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--background-color', colors.background);
    root.style.setProperty('--surface-color', colors.surface);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--border-color', colors.border);
    root.style.setProperty('--border-light', colors.borderLight);
  }

  private injectCustomCSS(css: string) {
    if (isServer) return;
    
    const existingStyle = document.getElementById('theme-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'theme-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// Global theme manager instance
export const themeManager = new ThemeManager();

// Theme provider component
export const ThemeProvider: ParentComponent<{ 
  serverDarkModePreference?: DarkModePreference 
}> = (props) => {
  // Initialize with hydration-safe values
  const initialState = createMemo(() => 
    initializeDarkModeForHydration(props.serverDarkModePreference)
  );

  const [currentTheme, setCurrentTheme] = createSignal(themeManager.getCurrentTheme());
  const [siteConfig, setSiteConfigSignal] = createSignal(themeManager.getSiteConfig());
  const [darkModePreference, setDarkModePreferenceSignal] = createSignal<DarkModePreference>(
    initialState().initialPreference
  );
  const [isDarkMode, setIsDarkMode] = createSignal(initialState().initialIsDark);
  const [isHydrated, setIsHydrated] = createSignal(false);

  // Initialize on mount - handles hydration properly
  onMount(() => {
    setIsHydrated(true);
    
    // Re-evaluate client-side preferences after hydration
    if (!isServer) {
      const clientPreference = getDarkModePreference();
      const clientIsDark = shouldUseDarkMode(clientPreference);
      
      // Only update if different from server
      if (clientPreference !== darkModePreference()) {
        setDarkModePreferenceSignal(clientPreference);
      }
      
      if (clientIsDark !== isDarkMode()) {
        setIsDarkMode(clientIsDark);
      }
      
      // Apply initial styles
      applyDarkModeToDocument(clientIsDark);
      themeManager.applyThemeStyles(currentTheme(), clientIsDark);

      // Listen for system theme changes
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          if (darkModePreference() === 'system') {
            const shouldBeDark = getSystemDarkModePreference();
            setIsDarkMode(shouldBeDark);
            applyDarkModeToDocument(shouldBeDark);
            themeManager.applyThemeStyles(currentTheme(), shouldBeDark);
          }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        
        // Cleanup
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  });

  // React to dark mode preference changes (only after hydration)
  createEffect(() => {
    if (!isHydrated()) return;
    
    const preference = darkModePreference();
    const shouldBeDark = shouldUseDarkMode(preference);
    setIsDarkMode(shouldBeDark);
    applyDarkModeToDocument(shouldBeDark);
    themeManager.applyThemeStyles(currentTheme(), shouldBeDark);
  });

  // React to theme changes (only after hydration)
  createEffect(() => {
    if (!isHydrated()) return;
    
    themeManager.applyThemeStyles(currentTheme(), isDarkMode());
  });

  const setTheme = (theme: string) => {
    if (themeManager.setCurrentTheme(theme)) {
      setCurrentTheme(theme);
    }
  };

  const setSiteConfig = (config: Partial<SiteConfig>) => {
    themeManager.updateSiteConfig(config);
    setSiteConfigSignal(themeManager.getSiteConfig());
  };

  const setDarkModePreferenceHandler = (preference: DarkModePreference) => {
    setDarkModePreference(preference);
    setDarkModePreferenceSignal(preference);
  };

  const toggleDarkMode = () => {
    const current = darkModePreference();
    let newPreference: DarkModePreference;
    
    if (current === 'system') {
      // If currently system, toggle to opposite of current system preference
      newPreference = (isServer ? false : getSystemDarkModePreference()) ? 'light' : 'dark';
    } else if (current === 'light') {
      newPreference = 'dark';
    } else {
      newPreference = 'light';
    }
    
    setDarkModePreferenceHandler(newPreference);
  };

  const contextValue: ThemeContextValue = {
    currentTheme,
    setTheme,
    availableThemes: () => themeManager.getAvailableThemes(),
    getThemeConfig: (themeName?: string) => themeManager.getTheme(themeName),
    getThemeColors: (isDark?: boolean) => themeManager.getThemeColors(isDark ?? isDarkMode()),
    siteConfig,
    setSiteConfig,
    darkModePreference,
    setDarkModePreference: setDarkModePreferenceHandler,
    isDarkMode,
    toggleDarkMode,
    isHydrated,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {props.children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Utility to get current theme configuration
export function getCurrentThemeConfig(): ThemeConfig | null {
  return themeManager.getTheme();
}

// Server-side theme utilities
export async function getServerThemeConfig(themeName?: string): Promise<ThemeConfig | null> {
  "use server";
  // In a real implementation, this would load from database
  return themeManager.getTheme(themeName);
}

export async function getServerSiteConfig(): Promise<SiteConfig> {
  "use server";
  // In a real implementation, this would load from database
  return themeManager.getSiteConfig();
}