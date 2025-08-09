import { Show, createSignal } from "solid-js";
import { useTheme } from "~/lib/theme-manager";
import type { DarkModePreference } from "~/lib/dark-mode";

export function DarkModeToggle() {
  const { darkModePreference, setDarkModePreference, isDarkMode, isHydrated } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);

  const handlePreferenceChange = (preference: DarkModePreference) => {
    setDarkModePreference(preference);
    setIsDropdownOpen(false);
  };

  const getIcon = () => {
    const preference = darkModePreference();
    switch (preference) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '💻';
    }
  };

  const getLabel = () => {
    const preference = darkModePreference();
    switch (preference) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  // Prevent hydration issues by not rendering until hydrated
  if (!isHydrated()) {
    return (
      <div class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-md">
        <span class="text-lg">💻</span>
        <span class="hidden md:inline">System</span>
      </div>
    );
  }

  return (
    <div class="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen())}
        class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
        aria-label={`Current theme: ${getLabel()}`}
        aria-expanded={isDropdownOpen()}
      >
        <span class="text-lg">{getIcon()}</span>
        <span class="hidden md:inline">{getLabel()}</span>
        <svg 
          class={`h-4 w-4 transform transition-transform ${isDropdownOpen() ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <Show when={isDropdownOpen()}>
        <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div class="py-1" role="menu">
            <button
              onClick={() => handlePreferenceChange('light')}
              class={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                darkModePreference() === 'light' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <span class="text-lg">☀️</span>
              <div>
                <div class="font-medium">Light</div>
                <div class="text-xs text-gray-500">Always use light mode</div>
              </div>
              <Show when={darkModePreference() === 'light'}>
                <svg class="h-4 w-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </Show>
            </button>

            <button
              onClick={() => handlePreferenceChange('dark')}
              class={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                darkModePreference() === 'dark' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <span class="text-lg">🌙</span>
              <div>
                <div class="font-medium">Dark</div>
                <div class="text-xs text-gray-500">Always use dark mode</div>
              </div>
              <Show when={darkModePreference() === 'dark'}>
                <svg class="h-4 w-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </Show>
            </button>

            <button
              onClick={() => handlePreferenceChange('system')}
              class={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                darkModePreference() === 'system' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <span class="text-lg">💻</span>
              <div>
                <div class="font-medium">System</div>
                <div class="text-xs text-gray-500">Use system preference</div>
              </div>
              <Show when={darkModePreference() === 'system'}>
                <svg class="h-4 w-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </Show>
            </button>
          </div>
        </div>
      </Show>

      {/* Backdrop to close dropdown */}
      <Show when={isDropdownOpen()}>
        <div 
          class="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      </Show>
    </div>
  );
}

// Simple toggle for mobile or compact spaces
export function DarkModeToggleSimple() {
  const { toggleDarkMode, isDarkMode, isHydrated } = useTheme();

  // Prevent hydration issues by not rendering until hydrated
  if (!isHydrated()) {
    return (
      <div class="p-2 text-gray-700 rounded-md">
        <span class="text-lg">💻</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      class="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
      aria-label={`Switch to ${isDarkMode() ? 'light' : 'dark'} mode`}
    >
      <Show 
        when={isDarkMode()}
        fallback={<span class="text-lg">🌙</span>}
      >
        <span class="text-lg">☀️</span>
      </Show>
    </button>
  );
}