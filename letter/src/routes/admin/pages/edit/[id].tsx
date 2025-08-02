import { createSignal, createResource, Show, createEffect } from "solid-js";
import {
  useNavigate,
  A,
  useParams,
  createAsync,
  redirect,
} from "@solidjs/router";
import AdminLayout from "../../layout";
import { getPost, updatePost } from "../../../../lib";
import { Auth } from "~/server/auth";

const getSession = async () => {
  "use server";

  const session = await Auth();
  if (!session?.user) {
    throw redirect("/login");
  }

  return session;
};
export default function EditPage() {
  const navigate = useNavigate();
  const params = useParams();

  const session = createAsync(getSession, {
    deferStream: true,
  });

  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [excerpt, setExcerpt] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [status, setStatus] = createSignal("DRAFT");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isLoaded, setIsLoaded] = createSignal(false);

  // Load existing page data
  const [pageData] = createResource(
    () => params.id,
    async (id) => {
      if (!id) return null;
      const result = await getPost(parseInt(id));
      return result.data;
    },
    { deferStream: true }
  );

  // Initialize form when page data loads
  createEffect(() => {
    const page = pageData();
    if (page && !isLoaded()) {
      setTitle(page.title || "");
      setContent(page.content || "");
      setExcerpt(page.excerpt || "");
      setSlug(page.slug || "");
      setStatus(page.status || "DRAFT");
      setIsLoaded(true);
    }
  });

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug() || slug() === generateSlug(title())) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUser = session();
      if (!currentUser?.user?.id) {
        alert("You must be logged in to update a page");

        return;
      }

      const result = await updatePost(parseInt(params.id), {
        title: title(),
        content: content() || undefined,
        excerpt: excerpt() || undefined,
        slug: slug(),
        status: status() as any,
        publishedAt: status() === "PUBLISHED" ? new Date() : undefined,
      });

      if (result.error) {
        alert(`Error updating page: ${result.error.message}`);
      } else {
        navigate(`/admin/pages`);
      }
    } catch (error) {
      console.error("Error updating page:", error);
      alert("Failed to update page");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Show when={session()?.user} fallback={<div>Loading...</div>}>
      <AdminLayout user={session()!.user}>
        <div class="p-6">
          <div class="max-w-4xl mx-auto">
            {/* Header */}
            <div class="mb-8">
              <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Edit Page</h1>
                <A
                  href="/admin/pages"
                  class="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Pages
                </A>
              </div>
            </div>

            <Show
              when={pageData()}
              fallback={
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div class="text-4xl mb-4">📄</div>
                  <h2 class="text-xl font-semibold text-gray-900 mb-2">
                    Loading page...
                  </h2>
                  <p class="text-gray-600">
                    Please wait while we fetch the page data.
                  </p>
                </div>
              }
            >
              {/* Form */}
              <form onSubmit={handleSubmit} class="space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Title */}
                  <div class="mb-6">
                    <label
                      for="title"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Page Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title()}
                      onInput={(e) => handleTitleChange(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter page title"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div class="mb-6">
                    <label
                      for="slug"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      URL Slug *
                    </label>
                    <div class="flex">
                      <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        /pages/
                      </span>
                      <input
                        type="text"
                        id="slug"
                        value={slug()}
                        onInput={(e) => setSlug(e.currentTarget.value)}
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="page-url-slug"
                        required
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div class="mb-6">
                    <label
                      for="content"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Content
                    </label>
                    <textarea
                      id="content"
                      value={content()}
                      onInput={(e) => setContent(e.currentTarget.value)}
                      rows={12}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Write your page content here..."
                    />
                  </div>

                  {/* Excerpt */}
                  <div class="mb-6">
                    <label
                      for="excerpt"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Excerpt
                    </label>
                    <textarea
                      id="excerpt"
                      value={excerpt()}
                      onInput={(e) => setExcerpt(e.currentTarget.value)}
                      rows={3}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of the page (optional)"
                    />
                  </div>

                  {/* Status */}
                  <div class="mb-6">
                    <label
                      for="status"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      value={status()}
                      onChange={(e) => setStatus(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="PRIVATE">Private</option>
                      <option value="REVIEW">Review</option>
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div class="flex justify-end space-x-3">
                  <A
                    href="/admin/pages"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </A>
                  <button
                    type="submit"
                    disabled={isSubmitting()}
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting() ? "Updating..." : "Update Page"}
                  </button>
                </div>
              </form>
            </Show>
          </div>
        </div>
      </AdminLayout>
    </Show>
  );
}
