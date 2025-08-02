# Plugin SDK Integration Guide

This guide shows how to integrate the LetterPress Plugin SDK into your LetterPress CMS project.

## Step 1: Install the SDK

### From the workspace (recommended for development)

Since the SDK is part of this workspace, you can reference it directly:

```bash
cd letter
pnpm add @letterpress/plugin-sdk@workspace:*
```

### From npm (when published)

```bash
cd letter  
pnpm add @letterpress/plugin-sdk
```

## Step 2: Update Plugin Type System

The existing plugin types need to be aligned with the SDK. Here's how to migrate:

### Current vs SDK Types

**Current types** (`letter/src/lib/plugin-types.ts`):
```typescript
export interface Plugin {
  config: PluginConfig;
  hooks?: PluginHooks;
  // ... other methods
}
```

**SDK types** (`letterpress-plugin-sdk/src/types/index.ts`):
```typescript
export interface Plugin {
  config: PluginConfig;
  hooks?: PluginHooks;
  // ... enhanced with better typing
}
```

### Migration Steps

1. **Replace plugin types import**:
   ```typescript
   // Before
   import type { Plugin, PluginConfig } from '../lib/plugin-types';
   
   // After  
   import type { Plugin, PluginConfig } from '@letterpress/plugin-sdk';
   ```

2. **Update plugin manager to use SDK utilities**:
   ```typescript
   import { 
     validatePluginConfig, 
     createLogger,
     HookHelper 
   } from '@letterpress/plugin-sdk';
   ```

3. **Enhance existing plugins**:
   ```typescript
   // Enhanced example plugin
   import { definePlugin } from '@letterpress/plugin-sdk';
   
   export default definePlugin({
     name: 'example-plugin',
     version: '1.0.0',
     // ... rest of configuration
   });
   ```

## Step 3: Create New Plugins with SDK

### Simple Plugin Example

```typescript
// plugins/my-plugin/main.ts
import { definePlugin } from '@letterpress/plugin-sdk';

export default definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My awesome plugin',
  
  hooks: {
    afterPostCreate: async (post) => {
      console.log(`New post: ${post.title}`);
    }
  }
});
```

### Advanced Plugin Example

```typescript
// plugins/analytics-plugin/main.ts
import { createPlugin } from '@letterpress/plugin-sdk';

export default createPlugin()
  .configure({
    name: 'analytics-plugin',
    version: '2.0.0',
    description: 'Advanced analytics tracking'
  })
  .addSettings({
    apiKey: {
      type: 'string',
      label: 'API Key',
      required: true
    }
  })
  .beforePostCreate(async (data) => {
    // Add analytics tracking
    data.tracked = true;
    return data;
  })
  .addMetaField({
    key: 'analytics_id',
    label: 'Analytics ID',
    type: 'text'
  })
  .build();
```

## Step 4: Plugin Directory Structure

Organize plugins with the recommended structure:

```
letter/plugins/
├── example-plugin/
│   ├── main.ts              # Plugin entry point (required)
│   ├── package.json         # Plugin metadata
│   ├── README.md           # Plugin documentation
│   └── components/         # UI components (optional)
│       └── SettingsPage.tsx
├── seo-plugin/
│   ├── main.ts
│   ├── utils/
│   │   └── seo-helpers.ts
│   └── types/
│       └── index.ts
└── enhanced-seo-plugin/    # Example using SDK
    └── main.ts
```

## Step 5: TypeScript Configuration

Ensure TypeScript can resolve the SDK types:

```json
// letter/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@letterpress/plugin-sdk": ["../letterpress-plugin-sdk/src/index.ts"]
    }
  }
}
```

## Step 6: Development Workflow

### Building the SDK

```bash
# Build the SDK
cd letterpress-plugin-sdk
pnpm install
pnpm build
```

### Testing Plugins

```bash
# Test plugins in development
cd letter
pnpm dev

# The plugin system will automatically load plugins from the plugins/ directory
```

### Plugin Validation

The SDK includes built-in validation:

```typescript
import { validatePluginConfig } from '@letterpress/plugin-sdk';

const validation = validatePluginConfig(pluginConfig);
if (!validation.isValid) {
  console.error('Plugin validation failed:', validation.errors);
}
```

## Step 7: Migration Checklist

- [ ] Install SDK in letter package
- [ ] Update plugin type imports
- [ ] Migrate existing plugins to use SDK (optional)
- [ ] Test plugin loading and execution
- [ ] Update plugin documentation
- [ ] Configure TypeScript paths
- [ ] Set up development workflow

## Benefits of Using the SDK

1. **Type Safety**: Full TypeScript support with strict typing
2. **Developer Experience**: Fluent API and helpful utilities
3. **Validation**: Built-in configuration and hook validation
4. **Documentation**: Self-documenting code with JSDoc
5. **Consistency**: Standardized plugin structure
6. **Testing**: Easier to test with mock utilities
7. **Maintainability**: Cleaner, more organized code

## Example: Converting Existing Plugin

### Before (without SDK)
```typescript
const plugin = {
  config: {
    name: 'my-plugin',
    version: '1.0.0'
  },
  hooks: {
    afterPostCreate: async (post) => {
      console.log('Post created');
    }
  }
};

export default plugin;
```

### After (with SDK)
```typescript
import { definePlugin } from '@letterpress/plugin-sdk';

export default definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  
  hooks: {
    afterPostCreate: async (post) => {
      console.log(`Post created: ${post.title}`);
    }
  }
});
```

The SDK version provides:
- Better type inference
- Runtime validation
- Enhanced error handling
- Consistent structure
- Better tooling support

## Next Steps

1. Review the [API Reference](../letterpress-plugin-sdk/README.md)
2. Check out [example plugins](../letterpress-plugin-sdk/examples/)
3. Start building your first plugin with the SDK
4. Contribute improvements back to the SDK
