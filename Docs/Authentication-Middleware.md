# Authentication Middleware Setup

This document explains the improved authentication middleware setup for Letter-Press CMS, following SolidStart best practices.

## Architecture Overview

```mermaid
graph TD
    A[HTTP Request] --> B[Middleware]
    B --> C[Get Session from Auth Provider]
    B --> D[Store Session in event.locals]
    B --> E[Add Security Headers]
    B --> F[Route Handler]
    F --> G[Use requireAuth() for Protected Routes]
    G --> H[Access Session from Middleware Locals]
    H --> I[Response]
```

## Components

### 1. Middleware (`src/middleware/index.ts`)

The middleware runs on every HTTP request and:

- **Sets up authentication context**: Retrieves the session once and stores it in `event.locals`
- **Adds security headers**: CSP, X-Frame-Options, etc.
- **Performance monitoring**: Tracks request timing
- **Static asset optimization**: Adds cache headers

**Important**: Per SolidStart documentation, middleware is NOT used for authorization. It only sets up context.

### 2. Auth Utilities (`src/lib/auth-utils.ts`)

Server-side utilities for route protection:

- `requireAuth()`: Ensures user is authenticated, redirects if not
- `requireAdmin()`: Ensures user has admin role
- `getSessionOptional()`: Gets session without throwing errors

### 3. Enhanced Auth Service (`src/server/auth.ts`)

Updated to leverage middleware locals for better performance:

- `Auth()`: First checks middleware locals, falls back to direct session retrieval
- `getUser()`: Quick access to user from middleware locals

## Usage Examples

### Protected Route (Basic)

```tsx
import { requireAuth } from "~/lib";

export default function ProtectedPage() {
  const session = createAsync(() => requireAuth(), {
    deferStream: true,
  });

  return (
    <div>
      <h1>Welcome {session()?.user.name}</h1>
      {/* No manual auth checks needed */}
    </div>
  );
}
```

### Admin-Only Route

```tsx
import { requireAdmin } from "~/lib";

export default function AdminPage() {
  const session = createAsync(() => requireAdmin(), {
    deferStream: true,
  });

  return (
    <AdminLayout user={session()!.user}>
      {/* Admin content */}
    </AdminLayout>
  );
}
```

### Optional Authentication

```tsx
import { getSessionOptional } from "~/lib";

export default function PublicPage() {
  const session = createAsync(() => getSessionOptional(), {
    deferStream: true,
  });

  return (
    <div>
      <Show 
        when={session()?.user} 
        fallback={<LoginButton />}
      >
        <h1>Welcome back, {session()!.user.name}</h1>
      </Show>
    </div>
  );
}
```

## Benefits

### Performance Improvements

1. **Single Session Retrieval**: Session is fetched once in middleware, not per route
2. **Fast User Access**: `getUser()` provides immediate access without async calls
3. **Reduced Database Queries**: Session data cached in request context

### Security Enhancements

1. **Automatic Security Headers**: CSP, X-Frame-Options, XSS protection
2. **Proper Authorization**: Route-level checks as recommended by SolidStart
3. **Consistent Error Handling**: Centralized redirect logic

### Developer Experience

1. **Simplified Route Code**: No manual auth checks in components
2. **Type Safety**: Full TypeScript support for session data
3. **Automatic Redirects**: `requireAuth()` handles unauthenticated users
4. **Performance Monitoring**: Built-in request timing

## Configuration

### App Config (`app.config.ts`)

```typescript
export default defineConfig({
  middleware: "src/middleware/index.ts", // Register middleware
  // ... other config
});
```

### Environment Variables

The same auth environment variables are used:

- `AUTH_SECRET`: Session signing secret
- `GOOGLE_ID`: Google OAuth client ID  
- `GOOGLE_SECRET`: Google OAuth client secret

## Migration Guide

### Before (Old Pattern)

```tsx
export default function AdminPage() {
  const session = createAsync(() => Auth(), { deferStream: true });

  if (!session()?.user) {
    return <div>Please log in</div>;
  }

  return <AdminLayout user={session()!.user}>...</AdminLayout>;
}
```

### After (New Pattern)

```tsx
export default function AdminPage() {
  const session = createAsync(() => requireAuth(), { deferStream: true });

  return <AdminLayout user={session()!.user}>...</AdminLayout>;
}
```

## Best Practices

1. **Use `requireAuth()` for protected routes**: Automatic redirects and cleaner code
2. **Use `requireAdmin()` for admin routes**: Built-in role checking
3. **Leverage `deferStream: true`**: Ensures SSR waits for auth resolution
4. **Access user via `session()!.user`**: Safe after `requireAuth()` call
5. **Use `getSessionOptional()` for public pages**: When auth is optional

## Troubleshooting

### Common Issues

1. **"Cannot access session"**: Ensure middleware is registered in `app.config.ts`
2. **Infinite redirects**: Check redirect URLs in auth utilities
3. **Type errors**: Import auth utilities from `~/lib` package

### Performance Tips

1. Use `getUser()` for immediate user access (non-async)
2. Prefer `requireAuth()` over manual auth checks
3. Enable request timing logs to monitor performance

## Security Considerations

- Session data is request-scoped and automatically cleared
- Authorization is performed per-route, not in middleware
- Security headers are applied to all responses
- CSP policy can be customized in middleware configuration
