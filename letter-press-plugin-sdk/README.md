# Letter-Press Plugin SDK

A comprehensive TypeScript SDK for developing plugins for Letter-Press CMS. This package provides type safety, utilities, and a fluent API to make plugin development fast and easy.

## Installation

```bash
npm install @letterpress/plugin-sdk
# or
pnpm add @letterpress/plugin-sdk
# or  
yarn add @letterpress/plugin-sdk
```

## Quick Start

### Simple Plugin (Object API)

```typescript
import { definePlugin } from '@letterpress/plugin-sdk';

export default definePlugin({
  name: 'my-awesome-plugin',
  version: '1.0.0',
  description: 'An awesome plugin for Letter-Press',
  author: 'Your Name',
  
  hooks: {
    onServerStart: async () => {
      console.log('🚀 My plugin is starting!');
    },
    
    afterPostCreate: async (post) => {
      console.log(`📝 New post created: ${post.title}`);
    }
  },
  
  activate: async () => {
    console.log('Plugin activated!');
  },
  
  deactivate: async () => {
    console.log('Plugin deactivated!');
  }
});
```

### Advanced Plugin (Fluent API)

```typescript
import { createPlugin } from '@letterpress/plugin-sdk';

export default createPlugin()
  .configure({
    name: 'advanced-plugin',
    version: '2.0.0',
    description: 'An advanced plugin with lots of features',
    author: 'Plugin Developer',
    requiresDatabase: true
  })
  .addSettings({
    apiKey: {
      type: 'string',
      label: 'API Key',
      required: true,
      description: 'Your service API key'
    },
    enableFeature: {
      type: 'boolean',
      label: 'Enable Advanced Feature',
      default: false
    }
  })
  .onActivate(async () => {
    console.log('Advanced plugin activated');
  })
  .beforePostCreate(async (data) => {
    // Modify post data before creation
    data.processedBy = 'advanced-plugin';
    return data;
  })
  .afterPostCreate(async (post) => {
    // Send to external service
    await sendToAnalytics(post);
  })
  .addMetaField({
    key: 'featured_image',
    label: 'Featured Image',
    type: 'url',
    description: 'URL of the featured image'
  })
  .addShortcode({
    name: 'gallery',
    handler: (attributes) => {
      return `<div class="gallery" data-images="${attributes.images}"></div>`;
    },
    attributes: {
      images: {
        type: 'string',
        required: true,
        description: 'Comma-separated list of image URLs'
      }
    }
  })
  .build();
```

## Available Hooks

### Server Lifecycle
- `onServerStart()` - Called when server starts
- `onServerStop()` - Called when server stops
- `onDatabaseConnect()` - Called when database connects

### Content Lifecycle
- `beforePostCreate(data)` - Before creating a post
- `afterPostCreate(post)` - After creating a post
- `beforePostUpdate(id, data)` - Before updating a post
- `afterPostUpdate(post)` - After updating a post
- `beforePostDelete(id)` - Before deleting a post
- `afterPostDelete(id)` - After deleting a post

### Authentication
- `beforeLogin(credentials)` - Before user login
- `afterLogin(user)` - After user login
- `beforeLogout(user)` - Before user logout
- `afterLogout(user)` - After user logout

### Request/Response
- `beforeRequest(event)` - Before processing request
- `afterRequest(event, response)` - After processing request

## Plugin Extensions

### Meta Fields

Add custom fields to posts:

```typescript
plugin.addMetaField({
  key: 'reading_time',
  label: 'Reading Time',
  type: 'number',
  description: 'Estimated reading time in minutes'
});
```

### Admin Pages

Add custom admin pages:

```typescript
plugin.addAdminPage({
  path: '/admin/my-plugin',
  title: 'My Plugin Settings',
  component: () => <PluginSettingsPage />,
  permission: 'admin'
});
```

### Shortcodes

Register shortcodes for content:

```typescript
plugin.addShortcode({
  name: 'youtube',
  handler: (attributes) => {
    return `<iframe src="https://youtube.com/embed/${attributes.id}" width="560" height="315"></iframe>`;
  },
  attributes: {
    id: {
      type: 'string',
      required: true,
      description: 'YouTube video ID'
    }
  }
});
```

### Widgets

Create dashboard widgets:

```typescript
plugin.addWidget({
  name: 'stats-widget',
  title: 'Site Statistics',
  component: StatsWidget,
  configSchema: {
    showViews: {
      type: 'boolean',
      label: 'Show Page Views',
      default: true
    }
  }
});
```

### Editor Blocks

Add custom editor blocks:

