import { JSX, Show, createSignal, For } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { Session } from "@auth/solid-start";
import { NotificationProvider } from "~/components/ui/notification";

/**
 * Props for the AdminLayout component.
 */
interface AdminLayoutProps {
  children: JSX.Element;
  user: Session["user"];
}

/**
 * Type for navigation items in the sidebar.
 */
type NavigationItem = {
  name: string;
  href: string;
  icon: string;
};

/**
 * Sidebar content component for the admin layout.
 * @param props.navigation - Array of navigation items.
 * @param props.user - The current user session.
 */
function SidebarContent(props: { navigation: NavigationItem[]; user: Session["user"] }) {
  const location = useLocation();

  return (
    <div class="flex-1 flex flex-col min-h-0 border-r-2 border-gray-300 admin-surface-blue shadow-lg">
      {/* Logo */}
      <div class="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
        <div class="flex items-center flex-shrink-0 px-4 mb-6">
          <A href="/admin" class="flex items-center p-4 rounded-xl admin-surface-accent border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md w-full group">
            <div class="flex-shrink-0">
              <span class="text-2xl group-hover:scale-110 transition-transform">📰</span>
            </div>
            <div class="ml-3">
              <h1 class="text-xl font-bold text-blue-900 group-hover:text-blue-800">Letter-Press</h1>
              <p class="text-xs text-blue-600 font-medium group-hover:text-blue-700">Content Management</p>
            </div>
          </A>
        </div>

        {/* Navigation */}
        <nav class="flex-1 px-3 space-y-2">
          <For each={props.navigation}>{(item) => {
            // Fix navigation highlighting - exact match for dashboard, startsWith for others
            const isCurrent = () => {
              if (item.href === "/admin") {
                return location.pathname === "/admin";
              }
              return location.pathname.startsWith(item.href);
            };
            return (
              <A
                href={item.href}
                class={`${isCurrent()
                  ? "admin-surface-warm text-blue-900 border-blue-300 shadow-md bg-gradient-to-r from-blue-100 to-blue-50"
                  : "text-blue-700 hover:admin-surface-cool hover:text-blue-900 border-transparent hover:border-blue-200 hover:shadow-sm"
                } group flex items-center px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-200 ease-in-out hover:transform hover:scale-[1.02]`}
                aria-current={isCurrent() ? "page" : undefined}
              >
                <span class="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </A>
            );
          }}</For>
        </nav>

        {/* User info */}
        <div class="flex-shrink-0 flex border-t-2 border-blue-200 p-4 admin-surface-accent">
          <div class="flex items-center w-full group p-3 rounded-lg border-2 border-transparent hover:border-blue-200 transition-all duration-200 hover:admin-surface-cool">
            <div>
              <img
                class="inline-block h-10 w-10 rounded-full border-2 border-blue-200 group-hover:border-blue-300 transition-all"
                src={props.user?.image || "/default-avatar.png"}
                alt={props.user?.name || "User avatar"}
                loading="lazy"
                referrerpolicy="no-referrer"
              />
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-blue-800 group-hover:text-blue-900">
                {props.user?.name || props.user?.email}
              </p>
              <p class="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                Administrator
              </p>
            </div>
            <div class="ml-auto">
              <button class="text-blue-400 hover:text-blue-600 p-2 rounded-lg border-2 border-transparent hover:border-blue-200 transition-all duration-200" type="button" aria-label="Settings">
                <span class="text-sm">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin layout component for the admin dashboard pages.
 * @param props.children - The main content to render.
 * @param props.user - The current user session.
 */
export default function AdminLayout(props: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Posts", href: "/admin/posts", icon: "📝" },
    { name: "Pages", href: "/admin/pages", icon: "📄" },
    { name: "Comments", href: "/admin/comments", icon: "💬" },
    { name: "Media", href: "/admin/media", icon: "🖼️" },
    { name: "Custom Fields", href: "/admin/custom-fields", icon: "🏷️" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Themes", href: "/admin/themes", icon: "🎨" },
    { name: "Theme Builder", href: "/admin/theme-builder", icon: "🎨✨" },
    { name: "Plugins", href: "/admin/plugins", icon: "🔌" },
    { name: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <NotificationProvider>
      <div class="h-screen flex overflow-hidden admin-surface-cool bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Mobile sidebar overlay */}
        <Show when={sidebarOpen()}>
          <div class="fixed inset-0 flex z-40 md:hidden">
            <div
              class="fixed inset-0 bg-blue-900 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div class="relative flex-1 flex flex-col max-w-xs w-full admin-surface-blue border-r-2 border-blue-300 shadow-2xl">
              <div class="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  class="ml-1 flex items-center justify-center h-10 w-10 rounded-full border-2 border-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white admin-surface-accent hover:transform hover:scale-105 transition-all duration-200 shadow-lg"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <span class="text-blue-900 font-bold">✕</span>
                </button>
              </div>
              <SidebarContent
                navigation={navigation}
                user={props.user}
              />
            </div>
          </div>
        </Show>

        {/* Static sidebar for desktop */}
        <div class="hidden md:flex md:flex-shrink-0">
          <div class="flex flex-col w-64 shadow-xl">
            <SidebarContent
              navigation={navigation}
              user={props.user}
            />
          </div>
        </div>

        {/* Main content area */}
        <div class="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Desktop header - visible on md and larger screens */}
          <div class="hidden md:flex relative z-10 flex-shrink-0 h-16 admin-surface-warm shadow-lg border-b-2 border-blue-200">
            <div class="flex-1 px-4 flex justify-between items-center">
              <div class="flex-1 flex">
                <div class="w-full flex md:ml-0">
                  <label for="search-field-desktop" class="sr-only">
                    Search
                  </label>
                  <div class="relative w-full max-w-lg text-blue-400 focus-within:text-blue-600">
                    <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                      <span class="text-blue-400">🔍</span>
                    </div>
                    <input
                      id="search-field-desktop"
                      class="block w-full h-10 pl-10 pr-3 py-2 border-2 border-blue-200 rounded-lg text-blue-900 placeholder-blue-500 focus:outline-none focus:placeholder-blue-400 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 sm:text-sm admin-surface-blue transition-all duration-200"
                      placeholder="Search content..."
                      type="search"
                      name="search"
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>
              
              {/* Desktop user menu */}
              <div class="ml-4 flex items-center space-x-4">
                <div class="flex items-center space-x-3">
                  <button
                    type="button"
                    class="text-blue-600 hover:text-blue-800 p-2 rounded-lg border-2 border-transparent hover:border-blue-200 transition-all duration-200"
                    title="Notifications"
                  >
                    <span class="text-lg">🔔</span>
                  </button>
                  <button
                    type="button"
                    class="text-blue-600 hover:text-blue-800 p-2 rounded-lg border-2 border-transparent hover:border-blue-200 transition-all duration-200"
                    title="Quick Settings"
                  >
                    <span class="text-lg">⚙️</span>
                  </button>
                </div>
                
                {/* User profile section */}
                <div class="flex items-center space-x-3 p-2 rounded-lg border-2 border-transparent hover:border-blue-200 transition-all duration-200">
                  <img
                    class="h-8 w-8 rounded-full border-2 border-blue-200"
                    src={props.user?.image || "/default-avatar.png"}
                    alt={props.user?.name || "User avatar"}
                    loading="lazy"
                    referrerpolicy="no-referrer"
                  />
                  <div class="hidden lg:block">
                    <p class="text-sm font-medium text-blue-800">
                      {props.user?.name || props.user?.email}
                    </p>
                    <p class="text-xs text-blue-600">Administrator</p>
                  </div>
                  <button
                    type="button"
                    class="text-blue-600 hover:text-blue-800 text-sm"
                    title="User menu"
                  >
                    <span>▾</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile header */}
          <div class="relative z-10 flex-shrink-0 flex h-16 admin-surface-warm shadow-lg border-b-2 border-blue-200 md:hidden">
            <button
              type="button"
              class="px-4 border-r-2 border-blue-200 text-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden hover:admin-surface-accent transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <span class="text-lg">☰</span>
            </button>
            <div class="flex-1 px-4 flex justify-between">
              <div class="flex-1 flex">
                <div class="w-full flex md:ml-0">
                  <label for="search-field" class="sr-only">
                    Search
                  </label>
                  <div class="relative w-full text-blue-400 focus-within:text-blue-600">
                    <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                      <span class="text-blue-400">🔍</span>
                    </div>
                    <input
                      id="search-field"
                      class="block w-full h-full pl-10 pr-3 py-2 border-2 border-blue-200 rounded-lg text-blue-900 placeholder-blue-500 focus:outline-none focus:placeholder-blue-400 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 sm:text-sm admin-surface-blue transition-all duration-200"
                      placeholder="Search"
                      type="search"
                      name="search"
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main class="flex-1 relative overflow-y-auto focus:outline-none admin-page">
            {props.children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
