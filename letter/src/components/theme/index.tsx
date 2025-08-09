import { JSX } from "solid-js";
import { useTheme, type LayoutProps } from "~/lib/theme-manager";
import { DefaultLayout, HomeLayout, PageLayout, PostLayout, ArchiveLayout } from "./layouts";

// Layout component mapping
const layoutComponents = {
  DefaultLayout,
  HomeLayout,
  PageLayout, 
  PostLayout,
  ArchiveLayout,
} as const;

export interface ThemedLayoutProps extends LayoutProps {
  children: JSX.Element;
}

export function ThemedLayout(props: ThemedLayoutProps) {
  const { getThemeConfig } = useTheme();
  
  const themeConfig = getThemeConfig();
  const layoutType = props.layoutType || 'default';
  
  // Get layout component name from theme config
  const layoutName = themeConfig?.layouts?.[layoutType] || 'DefaultLayout';
  
  // Get the actual component
  const LayoutComponent = layoutComponents[layoutName as keyof typeof layoutComponents] || DefaultLayout;
  
  return (
    <LayoutComponent {...props}>
      {props.children}
    </LayoutComponent>
  );
}

// Export individual layouts for direct use
export * from "./layouts";
export * from "./navigation";
export * from "./footer";