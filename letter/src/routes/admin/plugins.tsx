import { Show, For, createSignal } from "solid-js";
import { createAsync, redirect } from "@solidjs/router";
import AdminLayout from "./layout";
import { getPluginData, togglePluginStatus } from "../../lib";
import { getAdminSession } from "~/lib/auth-utils";

// Server function to get auth and plugins data
async function getAdminPluginsData() {
  "use server";

  // Use the cached admin session check
  const session = await getAdminSession();

  const pluginsData = await getPluginData();

  return {
    session,
    plugins: pluginsData,
  };
}

export default function AdminPlugins() {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("all");

  // Get both auth and data from server in one call
  const data = createAsync(() => getAdminPluginsData(), {
    deferStream: true,
  });

  const session = () => data()?.session;
  const plugins = () => data()?.plugins;

  // Filter plugins based on search and status
  const filteredPlugins = () => {
    const pluginData = plugins();
    if (!pluginData) return [];
    
    let allPlugins = pluginData.all;
    
    if (statusFilter() === "enabled") {
      allPlugins = pluginData.enabled;
    } else if (statusFilter() === "disabled") {
      allPlugins = pluginData.all.filter(p => !pluginData.enabled.find(e => e.id === p.id));
    }
    
    if (searchTerm()) {
      allPlugins = allPlugins.filter((plugin: any) =>
        plugin.name?.toLowerCase().includes(searchTerm().toLowerCase()) ||
        plugin.description?.toLowerCase().includes(searchTerm().toLowerCase())
      );
    }
    
    return allPlugins;
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    const result = await togglePluginStatus({ pluginName: pluginId, enabled: !enabled });
    if (result.error) {
      alert(`Failed to ${enabled ? "disable" : "enable"} plugin: ${result.error.message}`);
    } else {
      // Refresh the page to get updated data
      window.location.reload();
    }
  };

  return (
    <Show 
      when={session()?.user} 
      fallback={
        <div class="min-h-screen flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AdminLayout user={session()!.user}>
        <div class="p-6">
          <div class="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div class="mb-8">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <span class="mr-3">🔌</span>
                    Plugin Management
                  </h1>
                  <p class="text-gray-600">
                    Manage your Letter-Press CMS plugins and extend functionality.
                  </p>
                </div>
                <div class="mt-4 sm:mt-0">
                  <button class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                    <span class="mr-2">📦</span>
                    Install Plugin
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-400">🔍</span>
                    </div>
                    <input
                      type="text"
                      class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search plugins by name or description..."
                      value={searchTerm()}
                      onInput={(e) => setSearchTerm(e.currentTarget.value)}
                    />
                  </div>
                </div>
                <div>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter()}
                    onChange={(e) => setStatusFilter(e.currentTarget.value)}
                  >
                    <option value="all">All Plugins</option>
                    <option value="enabled">Active Only</option>
                    <option value="disabled">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Enhanced Plugin Statistics */}
            <Show when={plugins()}>
              {(pluginData) => {
                const totalPlugins = pluginData().all.length;
                const activePlugins = pluginData().enabled.length;
                const inactivePlugins = totalPlugins - activePlugins;
                const errorCount = pluginData().errors.length;
                
                return (
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <PluginStatsCard
                      title="Total Plugins"
                      value={totalPlugins}
                      icon="🔌"
                      color="blue"
                      subtitle={`${filteredPlugins().length} filtered`}
                    />
                    <PluginStatsCard
                      title="Active"
                      value={activePlugins}
                      icon="✅"
                      color="green"
                      subtitle="Currently enabled"
                    />
                    <PluginStatsCard
                      title="Inactive"
                      value={inactivePlugins}
                      icon="⏸️"
                      color="yellow"
                      subtitle="Available to enable"
                    />
                    <PluginStatsCard
                      title="Errors"
                      value={errorCount}
                      icon="⚠️"
                      color="red"
                      subtitle={errorCount > 0 ? "Need attention" : "All good"}
                    />
                  </div>
                );
              }}
            </Show>

            {/* Plugin Error Alert */}
            <Show when={plugins() && plugins()!.errors.length > 0}>
              <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center">
                  <span class="text-red-500 text-xl mr-3">⚠️</span>
                  <div class="flex-1">
                    <h3 class="text-sm font-medium text-red-800">Plugin Errors Detected</h3>
                    <p class="text-sm text-red-700 mt-1">
                      {plugins()!.errors.length} plugin(s) have encountered errors and may not function properly.
                    </p>
                    <div class="mt-2">
                      <For each={plugins()!.errors.slice(0, 3)}>
                        {(error) => (
                          <div class="text-xs text-red-600 bg-red-100 px-2 py-1 rounded mt-1 inline-block mr-2">
                            {error}
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                  <button class="text-red-600 hover:text-red-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </Show>

            {/* Enhanced Plugin Grid */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">Installed Plugins</h2>
                  <div class="text-sm text-gray-500">
                    Showing {filteredPlugins().length} plugins
                  </div>
                </div>
              </div>

              <Show 
                when={filteredPlugins().length > 0}
                fallback={
                  <div class="p-12 text-center">
                    <div class="text-6xl mb-4">🔌</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm() || statusFilter() !== "all" ? "No matching plugins" : "No plugins installed"}
                    </h3>
                    <p class="text-gray-500 mb-6">
                      {searchTerm() || statusFilter() !== "all" 
                        ? "Try adjusting your search criteria or filters."
                        : "Browse the plugin marketplace to extend your CMS functionality."
                      }
                    </p>
                    <Show when={searchTerm() === "" && statusFilter() === "all"}>
                      <button class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <span class="mr-2">📦</span>
                        Browse Plugins
                      </button>
                    </Show>
                  </div>
                }
              >
                <div class="p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <For each={filteredPlugins()}>
                      {(plugin: any) => {
                        const isEnabled = plugins()?.enabled.some((ep: any) => ep.id === plugin.id) || false;
                        
                        return (
                          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                            <div class="flex items-start justify-between mb-4">
                              <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900 mb-1">
                                  {plugin.name}
                                </h3>
                                <p class="text-sm text-gray-500 mb-2">v{plugin.version}</p>
                                <p class="text-sm text-gray-600 line-clamp-2">
                                  {plugin.description || "No description available"}
                                </p>
                              </div>
                              <div class="ml-4">
                                <Show 
                                  when={isEnabled}
                                  fallback={
                                    <div class="w-3 h-3 bg-gray-400 rounded-full" title="Inactive"></div>
                                  }
                                >
                                  <div class="w-3 h-3 bg-green-400 rounded-full" title="Active"></div>
                                </Show>
                              </div>
                            </div>

                            <div class="flex items-center justify-between">
                              <div class="flex items-center space-x-2">
                                <span class={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                  isEnabled 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {isEnabled ? 'Active' : 'Inactive'}
                                </span>
                                <Show when={plugin.installedAt}>
                                  <span class="text-xs text-gray-500">
                                    Installed {new Date(plugin.installedAt).toLocaleDateString()}
                                  </span>
                                </Show>
                              </div>
                              
                              <div class="flex space-x-2">
                                <button class="text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-50 transition-colors text-sm">
                                  Settings
                                </button>
                                <button
                                  onClick={() => togglePlugin(plugin.id, isEnabled)}
                                  class={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    isEnabled
                                      ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                      : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                  }`}
                                >
                                  {isEnabled ? 'Disable' : 'Enable'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </AdminLayout>
    </Show>
  );
}

// Enhanced Stats Card Component
function PluginStatsCard(props: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "red";
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    red: "bg-red-500 hover:bg-red-600",
  };

  const bgColorClasses = {
    blue: "hover:bg-blue-50",
    green: "hover:bg-green-50", 
    yellow: "hover:bg-yellow-50",
    red: "hover:bg-red-50",
  };

  return (
    <div class={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 cursor-pointer ${bgColorClasses[props.color]} hover:shadow-md hover:scale-105`}>
      <div class="flex items-center">
        <div class={`${colorClasses[props.color]} rounded-lg p-3 mr-4 transition-colors shadow-lg`}>
          <span class="text-white text-xl">{props.icon}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">{props.title}</p>
          <p class="text-2xl font-bold text-gray-900">
            {props.value.toLocaleString()}
          </p>
          <Show when={props.subtitle}>
            <p class="text-xs text-gray-500 mt-1">{props.subtitle}</p>
          </Show>
        </div>
      </div>
    </div>
  );
}
