import type { MiddlewareFn } from "@solidjs/start/middleware";

export default (async (event: any) => {
  // Add security headers for all requests
  event.nativeEvent.responseHeaders = {
    ...event.nativeEvent.responseHeaders,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  // Add cache headers for static assets
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/_build/") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".gif") ||
    url.pathname.endsWith(".svg")
  ) {
    event.nativeEvent.responseHeaders = {
      ...event.nativeEvent.responseHeaders,
      "Cache-Control": "public, max-age=31536000, immutable",
    };
  }
}) satisfies MiddlewareFn;