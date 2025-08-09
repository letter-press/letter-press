import { Show, createSignal, type JSX } from "solid-js";
import type { BlockRegistry } from "~/lib/types";
import { RichTextToolbar } from "./squire-editor";
import type { SquireInstance } from "./squire-editor";
import type { EditorBlock } from "./block-editor";

interface BlockToolbarProps {
    block: EditorBlock;
    onUpdate: (updates: Partial<EditorBlock>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onEdit: () => void;
    isEditing?: boolean;
    blockRegistry: BlockRegistry;
    squireInstance?: SquireInstance | null;
}

export function BlockToolbar(props: BlockToolbarProps): JSX.Element {
    const blockDef = props.blockRegistry[props.block.blockType] || props.blockRegistry[props.block.customType || ''];
    const [showRichTextToolbar, setShowRichTextToolbar] = createSignal(false);

    const isTextBlock = (): boolean => {
        return props.block.blockType === 'PARAGRAPH' || 
               props.block.blockType === 'HEADING' || 
               props.block.blockType === 'RICH_TEXT';
    };

    const toggleRichTextToolbar = (): void => {
        setShowRichTextToolbar(!showRichTextToolbar());
    };

    return (
        <div class="block-toolbar absolute -top-12 left-0 bg-gray-900/95 backdrop-blur-sm text-white rounded-lg px-3 py-2 flex items-center space-x-1 text-sm shadow-lg border border-gray-700/50" style={{ 'z-index': '45' }}>
            <div class="flex items-center space-x-2 pr-2 border-r border-gray-600/50">
                <span class="flex items-center justify-center w-5 h-5 text-xs bg-gray-700/50 rounded">
                    {blockDef?.icon || '📄'}
                </span>
                <span class="font-medium text-xs text-gray-200 max-w-20 truncate">
                    {blockDef?.title || 'Block'}
                </span>
            </div>
            
            <div class="flex items-center space-x-0.5">
                <Show when={!props.isEditing}>
                    <button
                        type="button"
                        onClick={props.onEdit}
                        class="p-1.5 hover:bg-gray-700/70 rounded transition-colors duration-150 group"
                        title="Edit content (Enter)"
                    >
                        <svg class="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    
                    <div class="w-px h-4 bg-gray-600/50 mx-1"></div>
                </Show>
                
                <Show when={props.isEditing}>
                    <div class="flex items-center space-x-1 px-2 py-1 bg-green-600/20 rounded">
                        <svg class="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-xs text-green-300 font-medium">Editing</span>
                    </div>
                    
                    <Show when={isTextBlock() && props.block.blockType !== 'RICH_TEXT'}>
                        <div class="flex items-center">
                            <RichTextToolbar
                                quire={props.squireInstance || null}
                                visible={true}
                                onClose={() => {}}
                                compact={true}
                            />
                        </div>
                    </Show>
                    
                    <div class="w-px h-4 bg-gray-600/50 mx-1"></div>
                </Show>
                
                {/* Floating Rich Text Toolbar for RICH_TEXT blocks */}
                <Show when={props.isEditing && props.block.blockType === 'RICH_TEXT'}>
                    <div class="fixed mt-2" style={{ 
                        top: "var(--toolbar-top, 100%)", 
                        left: "var(--toolbar-left, 0px)",
                        transform: "translateY(8px)",
                        'z-index': '90'
                    }}>
                        <RichTextToolbar
                            quire={props.squireInstance || null}
                            visible={true}
                            onClose={() => {}}
                            compact={false}
                        />
                    </div>
                </Show>
                
                <button
                    type="button"
                    onClick={props.onMoveUp}
                    class="p-1.5 hover:bg-gray-700/70 rounded transition-colors duration-150 group"
                    title="Move up (Ctrl+↑)"
                >
                    <svg class="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={props.onMoveDown}
                    class="p-1.5 hover:bg-gray-700/70 rounded transition-colors duration-150 group"
                    title="Move down (Ctrl+↓)"
                >
                    <svg class="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                <div class="w-px h-4 bg-gray-600/50 mx-1"></div>
                
                <button
                    type="button"
                    onClick={props.onDuplicate}
                    class="p-1.5 hover:bg-gray-700/70 rounded transition-colors duration-150 group"
                    title="Duplicate (Ctrl+D)"
                >
                    <svg class="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={props.onRemove}
                    class="p-1.5 hover:bg-red-600/80 rounded transition-colors duration-150 group"
                    title="Delete (Del)"
                >
                    <svg class="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            
            {/* Rich Text Toolbar - no longer needed as separate popup */}
        </div>
    );
}