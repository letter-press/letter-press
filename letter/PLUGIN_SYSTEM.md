# LetterPress CMS Plugin System

A powerful and flexible plugin system for extending your CMS functionality.

## Overview

The plugin system allows you to:
- Hook into content lifecycle events (create, update, delete)
- Register custom post types and meta fields
- Add shortcodes and widgets
- Extend the admin interface
- Integrate with external services

## Quick Start

### 1. Plugin Structure

Create a plugin directory in `/plugins/your-plugin-name/`:

```
plugins/
  your-plugin-name/
    main.ts         # Main plugin file (required)
    package.json    # Optional package info
    README.md       # Optional documentation
```

### 2. Basic Plugin

Create `plugins/your-plugin-name/main.ts`:

```typescript
import type { Plugin } from '../../src/lib/plugin-types';

const yourPlugin: Plugin = {
    config: {
        name: 'your-plugin-name',
        version: '1.0.0',
        description: 'Your plugin description',
        author: 'Your Name'
    },

    hooks: {
        async onServerStart() {
            console.log('Your plugin is starting!');
        },

        async beforePostCreate(data: any) {
            // Modify post data before creation
            console.log('Creating post:', data.title);
            return data;
        },

        async afterPostCreate(post: any) {
            // Do something after post creation
            console.log('Post created:', post.title);
        }
    }
};

export default yourPlugin;
```

### 3. Server Integration

The plugin system is automatically initialized when the server starts. You can also manually initialize it:

```typescript
import { initializePlugins } from './lib/plugin-system';

// Initialize plugins from custom directory
await initializePlugins('my-plugins-dir');
```

## Plugin Configuration

### Required Fields

```typescript
config: {
    name: string;        // Unique plugin identifier
    version: string;     // Plugin version (semver)
    description?: string; // Human-readable description
    author?: string;     // Plugin author
}
```

### Optional Fields

```typescript
config: {
    // Dependencies
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    
    // Requirements
    minCmsVersion?: string;
    maxCmsVersion?: string;
    requiresDatabase?: boolean;
    requiresAuth?: boolean;
    
    // Settings schema
    settings?: {
        [key: string]: {
            type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
            label: string;
            description?: string;
            default?: any;
            required?: boolean;
            options?: Array<{ label: string; value: any }>;
        }
    }
}
```

## Available Hooks

### Server Lifecycle
- `onServerStart()` - Called when server starts
- `onServerStop()` - Called when server stops

### Content Hooks
- `beforePostCreate(data)` - Before post creation
- `afterPostCreate(post)` - After post creation
- `beforePostUpdate(id, data)` - Before post update
- `afterPostUpdate(post)` - After post update
- `beforePostDelete(id)` - Before post deletion
- `afterPostDelete(id)` - After post deletion

### Auth Hooks
- `beforeLogin(credentials)` - Before user login
- `afterLogin(user)` - After user login
- `beforeLogout(user)` - Before user logout
- `afterLogout(user)` - After user logout

### Registration Hooks
- `registerPostTypes()` - Register custom post types
- `registerMetaFields()` - Register meta fields
- `registerAdminPages()` - Register admin pages
- `registerShortcodes()` - Register shortcodes
- `registerWidgets()` - Register widgets
- `registerBlocks()` - Register editor blocks

## Plugin Features

### Custom Post Types

```typescript
hooks: {
    registerPostTypes() {
        return ['event', 'portfolio', 'testimonial'];
    }
}
```

### Meta Fields

```typescript
hooks: {
    registerMetaFields() {
        return [
            {
                key: 'event_date',
                label: 'Event Date',
                type: 'text',
                description: 'The date of the event',
                required: false
            }
        ];
    }
}
```

### Shortcodes

```typescript
hooks: {
    registerShortcodes() {
        return [
            {
                name: 'hello',
                handler: (attributes) => {
                    const name = attributes.name || 'World';
                    return \`<p>Hello, \${name}!</p>\`;
                },
                attributes: {
                    name: {
                        type: 'string',
                        required: false,
                        default: 'World'
                    }
                }
            }
        ];
    }
}
```

### Settings Management

