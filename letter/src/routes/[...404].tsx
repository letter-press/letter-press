// we use a hacky way to handle 404s
// We check our pages and slugs to see if we have a match
// If not, we render a 404 page

import { useLocation, createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getPostBySlug } from "../lib";

// Server function to get page by slug
async function getPageBySlug(slug: string) {
  "use server";

  const result = await getPostBySlug(slug);

  // Only return published pages
  if (
    result.data &&
    result.data.status === "PUBLISHED" &&
    result.data.type === "PAGE"
  ) {
    return result.data;
  }

  return null;
}

export default function NotFound() {
  const location = useLocation();
  const path = location.pathname;

  // Extract slug from path (remove leading slash)
  const slug = path.startsWith("/") ? path.slice(1) : path;

  // Only check for pages if it's a top-level slug (no slashes)
  // and not already handled by other routes
  const shouldCheckForPage =
    slug &&
    !slug.includes("/") &&
    !slug.startsWith("admin") &&
    !slug.startsWith("api") &&
    !slug.startsWith("login");

  // Try to find a page with this slug
  const page = createAsync(
    () => (shouldCheckForPage ? getPageBySlug(slug) : Promise.resolve(null)),
    {
      deferStream: true,
    }
  );

  return (
    <Show when={page()} fallback={<NotFoundPage />}>
      <PageView page={page()!} />
    </Show>
  );
}

// Component to render a page
function PageView(props: { page: any }) {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <article class="bg-white rounded-lg shadow-sm p-8">
          <header class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
              {props.page.title}
            </h1>
            <Show when={props.page.excerpt}>
              <p class="text-xl text-gray-600 leading-relaxed">
                {props.page.excerpt}
              </p>
            </Show>
            <div class="flex items-center text-sm text-gray-500 mt-6">
              <Show when={props.page.publishedAt}>
                <time dateTime={props.page.publishedAt}>
                  Published on{" "}
                  {new Date(props.page.publishedAt).toLocaleDateString()}
                </time>
              </Show>
              <Show when={props.page.author}>
                <span class="mx-2">•</span>
                <span>
                  By {props.page.author.name || props.page.author.username}
                </span>
              </Show>
            </div>
          </header>

          <div class="prose prose-lg max-w-none">
            <Show
              when={props.page.content}
              fallback={
                <p class="text-gray-500 italic">No content available.</p>
              }
            >
              <div innerHTML={props.page.content} />
            </Show>
          </div>
        </article>
      </div>
    </div>
  );
}

// 404 page component
function NotFoundPage() {
  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="text-9xl font-bold text-gray-300 mb-4">404</div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p class="text-xl text-gray-600 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span class="mr-2">🏠</span>
          Go Home
        </a>
      </div>
    </div>
  );
}
