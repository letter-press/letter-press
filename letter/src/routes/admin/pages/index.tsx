import { createResource, Show, For, createSignal } from "solid-js";
import { A, redirect, createAsync } from "@solidjs/router";
import AdminLayout from "../layout";
import { getPosts } from "../../../lib";
import { Auth } from "~/server/auth";

// Server function to get auth and pages data
async function getAdminPagesData() {
  "use server";

  const session = await Auth();
  if (!session?.user) {
    throw redirect("/login");
  }

  const result = await getPosts({ type: "PAGE", limit: 100 });

  return {
    session,
    pages: result.data || [],
  };
}

export default function AdminPages() {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("all");

  // Get both auth and data from server in one call
  const data = createAsync(() => getAdminPagesData(), {
    deferStream: true,
  });

  const session = () => data()?.session;
  const pages = () => data()?.pages || [];

  // Filter pages based on search and status
  const filteredPages = () => {
    const pageList = pages();
    if (!pageList) return [];

    return pageList.filter((page: any) => {
      const matchesSearch =
        searchTerm() === "" ||
        page.title?.toLowerCase().includes(searchTerm().toLowerCase()) ||
        page.content?.toLowerCase().includes(searchTerm().toLowerCase());

      const matchesStatus =
        statusFilter() === "all" ||
        (statusFilter() === "published" && page.publishedAt) ||
        (statusFilter() === "draft" && !page.publishedAt) ||
        (statusFilter() === "private" && page.visibility === "PRIVATE");

      return matchesSearch && matchesStatus;
    });
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
                  <span class="mr-3">📄</span>
                  Pages
                </h1>
                <p class="text-gray-600">
                  Manage your website pages and static content.
                </p>
              </div>
              <div class="mt-4 sm:mt-0">
                <A
                  href="/admin/pages/new"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <span class="mr-2">➕</span>
                  Create New Page
                </A>
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
                    placeholder="Search pages by title or content..."
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
                  <option value="all">All Pages</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enhanced Pages Stats */}
          <Show when={pages()}>
            {(pageList) => {
              const totalPages = pageList().length;
              const publishedPages = pageList().filter(
                (p: any) => p.publishedAt
              ).length;
              const draftPages = pageList().filter(
                (p: any) => !p.publishedAt
              ).length;
              const privatePages = pageList().filter(
                (p: any) => p.visibility === "PRIVATE"
              ).length;

              return (
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <PageStatsCard
                    title="Total Pages"
                    value={totalPages}
                    icon="📄"
                    color="blue"
                    subtitle={`${filteredPages().length} filtered`}
                  />
                  <PageStatsCard
                    title="Published"
                    value={publishedPages}
                    icon="🌐"
                    color="green"
                    subtitle="Live on website"
                  />
                  <PageStatsCard
                    title="Drafts"
                    value={draftPages}
                    icon="📝"
                    color="yellow"
                    subtitle="Work in progress"
                  />
                  <PageStatsCard
                    title="Private"
                    value={privatePages}
                    icon="🔒"
                    color="purple"
                    subtitle="Restricted access"
                  />
                </div>
              );
            }}
          </Show>

          {/* Enhanced Pages List */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">All Pages</h2>
                <div class="text-sm text-gray-500">
                  Showing {filteredPages().length} of {pages()?.length || 0}{" "}
                  pages
                </div>
              </div>
            </div>

            <Show
              when={filteredPages().length > 0}
              fallback={
                <div class="p-12 text-center">
                  <div class="text-6xl mb-4">📄</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm() || statusFilter() !== "all"
                      ? "No matching pages"
                      : "No pages yet"}
                  </h3>
                  <p class="text-gray-500 mb-6">
                    {searchTerm() || statusFilter() !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "Get started by creating your first page."}
                  </p>
                  <Show when={searchTerm() === "" && statusFilter() === "all"}>
                    <A
                      href="/admin/pages/new"
                      class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <span class="mr-2">➕</span>
                      Create Your First Page
                    </A>
                  </Show>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <For each={filteredPages()}>
                      {(page: any) => (
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-6 py-4">
                            <div class="flex items-center">
                              <div class="flex-shrink-0">
                                <span class="text-2xl">📄</span>
                              </div>
                              <div class="ml-4">
                                <div class="text-sm font-semibold text-gray-900 hover:text-blue-600">
                                  <A href={`/admin/pages/edit/${page.id}`}>
                                    {page.title}
                                  </A>
                                </div>
                                <Show when={page.slug}>
                                  <div class="text-sm text-gray-500">
                                    /{page.slug}
                                  </div>
                                </Show>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span
                              class={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                page.publishedAt
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : page.visibility === "PRIVATE"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {page.publishedAt
                                ? "Published"
                                : page.visibility === "PRIVATE"
                                ? "Private"
                                : "Draft"}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div class="flex-shrink-0 h-8 w-8">
                                <Show
                                  when={page.author?.image}
                                  fallback={
                                    <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                      <span class="text-white font-medium text-sm">
                                        {page.author?.name?.charAt(0) ||
                                          page.author?.username?.charAt(0) ||
                                          "A"}
                                      </span>
                                    </div>
                                  }
                                >
                                  <img
                                    class="h-8 w-8 rounded-full object-cover"
                                    src={page.author.image}
                                    alt=""
                                  />
                                </Show>
                              </div>
                              <div class="ml-3">
                                <div class="text-sm font-medium text-gray-900">
                                  {page.author?.name || page.author?.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {new Date(page.updatedAt).toLocaleDateString()}
                            </div>
                            <div class="text-xs text-gray-400">
                              {new Date(page.updatedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end space-x-2">
                              <Show when={page.publishedAt}>
                                <A
                                  href={`/pages/${page.slug}`}
                                  target="_blank"
                                  class="text-green-600 hover:text-green-800 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                                >
                                  View
                                </A>
                              </Show>
                              <A
                                href={`/admin/pages/${page.id}`}
                                class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                Edit
                              </A>
                              <button class="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
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
function PageStatsCard(props: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "purple";
  subtitle?: string;
}) {
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
      class={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 cursor-pointer ${
        bgColorClasses[props.color]
      } hover:shadow-md hover:scale-105`}
    >
      <div class="flex items-center">
        <div
          class={`${
            colorClasses[props.color]
          } rounded-lg p-3 mr-4 transition-colors shadow-lg`}
        >
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
