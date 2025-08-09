# Letter-Press Block Editor System

A modern, extensible block-based content editor similar to WordPress Gutenberg, built for the Letter-Press CMS.

## Features

- **Modern Block Editor**: WordPress Gutenberg-style block editor built with SolidJS
- **Extensible Architecture**: Plugin system for custom blocks
- **Rich Default Blocks**: 15+ built-in block types
- **Database Integration**: Efficient storage with PostgreSQL
- **Backward Compatibility**: Legacy content support
- **Type Safety**: Full TypeScript support

## Default Block Types

### Text Blocks
- **Paragraph** - Basic text content with formatting
- **Heading** - H1-H6 headings with alignment options
- **Quote** - Blockquotes with citation support
- **Code** - Syntax-highlighted code blocks
- **List** - Ordered and unordered lists

### Media Blocks
- **Image** - Image upload with captions and alt text
- **Video** - Video embed with poster and controls
- **Audio** - Audio player with custom controls
- **Gallery** - Multi-image galleries with layouts
- **Embed** - External content embedding (YouTube, Twitter, etc.)

### Layout Blocks
- **Columns** - Multi-column layouts
- **Group** - Container for grouping blocks
- **Separator** - Horizontal dividers
- **Spacer** - Customizable white space

### Interactive Blocks
- **Button** - Call-to-action buttons with styling options

## Usage

### Creating Posts with Blocks

```tsx
import { PostForm } from "~/components/forms/post-form";

export default function CreatePost() {
  const handleSubmit = async (data: PostFormData) => {
    await createPost({
      title: data.title,
      content: data.content, // Legacy fallback
      blocks: data.blocks,   // Modern block content
      status: data.status,
      authorId: session.user.id,
    });
  };

  return (
    <PostForm
      onSubmit={handleSubmit}
      type="POST"
    />
  );
}
```

### Block Editor Component

```tsx
import { BlockEditor } from "~/components/editor/block-editor";

export default function MyEditor() {
  const [blocks, setBlocks] = createSignal([]);

  return (
    <BlockEditor
      initialBlocks={blocks()}
      onChange={setBlocks}
      className="min-h-[400px]"
    />
  );
}
```

### Custom Block Development

```tsx
import type { BlockDefinition } from "~/lib/types";

// Define your custom block
const customBlock: BlockDefinition = {
  type: 'CUSTOM',
  name: 'testimonial',
  title: 'Testimonial',
  description: 'Display customer testimonials',
  icon: '💬',
  category: 'widget',
  supports: {
    align: true,
    anchor: true,
    customClassName: true,
    reusable: true,
  },
  defaultContent: {
    quote: '',
    author: '',
    rating: 5,
  },
  component: TestimonialBlockComponent,
};

// Register the block
import { registerBlock } from "~/components/editor/block-registry";
registerBlock(customBlock);
```

### Plugin Integration

```tsx
// In your plugin's main.js
export default {
  name: 'my-custom-blocks',
  version: '1.0.0',
  
  // Define custom blocks
  blocks: [
    {
      type: 'testimonial',
      title: 'Testimonial',
      description: 'Customer testimonials with ratings',
      icon: '💬',
      category: 'widget',
      defaultContent: {
        quote: '',
        author: '',
        company: '',
        rating: 5,
      },
      component: TestimonialBlock,
    },
    {
      type: 'pricing-table',
      title: 'Pricing Table',
      description: 'Display pricing plans',
      icon: '💰',
      category: 'widget',
      defaultContent: {
        plans: [],
      },
      component: PricingTableBlock,
    },
  ],

  // Plugin lifecycle
  onLoad: (api) => {
    console.log('Custom blocks plugin loaded');
  },

  onUnload: (api) => {
    console.log('Custom blocks plugin unloaded');
  },
};
```

## Block Component Interface

Every block component receives these props:

