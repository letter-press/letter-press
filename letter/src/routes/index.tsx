import { signOut } from "@auth/solid-start/client";
import { createAsync, A } from "@solidjs/router";
import { Show, For } from "solid-js";
import { Auth } from "~/server/auth";
import { getPosts } from "../lib";

// Server function to get homepage data
async function getHomepageData() {
  "use server";
  
  const session = await Auth();
  
  // Get published pages for public display
  const pagesResult = await getPosts({ 
    type: "PAGE", 
    status: "PUBLISHED",
    limit: 6 
  });
  
  return {
    session,
    pages: pagesResult.data || [],
  };
}

export default function Home() {
  const data = createAsync(() => getHomepageData(), {
    deferStream: true,
  });

  const session = () => data()?.session;
  const pages = () => data()?.pages || [];

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to LetterPress
            </h1>
            <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              A powerful content management system built with modern web technologies.
            </p>
            
            <Show when={session()?.user}>
              <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div class="text-lg text-gray-700">
                  Hello, {session()!.user.name || session()!.user.username}!
                </div>
                <div class="flex gap-3">
                  <A
                    href="/admin"
                    class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <span class="mr-2">⚙️</span>
                    Admin Dashboard
                  </A>
                  <button 
                    onClick={() => signOut()}
                    class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span class="mr-2">👋</span>
                    Logout
                  </button>
                </div>
              </div>
            </Show>
            
            <Show when={!session()?.user}>
              <div class="mt-8">
                <A
                  href="/login"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <span class="mr-2">🔐</span>
                  Sign In
                </A>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Pages Section */}
      <Show when={pages().length > 0}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900">
              Explore Our Pages
            </h2>
            <p class="mt-3 text-lg text-gray-500">
              Discover content and information across our website.
            </p>
          </div>
          
          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <For each={pages()}>
              {(page: any) => (
                <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                  <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">
                      <A 
                        href={`/pages/${page.slug}`}
                        class="hover:text-blue-600 transition-colors"
                      >
                        {page.title}
                      </A>
                    </h3>
                    <Show when={page.excerpt}>
                      <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                        {page.excerpt}
                      </p>
                    </Show>
                    <div class="flex items-center justify-between text-xs text-gray-500">
                      <Show when={page.publishedAt}>
                        <time dateTime={page.publishedAt}>
                          {new Date(page.publishedAt).toLocaleDateString()}
                        </time>
                      </Show>
                      <A 
                        href={`/pages/${page.slug}`}
                        class="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Read more →
                      </A>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Footer */}
      <footer class="bg-white border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center text-gray-500">
            <p>&copy; 2025 LetterPress CMS. Built with SolidStart.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
