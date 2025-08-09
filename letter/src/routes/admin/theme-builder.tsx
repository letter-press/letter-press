import { createSignal } from "solid-js";
import { createAsync } from "@solidjs/router";
import AdminLayout from "./layout";
import { ThemeBuilder } from "../../components/admin/theme-builder";
import type { ThemeConfig } from "../../lib/types";
import { getSessionOptional } from "../../lib/auth-utils";
import { 
  getThemesData, 
  saveTheme, 
  activateTheme, 
  deleteTheme 
} from "../../lib/admin-server-functions";

// Server function to get data with auth check
async function getThemeBuilderData() {
  "use server";
  const session = await getSessionOptional();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const themesResult = await getThemesData();
  return { 
    user: session.user, 
    themes: themesResult?.data?.themes || [],
    activeTheme: themesResult?.data?.activeTheme || 'default'
  };
}

export default function ThemeBuilderPage() {
  const data = createAsync(() => getThemeBuilderData());
  const [currentTheme, setCurrentTheme] = createSignal<ThemeConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = createSignal(false);
  const [notification, setNotification] = createSignal<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSaveTheme = async (theme: ThemeConfig) => {
    try {
      const result = await saveTheme({
        ...theme,
        id: currentTheme()?.id as number | undefined
      });
      
      showNotification('success', 'Theme saved successfully!');
      setIsCreatingNew(false);
      // Reload themes data
      window.location.reload();
    } catch (error) {
      console.error('Error saving theme:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save theme';
      showNotification('error', errorMessage);
    }
  };

  const handleActivateTheme = async (themeName: string) => {
    try {
      const result = await activateTheme({ themeName });
      
      showNotification('success', `Theme "${themeName}" activated!`);
      // Reload themes data
      window.location.reload();
    } catch (error) {
      console.error('Error activating theme:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate theme';
      showNotification('error', errorMessage);
    }
  };

  const handleDeleteTheme = async (themeId: number) => {
    if (!confirm('Are you sure you want to delete this theme? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await deleteTheme({ themeId });
      
      showNotification('success', 'Theme deleted successfully!');
      // Reload themes data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting theme:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete theme';
      showNotification('error', errorMessage);
    }
  };

  const handleCreateNewTheme = () => {
    setCurrentTheme(null);
    setIsCreatingNew(true);
  };

  const handleEditTheme = (theme: any) => {
    setCurrentTheme(theme);
    setIsCreatingNew(false);
  };

  return (
    <AdminLayout user={data()?.user!}>
      {notification() && (
        <div class={`notification ${notification()!.type}`}>
          {notification()!.message}
        </div>
      )}
      
      <div class="theme-builder-page">
        {isCreatingNew() || currentTheme() ? (
          <div>
            <div class="page-header">
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setCurrentTheme(null);
                }}
                class="admin-button-secondary"
              >
                ← Back to Themes
              </button>
            </div>
            
            <ThemeBuilder
              initialTheme={currentTheme() as any}
              onSave={handleSaveTheme}
              onPreview={(theme) => {
                // TODO: Implement live preview
                console.log('Preview theme:', theme);
              }}
            />
          </div>
        ) : (
          <div>
            <div class="admin-page-header">
              <div>
                <h1>Theme Management</h1>
                <p class="admin-page-description">
                  Manage and customize your website's visual appearance
                </p>
              </div>
              
              <button
                onClick={handleCreateNewTheme}
                class="admin-button-primary"
              >
                Create New Theme
              </button>
            </div>

            <div class="themes-grid">
              {data()?.themes.map((theme) => (
                <div class={`theme-card ${theme.isActive ? 'active' : ''}`}>
                  <div class="theme-card-header">
                    <div class="theme-card-info">
                      <h3 class="theme-card-title">{theme.displayName}</h3>
                      <p class="theme-card-description">{theme.description || 'No description'}</p>
                      
                      <div class="theme-card-meta">
                        <span class="theme-meta-item">
                          <strong>Version:</strong> {theme.version}
                        </span>
                        {theme.author && (
                          <span class="theme-meta-item">
                            <strong>Author:</strong> {theme.author}
                          </span>
                        )}
                        <span class="theme-meta-item">
                          <strong>Dark Mode:</strong> {theme.supportsDarkMode ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {theme.isActive && (
                      <div class="theme-active-badge">
                        Active
                      </div>
                    )}
                  </div>
                  
                  <div class="theme-card-preview">
                    <div class="preview-mini">
                      <div class="preview-mini-header" style={{
                        background: theme.colors?.primary || '#3b82f6'
                      }}>
                        <div class="preview-mini-nav"></div>
                      </div>
                      <div class="preview-mini-content" style={{
                        background: theme.colors?.background || '#ffffff',
                        color: theme.colors?.text || '#1f2937'
                      }}>
                        <div class="preview-mini-text" style={{
                          background: theme.colors?.surface || '#f9fafb'
                        }}></div>
                        <div class="preview-mini-text" style={{
                          background: theme.colors?.surface || '#f9fafb'
                        }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="theme-card-actions">
                    <button
                      onClick={() => handleEditTheme(theme)}
                      class="admin-button-secondary"
                    >
                      Edit
                    </button>
                    
                    {!theme.isActive && (
                      <button
                        onClick={() => handleActivateTheme(theme.name)}
                        class="admin-button-primary"
                      >
                        Activate
                      </button>
                    )}
                    
                    {!theme.isBuiltIn && !theme.isActive && (
                      <button
                        onClick={() => handleDeleteTheme(theme.id)}
                        class="admin-button-danger"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}