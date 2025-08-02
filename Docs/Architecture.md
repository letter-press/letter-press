# Architecture Overview

LetterPress CMS is built with a modern TypeScript stack emphasizing type safety, performance, and extensibility through a plugin system.

## Technology Stack

```mermaid
graph TB
    A[SolidStart Frontend] --> B[Server Functions]
    B --> C[Prisma ORM]
    C --> D[PostgreSQL Database]
    B --> E[Plugin System]
    E --> F[Plugin Manager]
    F --> G[Plugin Hooks]
    H[Auth.js] --> B
    I[Tailwind CSS] --> A
```

## Core Components

### Database Layer
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Primary database with advanced features
- **Optimized Queries**: Using `select` over `include`, `groupBy` aggregations

### Application Layer
- **SolidStart**: Full-stack framework with SSR
- **Server Functions**: Type-safe server-side operations
- **Error Handling**: Discriminated unions with `tryCatch` utility

### Plugin Architecture

```mermaid
graph LR
    A[Plugin Manager] --> B[Plugin Registry]
    B --> C[Hook System]
    C --> D[Content Hooks]
    C --> E[Lifecycle Hooks]
    C --> F[Admin Hooks]
    G[Plugin Instance] --> B
    H[Plugin Config] --> G
    I[Plugin Hooks] --> G
```

## File Structure

```
src/
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── try-catch.ts            # Error handling utility
│   ├── queries.ts              # Optimized database queries
│   ├── cms-utils.ts            # CMS utility functions
│   ├── plugin-types.ts         # Plugin type definitions
│   ├── plugin-manager.ts       # Plugin management logic
│   ├── plugin-system.ts        # Plugin initialization
│   └── index.ts                # Library exports
├── routes/
│   ├── admin/
│   │   ├── dashboard.tsx       # Admin dashboard
│   │   ├── layout.tsx          # Admin layout component
│   │   ├── plugins.tsx         # Plugin management UI
│   │   └── users.tsx           # User management UI
│   └── index.tsx               # Homepage
└── server/
    └── auth.ts                 # Authentication configuration
```

## Data Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as SolidStart
    participant P as Plugin System
    participant DB as Database
    
    C->>S: Request
    S->>P: Execute beforeRequest hooks
    S->>DB: Query data (optimized)
    DB-->>S: Return data
    S->>P: Execute afterRequest hooks
    P-->>S: Modified response
    S-->>C: Response
```

## Plugin Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Discovered: Plugin found in /plugins
    Discovered --> Loaded: Import main.ts
    Loaded --> Installed: Run install()
    Installed --> Activated: Run activate()
    Activated --> Running: Register hooks
    Running --> Deactivated: Run deactivate()
    Deactivated --> Activated: Re-enable
    Deactivated --> Uninstalled: Run uninstall()
    Uninstalled --> [*]
```

## Performance Optimizations

### Database Level
- `groupBy` aggregations instead of multiple queries
- `select` specific fields instead of full records
- Raw SQL for complex date operations
- Database-level filtering and sorting

### Application Level
- Type-safe error handling with discriminated unions
- Lazy loading with Suspense boundaries
- Plugin hook execution optimization
- Memory-efficient plugin management

## Security Model

```mermaid
graph TD
    A[Auth.js Authentication] --> B[Session Management]
    B --> C[Role-Based Access]
    C --> D[Admin Routes Protection]
    E[Plugin Sandbox] --> F[Hook Validation]
    F --> G[Error Isolation]
```

## Extension Points

### Plugin Hooks
- Content lifecycle: `beforePostCreate`, `afterPostCreate`
- Server lifecycle: `onServerStart`, `onServerStop`
- Custom registration: `registerPostTypes`, `registerMetaFields`

### Admin Interface
- Custom admin pages
- Plugin settings UI
- Dashboard widgets
- Navigation extensions
