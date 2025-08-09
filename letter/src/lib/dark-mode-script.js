/**
 * Dark Mode Hydration Script
 * 
 * This script runs before React/SolidJS hydration to prevent dark mode flash.
 * It should be inlined in the document head.
 */

(function() {
  'use strict';
  
  const DARK_MODE_COOKIE = 'letter-press-dark-mode';
  
  function getCookieValue(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }
  
  function getSystemDarkModePreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  function shouldUseDarkMode(preference) {
    switch (preference) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'system':
        return getSystemDarkModePreference();
      default:
        return getSystemDarkModePreference();
    }
  }
  
  function applyDarkMode() {
    const preference = getCookieValue(DARK_MODE_COOKIE) || 'system';
    const isDark = shouldUseDarkMode(preference);
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    
    // Store the computed preference to prevent flicker
    root.setAttribute('data-dark-mode-computed', isDark ? 'true' : 'false');
  }
  
  // Apply immediately
  applyDarkMode();
  
  // Listen for system changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function() {
      const preference = getCookieValue(DARK_MODE_COOKIE) || 'system';
      if (preference === 'system') {
        applyDarkMode();
      }
    });
  }
})();