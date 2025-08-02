import { createSignal, Show, createResource } from "solid-js";
import { A, createAsync, redirect } from "@solidjs/router";
import AdminLayout from "./layout";
import { Auth } from "~/server/auth";

// Server function to get auth and settings data
async function getAdminSettingsData() {
  "use server";

  const session = await Auth();
  if (!session?.user) {
    throw redirect("/login");
  }

  // TODO: Implement actual settings loading
  const settings = {
    siteTitle: "LetterPress CMS",
    siteDescription: "A powerful content management system",
    siteUrl: "https://example.com",
    adminEmail: "admin@example.com",
    timezone: "UTC",
    postsPerPage: 10,
    defaultPostStatus: "DRAFT",
    commentsEnabled: true,
    userRegistration: false,
    theme: "default"
  };

  return {
    session,
    settings,
  };
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = createSignal('general');
  const [saved, setSaved] = createSignal(false);

  // Get both auth and data from server in one call
  const data = createAsync(() => getAdminSettingsData(), {
    deferStream: true,
  });

  const session = () => data()?.session;
  const settings = () => data()?.settings;

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️', description: 'Basic site settings' },
    { id: 'content', name: 'Content', icon: '📝', description: 'Post and page settings' },
    { id: 'users', name: 'Users & Roles', icon: '👥', description: 'User management settings' },
    { id: 'plugins', name: 'Plugin Settings', icon: '🔌', description: 'Plugin configuration' },
    { id: 'advanced', name: 'Advanced', icon: '🔧', description: 'Technical settings' },
  ];

  const handleSave = () => {
    // TODO: Implement actual save functionality
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Show when={session()?.user} fallback={<div>Loading...</div>}>
      <AdminLayout user={session()!.user}>
        <div class="p-6">
          <div class="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div class="mb-8">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <span class="mr-3">⚙️</span>
                    Settings
                  </h1>
                  <p class="text-gray-600">
                    Configure your LetterPress CMS installation and preferences.
                  </p>
                </div>
                <div class="mt-4 sm:mt-0">
                  <button
                    onClick={handleSave}
                    class="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <span class="mr-2">💾</span>
                    Save All Changes
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-col lg:flex-row gap-8">
              {/* Enhanced Tab Navigation */}
              <div class="lg:w-80 flex-shrink-0">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 class="text-lg font-semibold text-gray-900">Configuration</h3>
                  </div>
                  <nav class="p-2">
                    {tabs.map((tab) => (
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        class={`w-full flex items-start p-4 text-sm font-medium rounded-lg transition-all duration-200 mb-1 ${
                          activeTab() === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                        }`}
                      >
                        <span class="mr-3 text-lg">{tab.icon}</span>
                        <div class="text-left">
                          <div class="font-medium">{tab.name}</div>
                          <div class="text-xs text-gray-500 mt-1">{tab.description}</div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Enhanced Tab Content */}
              <div class="flex-1">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
                  <Show when={activeTab() === 'general'}>
                    <GeneralSettings onSave={handleSave} settings={settings} />
                  </Show>
                  <Show when={activeTab() === 'content'}>
                    <ContentSettings onSave={handleSave} settings={settings} />
                  </Show>
                  <Show when={activeTab() === 'users'}>
                    <UserSettings onSave={handleSave} settings={settings} />
                  </Show>
                  <Show when={activeTab() === 'plugins'}>
                    <PluginSettings onSave={handleSave} settings={settings} />
                  </Show>
                  <Show when={activeTab() === 'advanced'}>
                    <AdvancedSettings onSave={handleSave} settings={settings} />
                  </Show>
                </div>

                {/* Enhanced Save Notification */}
                <Show when={saved()}>
                  <div class="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                    <div class="flex items-center">
                      <span class="text-green-600 mr-3 text-xl">✅</span>
                      <div>
                        <span class="text-green-800 font-semibold">Settings saved successfully!</span>
                        <div class="text-green-700 text-sm mt-1">Your changes have been applied to the system.</div>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </Show>
  );
}

// General Settings Component
function GeneralSettings(props: { onSave: () => void; settings: any }) {
  return (
    <div>
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <span class="mr-2">⚙️</span>
          General Settings
        </h2>
        <p class="text-sm text-gray-600 mt-1">Configure basic site information and preferences</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Site Title
            </label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="LetterPress CMS"
              value={props.settings()?.siteTitle || ""}
            />
            <p class="text-xs text-gray-500 mt-1">The name of your website</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Site URL
            </label>
            <input
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
              value={props.settings()?.siteUrl || ""}
            />
            <p class="text-xs text-gray-500 mt-1">Your website's public URL</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Site Description
          </label>
          <textarea
            rows={3}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="A powerful content management system"
            value={props.settings()?.siteDescription || ""}
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">Brief description of your website for SEO and social sharing</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@example.com"
              value={props.settings()?.adminEmail || ""}
            />
            <p class="text-xs text-gray-500 mt-1">Primary administrator email address</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Australia/Sydney">Sydney (AEST)</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Default timezone for dates and times</p>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <button
            onClick={props.onSave}
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save General Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Content Settings Component
function ContentSettings(props: { onSave: () => void; settings: any }) {
  return (
    <div>
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <span class="mr-2">📝</span>
          Content Settings
        </h2>
        <p class="text-sm text-gray-600 mt-1">Configure how posts and pages are displayed and managed</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Posts per page
            </label>
            <input
              type="number"
              class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={props.settings()?.postsPerPage || 10}
              min="1"
              max="100"
            />
            <p class="text-xs text-gray-500 mt-1">Number of posts to show on each page</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Default post status
            </label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="PRIVATE">Private</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Default status for new posts</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Comments</h4>
              <p class="text-sm text-gray-600">Allow visitors to comment on posts</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked={props.settings()?.commentsEnabled || false} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Auto-save drafts</h4>
              <p class="text-sm text-gray-600">Automatically save post drafts while editing</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">SEO optimization</h4>
              <p class="text-sm text-gray-600">Enable automatic SEO meta tags and optimizations</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <button
            onClick={props.onSave}
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Content Settings
          </button>
        </div>
      </div>
    </div>
  );
}
          <label class="flex items-center">
            <input type="checkbox" class="mr-2" checked />
            <span class="text-sm font-medium text-gray-700">Allow comments by default</span>
          </label>
// User Settings Component
function UserSettings(props: { onSave: () => void; settings: any }) {
  return (
    <div>
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <span class="mr-2">👥</span>
          User & Role Settings
        </h2>
        <p class="text-sm text-gray-600 mt-1">Configure user registration and role management</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Default user role
            </label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="SUBSCRIBER">Subscriber</option>
              <option value="CONTRIBUTOR">Contributor</option>
              <option value="AUTHOR">Author</option>
              <option value="EDITOR">Editor</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Role assigned to new users by default</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Password minimum length
            </label>
            <input
              type="number"
              class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value="8"
              min="6"
              max="50"
            />
            <p class="text-xs text-gray-500 mt-1">Minimum characters required for passwords</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">User Registration</h4>
              <p class="text-sm text-gray-600">Allow new users to register accounts</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked={props.settings()?.userRegistration || false} />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Email Verification</h4>
              <p class="text-sm text-gray-600">Require email verification for new accounts</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
              <p class="text-sm text-gray-600">Enable 2FA for enhanced security</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <button
            onClick={props.onSave}
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save User Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Plugin Settings Component
function PluginSettings(props: { onSave: () => void; settings: any }) {
  return (
    <div>
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <span class="mr-2">🔌</span>
          Plugin Settings
        </h2>
        <p class="text-sm text-gray-600 mt-1">Configure plugin behavior and permissions</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Auto-update plugins</h4>
              <p class="text-sm text-gray-600">Automatically update plugins when new versions are available</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Plugin error notifications</h4>
              <p class="text-sm text-gray-600">Send email notifications when plugins encounter errors</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Development mode</h4>
              <p class="text-sm text-gray-600">Enable development features for plugin creators</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Plugin cache duration (minutes)
          </label>
          <input
            type="number"
            class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value="60"
            min="0"
            max="1440"
          />
          <p class="text-xs text-gray-500 mt-1">How long to cache plugin data (0 to disable)</p>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <button
            onClick={props.onSave}
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Plugin Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Advanced Settings Component
function AdvancedSettings(props: { onSave: () => void; settings: any }) {
  return (
    <div>
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <span class="mr-2">🔧</span>
          Advanced Settings
        </h2>
        <p class="text-sm text-gray-600 mt-1">Technical configuration options (use with caution)</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center">
            <span class="text-yellow-500 text-xl mr-3">⚠️</span>
            <div>
              <h4 class="text-sm font-medium text-yellow-800">Caution Required</h4>
              <p class="text-sm text-yellow-700 mt-1">
                These settings can affect your site's functionality. Only modify if you understand the implications.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Debug mode</h4>
              <p class="text-sm text-gray-600">Enable detailed error logging and debugging features</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Performance monitoring</h4>
              <p class="text-sm text-gray-600">Track performance metrics and optimization opportunities</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">Database optimization</h4>
              <p class="text-sm text-gray-600">Automatically optimize database tables weekly</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cache expiration (seconds)
            </label>
            <input
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value="3600"
              min="0"
            />
            <p class="text-xs text-gray-500 mt-1">Default cache duration for content</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              API rate limit (requests/minute)
            </label>
            <input
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value="100"
              min="1"
            />
            <p class="text-xs text-gray-500 mt-1">Maximum API requests per minute per IP</p>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <button
              onClick={props.onSave}
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Advanced Settings
            </button>
            <button class="text-red-600 hover:text-red-800 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
