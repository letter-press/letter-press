# API Reference

Letter-Press provides a comprehensive API for server functions, plugin hooks, database utilities, and frontend components.

## Server Functions

### Content Management

#### `createPost(data: CreatePostData): Promise<Result<Post, Error>>`

Creates a new post with validation and plugin hook execution. Accepts post data including title, content, excerpt, author ID, category IDs, tag IDs, and status. Returns a Result type containing either the created post or an error.

#### `updatePost(id: number, data: UpdatePostData): Promise<Result<Post, Error>>`

Updates an existing post with plugin hook integration. Takes a post ID and partial post data for updates. Executes beforePostUpdate and afterPostUpdate hooks.

#### `deletePost(id: number): Promise<Result<void, Error>>`

Soft deletes a post and executes cleanup hooks. Marks the post as deleted rather than removing it from the database. Triggers beforePostDelete and afterPostDelete hooks.

### User Management

#### `createUser(data: CreateUserData): Promise<Result<User, Error>>`

Creates a new user with role assignment and validation. Handles password hashing, email validation, and role assignment. Integrates with the authentication system.

#### `getUserPosts(userId: number, options?: QueryOptions): Promise<Result<Post[], Error>>`

Retrieves posts for a specific user with optimized queries. Supports pagination, filtering, and sorting options. Returns posts with optional relation data.

### Database Utilities

#### `tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>>`

Utility for type-safe error handling throughout the application. Wraps async operations and returns a Result type that contains either success data or error information. Essential for maintaining type safety across the application.

## Plugin Hooks API

### Content Lifecycle Hooks

#### `beforePostCreate(data: CreatePostData): Promise<CreatePostData>`

Executed before post creation. Allows plugins to modify or validate data before it's saved to the database. Can be used for auto-generating excerpts, validating custom fields, or enriching content.

#### `afterPostCreate(post: Post): Promise<void>`

Executed after successful post creation. Useful for notifications, search index updates, analytics tracking, or syncing with external services. Receives the complete post object with ID.

#### `beforePostUpdate(id: number, data: UpdatePostData): Promise<UpdatePostData>`

Executed before post updates. Allows modification of update data, adding audit trails, or validation. Receives both the post ID and the update data.

#### `afterPostUpdate(post: Post, previousData: Post): Promise<void>`

Executed after successful post update with access to both new and previous state. Enables status change handling, cache invalidation, or change tracking.

### Server Lifecycle Hooks

#### `onServerStart(): Promise<void>`

Executed when the server starts up. Used for initializing external services, setting up scheduled tasks, or validating plugin configuration.

#### `onServerStop(): Promise<void>`

Executed during graceful server shutdown. Handles cleanup of connections, saving state, or clearing timers and intervals.

### Registration Hooks

#### `registerPostTypes(): CustomPostType[]`

Register custom post types with the CMS. Define new content types with custom fields, validation rules, and capabilities. Each post type can have unique field schemas and permissions.

#### `registerMetaFields(): MetaField[]`

Register custom meta fields for posts. Add SEO fields, social media metadata, or custom properties. Fields support various types including string, number, boolean, and image.

#### `registerAdminPages(): AdminPage[]`

Register custom admin pages. Create plugin-specific administration interfaces, analytics dashboards, or configuration pages. Supports permission-based access control.

## Database API

### Query Functions

#### `getPosts(options: GetPostsOptions): Promise<Result<Post[], Error>>`

Optimized post retrieval with filtering and pagination. Supports search, category filtering, author filtering, status filtering, and custom ordering. Includes relation loading options.

#### `getPostAnalytics(postId: number, timeframe: string): Promise<Analytics>`

Retrieve analytics data for a specific post. Returns view counts, engagement metrics, and performance data for specified time periods.

### Aggregation Functions

#### `getContentStats(): Promise<ContentStats>`

Get aggregated content statistics including total posts, published posts, draft posts, total views, and other metrics useful for dashboard displays.

## Frontend Components API

### Content Components

#### `<PostEditor>`

Advanced post editing component with block editor support. Features autosave, preview functionality, and plugin-extensible blocks. Supports image uploads, code blocks, and embedded content.

#### `<MediaLibrary>`

Media management component for file uploads and selection. Handles multiple file types, size validation, and provides a searchable interface for existing media.

### Admin Components

#### `<AdminLayout>`

Standard admin layout with navigation and authentication. Provides consistent header, sidebar, and content area structure. Includes breadcrumb navigation and user menu.

#### `<DataTable>`

Reusable data table with sorting, filtering, and pagination. Supports custom column definitions, row actions, and bulk operations. Optimized for large datasets.

## Type Definitions

### Core Types

**Post**: Represents a content post with title, content, excerpt, status, author relationship, and timestamps.

**User**: Represents a system user with email, name, role, and timestamps.

**Plugin**: Interface defining plugin structure with config, hooks, and lifecycle methods.

**Result<T, E>**: Discriminated union type for type-safe error handling, containing either success data or error information.

### Plugin Types

**PluginConfig**: Configuration object containing plugin metadata, version, dependencies, and settings schema.

**PluginHooks**: Object defining available hook functions for content lifecycle, server lifecycle, and registrations.

**CustomPostType**: Definition for custom content types with fields, capabilities, and validation rules.

**MetaField**: Definition for custom metadata fields with type, validation, and display properties.

## Error Handling

### Error Types

**ValidationError**: Thrown when data validation fails, includes field information and specific error message.

**PermissionError**: Thrown when user lacks required permissions for an action.

**PluginError**: Thrown when plugin operations fail, includes plugin name and error context.

### Error Handling Patterns

The API uses the Result type pattern for consistent error handling. Functions return either success with data or failure with error information. This approach provides type safety and explicit error handling without exceptions.

Direct error handling is available for cases where immediate exception handling is preferred. The tryCatch utility can wrap any async operation to convert exceptions into Result types.

## Authentication & Security

### Session Management

Authentication is handled through Auth.js integration with support for multiple providers. Sessions are managed server-side with secure cookies and CSRF protection.

### Permission System

Role-based access control with hierarchical permissions. Users can have admin, editor, author, or subscriber roles with different capabilities for content management and system access.

### Plugin Security

Plugins run in isolated contexts with error boundary protection. Plugin failures don't affect core system functionality, and hooks have timeout protection to prevent blocking operations.

This API reference provides the core interfaces for extending and integrating with Letter-Press. For specific implementation examples, see the Plugin Development guide.