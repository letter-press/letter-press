import type { PluginBlockDefinition, BlockDefinition } from "~/lib/types";
import { registerBlock, unregisterBlock } from "~/components/editor/block-registry";

/**
 * Plugin API for block editor integration
 */
export class BlockEditorAPI {
    private pluginId: string;

    constructor(pluginId: string) {
        this.pluginId = pluginId;
    }

    /**
     * Register a custom block type
     */
    registerBlock(blockDef: Omit<PluginBlockDefinition, 'pluginId'>): void {
        const fullBlockDef: BlockDefinition = {
            ...blockDef,
            type: `${this.pluginId}-${blockDef.type}`,
        };

        registerBlock(fullBlockDef);
    }

    /**
     * Unregister a block type
     */
    unregisterBlock(blockType: string): void {
        unregisterBlock(`${this.pluginId}-${blockType}`);
    }

    /**
     * Register multiple blocks at once
     */
    registerBlocks(blocks: Omit<PluginBlockDefinition, 'pluginId'>[]): void {
        blocks.forEach(block => this.registerBlock(block));
    }

    /**
     * Create a block template for reuse
     */
    createBlockTemplate(template: {
        name: string;
        description?: string;
        blockType: string;
        content: any;
        attributes?: any;
        category?: string;
    }): void {
        // TODO: Implement block template creation
        console.log(`Creating block template: ${template.name} for plugin: ${this.pluginId}`);
    }
}

/**
 * Plugin hook integration
 */
export function createBlockEditorHooks() {
    return {
        // Hook called when a plugin is loaded
        onPluginLoad: (pluginId: string, pluginInstance: any) => {
            if (pluginInstance.blocks) {
                const api = new BlockEditorAPI(pluginId);
                pluginInstance.blocks.forEach((block: any) => {
                    api.registerBlock(block);
                });
            }
        },

        // Hook called when a plugin is unloaded
        onPluginUnload: (pluginId: string, pluginInstance: any) => {
            if (pluginInstance.blocks) {
                const api = new BlockEditorAPI(pluginId);
                pluginInstance.blocks.forEach((block: any) => {
                    api.unregisterBlock(block.type);
                });
            }
        },

        // Hook called before rendering a block
        onBlockRender: (blockType: string, blockData: any) => {
            // Allow plugins to modify block data before rendering
            return blockData;
        },

        // Hook called after a block is updated
        onBlockUpdate: (blockType: string, blockData: any) => {
            // Allow plugins to react to block updates
            console.log(`Block updated: ${blockType}`, blockData);
        },
    };
}