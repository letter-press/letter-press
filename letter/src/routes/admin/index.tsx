import {  Show, For, createMemo, createSignal, type JSX, type Accessor } from "solid-js";
import { A, createAsync, redirect, useNavigate, action, useAction, type Action } from "@solidjs/router";
import AdminLayout from "./layout";
import { getSiteStats, getPluginData, createPage } from "../../lib";
import { getAdminSession } from "~/lib/auth-utils";
import type { SiteStats, ApiResponse } from "~/lib/types";
import type { Session } from "@auth/solid-start";

// Plugin data type
interface PluginData {
  all?: Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    enabled: boolean;
    installedAt: Date;
  }>;
  enabled: Array<{
    name: string;
    version: string;
    description: string;
  }>;
  errors: string[];
}

// Server action to create a new page
const createNewPage: Action<[], never> = action(async (): Promise<never> => {
  "use server";
  
  const session = await getAdminSession();
  
  if (!session?.user?.id) {
    throw redirect("/login");
  }

  const result = await createPage({
    title: "Untitled Page",
    content: "",
    excerpt: "",
    slug: `untitled-page-${Date.now()}`,
    status: "DRAFT",
    authorId: session.user.id,
    publishedAt: undefined,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to create page");
  }

  if (!result.data?.id) {
    throw new Error("Failed to create page - no ID returned");
  }

  // Redirect to edit page
  throw redirect(`/admin/pages/edit/${result.data.id}`);
});

// Server function to get auth and dashboard data
async function getAdminDashboardData(): Promise<{
  session: Session;
  stats: SiteStats | null;
  plugins: PluginData;
}> {
  "use server";

  // Use the cached admin session check
  const session = await getAdminSession();

  const statsResult = await getSiteStats();
  const pluginsData = await getPluginData();

  return {
    session,
    stats: statsResult.data || null,
    plugins: pluginsData,
  };
}

// Dashboard component for administrators
export default function AdminDashboard(): JSX.Element {
  const createPageAction = useAction(createNewPage) as any;

  // Get both auth and data from server in one call
  const data = createAsync(() => getAdminDashboardData(), {
    deferStream: true,
  });

  const session = (): Session | undefined => data()?.session;
  const stats = (): SiteStats | null | undefined => data()?.stats;
  const plugins = (): PluginData | undefined => data()?.plugins;

  // Time-based greeting with user name
  const getGreeting = createMemo((): string => {
    const hour = new Date().getHours();
    const userData = session()?.user;
    const name = userData?.name || userData?.username || "Administrator";

    let timeGreeting = "Good evening";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";

    return `${timeGreeting}, ${name}`;
  });

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
          {/* Header with Actions */}
          <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}
              </h1>
              <p class="text-gray-600">
                Welcome to your Letter-Press CMS dashboard. Here's an overview of
                your site.
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <form action={createNewPage} method="post">
                <button
                  type="submit"
                  disabled={createPageAction.pending}
                  class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed"
                >
                  <Show when={createPageAction.pending} fallback={<span class="mr-2">✏️</span>}>
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  </Show>
                  {createPageAction.pending ? "Creating..." : "New Post"}
                </button>
              </form>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Show when={stats()}>
              {(siteStats) => {
                const totalPosts =
                  siteStats().counts.publishedPosts +
                  siteStats().counts.draftPosts;
                const publishedPercentage =
                  totalPosts > 0
                    ? Math.round(
                        (siteStats().counts.publishedPosts / totalPosts) * 100
                      )
                    : 0;

                return (
                  <>
                    <StatsCard
                      title="Published Posts"
                      value={siteStats().counts.publishedPosts}
                      icon="📝"
                      color="blue"
                      trend={`${publishedPercentage}% published`}
                    />
                    <StatsCard
                      title="Draft Posts"
                      value={siteStats().counts.draftPosts}
                      icon="📋"
                      color="yellow"
                      subtitle={
                        totalPosts > 0
                          ? `${100 - publishedPercentage}% drafts`
                          : "No posts yet"
                      }
                    />
                    <StatsCard
                      title="Total Users"
                      value={siteStats().counts.totalUsers}
                      icon="👥"
                      color="green"
                      subtitle="Active community members"
                    />
                    <StatsCard
                      title="Comments"
                      value={siteStats().counts.approvedComments}
                      icon="💬"
                      color="purple"
                      subtitle={`${
                        siteStats().counts.pendingComments
                      } pending approval`}
                    />
                  </>
                );
              }}
            </Show>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Recent Activity */}
            <div class="lg:col-span-2 space-y-6">
              {/* Welcome Message */}
              <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white p-6">
                <h2 class="text-xl font-bold mb-2">
                  Welcome to Letter-Press CMS
                </h2>
                <p class="text-blue-100 mb-4">
                  Your content management system is ready. Start creating
                  amazing content today!
                </p>
                <div class="flex space-x-3">
                  <form action={createNewPage} method="post">
                    <button
                      type="submit"
                      disabled={createPageAction.pending}
                      class="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg text-sm font-medium hover:bg-opacity-30 disabled:bg-opacity-10 transition-colors disabled:cursor-not-allowed"
                    >
                      <Show when={createPageAction.pending} fallback={<>✏️ Write Your First Post</>}>
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </Show>
                    </button>
                  </form>
                  <a
                    href="/docs"
                    class="inline-flex items-center px-4 py-2 bg-transparent border border-white border-opacity-30 text-white rounded-lg text-sm font-medium hover:bg-white hover:bg-opacity-10 transition-colors"
                  >
                    📚 View Documentation
                  </a>
                </div>
              </div>

              {/* Recent Activity */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </h2>
                  <a
                    href="/admin/pages"
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Posts →
                  </a>
                </div>
                <div class="p-6">
                  <Show
                    when={stats()}
                    fallback={
                      <div class="text-center py-8">
                        <div class="text-4xl mb-4">📝</div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">
                          No posts yet
                        </h3>
                        <p class="text-gray-600 mb-4">
                          Get started by creating your first post.
                        </p>
                         <form action={createNewPage} method="post">
                           <button
                             type="submit"
                             disabled={createPageAction.pending}
                             class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors disabled:cursor-not-allowed"
                           >
                             <Show when={createPageAction.pending} fallback={<>Create First Post</>}>
                               <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               Creating...
                             </Show>
                           </button>
                         </form>                      </div>
                    }
                  >
                    {(siteStats) => (
                      <Show
                        when={siteStats().recentPosts.length > 0}
                        fallback={
                          <div class="text-center py-8">
                            <div class="text-4xl mb-4">📝</div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">
                              No posts yet
                            </h3>
                            <p class="text-gray-600 mb-4">
                              Get started by creating your first post.
                            </p>
                            <form action={createNewPage} method="post">
                              <button
                                type="submit"
                                disabled={createPageAction.pending}
                                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors disabled:cursor-not-allowed"
                              >
                                <Show when={createPageAction.pending} fallback={<>Create First Post</>}>
                                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Creating...
                                </Show>
                              </button>
                            </form>
                          </div>
                        }
                      >
                        <div class="space-y-3">
                          <For each={siteStats().recentPosts.slice(0, 5)}>
                            {(post) => (
                              <div class="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                <div class="flex-shrink-0">
                                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-blue-600 text-sm font-medium">
                                      {post.publishedAt ? "📄" : "📋"}
                                    </span>
                                  </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                  <p class="text-sm font-medium text-gray-900 truncate">
                                    {post.title}
                                  </p>
                                  <div class="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>
                                      by{" "}
                                      {post.author.name || post.author.username}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {new Date(
                                        post.publishedAt || new Date()
                                      ).toLocaleDateString()}
                                    </span>
                                    <span>•</span>
                                    <span
                                      class={`px-2 py-1 rounded-full text-xs ${
                                        post.publishedAt
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {post.publishedAt ? "published" : "draft"}
                                    </span>
                                  </div>
                                </div>
                                <div class="flex-shrink-0 flex space-x-2">
                                  <a
                                    href={`/admin/pages/${post.id}`}
                                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Edit
                                  </a>
                                  <Show when={post.publishedAt}>
                                    <a
                                      href={`/posts/${post.slug}`}
                                      class="text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                      View
                                    </a>
                                  </Show>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    )}
                  </Show>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div class="space-y-6">
              {/* Enhanced Quick Actions */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                </div>
                <div class="p-6 space-y-3">
                  <QuickActionButton
                    action={createNewPage}
                    pending={createPageAction.pending}
                    icon="✏️"
                    text="Create New Post"
                    description="Write a new blog post"
                  />
                  <QuickActionButton
                    href="/admin/pages"
                    icon="📑"
                    text="Manage Posts"
                    description="View and edit all posts"
                  />
                  <QuickActionButton
                    action={createNewPage}
                    pending={createPageAction.pending}
                    icon="📄"
                    text="Create New Page"
                    description="Add a new static page"
                  />
                  <QuickActionButton
                    href="/admin/users"
                    icon="👥"
                    text="Manage Users"
                    description="Add or edit user accounts"
                  />
                  <QuickActionButton
                    href="/admin/plugins"
                    icon="🔌"
                    text="Plugin Manager"
                    description="Install and configure plugins"
                  />
                  <QuickActionButton
                    href="/admin/settings"
                    icon="⚙️"
                    text="Site Settings"
                    description="Configure your site preferences"
                  />
                </div>
              </div>

              {/* Enhanced Plugin Status */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-900">
                    Plugin Status
                  </h3>
                </div>
                <div class="p-6">
                  <Show when={plugins()}>
                    {(pluginData) => (
                      <div class="space-y-4">
                        {/* Plugin Statistics */}
                        <div class="grid grid-cols-2 gap-4">
                          <div class="text-center p-3 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">
                              {pluginData()?.enabled?.length || 0}
                            </div>
                            <div class="text-sm text-green-700">Active</div>
                          </div>
                          <div class="text-center p-3 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">
                              {pluginData()?.all?.length || 0}
                            </div>
                            <div class="text-sm text-blue-700">Total</div>
                          </div>
                        </div>

                        {/* Active Plugins List */}
                        <Show when={pluginData().enabled.length > 0}>
                          <div>
                            <p class="text-sm font-medium text-gray-700 mb-3">
                              Active Plugins:
                            </p>
                            <div class="space-y-2">
                              <For each={pluginData().enabled.slice(0, 4)}>
                                {(plugin) => (
                                  <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div class="flex items-center space-x-2">
                                      <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                                      <span class="text-sm font-medium text-gray-700">
                                        {plugin.name}
                                      </span>
                                    </div>
                                    <span class="text-xs text-gray-500">
                                      v{plugin.version}
                                    </span>
                                  </div>
                                )}
                              </For>
                              <Show when={pluginData().enabled.length > 4}>
                                <div class="text-center">
                                  <span class="text-xs text-gray-500">
                                    +{pluginData().enabled.length - 4} more
                                    plugins
                                  </span>
                                </div>
                              </Show>
                            </div>
                          </div>
                        </Show>

                        {/* Plugin Errors */}
                        <Show when={pluginData().errors.length > 0}>
                          <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div class="flex items-center space-x-2 mb-2">
                              <span class="text-red-500">⚠️</span>
                              <p class="text-sm font-medium text-red-800">
                                Plugin Issues ({pluginData().errors.length})
                              </p>
                            </div>
                            <p class="text-xs text-red-600">
                              Some plugins have encountered errors. Check the
                              plugin manager for details.
                            </p>
                          </div>
                        </Show>

                        {/* Plugin Management Link */}
                        <div class="pt-3 border-t border-gray-200">
                          <a
                            href="/admin/plugins"
                            class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium group"
                          >
                            <span>Manage All Plugins</span>
                            <span class="ml-1 group-hover:translate-x-0.5 transition-transform">
                              →
                            </span>
                          </a>
                        </div>
                      </div>
                    )}
                  </Show>
                </div>
              </div>

              {/* Enhanced System Status */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-900">
                    System Health
                  </h3>
                </div>
                <div class="p-6 space-y-4">
                  <StatusItem label="Database Connection" status="healthy" />
                  <StatusItem label="File System" status="healthy" />
                  <StatusItem label="Plugin System" status="healthy" />
                  <StatusItem label="Authentication" status="healthy" />

                  {/* System Info */}
                  <div class="pt-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 space-y-1">
                      <div class="flex justify-between">
                        <span>CMS Version:</span>
                        <span class="font-medium">Letter-Press v1.0.0</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Last Updated:</span>
                        <span class="font-medium">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span>Environment:</span>
                        <span class="font-medium">
                          {import.meta.env.DEV ? "Development" : "Production"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Posts */}
          <div class="mt-8">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">
                  Popular Posts
                </h2>
              </div>
              <div class="p-6">
                <Show when={stats()}>
                  {(siteStats) => (
                    <Show
                      when={siteStats().popularPosts.length > 0}
                      fallback={
                        <div class="text-center py-8">
                          <div class="text-4xl mb-4">📊</div>
                          <h3 class="text-lg font-medium text-gray-900 mb-2">
                            No popular posts yet
                          </h3>
                          <p class="text-gray-600">
                            Create and publish content to see popular posts
                            here.
                          </p>
                        </div>
                      }
                    >
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <For each={siteStats().popularPosts.slice(0, 6)}>
                          {(post) => (
                            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <h4 class="font-medium text-gray-900 mb-2 line-clamp-2">
                                {post.title}
                              </h4>
                              <div class="flex items-center justify-between text-sm text-gray-500">
                                <span>{post._count?.comments || 0} comments</span>
                                <span>
                                  {new Date(
                                    post.publishedAt!
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <a
                                href={`/posts/${post.slug}`}
                                class="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                              >
                                View Post →
                              </a>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  )}
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
    </Show>
  );
}

// Enhanced Stats Card with click functionality
interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "purple";
  trend?: string;
  subtitle?: string;
}

function StatsCard(props: StatsCardProps): JSX.Element {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    purple: "bg-purple-500 hover:bg-purple-600",
  };

  const bgColorClasses = {
    blue: "hover:bg-blue-50",
    green: "hover:bg-green-50",
    yellow: "hover:bg-yellow-50",
    purple: "hover:bg-purple-50",
  };

  return (
    <div
      class={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 cursor-pointer ${
        bgColorClasses[props.color]
      } hover:shadow-md hover:scale-105`}
    >
      <div class="flex items-center">
        <div
          class={`${
            colorClasses[props.color]
          } rounded-md p-3 mr-4 transition-colors`}
        >
          <span class="text-white text-xl">{props.icon}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">{props.title}</p>
          <p class="text-2xl font-bold text-gray-900">
            {props.value.toLocaleString()}
          </p>
          <Show when={props.trend}>
            <p class="text-xs text-green-600 font-medium">{props.trend}</p>
          </Show>
          <Show when={props.subtitle}>
            <p class="text-xs text-gray-500">{props.subtitle}</p>
          </Show>
        </div>
      </div>
    </div>
  );
}

// Enhanced Quick Action Button
interface QuickActionButtonProps {
  href?: string;
  action?: Action<[], never>;
  pending?: boolean;
  icon: string;
  text: string;
  description: string;
}

function QuickActionButton(props: QuickActionButtonProps): JSX.Element {
  return (
    <Show
      when={props.action}
      fallback={
        <a
          href={props.href!}
          class="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-200 w-full text-left"
        >
          <div class="flex-shrink-0 mr-3">
            <span class="text-xl group-hover:scale-110 transition-transform">
              {props.icon}
            </span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {props.text}
            </p>
            <p class="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
              {props.description}
            </p>
          </div>
          <div class="flex-shrink-0">
            <span class="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
              →
            </span>
          </div>
        </a>
      }
    >
      <form action={props.action} method="post" class="w-full">
        <button
          type="submit"
          disabled={props.pending}
          class="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-200 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex-shrink-0 mr-3">
            <Show
              when={props.pending}
              fallback={
                <span class="text-xl group-hover:scale-110 transition-transform">
                  {props.icon}
                </span>
              }
            >
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </Show>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {props.pending ? "Creating..." : props.text}
            </p>
            <p class="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
              {props.description}
            </p>
          </div>
          <div class="flex-shrink-0">
            <span class="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
              →
            </span>
          </div>
        </button>
      </form>
    </Show>
  );
}

// Enhanced Status Item
interface StatusItemProps {
  label: string;
  status: "healthy" | "warning" | "error";
}

function StatusItem(props: StatusItemProps): JSX.Element {
  const statusConfig = {
    healthy: {
      color: "bg-green-400",
      text: "Healthy",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
    warning: {
      color: "bg-yellow-400",
      text: "Warning",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    error: {
      color: "bg-red-400",
      text: "Error",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
  };

  const config = statusConfig[props.status];

  return (
    <div
      class={`flex items-center justify-between p-3 rounded-lg ${config.bgColor} border border-gray-200`}
    >
      <span class="text-sm font-medium text-gray-700">{props.label}</span>
      <div class="flex items-center space-x-2">
        <div class={`w-2 h-2 ${config.color} rounded-full`}></div>
        <span class={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>
    </div>
  );
}
