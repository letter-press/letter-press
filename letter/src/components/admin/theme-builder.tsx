import { createSignal, createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { ThemeConfigSchema, type ThemeConfig } from "../../lib/validation-schemas";
import { validateForm, validateOnClient } from "../../lib/validation-utils";
import { defaultColors, defaultDarkColors } from "../../lib/theme-database";

interface ThemeBuilderProps {
  initialTheme?: ThemeConfig | undefined;
  onSave?: (theme: ThemeConfig) => void;
  onPreview?: (theme: ThemeConfig) => void;
}

interface ColorPickerProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const ColorPicker = (props: ColorPickerProps) => {
  return (
    <div class="admin-form-group">
      <label class="admin-label">
        {props.label}
        {props.description && (
          <span class="admin-help-text">{props.description}</span>
        )}
      </label>
      <div class="color-picker-container">
        <input
          type="color"
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          class={`color-picker-input ${props.error ? 'error' : ''}`}
        />
        <input
          type="text"
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          class={`admin-input color-hex-input ${props.error ? 'error' : ''}`}
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
      {props.error && (
        <span class="admin-error-text">{props.error}</span>
      )}
    </div>
  );
};

export const ThemeBuilder = (props: ThemeBuilderProps) => {
  const [activeTab, setActiveTab] = createSignal<'basic' | 'colors' | 'dark-colors' | 'advanced'>('basic');
  const [previewMode, setPreviewMode] = createSignal<'light' | 'dark'>('light');
  
  // Create default theme config with better type safety
  const defaultThemeConfig: ThemeConfig = {
    name: '',
    displayName: '',
    description: '',
    author: '',
    version: '1.0.0',
    supportsDarkMode: true,
    isBuiltIn: false,
    layouts: {
      default: "DefaultLayout",
      home: "HomeLayout",
      page: "PageLayout",
      post: "PostLayout",
    },
    colors: { ...defaultColors },
    darkColors: { ...defaultDarkColors },
    customCSS: '',
  };

  // Theme configuration store with better type inference
  const [theme, setTheme] = createStore<ThemeConfig>({
    ...defaultThemeConfig,
    ...(props.initialTheme && typeof props.initialTheme === 'object' ? props.initialTheme : {})
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = createSignal<Record<string, string>>({});
  const [isValidating, setIsValidating] = createSignal(false);

  // Real-time validation on theme changes
  createEffect(() => {
    if (theme.name || theme.displayName) {
      const validation = validateForm(ThemeConfigSchema, theme);
      setFieldErrors(validation.fieldErrors);
    }
  });

  const handleSave = () => {
    setIsValidating(true);
    
    // Validate client-side first with the base schema
    const validation = validateForm(ThemeConfigSchema, theme);
    if (!validation.isValid) {
      setIsValidating(false);
      setFieldErrors(validation.fieldErrors);
      return;
    }
    
    // If validation passes, call the save callback
    setIsValidating(false);
    props.onSave?.(theme);
  };

  const handlePreview = () => {
    // Preview doesn't require full validation
    props.onPreview?.(theme);
  };

  const resetToDefaults = () => {
    setTheme('colors', { ...defaultColors });
    setTheme('darkColors', { ...defaultDarkColors });
  };

  const colorSections = [
    {
      title: 'Brand Colors',
      colors: [
        { key: 'primary', label: 'Primary', description: 'Main brand color for buttons and links' },
        { key: 'secondary', label: 'Secondary', description: 'Secondary brand color for accents' },
        { key: 'accent', label: 'Accent', description: 'Highlight color for special elements' },
      ]
    },
    {
      title: 'Text Colors',
      colors: [
        { key: 'text', label: 'Primary Text', description: 'Main text color' },
        { key: 'textSecondary', label: 'Secondary Text', description: 'Lighter text for descriptions' },
        { key: 'textMuted', label: 'Muted Text', description: 'Very light text for hints' },
      ]
    },
    {
      title: 'Background Colors',
      colors: [
        { key: 'background', label: 'Background', description: 'Main page background' },
        { key: 'surface', label: 'Surface', description: 'Card and panel backgrounds' },
        { key: 'surfaceSecondary', label: 'Secondary Surface', description: 'Alternate panel backgrounds' },
      ]
    },
    {
      title: 'Border Colors',
      colors: [
        { key: 'border', label: 'Border', description: 'Main border color' },
        { key: 'borderLight', label: 'Light Border', description: 'Subtle border color' },
      ]
    },
    {
      title: 'Status Colors',
      colors: [
        { key: 'success', label: 'Success', description: 'Success messages and indicators' },
        { key: 'warning', label: 'Warning', description: 'Warning messages and indicators' },
        { key: 'error', label: 'Error', description: 'Error messages and indicators' },
        { key: 'info', label: 'Info', description: 'Information messages' },
      ]
    },
    {
      title: 'Content Colors',
      colors: [
        { key: 'highlight', label: 'Highlight', description: 'Text highlighting' },
        { key: 'quote', label: 'Quote', description: 'Blockquote styling' },
        { key: 'code', label: 'Code Text', description: 'Inline code text' },
        { key: 'codeBackground', label: 'Code Background', description: 'Code block backgrounds' },
      ]
    }
  ] as const;

  return (
    <div class="theme-builder">
      <div class="theme-builder-header">
        <div class="theme-builder-title">
          <h2>Theme Builder</h2>
          <p class="theme-builder-description">
            Create and customize your website's visual appearance
          </p>
        </div>
        
        <div class="theme-builder-actions">
          <button
            type="button"
            onClick={handlePreview}
            class="admin-button-secondary"
          >
            Preview Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            class="admin-button-primary"
            disabled={Object.keys(fieldErrors()).length > 0 || isValidating()}
          >
            {isValidating() ? 'Validating...' : 'Save Theme'}
          </button>
        </div>
      </div>

      <div class="theme-builder-content">
        <div class="theme-builder-tabs">
          <button
            class={`theme-tab ${activeTab() === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            class={`theme-tab ${activeTab() === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            Light Colors
          </button>
          <Show when={theme.supportsDarkMode}>
            <button
              class={`theme-tab ${activeTab() === 'dark-colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('dark-colors')}
            >
              Dark Colors
            </button>
          </Show>
          <button
            class={`theme-tab ${activeTab() === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <div class="theme-builder-panel">
          <Show when={activeTab() === 'basic'}>
            <div class="theme-form-section">
              <h3>Theme Information</h3>
              
              <div class="admin-form-group">
                <label class="admin-label" for="theme-name">
                  Theme Name *
                  <span class="admin-help-text">
                    Internal name (lowercase, hyphens only)
                  </span>
                </label>
                <input
                  id="theme-name"
                  type="text"
                  value={theme.name}
                  onInput={(e) => setTheme('name', e.currentTarget.value)}
                  class={`admin-input ${fieldErrors().name ? 'error' : ''}`}
                  placeholder="my-custom-theme"
                />
                <Show when={fieldErrors().name}>
                  <span class="admin-error-text">{fieldErrors().name}</span>
                </Show>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="theme-display-name">
                  Display Name *
                  <span class="admin-help-text">
                    Human-readable name shown in the admin
                  </span>
                </label>
                <input
                  id="theme-display-name"
                  type="text"
                  value={theme.displayName}
                  onInput={(e) => setTheme('displayName', e.currentTarget.value)}
                  class={`admin-input ${fieldErrors().displayName ? 'error' : ''}`}
                  placeholder="My Custom Theme"
                />
                <Show when={fieldErrors().displayName}>
                  <span class="admin-error-text">{fieldErrors().displayName}</span>
                </Show>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="theme-description">
                  Description
                </label>
                <textarea
                  id="theme-description"
                  value={theme.description || ''}
                  onInput={(e) => setTheme('description', e.currentTarget.value)}
                  class="admin-textarea"
                  placeholder="Describe your theme..."
                  rows="3"
                />
              </div>

              <div class="form-row">
                <div class="admin-form-group">
                  <label class="admin-label" for="theme-author">
                    Author
                  </label>
                  <input
                    id="theme-author"
                    type="text"
                    value={theme.author || ''}
                    onInput={(e) => setTheme('author', e.currentTarget.value)}
                    class="admin-input"
                    placeholder="Your Name"
                  />
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="theme-version">
                    Version
                  </label>
                  <input
                    id="theme-version"
                    type="text"
                    value={theme.version}
                    onInput={(e) => setTheme('version', e.currentTarget.value)}
                    class="admin-input"
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-checkbox-container">
                  <input
                    type="checkbox"
                    checked={theme.supportsDarkMode}
                    onChange={(e) => setTheme('supportsDarkMode', e.currentTarget.checked)}
                    class="admin-checkbox"
                  />
                  <span class="admin-checkbox-label">
                    Support Dark Mode
                    <span class="admin-help-text">
                      Enable dark mode color palette for this theme
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </Show>

          <Show when={activeTab() === 'colors'}>
            <div class="theme-colors-section">
              <div class="theme-colors-header">
                <h3>Light Mode Colors</h3>
                <div class="theme-colors-actions">
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    class="admin-button-secondary small"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>

              <div class="color-sections">
                <For each={colorSections}>
                  {(section) => (
                    <div class="color-section">
                      <h4 class="color-section-title">{section.title}</h4>
                      <div class="color-grid">
                        <For each={section.colors}>
                          {(colorDef) => (
                            <ColorPicker
                              label={colorDef.label}
                              description={colorDef.description}
                              value={theme.colors[colorDef.key] || ''}
                              onChange={(value) => setTheme('colors', colorDef.key, value)}
                              error={fieldErrors()[`colors.${String(colorDef.key)}`]}
                            />
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={activeTab() === 'dark-colors' && theme.supportsDarkMode}>
            <div class="theme-colors-section">
              <div class="theme-colors-header">
                <h3>Dark Mode Colors</h3>
                <div class="theme-colors-actions">
                  <button
                    type="button"
                    onClick={() => setTheme('darkColors', { ...defaultDarkColors })}
                    class="admin-button-secondary small"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>

              <div class="color-sections">
                <For each={colorSections}>
                  {(section) => (
                    <div class="color-section">
                      <h4 class="color-section-title">{section.title}</h4>
                      <div class="color-grid">
                        <For each={section.colors}>
                          {(colorDef) => (
                            <ColorPicker
                              label={colorDef.label}
                              description={colorDef.description}
                              value={theme.darkColors?.[colorDef.key] || defaultDarkColors[colorDef.key] || ''}
                              onChange={(value) => setTheme('darkColors', colorDef.key, value)}
                              error={fieldErrors()[`darkColors.${String(colorDef.key)}`]}
                            />
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={activeTab() === 'advanced'}>
            <div class="theme-advanced-section">
              <h3>Advanced Settings</h3>
              
              <div class="admin-form-group">
                <label class="admin-label" for="custom-css">
                  Custom CSS
                  <span class="admin-help-text">
                    Additional CSS rules to customize your theme
                  </span>
                </label>
                <textarea
                  id="custom-css"
                  value={theme.customCSS || ''}
                  onInput={(e) => setTheme('customCSS', e.currentTarget.value)}
                  class="admin-textarea code-textarea"
                  placeholder={`/* Add your custom CSS here */
.my-custom-class {
  color: var(--color-primary);
  font-size: 1.2rem;
}`}
                  rows="10"
                />
              </div>

              <div class="admin-form-group">
                <label class="admin-label">
                  Layout Templates
                  <span class="admin-help-text">
                    Configure which layout components to use for different page types
                  </span>
                </label>
                
                <div class="layout-grid">
                  <div class="admin-form-group">
                    <label class="admin-label" for="layout-default">Default Layout</label>
                    <input
                      id="layout-default"
                      type="text"
                      value={theme.layouts?.default || 'DefaultLayout'}
                      onInput={(e) => setTheme('layouts', 'default', e.currentTarget.value)}
                      class="admin-input"
                      placeholder="DefaultLayout"
                    />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-label" for="layout-home">Home Layout</label>
                    <input
                      id="layout-home"
                      type="text"
                      value={theme.layouts?.home || 'HomeLayout'}
                      onInput={(e) => setTheme('layouts', 'home', e.currentTarget.value)}
                      class="admin-input"
                      placeholder="HomeLayout"
                    />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-label" for="layout-page">Page Layout</label>
                    <input
                      id="layout-page"
                      type="text"
                      value={theme.layouts?.page || 'PageLayout'}
                      onInput={(e) => setTheme('layouts', 'page', e.currentTarget.value)}
                      class="admin-input"
                      placeholder="PageLayout"
                    />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-label" for="layout-post">Post Layout</label>
                    <input
                      id="layout-post"
                      type="text"
                      value={theme.layouts?.post || 'PostLayout'}
                      onInput={(e) => setTheme('layouts', 'post', e.currentTarget.value)}
                      class="admin-input"
                      placeholder="PostLayout"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <div class="theme-preview-panel">
        <div class="preview-header">
          <h4>Live Preview</h4>
          <div class="preview-mode-toggle">
            <button
              class={`preview-mode-btn ${previewMode() === 'light' ? 'active' : ''}`}
              onClick={() => setPreviewMode('light')}
            >
              Light
            </button>
            <Show when={theme.supportsDarkMode}>
              <button
                class={`preview-mode-btn ${previewMode() === 'dark' ? 'active' : ''}`}
                onClick={() => setPreviewMode('dark')}
              >
                Dark
              </button>
            </Show>
          </div>
        </div>
        
        <div 
          class="theme-preview"
          style={{
            '--preview-primary': previewMode() === 'dark' ? (theme.darkColors?.primary || theme.colors?.primary || '') : (theme.colors?.primary || ''),
            '--preview-secondary': previewMode() === 'dark' ? (theme.darkColors?.secondary || theme.colors?.secondary || '') : (theme.colors?.secondary || ''),
            '--preview-background': previewMode() === 'dark' ? (theme.darkColors?.background || theme.colors?.background || '') : (theme.colors?.background || ''),
            '--preview-surface': previewMode() === 'dark' ? (theme.darkColors?.surface || theme.colors?.surface || '') : (theme.colors?.surface || ''),
            '--preview-text': previewMode() === 'dark' ? (theme.darkColors?.text || theme.colors?.text || '') : (theme.colors?.text || ''),
            '--preview-border': previewMode() === 'dark' ? (theme.darkColors?.border || theme.colors?.border || '') : (theme.colors?.border || ''),
          }}
        >
          <div class="preview-content">
            <div class="preview-header-bar">
              <div class="preview-logo">🎨 {theme.displayName || 'Theme Name'}</div>
              <div class="preview-nav">
                <span class="preview-nav-item">Home</span>
                <span class="preview-nav-item">About</span>
                <span class="preview-nav-item">Blog</span>
              </div>
            </div>
            
            <div class="preview-main">
              <h1 class="preview-title">Welcome to Your Site</h1>
              <p class="preview-text">This is how your theme will look with the current color settings.</p>
              
              <div class="preview-buttons">
                <button class="preview-btn preview-btn-primary">Primary Button</button>
                <button class="preview-btn preview-btn-secondary">Secondary Button</button>
              </div>
              
              <div class="preview-card">
                <h3 class="preview-card-title">Sample Card</h3>
                <p class="preview-card-text">This card shows how content areas will appear with your theme colors.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};