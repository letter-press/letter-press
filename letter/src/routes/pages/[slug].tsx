import { useParams, createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getPostBySlug } from "../../lib";

// Server function to get page by slug
async function getPageBySlug(slug: string) {
  "use server";
  
  const result = await getPostBySlug(slug);
  
  // Only return published pages
  if (result.data && result.data.status === "PUBLISHED" && result.data.type === "PAGE") {
    return result.data;
  }
  
  return null;
}

export default function PageView() {
  const params = useParams();
  
  // Get page data
  const page = createAsync(() => getPageBySlug(params.slug), {
    deferStream: true,
  });

  return (
    <Show 
      when={page()} 
      fallback={<PageNotFound />}
    >
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 py-8">
          <article class="bg-white rounded-lg shadow-sm p-8">
            <header class="mb-8">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">
                {page()!.title}
              </h1>
              <Show when={page()!.excerpt}>
                <p class="text-xl text-gray-600 leading-relaxed">
                  {page()!.excerpt}
                </p>
              </Show>
              <div class="flex items-center text-sm text-gray-500 mt-6">
                <Show when={page()!.publishedAt}>
                  <time dateTime={page()!.publishedAt?.toISOString()}>
                    Published on {new Date(page()!.publishedAt!).toLocaleDateString()}
                  </time>
                </Show>
                <Show when={page()!.author}>
                  <span class="mx-2">•</span>
                  <span>By {page()!.author.name || page()!.author.username}</span>
                </Show>
              </div>
            </header>
            
            <div class="prose prose-lg max-w-none">
              <Show 
                when={page()!.content}
                fallback={<p class="text-gray-500 italic">No content available.</p>}
              >
                <div innerHTML={page()!.content || ""} />
              </Show>
            </div>
          </article>
        </div>
      </div>
    </Show>
  );
}

// Page not found component
function PageNotFound() {
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
