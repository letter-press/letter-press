import { Show, JSX } from "solid-js";
import { useTheme, type LayoutProps } from "~/lib/theme-manager";
import { Navigation } from "./navigation";
import { Footer } from "./footer";

export function DefaultLayout(props: LayoutProps) {
  const { currentTheme, getThemeConfig } = useTheme();
  
  // SEO meta tags
  const metaTitle = () => {
    const baseTitle = useTheme().siteConfig().title;
    return props.title ? `${props.title} | ${baseTitle}` : baseTitle;
  };

  const metaDescription = () => {
    return props.description || useTheme().siteConfig().description;
  };

  return (
    <div class="min-h-screen flex flex-col bg-gray-50">
      {/* SEO Head */}
      <Head title={metaTitle()} description={metaDescription()} />
      
      {/* Header */}
      <header>
        <Navigation />
      </header>

      {/* Main Content */}
      <main class="flex-1">
        {props.children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export function HomeLayout(props: LayoutProps) {
  return (
    <DefaultLayout {...props}>
      <div class="bg-gradient-to-br from-blue-50 to-indigo-100">
        {props.children}
      </div>
    </DefaultLayout>
  );
}

export function PageLayout(props: LayoutProps) {
  return (
    <DefaultLayout {...props}>
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-sm">
          {props.children}
        </div>
      </div>
    </DefaultLayout>
  );
}

export function PostLayout(props: LayoutProps) {
  return (
    <DefaultLayout {...props}>
      <article class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-sm">
          {props.children}
        </div>
      </article>
    </DefaultLayout>
  );
}

export function ArchiveLayout(props: LayoutProps) {
  return (
    <DefaultLayout {...props}>
      <div class="max-w-6xl mx-auto px-4 py-8">
        {props.children}
      </div>
    </DefaultLayout>
  );
}

// SEO Head component
function Head(props: { title: string; description: string }) {
  return (
    <>
      <title>{props.title}</title>
      <meta name="description" content={props.description} />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </>
  );
}