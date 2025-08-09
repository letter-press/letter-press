import { Show, createSignal, createEffect, onCleanup, For, type JSX } from "solid-js";
import type { BlockRegistry } from "~/lib/types";
import type { SquireInstance } from "./squire-editor";
import type { EditorBlock } from "./block-editor";

interface EmbeddedBlockControlsProps {
    block: EditorBlock;
    onUpdate: (updates: Partial<EditorBlock>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onAddBlock: (blockType: string, position: 'before' | 'after') => void;
    onConvertTo: (blockType: string) => void;
    isEditing?: boolean;
    isSelected?: boolean;
    blockRegistry: BlockRegistry;
    squireInstance?: SquireInstance | null;
}

export function EmbeddedBlockControls(props: EmbeddedBlockControlsProps): JSX.Element {
    const [showBlockMenu, setShowBlockMenu] = createSignal(false);
    const [showConvertMenu, setShowConvertMenu] = createSignal(false);
    
    const blockDef = props.blockRegistry[props.block.blockType] || props.blockRegistry[props.block.customType || ''];
    
    // Close menus when clicking outside
    createEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.embedded-block-controls')) {
                setShowBlockMenu(false);
                setShowConvertMenu(false);
            }
        };

        if (showBlockMenu() || showConvertMenu()) {
            // Use passive listener for click outside - improves scroll performance
            document.addEventListener('click', handleClickOutside, { passive: true });
            onCleanup(() => {
                document.removeEventListener('click', handleClickOutside);
            });
        }
    });
    
    const isTextBlock = (): boolean => {
        return props.block.blockType === 'PARAGRAPH' || 
               props.block.blockType === 'HEADING' || 
               props.block.blockType === 'RICH_TEXT';
    };

    const getAvailableBlocks = () => {
        return Object.entries(props.blockRegistry).filter(([key]) => 
            key !== props.block.blockType && 
            !key.startsWith('custom-')
        );
    };

    const handleAddBlock = (blockType: string, position: 'before' | 'after') => {
        props.onAddBlock(blockType, position);
        setShowBlockMenu(false);
    };

    const handleConvertTo = (blockType: string) => {
        props.onConvertTo(blockType);
        setShowConvertMenu(false);
    };

    const toggleBlockMenu = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowBlockMenu(!showBlockMenu());
        setShowConvertMenu(false);
    };

    const toggleConvertMenu = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowConvertMenu(!showConvertMenu());
        setShowBlockMenu(false);
    };

    return (
        <div class="embedded-block-controls" onClick={(e) => e.stopPropagation()}>
            {/* Left side controls - Block type and actions */}
            <div class="absolute left-0 top-0 flex items-center -ml-12 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30">
                {/* Drag handle */}
                <div 
                    class="w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 6a2 2 0 110-4 2 2 0 010 4zM4 12a2 2 0 110-4 2 2 0 010 4zM4 18a2 2 0 110-4 2 2 0 010 4zM12 6a2 2 0 110-4 2 2 0 010 4zM12 12a2 2 0 110-4 2 2 0 010 4zM12 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                </div>
                
                {/* Block type indicator and menu */}
                <div class="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={toggleBlockMenu}
                        class="w-6 h-6 flex items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer z-30"
                        title={`${blockDef?.title || 'Block'} - Click to add or convert`}
                    >
                        {blockDef?.icon || '📄'}
                    </button>
                    
                    {/* Block menu */}
                    <Show when={showBlockMenu()}>
                        <div 
                            class="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-48"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div class="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
                                Add Block
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddBlock('PARAGRAPH', 'before');
                                }}
                                class="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                            >
                                <span>📝</span>
                                <span>Add Paragraph Above</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddBlock('PARAGRAPH', 'after');
                                }}
                                class="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                            >
                                <span>📝</span>
                                <span>Add Paragraph Below</span>
                            </button>
                            <div class="border-t border-gray-100 mt-1 pt-1">
                                <div class="px-3 py-1 text-xs font-medium text-gray-500">
                                    Convert To
                                </div>
                                {getAvailableBlocks().slice(0, 4).map(([blockType, def]) => (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConvertTo(blockType);
                                        }}
                                        class="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                        <span>{def.icon}</span>
                                        <span>{def.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Show>
                </div>
            </div>

            {/* Right side controls - Quick actions */}
            <div class="absolute right-0 top-0 flex items-center -mr-8 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30">
                <div class="flex items-center space-x-1">
                    {/* Move up */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onMoveUp();
                        }}
                        class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors z-30"
                        title="Move up"
                    >
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    
                    {/* Move down */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onMoveDown();
                        }}
                        class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors z-30"
                        title="Move down"
                    >
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {/* Duplicate */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onDuplicate();
                        }}
                        class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors z-30"
                        title="Duplicate"
                    >
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    
                    {/* Delete */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onRemove();
                        }}
                        class="w-6 h-6 flex items-center justify-center hover:bg-red-50 hover:text-red-600 rounded transition-colors z-30"
                        title="Delete"
                    >
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Bottom add button */}
            <div class="absolute left-0 -bottom-3 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-30">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddBlock('PARAGRAPH', 'after');
                    }}
                    class="w-8 h-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm z-30"
                    title="Add block below"
                >
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
}