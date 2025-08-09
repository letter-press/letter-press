// Register additional themes
import { defaultColors, defaultDarkColors } from "~/lib/theme-database";
import type { ThemeConfig } from "~/lib/types";

// Default theme configuration
const defaultTheme: ThemeConfig = {
  name: "default",
  displayName: "Default",
  version: "1.0.0",
  description: "Clean and modern default theme with excellent readability",
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

// Dark theme configuration
const darkTheme: ThemeConfig = {
  name: "dark",
  displayName: "Dark",
  version: "1.0.0",
  description: "Dark theme with modern styling and improved readability",
  author: "Letter-Press Team",
  supportsDarkMode: true,
  isBuiltIn: true,
  layouts: {
    default: "DefaultLayout",
    home: "HomeLayout",
    page: "PageLayout", 
    post: "PostLayout",
  },
  colors: {
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
  },
  darkColors: {
    // Primary colors
    primary: "#93c5fd",
    secondary: "#d1d5db",
    accent: "#6ee7b7",
    
    // Text colors
    text: "#f1f5f9",
    textSecondary: "#e2e8f0",
    textMuted: "#cbd5e1",
    
    // Background colors
    background: "#0f172a",
    surface: "#1e293b",
    surfaceSecondary: "#334155",
    
    // Border colors
    border: "#334155",
    borderLight: "#475569",
    
    // State colors
    success: "#6ee7b7",
    warning: "#fcd34d",
    error: "#fca5a5",
    info: "#93c5fd",
    
    // Semantic colors for blocks
    highlight: "#365314",
    quote: "#475569",
    code: "#f1f5f9",
    codeBackground: "#334155",
  },
};

// Minimal theme configuration
const minimalTheme: ThemeConfig = {
  name: "minimal",
  displayName: "Minimal",
  version: "1.0.0", 
  description: "Clean minimal theme with focus on typography and whitespace",
  author: "Letter-Press Team",
  supportsDarkMode: true,
  isBuiltIn: true,
  layouts: {
    default: "DefaultLayout",
    home: "HomeLayout",
    page: "PageLayout",
    post: "PostLayout",
  },
  colors: {
    // Primary colors
    primary: "#000000",
    secondary: "#666666",
    accent: "#333333",
    
    // Text colors
    text: "#000000",
    textSecondary: "#666666",
    textMuted: "#999999",
    
    // Background colors
    background: "#ffffff",
    surface: "#ffffff",
    surfaceSecondary: "#fafafa",
    
    // Border colors
    border: "#e0e0e0",
    borderLight: "#f0f0f0",
    
    // State colors
    success: "#000000",
    warning: "#000000",
    error: "#000000",
    info: "#000000",
    
    // Semantic colors for blocks
    highlight: "#f5f5f5",
    quote: "#e0e0e0",
    code: "#000000",
    codeBackground: "#f5f5f5",
  },
  darkColors: {
    // Primary colors
    primary: "#ffffff",
    secondary: "#a3a3a3",
    accent: "#cccccc",
    
    // Text colors
    text: "#ffffff",
    textSecondary: "#a3a3a3",
    textMuted: "#666666",
    
    // Background colors
    background: "#000000",
    surface: "#111111",
    surfaceSecondary: "#222222",
    
    // Border colors
    border: "#333333",
    borderLight: "#444444",
    
    // State colors
    success: "#ffffff",
    warning: "#ffffff",
    error: "#ffffff",
    info: "#ffffff",
    
    // Semantic colors for blocks
    highlight: "#1a1a1a",
    quote: "#333333",
    code: "#ffffff",
    codeBackground: "#1a1a1a",
  },
  customCSS: `
    .nav-sticky {
      border-bottom: 2px solid var(--color-border);
      box-shadow: none;
    }
    
    .card {
      border: 2px solid var(--color-border);
      box-shadow: none;
      border-radius: 0;
    }
    
    .btn {
      border-radius: 0;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      font-family: Georgia, serif;
      letter-spacing: -0.025em;
    }
  `,
};

// Colorful theme configuration
const colorfulTheme: ThemeConfig = {
  name: "colorful",
  displayName: "Colorful",
  version: "1.0.0",
  description: "Vibrant colorful theme with playful design elements",
  author: "Letter-Press Team",
  supportsDarkMode: true,
  isBuiltIn: true,
  layouts: {
    default: "DefaultLayout",
    home: "HomeLayout",
    page: "PageLayout",
    post: "PostLayout",
  },
  colors: {
    // Primary colors
    primary: "#8b5cf6",
    secondary: "#6b7280",
    accent: "#06b6d4",
    
    // Text colors
    text: "#1f2937",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    
    // Background colors
    background: "#fdf4ff",
    surface: "#ffffff",
    surfaceSecondary: "#f8fafc",
    
    // Border colors
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    
    // State colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
    
    // Semantic colors for blocks
    highlight: "#fef3c7",
    quote: "#e0e7ff",
    code: "#1f2937",
    codeBackground: "#f1f5f9",
  },
  darkColors: {
    // Primary colors
    primary: "#a78bfa",
    secondary: "#9ca3af",
    accent: "#67e8f9",
    
    // Text colors
    text: "#fafaf9",
    textSecondary: "#d6d3d1",
    textMuted: "#a8a29e",
    
    // Background colors
    background: "#1c1917",
    surface: "#292524",
    surfaceSecondary: "#44403c",
    
    // Border colors
    border: "#44403c",
    borderLight: "#57534e",
    
    // State colors
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#67e8f9",
    
    // Semantic colors for blocks
    highlight: "#365314",
    quote: "#3730a3",
    code: "#fafaf9",
    codeBackground: "#44403c",
  },
  customCSS: `
    .nav-sticky {
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-success));
      border-bottom: none;
    }
    
    .nav-brand, .nav-link {
      color: white !important;
    }
    
    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
    }
    
    .btn-primary {
      background: linear-gradient(45deg, var(--color-primary), var(--color-accent));
      border: none;
    }
    
    .btn-primary:hover {
      background: linear-gradient(45deg, #7c3aed, #0891b2);
    }
    
    .card {
      background: linear-gradient(135deg, var(--color-surface), var(--color-background));
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
    }

    /* Dark mode overrides for colorful theme */
    .dark .nav-sticky,
    [data-theme="dark"] .nav-sticky {
      background: linear-gradient(90deg, #7c3aed, #0891b2, #059669);
    }
    
    .dark .card,
    [data-theme="dark"] .card {
      background: linear-gradient(135deg, var(--color-surface), var(--color-background));
    }
  `,
};

// Export all built-in themes
export const builtInThemes: ThemeConfig[] = [
  defaultTheme,
  darkTheme,
  minimalTheme, 
  colorfulTheme,
];

// Auto-register themes when module loads - this will be handled by the server initialization
export function getBuiltInThemes() {
  return builtInThemes;
}