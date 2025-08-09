// Dark mode SSR script - prevents flash of unstyled content
// This should be injected as early as possible in the HTML head

(function() {
  try {
    // Get dark mode preference from cookie
    function getCookie(name) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
          return decodeURIComponent(cookieValue);
        }
      }
      return null;
    }

    function getSystemDarkMode() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function shouldUseDarkMode(preference) {
      switch (preference) {
        case 'dark':
          return true;
        case 'light':
          return false;
        case 'system':
        default:
          return getSystemDarkMode();
      }
    }

    const preference = getCookie('letter-press-dark-mode') || 'system';
    const isDark = shouldUseDarkMode(preference);
    
    // Apply dark mode immediately
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {
    // Fail silently to avoid breaking the page
    console.warn('Dark mode SSR script failed:', e);
  }
})();