```tsx
interface BlockComponentProps {
  block: {
    content?: BlockContent;     // Block-specific content
    attributes?: BlockAttributes; // Styling and configuration
  };
  isSelected: boolean;          // Whether block is selected
  isEditing: boolean;          // Whether block is in edit mode
  readonly?: boolean;          // Whether editor is readonly
  onUpdate: (content: BlockContent, attributes?: BlockAttributes) => void;
  onStopEditing: () => void;
}
```

## Database Schema

The block system uses the following database structure:

```sql
-- Content blocks table
CREATE TABLE ContentBlock (
  id SERIAL PRIMARY KEY,
  postId INTEGER REFERENCES Post(id) ON DELETE CASCADE,
  blockType VARCHAR NOT NULL,
  customType VARCHAR,          -- For plugin blocks
  order INTEGER DEFAULT 0,
  parentId INTEGER REFERENCES ContentBlock(id),
  content JSONB,              -- Block content as JSON
  attributes JSONB,           -- Block styling/config
  pluginId VARCHAR,           -- Plugin that owns this block
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Block templates for reusable blocks
CREATE TABLE BlockTemplate (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  blockType VARCHAR NOT NULL,
  customType VARCHAR,
  content JSONB NOT NULL,
  attributes JSONB,
  category VARCHAR,
  isActive BOOLEAN DEFAULT TRUE,
  authorId INTEGER,
  pluginId VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## API Reference

### Block Registry Functions

```tsx
// Register a new block type
registerBlock(blockDefinition: BlockDefinition): void

// Unregister a block type
unregisterBlock(blockType: string): void

// Get all registered blocks
getBlockRegistry(): BlockRegistry

// Get blocks by category
getBlocksByCategory(category: string): BlockDefinition[]

// Get all available categories
getAllCategories(): string[]
```

### Block Editor API

```tsx
// Create block editor instance
<BlockEditor
  initialBlocks={blocks}
  onChange={handleChange}
  readonly={false}
  className="custom-editor"
/>
```

### Plugin API

```tsx
// Block Editor API for plugins
class BlockEditorAPI {
  registerBlock(blockDef: PluginBlockDefinition): void
  unregisterBlock(blockType: string): void
  registerBlocks(blocks: PluginBlockDefinition[]): void
  createBlockTemplate(template: BlockTemplate): void
}
```

## Styling

The block editor includes CSS classes for styling:

```css
/* Block wrapper */
.block-wrapper { /* Block container */ }
.block-wrapper.selected { /* Selected block */ }
.block-wrapper.editing { /* Editing block */ }

/* Block types */
.paragraph-block { /* Paragraph block */ }
.heading-block { /* Heading block */ }
.image-block-wrapper { /* Image block */ }
.quote-block { /* Quote block */ }
.code-block { /* Code block */ }

/* Block inserter */
.block-inserter { /* Insert button */ }
.block-picker { /* Block selection menu */ }
```

## Keyboard Shortcuts

- **Enter** - Create new paragraph block
- **Shift+Enter** - Create new block after current
- **Backspace** - Delete empty block and select previous
- **Ctrl/Cmd+↑/↓** - Navigate between blocks
- **Escape** - Deselect current block

## Migration from Legacy Content

The system automatically handles migration:

1. **Automatic Conversion**: Legacy HTML content is converted to blocks on first edit
2. **Backward Compatibility**: Legacy content field is maintained for fallback
3. **Gradual Migration**: Content is migrated as it's edited

## Performance Considerations

- **Lazy Loading**: Block components are loaded on demand
- **Optimistic Updates**: UI updates immediately, syncs to database
- **Efficient Storage**: JSON storage for block content and attributes
- **Indexed Queries**: Database indexes on frequently queried fields

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile Support**: iOS Safari 14+, Android Chrome 88+
- **Progressive Enhancement**: Fallback to text editor on unsupported browsers

## Contributing

To add new default blocks:

1. Create block component in `src/components/editor/blocks/`
2. Add to block registry in `src/components/editor/block-registry.tsx`
3. Add TypeScript interfaces in `src/lib/types.ts`
4. Write tests and documentation

## License

Part of the Letter-Press CMS - MIT License