```typescript
const plugin: Plugin = {
    config: {
        settings: {
            apiKey: {
                type: 'string',
                label: 'API Key',
                description: 'Your service API key',
                required: true
            },
            enableFeature: {
                type: 'boolean',
                label: 'Enable Feature',
                default: false
            }
        }
    },

    getSettings() {
        return {
            apiKey: process.env.PLUGIN_API_KEY,
            enableFeature: true
        };
    },

    async updateSettings(settings) {
        // Save settings to database or file
        console.log('Settings updated:', settings);
    }
};
```

## Plugin Lifecycle

### Installation
```typescript
async install() {
    // Run database migrations
    // Create necessary files/directories
    // Initialize default settings
}
```

### Activation
```typescript
async activate() {
    // Enable plugin functionality
    // Register hooks and handlers
    // Start background processes
}
```

### Deactivation
```typescript
async deactivate() {
    // Disable plugin functionality
    // Clean up resources
    // Stop background processes
}
```

### Uninstallation
```typescript
async uninstall() {
    // Remove database tables/data
    // Delete files/directories
    // Clean up all traces
}
```

## Plugin Context

Plugins have access to a context object with utilities:

```typescript
hooks: {
    async afterPostCreate(post) {
        // Access database
        const { db } = this.context;
        
        // Use logger
        this.context.logger.info('Post created', { postId: post.id });
        
        // Use utilities
        const isValidSlug = this.context.utils.validateSlug(post.slug);
        
        // Use hook system
        await this.context.hooks.doAction('custom_action', post);
    }
}
```

## Error Handling

The plugin system includes comprehensive error handling:

```typescript
import { getPluginManager } from './lib/plugin-system';

// Get plugin errors
const manager = getPluginManager();
const errors = manager.getErrors('your-plugin-name');

// Log plugin error
manager.logError('your-plugin-name', new Error('Something went wrong'), 'context');
```

## Examples

See the included example plugins:
- `/plugins/example-plugin/` - Basic plugin demonstrating all features
- `/plugins/seo-plugin/` - SEO enhancements with meta fields

## Using Plugin-Enhanced Functions

To use functions with plugin hooks, import the enhanced versions:

```typescript
import { 
    createPostWithHooks,
    updatePostWithHooks,
    deletePostWithHooks 
} from './lib';

// This will trigger beforePostCreate and afterPostCreate hooks
const result = await createPostWithHooks({
    title: 'My Post',
    content: 'Post content',
    slug: 'my-post',
    authorId: 1
});
```

## Best Practices

1. **Naming**: Use descriptive, unique plugin names
2. **Error Handling**: Always wrap plugin code in try-catch blocks
3. **Performance**: Avoid blocking operations in hooks
4. **Dependencies**: Clearly specify plugin dependencies
5. **Documentation**: Include README.md with your plugin
6. **Testing**: Test plugin installation/uninstallation
7. **Cleanup**: Always clean up resources in deactivate/uninstall
8. **Security**: Validate all user inputs and API calls

## Advanced Features

### Custom Admin Pages

```typescript
hooks: {
    registerAdminPages() {
        return [
            {
                path: '/admin/my-plugin',
                title: 'My Plugin Settings',
                component: () => <PluginSettingsPage />,
                permission: 'admin'
            }
        ];
    }
}
```

### Background Tasks

```typescript
let intervalId: NodeJS.Timeout;

const plugin: Plugin = {
    async activate() {
        // Start background task
        intervalId = setInterval(async () => {
            await doBackgroundWork();
        }, 60000); // Every minute
    },

    async deactivate() {
        // Stop background task
        if (intervalId) {
            clearInterval(intervalId);
        }
    }
};
```

### Database Integration

```typescript
hooks: {
    async afterPostCreate(post) {
        // Use the database context
        const { db } = this.context;
        
        // Create related data
        await db.postMeta.create({
            data: {
                postId: post.id,
                metaKey: 'plugin_data',
                metaValue: JSON.stringify({ processed: true }),
                metaType: 'JSON'
            }
        });
    }
}
```

## Troubleshooting

### Plugin Not Loading
- Check file path: `/plugins/plugin-name/main.ts`
- Verify export: `export default plugin`
- Check console for errors during startup

### Hooks Not Firing
- Ensure plugin is activated
- Check hook names for typos
- Verify plugin has no errors

### TypeScript Errors
- Import types: `import type { Plugin } from '../../src/lib/plugin-types'`
- Check function signatures match expected hooks
- Ensure proper async/await usage
