import { Show, createSignal, onMount, type ParentComponent } from "solid-js";

/**
 * ClientOnly component to prevent hydration mismatches
 * 
 * This component ensures that children are only rendered on the client side,
 * preventing server/client HTML differences that cause hydration errors.
 * 
 * Use this wrapper for:
 * - Components that rely on browser APIs (window, document, etc.)
 * - Dynamic content that differs between server and client
 * - Third-party components that don't support SSR
 */

interface ClientOnlyProps {
  /** Content to show while loading (defaults to nothing) */
  fallback?: any;
  /** Additional CSS classes for the wrapper */
  class?: string;
}

export const ClientOnly: ParentComponent<ClientOnlyProps> = (props) => {
  const [isMounted, setIsMounted] = createSignal(false);

  onMount(() => {
    setIsMounted(true);
  });

  return (
    <Show when={isMounted()} fallback={props.fallback}>
      <div class={props.class}>
        {props.children}
      </div>
    </Show>
  );
};

/**
 * Hook to detect if component is running on client side
 */
export function useIsClient() {
  const [isClient, setIsClient] = createSignal(false);
  
  onMount(() => {
    setIsClient(true);
  });
  
  return isClient;
}

/**
 * NoSSR component - shorter alias for ClientOnly
 */
export const NoSSR = ClientOnly;