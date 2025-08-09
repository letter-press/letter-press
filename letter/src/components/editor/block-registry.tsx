import type { BlockRegistry, BlockDefinition } from "~/lib/types";
import { SimpleTextBlock } from "./blocks/simple-text-block";
import { RichTextBlock } from "./squire-editor";

export const defaultBlockRegistry: BlockRegistry = {
    'SIMPLE_TEXT': {
        type: 'SIMPLE_TEXT',
        name: 'simpletext',
        title: 'Simple Text',
        description: 'Plain text without formatting - great for basic content.',
        icon: '📝',
        category: 'text',
        supports: {
            html: false,
            align: false,
            anchor: true,
            customClassName: true,
            reusable: true,
        },
        defaultContent: {
            text: '',
            format: {}
        },
        component: SimpleTextBlock,
    },

    'RICH_TEXT': {
        type: 'RICH_TEXT',
        name: 'richtext',
        title: 'Rich Text',
        description: 'Rich formatted text with full WYSIWYG editing capabilities.',
        icon: '✨',
        category: 'text',
        supports: {
            html: true,
            align: true,
            anchor: true,
            customClassName: true,
            reusable: true,
        },
        defaultContent: {
            text: '',
            html: '',
            format: {}
        },
        component: RichTextBlock,
    },
};

// Plugin block registration system
const pluginBlocks = new Map<string, BlockDefinition>();

export function registerBlock(blockDef: BlockDefinition): void {
    if (defaultBlockRegistry[blockDef.type] || pluginBlocks.has(blockDef.type)) {
        console.warn(`Block type '${blockDef.type}' is already registered`);
        return;
    }
    
    pluginBlocks.set(blockDef.type, blockDef);
}

export function unregisterBlock(blockType: string): void {
    pluginBlocks.delete(blockType);
}

export function getBlockRegistry(): BlockRegistry {
    const registry = { ...defaultBlockRegistry };
    
    // Add plugin blocks
    pluginBlocks.forEach((blockDef, blockType) => {
        registry[blockType] = blockDef;
    });
    
    return registry;
}

export function getBlockDefinition(blockType: string): BlockDefinition | undefined {
    return defaultBlockRegistry[blockType] || pluginBlocks.get(blockType);
}

export function getBlocksByCategory(category: string): BlockDefinition[] {
    const registry = getBlockRegistry();
    return Object.values(registry).filter(block => block.category === category);
}

export function getAllCategories(): string[] {
    const registry = getBlockRegistry();
    const categories = new Set<string>();
    
    Object.values(registry).forEach(block => {
        categories.add(block.category);
    });
    
    return Array.from(categories).sort();
}