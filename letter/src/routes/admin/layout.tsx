import { JSX, Show, createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { Session } from "@auth/solid-start";

interface AdminLayoutProps {
  children: JSX.Element;
  user: Session["user"];
}

export default function AdminLayout(props: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: "📊", current: false },
    { name: "Posts", href: "/admin/posts", icon: "📝", current: false },
    { name: "Pages", href: "/admin/pages", icon: "📄", current: false },
    { name: "Comments", href: "/admin/comments", icon: "💬", current: false },
    { name: "Media", href: "/admin/media", icon: "🖼️", current: false },
    { name: "Users", href: "/admin/users", icon: "👥", current: false },
    { name: "Plugins", href: "/admin/plugins", icon: "🔌", current: false },
    { name: "Settings", href: "/admin/settings", icon: "⚙️", current: false },
  ];

  // Update current navigation item based on location
  const getCurrentNavigation = () => {
    return navigation.map((item) => ({
      ...item,
      current: location.pathname.startsWith(item.href),
    }));
  };

  return (
    <div class="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      <Show when={sidebarOpen()}>
        <div class="fixed inset-0 flex z-40 md:hidden">
          <div
            class="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div class="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span class="text-white">✕</span>
              </button>
            </div>
            <SidebarContent
              navigation={getCurrentNavigation()}
              user={props.user}
            />
          </div>
        </div>
      </Show>

      {/* Desktop sidebar */}
      <div class="hidden md:flex md:flex-shrink-0">
        <div class="flex flex-col w-64">
          <SidebarContent
            navigation={getCurrentNavigation()}
            user={props.user}
          />
        </div>
      </div>

      {/* Main content */}
      <div class="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div class="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            class="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span class="text-xl">☰</span>
          </button>

          <div class="flex-1 px-4 flex justify-between items-center">
            <div class="flex-1 flex">
              <div class="w-full flex md:ml-0">
                <div class="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                    <span>🔍</span>
                  </div>
                  <input
                    class="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                    placeholder="Search posts, pages, users..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            <div class="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <button class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <span class="text-xl">🔔</span>
              </button>

              {/* View site link */}
              <A
                href="/"
                target="_blank"
                class="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>🌐</span>
                <span>View Site</span>
              </A>

              {/* Profile dropdown */}
              <div class="relative">
                <Show when={props.user}>
                  {(currentUser) => (
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <Show
                          when={currentUser().image}
                          fallback={
                            <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span class="text-white text-sm font-medium">
                                {currentUser().name?.charAt(0) || "A"}
                              </span>
                            </div>
                          }
                        >
                          <img
                            class="h-8 w-8 rounded-full"
                            src={currentUser()!.image!}
                            alt=""
                          />
                        </Show>
                      </div>
                      <div class="hidden md:block">
                        <div class="text-sm font-medium text-gray-700">
                          {currentUser().name}
                        </div>
                        <div class="text-xs text-gray-500">
                          {currentUser().role}
                        </div>
                      </div>
                    </div>
                  )}
                </Show>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main class="flex-1 relative overflow-y-auto focus:outline-none">
          {props.children}
        </main>
      </div>
    </div>
  );
}

// Sidebar content component
function SidebarContent(props: { navigation: any[]; user: any }) {
  return (
    <div class="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div class="flex items-center flex-shrink-0 px-4 mb-8">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-2xl">📰</span>
            </div>
            <div class="ml-3">
              <h1 class="text-xl font-bold text-gray-900">LetterPress</h1>
              <p class="text-xs text-gray-500">Content Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav class="mt-5 flex-1 px-2 space-y-1">
          {props.navigation.map((item) => (
            <a
              href={item.href}
              class={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span class="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </div>

      {/* User info at bottom */}
      <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
        <Show when={props.user}>
          {(user) => (
            <div class="flex-shrink-0 w-full group block">
              <div class="flex items-center">
                <div>
                  <Show
                    when={user().image}
                    fallback={
                      <div class="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span class="text-white text-sm font-medium">
                          {user().name?.charAt(0) || "A"}
                        </span>
                      </div>
                    }
                  >
                    <img
                      class="h-9 w-9 rounded-full"
                      src={user().image}
                      alt=""
                    />
                  </Show>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user().name}
                  </p>
                  <p class="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    {user().email}
                  </p>
                </div>
                <div class="ml-auto">
                  <button class="text-gray-400 hover:text-gray-600">
                    <span class="text-sm">⚙️</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
