import { Show, For, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useTheme, type NavItem } from "~/lib/theme-manager";
import { DarkModeToggle, DarkModeToggleSimple } from "./dark-mode-toggle";

export function Navigation() {
  const { siteConfig } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen());
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo */}
          <div class="flex-shrink-0 flex items-center">
            <A href="/" class="flex items-center space-x-2">
              <Show 
                when={siteConfig().logo}
                fallback={
                  <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                    L
                  </div>
                }
              >
                <img 
                  src={siteConfig().logo} 
                  alt={siteConfig().title}
                  class="w-8 h-8 object-contain"
                />
              </Show>
              <span class="text-xl font-bold text-gray-900">
                {siteConfig().title}
              </span>
            </A>
          </div>

          {/* Desktop Navigation */}
          <div class="hidden md:flex md:items-center md:space-x-4">
            <div class="flex items-baseline space-x-4">
              <For each={siteConfig().navigation}>
                {(item) => <NavItemDesktop item={item} />}
              </For>
            </div>
            
            {/* Dark Mode Toggle */}
            <div class="ml-4">
              <DarkModeToggle />
            </div>
          </div>

          {/* Mobile menu button and dark mode toggle */}
          <div class="md:hidden flex items-center space-x-2">
            <DarkModeToggleSimple />
            <button
              onClick={toggleMobileMenu}
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Toggle mobile menu"
            >
              <Show
                when={!isMobileMenuOpen()}
                fallback={
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Show>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <Show when={isMobileMenuOpen()}>
        <div class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <For each={siteConfig().navigation}>
              {(item) => <NavItemMobile item={item} onClick={closeMobileMenu} />}
            </For>
          </div>
        </div>
      </Show>
    </nav>
  );
}

function NavItemDesktop(props: { item: NavItem }) {
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);

  return (
    <div 
      class="relative"
      onMouseEnter={() => props.item.children && setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <Show
        when={props.item.children}
        fallback={
          <NavLink item={props.item} class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors" />
        }
      >
        <button class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
          {props.item.label}
          <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <Show when={isDropdownOpen()}>
          <div class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div class="py-1" role="menu">
              <For each={props.item.children}>
                {(child) => (
                  <NavLink 
                    item={child} 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  />
                )}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function NavItemMobile(props: { item: NavItem; onClick: () => void }) {
  const [isExpanded, setIsExpanded] = createSignal(false);

  return (
    <div>
      <Show
        when={props.item.children}
        fallback={
          <NavLink 
            item={props.item} 
            class="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            onClick={props.onClick}
          />
        }
      >
        <button
          onClick={() => setIsExpanded(!isExpanded())}
          class="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center justify-between"
        >
          {props.item.label}
          <svg 
            class={`h-4 w-4 transform transition-transform ${isExpanded() ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <Show when={isExpanded()}>
          <div class="pl-4">
            <For each={props.item.children}>
              {(child) => (
                <NavLink 
                  item={child} 
                  class="text-gray-600 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={props.onClick}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function NavLink(props: { 
  item: NavItem; 
  class?: string; 
  onClick?: () => void;
}) {
  const isExternal = props.item.external || props.item.href.startsWith('http');

  return (
    <Show
      when={isExternal}
      fallback={
        <A 
          href={props.item.href}
          class={props.class}
          onClick={props.onClick}
        >
          {props.item.label}
        </A>
      }
    >
      <a 
        href={props.item.href}
        class={props.class}
        target="_blank"
        rel="noopener noreferrer"
        onClick={props.onClick}
      >
        {props.item.label}
        <svg class="inline ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </Show>
  );
}