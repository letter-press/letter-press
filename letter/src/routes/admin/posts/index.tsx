import { createResource, Show, For, createSignal, type JSX } from "solid-js";
import {
  A,
  redirect,
  createAsync,
  useNavigate,
  action,
  useAction,
} from "@solidjs/router";
import AdminLayout from "../layout";
import { getPosts, createPost } from "../../../lib";
import { getAdminSession } from "~/lib/auth-utils";
import type { PostListItem, ApiResponse, PostFilters } from "~/lib/types";
import type { Session } from "@auth/solid-start";

// Server action to create a new post
const createNewPost = action(async (): Promise<never> => {
  "use server";

  const session = await getAdminSession();

  if (!session?.user?.id) {
    throw redirect("/login");
  }

  const result = await createPost({
    title: "Untitled Post",
    content: "",
    excerpt: "",
    slug: `untitled-post-${Date.now()}`,
    status: "DRAFT",
    type: "POST",
    authorId: session.user.id,
    publishedAt: undefined,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to create post");
  }

  if (!result.data?.id) {
    throw new Error("Failed to create post - no ID returned");
  }

  // Redirect to edit post
  throw redirect(`/admin/posts/edit/${result.data.id}`);
});

// Server function to get auth and posts data
async function getAdminPostsData() {
  "use server";

  // Use the cached admin session check
  const session = await getAdminSession();

  const filters: PostFilters = {
    type: "POST",
    limit: 100,
    orderBy: "createdAt",
    orderDirection: "desc",
  };

  const result = await getPosts(filters);

  return {
    session,
    posts: result.data || [],
  };
}

export default function AdminPosts(): JSX.Element {
  const [searchTerm, setSearchTerm] = createSignal<string>("");
  const [statusFilter, setStatusFilter] = createSignal<
    "all" | "published" | "draft" | "private" | "review"
  >("all");
  const createPostAction = useAction(createNewPost) as any;

  // Get both auth and data from server in one call
  const data = createAsync(() => getAdminPostsData(), {
    deferStream: true,
  });

  const session = () => data()?.session;
  const posts = () => data()?.posts || [];

  // Filter posts based on search and status
  const filteredPosts = () => {
    const postList = posts();
    if (!postList) return [];

    return postList.filter((post) => {
      const matchesSearch =
        searchTerm() === "" ||
        post.title?.toLowerCase().includes(searchTerm().toLowerCase());

      const matchesStatus =
        statusFilter() === "all" ||
        (statusFilter() === "published" && post.publishedAt) ||
        (statusFilter() === "draft" && !post.publishedAt && post.status === "DRAFT") ||
        (statusFilter() === "private" && post.status === "PRIVATE") ||
        (statusFilter() === "review" && post.status === "REVIEW");

      return matchesSearch && matchesStatus;
    });
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
                    <span class="mr-3">📝</span>
                    Posts
                  </h1>
                  <p class="text-gray-600">
                    Create and manage your blog posts and articles.
                  </p>
                </div>
                <div class="mt-4 sm:mt-0">
                  <form action={createNewPost} method="post">
                    <button
                      type="submit"
                      disabled={createPostAction.pending}
                      class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed"
                    >
                      <Show
                        when={createPostAction.pending}
                        fallback={<span class="mr-2">✏️</span>}
                      >
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      </Show>
                      {createPostAction.pending
                        ? "Creating..."
                        : "Create New Post"}
                    </button>
                  </form>
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
                      placeholder="Search posts by title or content..."
                      value={searchTerm()}
                      onInput={(e) => setSearchTerm(e.currentTarget.value)}
                    />
                  </div>
                </div>
                <div>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter()}
                    onChange={(e) => setStatusFilter(e.currentTarget.value as "all" | "published" | "draft" | "private" | "review")}
                  >
                    <option value="all">All Posts</option>
                    <option value="published">Published</option>
                    <option value="draft">Drafts</option>
                    <option value="review">Under Review</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Enhanced Posts Stats */}
            <Show when={posts()}>
              {(postList) => {
                const totalPosts = postList().length;
                const publishedPosts = postList().filter(
                  (p: any) => p.publishedAt
                ).length;
                const draftPosts = postList().filter(
                  (p: any) => !p.publishedAt && p.status === "DRAFT"
                ).length;
                const reviewPosts = postList().filter(
                  (p: any) => p.status === "REVIEW"
                ).length;

                return (
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <PostStatsCard
                      title="Total Posts"
                      value={totalPosts}
                      icon="📝"
                      color="blue"
                      subtitle={`${filteredPosts().length} filtered`}
                    />
                    <PostStatsCard
                      title="Published"
                      value={publishedPosts}
                      icon="🌐"
                      color="green"
                      subtitle="Live on website"
                    />
                    <PostStatsCard
                      title="Drafts"
                      value={draftPosts}
                      icon="📋"
                      color="yellow"
                      subtitle="Work in progress"
                    />
                    <PostStatsCard
                      title="Under Review"
                      value={reviewPosts}
                      icon="👁️"
                      color="purple"
                      subtitle="Awaiting approval"
                    />
                  </div>
                );
              }}
            </Show>

            {/* Enhanced Posts List */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">All Posts</h2>
                  <div class="text-sm text-gray-500">
                    Showing {filteredPosts().length} of {posts()?.length || 0}{" "}
                    posts
                  </div>
                </div>
              </div>

              <Show
                when={filteredPosts().length > 0}
                fallback={
                  <div class="p-12 text-center">
                    <div class="text-6xl mb-4">📝</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm() || statusFilter() !== "all"
                        ? "No matching posts"
                        : "No posts yet"}
                    </h3>
                    <p class="text-gray-500 mb-6">
                      {searchTerm() || statusFilter() !== "all"
                        ? "Try adjusting your search criteria or filters."
                        : "Get started by creating your first post."}
                    </p>
                    <Show
                      when={searchTerm() === "" && statusFilter() === "all"}
                    >
                      <form action={createNewPost} method="post">
                        <button
                          type="submit"
                          disabled={createPostAction.pending}
                          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium disabled:cursor-not-allowed"
                        >
                          <Show
                            when={createPostAction.pending}
                            fallback={<span class="mr-2">✏️</span>}
                          >
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          </Show>
                          {createPostAction.pending
                            ? "Creating..."
                            : "Create Your First Post"}
                        </button>
                      </form>
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
                          Published
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
                      <For each={filteredPosts()}>
                        {(post: PostListItem) => (
                          <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4">
                              <div class="flex items-center">
                                <div class="flex-shrink-0">
                                  <span class="text-2xl">📝</span>
                                </div>
                                <div class="ml-4">
                                  <div class="text-sm font-semibold text-gray-900 hover:text-blue-600">
                                    <A href={`/admin/posts/edit/${post.id}`}>
                                      {post.title}
                                    </A>
                                  </div>
                                  <Show when={post.slug}>
                                    <div class="text-sm text-gray-500">
                                      /{post.slug}
                                    </div>
                                  </Show>
                                </div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span
                                class={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                  post.publishedAt
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : post.status === "PRIVATE"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                                    : post.status === "REVIEW"
                                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                }`}
                              >
                                {post.publishedAt
                                  ? "Published"
                                  : post.status === "PRIVATE"
                                  ? "Private"
                                  : post.status === "REVIEW"
                                  ? "Review"
                                  : "Draft"}
                              </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex items-center">
                                <div class="flex-shrink-0 h-8 w-8">
                                  <Show
                                    when={post.author?.image}
                                    fallback={
                                      <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span class="text-white font-medium text-sm">
                                          {post.author?.name?.charAt(0) ||
                                            post.author?.username?.charAt(0) ||
                                            "A"}
                                        </span>
                                      </div>
                                    }
                                  >
                                    <img
                                      class="h-8 w-8 rounded-full object-cover"
                                      src={post.author.image || undefined}
                                      alt=""
                                    />
                                  </Show>
                                </div>
                                <div class="ml-3">
                                  <div class="text-sm font-medium text-gray-900">
                                    {post.author?.name || post.author?.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Show when={post.publishedAt} fallback={<span>—</span>}>
                                <div>
                                  {new Date(post.publishedAt!).toLocaleDateString()}
                                </div>
                                <div class="text-xs text-gray-400">
                                  {new Date(post.publishedAt!).toLocaleTimeString()}
                                </div>
                              </Show>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                {new Date(post.updatedAt).toLocaleDateString()}
                              </div>
                              <div class="text-xs text-gray-400">
                                {new Date(post.updatedAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div class="flex items-center justify-end space-x-2">
                                <Show when={post.publishedAt}>
                                  <A
                                    href={`/posts/${post.slug}`}
                                    target="_blank"
                                    class="text-green-600 hover:text-green-800 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                                  >
                                    View
                                  </A>
                                </Show>
                                <A
                                  href={`/admin/posts/edit/${post.id}`}
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
interface PostStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "purple";
  subtitle?: string;
}

function PostStatsCard(props: PostStatsCardProps): JSX.Element {
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