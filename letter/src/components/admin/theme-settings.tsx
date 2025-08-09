import { createSignal, createEffect, Show, For } from "solid-js";
import { useTheme, type SiteConfig, type NavItem } from "~/lib/theme-manager";
import type { ThemeConfig } from "~/lib/types";
import { DarkModeToggle } from "~/components/theme/dark-mode-toggle";

export function ThemeSettings() {
  const { 
    currentTheme, 
    setTheme, 
    availableThemes, 
    getThemeConfig, 
    getThemeColors,
    siteConfig, 
    setSiteConfig,
    darkModePreference,
    setDarkModePreference,
    isDarkMode
  } = useTheme();

  const [isLoading, setIsLoading] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'themes' | 'dark-mode' | 'site-config' | 'navigation'>('themes');
  const [localSiteConfig, setLocalSiteConfig] = createSignal<SiteConfig>(siteConfig());

  // Sync local config with global config
  createEffect(() => {
    setLocalSiteConfig(siteConfig());
  });

  const handleThemeChange = async (themeName: string) => {
    setIsLoading(true);
    try {
      setTheme(themeName);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to change theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteConfigSave = async () => {
    setIsLoading(true);
    try {
      setSiteConfig(localSiteConfig());
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to save site config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSiteConfigField = (field: keyof SiteConfig, value: any) => {
    setLocalSiteConfig(prev => ({ ...prev, [field]: value }));
  };

  const addNavigationItem = () => {
    const nav = localSiteConfig().navigation;
    const newItem = { label: "New Link", href: "/new-page" };
    updateSiteConfigField('navigation', [...nav, newItem]);
  };

  const removeNavigationItem = (index: number) => {
    const nav = localSiteConfig().navigation;
    updateSiteConfigField('navigation', nav.filter((_, i) => i !== index));
  };

  const updateNavigationItem = (index: number, field: keyof NavItem, value: string) => {
    const nav = [...localSiteConfig().navigation];
    nav[index] = { ...nav[index], [field]: value };
    updateSiteConfigField('navigation', nav);
  };

  return (
    <div class="admin-page">
      <div class="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-color-text mb-2">Themes & Settings</h1>
          <p class="text-color-text-secondary">
            Customize your site's appearance and configuration
          </p>
        </div>

        {/* Tab Navigation */}
        <div class="tab-nav mb-6">
          <button
            onClick={() => setActiveTab('themes')}
            class={`tab-button ${activeTab() === 'themes' ? 'active' : ''}`}
          >
            🎨 Themes
          </button>
          <button
            onClick={() => setActiveTab('dark-mode')}
            class={`tab-button ${activeTab() === 'dark-mode' ? 'active' : ''}`}
          >
            🌙 Dark Mode
          </button>
          <button
            onClick={() => setActiveTab('site-config')}
            class={`tab-button ${activeTab() === 'site-config' ? 'active' : ''}`}
          >
            ⚙️ Site Settings
          </button>
          <button
            onClick={() => setActiveTab('navigation')}
            class={`tab-button ${activeTab() === 'navigation' ? 'active' : ''}`}
          >
            📱 Navigation
          </button>
        </div>

        {/* Dark Mode Tab */}
        <Show when={activeTab() === 'dark-mode'}>
          <div class="admin-container p-6">
            <h2 class="text-xl font-semibold text-color-text mb-6">Dark Mode Settings</h2>
            
            <div class="space-y-6">
              {/* Current Status */}
              <div class="admin-section-accent p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-color-text">Current Status</h3>
                    <p class="text-sm text-color-text-secondary mt-1">
                      Dark mode is currently <span class="font-semibold text-color-primary">{isDarkMode() ? 'enabled' : 'disabled'}</span>
                    </p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">{isDarkMode() ? '🌙' : '☀️'}</span>
                    <span class="px-3 py-1 text-sm font-medium rounded-full border-2" 
                          style={{
                            "background-color": isDarkMode() ? 'var(--color-primary)' : 'var(--color-warning)',
                            "border-color": isDarkMode() ? 'var(--color-primary)' : 'var(--color-warning)',
                            color: 'white'
                          }}>
                      {isDarkMode() ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dark Mode Preference */}
              <div class="admin-section p-4">
                <h3 class="font-medium text-color-text mb-4">Choose Your Preference</h3>
                <div class="grid gap-3">
                  <label class="flex items-center p-4 border-2 border-color-border rounded-lg hover:border-color-border-strong hover:bg-color-surface-secondary transition-all cursor-pointer">
                    <input
                      type="radio"
                      name="darkMode"
                      value="light"
                      checked={darkModePreference() === 'light'}
                      onChange={() => setDarkModePreference('light')}
                      class="mr-4 text-color-primary"
                    />
                    <div class="flex items-center space-x-3 flex-1">
                      <span class="text-2xl">☀️</span>
                      <div>
                        <div class="font-medium text-color-text">Light Mode</div>
                        <div class="text-sm text-color-text-secondary">Always use the light theme</div>
                      </div>
                    </div>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-color-border rounded-lg hover:border-color-border-strong hover:bg-color-surface-secondary transition-all cursor-pointer">
                    <input
                      type="radio"
                      name="darkMode"
                      value="dark"
                      checked={darkModePreference() === 'dark'}
                      onChange={() => setDarkModePreference('dark')}
                      class="mr-4 text-color-primary"
                    />
                    <div class="flex items-center space-x-3 flex-1">
                      <span class="text-2xl">🌙</span>
                      <div>
                        <div class="font-medium text-color-text">Dark Mode</div>
                        <div class="text-sm text-color-text-secondary">Always use the dark theme</div>
                      </div>
                    </div>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-color-border rounded-lg hover:border-color-border-strong hover:bg-color-surface-secondary transition-all cursor-pointer">
                    <input
                      type="radio"
                      name="darkMode"
                      value="system"
                      checked={darkModePreference() === 'system'}
                      onChange={() => setDarkModePreference('system')}
                      class="mr-4 text-color-primary"
                    />
                    <div class="flex items-center space-x-3 flex-1">
                      <span class="text-2xl">💻</span>
                      <div>
                        <div class="font-medium text-color-text">System Preference</div>
                        <div class="text-sm text-color-text-secondary">Follow your system's dark mode setting</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quick Toggle */}
              <div class="admin-section-cool p-4">
                <h3 class="font-medium text-color-text mb-3">Quick Toggle</h3>
                <p class="text-sm text-color-text-secondary mb-4">
                  Use this toggle to quickly switch between light and dark modes:
                </p>
                <div class="flex items-center space-x-4">
                  <DarkModeToggle />
                  <span class="text-sm text-color-text-secondary">
                    Current: {isDarkMode() ? 'Dark' : 'Light'} mode
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Themes Tab */}
        <Show when={activeTab() === 'themes'}>
          <div class="space-y-6">
            {/* Theme Selection */}
            <div class="admin-container p-6">
              <h2 class="text-xl font-semibold text-color-text mb-6">Choose Your Theme</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={availableThemes()}>
                  {(theme) => (
                    <ThemeCard
                      theme={theme}
                      isActive={currentTheme() === theme.name}
                      onSelect={() => handleThemeChange(theme.name)}
                      isLoading={isLoading()}
                    />
                  )}
                </For>
              </div>
            </div>

            {/* Current Theme Details */}
            <Show when={getThemeConfig()}>
              <div class="admin-section-warm p-6">
                <h3 class="text-lg font-semibold text-color-text mb-4">Current Theme Details</h3>
                <ThemeConfigDisplay config={getThemeConfig()!} />
              </div>
            </Show>
          </div>
        </Show>

        {/* Site Configuration Tab */}
        <Show when={activeTab() === 'site-config'}>
          <div class="admin-container p-6">
            <h2 class="text-xl font-semibold text-color-text mb-6">Site Configuration</h2>
            
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-color-text mb-2">Site Title</label>
                  <input
                    type="text"
                    value={localSiteConfig().title}
                    onInput={(e) => updateSiteConfigField('title', e.target.value)}
                    class="form-input w-full"
                    placeholder="Enter your site title"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-color-text mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={localSiteConfig().logo || ''}
                    onInput={(e) => updateSiteConfigField('logo', e.target.value || undefined)}
                    placeholder="https://example.com/logo.png"
                    class="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-color-text mb-2">Site Description</label>
                <textarea
                  value={localSiteConfig().description}
                  onInput={(e) => updateSiteConfigField('description', e.target.value)}
                  rows="3"
                  class="form-textarea w-full"
                  placeholder="Describe your website..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-color-text mb-2">Footer Copyright</label>
                <input
                  type="text"
                  value={localSiteConfig().footer.copyright}
                  onInput={(e) => updateSiteConfigField('footer', { 
                    ...localSiteConfig().footer, 
                    copyright: e.target.value 
                  })}
                  class="form-input w-full"
                  placeholder="© 2024 Your Company Name"
                />
              </div>

              <div class="pt-4 border-t-2 border-color-border">
                <button
                  onClick={handleSiteConfigSave}
                  disabled={isLoading()}
                  class="btn btn-primary"
                >
                  {isLoading() ? '💾 Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </Show>

        {/* Navigation Tab */}
        <Show when={activeTab() === 'navigation'}>
          <div class="admin-container p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-color-text">Navigation Menu</h2>
              <button
                onClick={addNavigationItem}
                class="btn btn-primary"
              >
                ➕ Add Item
              </button>
            </div>

            <div class="space-y-4">
              <Show when={localSiteConfig().navigation.length === 0}>
                <div class="admin-section-cool p-12 text-center">
                  <div class="text-4xl mb-4">📱</div>
                  <p class="text-lg mb-2 text-color-text">No navigation items yet</p>
                  <p class="text-sm text-color-text-secondary">Add your first navigation item to get started</p>
                </div>
              </Show>

              <For each={localSiteConfig().navigation}>
                {(item, index) => (
                  <div class="admin-section p-4">
                    <div class="flex items-center space-x-4">
                      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-medium text-color-text-secondary mb-1">Label</label>
                          <input
                            type="text"
                            value={item.label}
                            onInput={(e) => updateNavigationItem(index(), 'label', e.target.value)}
                            placeholder="Home, About, Contact..."
                            class="form-input w-full"
                          />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-color-text-secondary mb-1">URL</label>
                          <input
                            type="text"
                            value={item.href}
                            onInput={(e) => updateNavigationItem(index(), 'href', e.target.value)}
                            placeholder="/about, https://example.com"
                            class="form-input w-full"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeNavigationItem(index())}
                        class="btn btn-error"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="pt-6 border-t-2 border-color-border">
              <button
                onClick={handleSiteConfigSave}
                disabled={isLoading()}
                class="btn btn-primary"
              >
                {isLoading() ? '💾 Saving...' : '💾 Save Navigation'}
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

function ThemeCard(props: {
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
  isLoading: boolean;
}) {
  return (
    <div 
      class={`card relative cursor-pointer transition-all ${
        props.isActive 
          ? 'card-accent border-color-primary' 
          : 'hover:border-color-primary'
      }`}
      onClick={props.onSelect}
    >
      {/* Active Badge */}
      <Show when={props.isActive}>
        <div class="absolute -top-2 -right-2 px-3 py-1 text-xs font-bold text-white rounded-full shadow-lg border-2 border-white"
             style={{ "background-color": 'var(--color-primary)' }}>
          ✓ Active
        </div>
      </Show>

      {/* Theme Header */}
      <div class="mb-4">
        <h3 class="font-bold text-lg text-color-text mb-1">{props.theme.displayName}</h3>
        <p class="text-sm text-color-text-secondary leading-relaxed">{props.theme.description}</p>
      </div>
      
      {/* Theme Info */}
      <div class="flex items-center justify-between text-xs text-color-text-muted mb-4 p-2 bg-color-surface-secondary rounded border border-color-border-light">
        <span class="font-medium">v{props.theme.version}</span>
        <span class="font-medium">{props.theme.author}</span>
        <Show when={props.theme.supportsDarkMode}>
          <span class="flex items-center space-x-1 px-2 py-1 bg-color-surface rounded-full border border-color-border">
            <span>🌙</span>
            <span>Dark</span>
          </span>
        </Show>
      </div>

      {/* Color Preview */}
      <Show when={props.theme.colors}>
        <div class="mb-5">
          <div class="text-xs font-medium text-color-text-secondary mb-2">Color Palette</div>
          <div class="flex space-x-2">
            <div 
              class="w-8 h-8 rounded-lg border-2 border-color-border shadow-sm"
              style={`background-color: ${props.theme.colors.primary}`}
              title="Primary"
            />
            <div 
              class="w-8 h-8 rounded-lg border-2 border-color-border shadow-sm"
              style={`background-color: ${props.theme.colors.secondary}`}
              title="Secondary"
            />
            <div 
              class="w-8 h-8 rounded-lg border-2 border-color-border shadow-sm"
              style={`background-color: ${props.theme.colors.accent}`}
              title="Accent"
            />
            <div 
              class="w-8 h-8 rounded-lg border-2 border-color-border shadow-sm"
              style={`background-color: ${props.theme.colors.surface}`}
              title="Surface"
            />
          </div>
        </div>
      </Show>

      {/* Action Button */}
      <button
        disabled={props.isActive || props.isLoading}
        class={`w-full ${
          props.isActive
            ? 'btn btn-secondary cursor-not-allowed'
            : 'btn btn-primary'
        }`}
      >
        {props.isActive ? '✓ Current Theme' : 'Select Theme'}
      </button>
    </div>
  );
}

function ThemeConfigDisplay(props: { config: ThemeConfig }) {
  return (
    <div class="admin-section p-5">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Info */}
        <div class="admin-section-cool p-4">
          <h4 class="font-semibold text-color-text mb-3 flex items-center">
            ℹ️ Theme Information
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between py-1 border-b border-color-border-light">
              <span class="text-color-text-secondary">Name:</span>
              <span class="font-medium text-color-text">{props.config.displayName}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-color-border-light">
              <span class="text-color-text-secondary">Version:</span>
              <span class="font-medium text-color-text">{props.config.version}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-color-border-light">
              <span class="text-color-text-secondary">Author:</span>
              <span class="font-medium text-color-text">{props.config.author}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-color-text-secondary">Dark Mode:</span>
              <span class={`font-medium px-2 py-1 rounded-full text-xs border ${props.config.supportsDarkMode ? 'text-color-success border-color-success' : 'text-color-text-muted border-color-border'}`}>
                {props.config.supportsDarkMode ? '✅ Supported' : '❌ Not supported'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Available Layouts */}
        <div class="admin-section-accent p-4">
          <h4 class="font-semibold text-color-text mb-3 flex items-center">
            📐 Available Layouts
          </h4>
          <Show when={props.config.layouts} fallback={
            <p class="text-sm text-color-text-secondary italic">No custom layouts defined</p>
          }>
            <div class="space-y-1 text-sm max-h-24 overflow-y-auto">
              <For each={props.config.layouts ? Object.entries(props.config.layouts) : []}>
                {([key, value]) => (
                  <div class="flex justify-between py-1 border-b border-color-border-light">
                    <span class="text-color-text-secondary font-mono">{key}:</span>
                    <span class="text-color-text truncate ml-2">{value}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
      
      {/* Color Palette */}
      <Show when={props.config.colors}>
        <div class="mt-6 pt-6 border-t-2 border-color-border">
          <h4 class="font-semibold text-color-text mb-4 flex items-center">
            🎨 Color Palette
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <For each={props.config.colors ? Object.entries(props.config.colors) : []}>
              {([key, value]) => (
                <div class="flex items-center space-x-3 p-3 rounded border-2 border-color-border hover:border-color-border-strong transition-all bg-color-surface-secondary">
                  <div 
                    class="w-10 h-10 rounded-lg border-2 border-color-border shadow-sm flex-shrink-0"
                    style={`background-color: ${value}`}
                    title={`${key}: ${value}`}
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-medium text-color-text truncate">{key}</div>
                    <div class="text-xs text-color-text-secondary font-mono truncate">{value}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}