```typescript
plugin.addBlock({
  name: 'callout',
  title: 'Callout Box',
  category: 'formatting',
  component: CalloutBlock,
  attributes: {
    type: {
      type: 'string',
      default: 'info'
    },
    title: {
      type: 'string',
      default: ''
    }
  }
});
```

## Settings Schema

Define plugin settings with full type safety:

```typescript
plugin.addSettings({
  apiEndpoint: {
    type: 'url',
    label: 'API Endpoint',
    required: true,
    placeholder: 'https://api.example.com'
  },
  retryCount: {
    type: 'number',
    label: 'Retry Count',
    default: 3,
    min: 1,
    max: 10
  },
  enableDebug: {
    type: 'boolean',
    label: 'Enable Debug Mode',
    default: false
  },
  mode: {
    type: 'select',
    label: 'Operation Mode',
    options: [
      { label: 'Development', value: 'dev' },
      { label: 'Production', value: 'prod' }
    ],
    default: 'dev'
  }
});
```

## Utilities

The SDK includes helpful utilities:

```typescript
import { 
  validateSlug,
  sanitizeHtml,
  generateExcerpt,
  createLogger,
  debounce,
  retry
} from '@letterpress/plugin-sdk';

// Validate URL slugs
if (validateSlug('my-post-slug')) {
  // Valid slug
}

// Sanitize HTML content
const clean = sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>');

// Generate excerpts
const excerpt = generateExcerpt(longContent, 150);

// Create logger
const logger = createLogger('my-plugin');
logger.info('Plugin started');

// Debounce functions
const debouncedSave = debounce(saveData, 1000);

// Retry failed operations
const result = await retry(async () => {
  return await fetch('/api/data');
}, 3, 1000);
```

## Hook System

Advanced hook management:

```typescript
import { HookHelper, HOOK_PRIORITIES } from '@letterpress/plugin-sdk';

const hookHelper = new HookHelper();

// Add hooks with different priorities
hookHelper.addHook('my-plugin', 'beforePostCreate', callback1, HOOK_PRIORITIES.HIGH);
hookHelper.addHook('my-plugin', 'beforePostCreate', callback2, HOOK_PRIORITIES.LOW);

// Execute hooks
const results = await hookHelper.executeHook('beforePostCreate', postData);

// Check if hooks exist
if (hookHelper.hasHook('beforePostCreate')) {
  // Hooks are registered
}
```

## Error Handling

Built-in error handling and logging:

```typescript
plugin.onActivate(async () => {
  try {
    await initializeExternalService();
  } catch (error) {
    plugin.getLogger().error('Failed to initialize service:', error);
    throw error; // Re-throw to prevent activation
  }
});
```

## TypeScript Support

Full TypeScript support with strict typing:

```typescript
import type { 
  Plugin,
  PluginConfig,
  PluginHooks,
  PluginContext
} from '@letterpress/plugin-sdk';

// Your plugin will have full type safety
const plugin: Plugin = createPlugin()
  .configure({
    name: 'typed-plugin',
    version: '1.0.0'
  })
  .beforePostCreate(async (data: PostData) => {
    // data is fully typed
    return data;
  })
  .build();
```

## Development Tips

1. **Use TypeScript** - The SDK is built with TypeScript for better development experience
2. **Handle Errors** - Always wrap async operations in try-catch blocks
3. **Use Priorities** - Use hook priorities to control execution order
4. **Validate Data** - Always validate external data and user inputs
5. **Log Everything** - Use the built-in logger for debugging
6. **Test Thoroughly** - Test plugin lifecycle methods (install, activate, deactivate, uninstall)

## Plugin Structure

Recommended plugin directory structure:

```
my-plugin/
├── main.ts              # Plugin entry point
├── package.json         # Plugin metadata
├── README.md           # Plugin documentation
├── components/         # React/Solid components
│   ├── AdminPage.tsx
│   └── Widget.tsx
├── hooks/              # Hook implementations
│   ├── content.ts
│   └── auth.ts
├── utils/              # Utility functions
│   └── helpers.ts
└── types/              # TypeScript types
    └── index.ts
```

## Examples

Check out the `/examples` directory for complete plugin examples:

- **Basic Plugin** - Simple content hooks
- **Admin Dashboard Plugin** - Custom admin pages and widgets
- **SEO Plugin** - Meta fields and content optimization
- **Analytics Plugin** - External service integration
- **Media Plugin** - File handling and galleries

## API Reference

For complete API documentation, see the [API Reference](./docs/api.md).

## License

MIT License - see LICENSE file for details.
