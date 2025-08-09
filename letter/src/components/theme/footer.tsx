import { Show, For, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { useTheme } from "~/lib/theme-manager";

export function Footer() {
  const { siteConfig, isHydrated } = useTheme();
  
  // Use createMemo to ensure consistent values during hydration
  const footerData = createMemo(() => {
    if (!isHydrated()) {
      // Return safe defaults during SSR/hydration
      return {
        currentYear: 2025,
        hasLogo: false,
        hasFooterLinks: false,
        hasSocial: false,
        title: "Letter-Press CMS",
        copyright: "© 2025 Letter-Press CMS. Built with SolidStart."
      };
    }
    
    // Return actual data after hydration
    const config = siteConfig();
    return {
      currentYear: new Date().getFullYear(),
      hasLogo: !!config.logo,
      hasFooterLinks: !!(config.footer?.links && config.footer.links.length > 0),
      hasSocial: !!(config.footer?.social && config.footer.social.length > 0),
      title: config.title,
      copyright: config.footer?.copyright || "© 2025 Letter-Press CMS. Built with SolidStart."
    };
  });

  return (
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Site Info */}
          <div class="col-span-1 md:col-span-1">
            <div class="flex items-center space-x-2 mb-4">
              <Show 
                when={footerData().hasLogo}
                fallback={
                  <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                    L
                  </div>
                }
              >
                <Show when={isHydrated()}>
                  <img 
                    src={siteConfig().logo} 
                    alt={siteConfig().title}
                    class="w-8 h-8 object-contain"
                  />
                </Show>
              </Show>
              <h3 class="text-lg font-bold text-gray-900">
                {footerData().title}
              </h3>
            </div>
            
            <Show when={isHydrated()}>
              <p class="text-gray-600 text-sm leading-relaxed">
                {siteConfig().description}
              </p>
            </Show>

            <Show when={footerData().hasSocial && isHydrated()}>
              <div class="mt-4">
                <div class="flex space-x-4">
                  <For each={siteConfig().footer?.social || []}>
                    {(social) => (
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label={social.platform}
                      >
                        <span class="text-xl">{social.icon}</span>
                      </a>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>

          {/* Quick Links */}
          <div class="col-span-1 md:col-span-1">
            <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <Show when={isHydrated()} fallback={
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-14"></div>
              </div>
            }>
              <ul class="space-y-2">
                <For each={siteConfig().navigation.slice(0, 4)}>
                  {(link) => (
                    <li>
                      <A
                        href={link.href}
                        class="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>

          {/* Footer Links */}
          <div class="col-span-1 md:col-span-1">
            <Show when={footerData().hasFooterLinks && isHydrated()}>
              <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul class="space-y-2">
                <For each={siteConfig().footer.links}>
                  {(link) => (
                    <li>
                      <A
                        href={link.href}
                        class="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>
        </div>

        {/* Copyright */}
        <div class="border-t border-gray-200 pt-6">
          <p class="text-center text-gray-600 text-sm">
            {footerData().copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink(props: { item: { label: string; href: string; external?: boolean } }) {
  const isExternal = props.item.external || props.item.href.startsWith('http');

  return (
    <Show
      when={isExternal}
      fallback={
        <A 
          href={props.item.href}
          class="text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          {props.item.label}
        </A>
      }
    >
      <a 
        href={props.item.href}
        class="text-sm text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center"
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.item.label}
        <svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </Show>
  );
}