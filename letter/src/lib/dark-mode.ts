import { isServer } from "solid-js/web";

export type DarkModePreference = 'light' | 'dark' | 'system';

// Cookie utilities
export const DARK_MODE_COOKIE = 'letter-press-dark-mode';

export function getCookieValue(name: string): string | null {
  if (isServer) return null;
  
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export function setCookieValue(name: string, value: string, days: number = 365): void {
  if (isServer) return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  const expiresString = expires.toUTCString();
  
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresString}; path=/; SameSite=Strict`;
}

export function getDarkModePreference(): DarkModePreference {
  if (isServer) return 'system';
  
  const saved = getCookieValue(DARK_MODE_COOKIE);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

export function setDarkModePreference(preference: DarkModePreference): void {
  setCookieValue(DARK_MODE_COOKIE, preference);
}

export function getSystemDarkModePreference(): boolean {
  if (isServer) return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function shouldUseDarkMode(preference: DarkModePreference): boolean {
  if (isServer) return false;
  
  switch (preference) {
    case 'dark':
      return true;
    case 'light':
      return false;
    case 'system':
      return getSystemDarkModePreference();
    default:
      return false;
  }
}

export function applyDarkModeToDocument(isDark: boolean): void {
  if (isServer) return;
  
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

// Server-side helpers
export async function getServerDarkModePreference(request?: Request): Promise<DarkModePreference> {
  "use server";
  
  if (!request) return 'system';
  
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return 'system';
  
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === DARK_MODE_COOKIE) {
      const decoded = decodeURIComponent(value);
      if (decoded === 'light' || decoded === 'dark' || decoded === 'system') {
        return decoded;
      }
    }
  }
  
  return 'system';
}

// Initial dark mode state calculation for SSR
export function getInitialDarkModeState(serverPreference?: DarkModePreference): boolean {
  // During SSR, we can only guess based on the saved preference
  // We default to light mode to prevent hydration mismatch
  if (isServer) {
    // Only return true for explicit dark preference during SSR
    return serverPreference === 'dark';
  }
  
  // On client, calculate actual preference
  const preference = getDarkModePreference();
  return shouldUseDarkMode(preference);
}

// Hydration-safe dark mode initialization
export function initializeDarkModeForHydration(serverPreference?: DarkModePreference): {
  initialPreference: DarkModePreference;
  initialIsDark: boolean;
} {
  if (isServer) {
    return {
      initialPreference: serverPreference || 'system',
      initialIsDark: serverPreference === 'dark'
    };
  }
  
  const preference = getDarkModePreference();
  const isDark = shouldUseDarkMode(preference);
  
  return {
    initialPreference: preference,
    initialIsDark: isDark
  };
}