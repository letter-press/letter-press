import { For, Show, createSignal, createEffect, onMount, type JSX } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { 
    ContentBlockWithChildren, 
    BlockContent, 
    BlockAttributes, 
    BlockDefinition,
    BlockRegistry 
} from "~/lib/types";
import type { BlockPattern } from "~/lib/pattern-types";
import { defaultBlockRegistry } from "./block-registry";
import { BlockInserter } from "./block-inserter";
import type { SquireInstance } from "./squire-editor";

export interface BlockEditorProps {
    initialBlocks?: ContentBlockWithChildren[];
    onChange?: (blocks: ContentBlockWithChildren[]) => void;
    readonly?: boolean;
    className?: string;
}

export interface EditorBlock extends Omit<ContentBlockWithChildren, 'id' | 'postId' | 'createdAt' | 'updatedAt'> {
    id: string; // Use string ID for editor to avoid conflicts
    selected?: boolean;
    editing?: boolean;
}

interface BlockComponentProps {
    block: EditorBlock;
    isSelected: boolean;
    isEditing: boolean;
    readonly?: boolean;
    onUpdate: (content: BlockContent, attributes?: BlockAttributes) => void;
    onStopEditing: () => void;
    onSquireReady?: (squire: SquireInstance) => void;
}

export function BlockEditor(props: BlockEditorProps): JSX.Element {
    const [blocks, setBlocks] = createStore<EditorBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = createSignal<string | null>(null);
    const [blockRegistry] = createSignal<BlockRegistry>(defaultBlockRegistry);
    const [draggedBlock, setDraggedBlock] = createSignal<EditorBlock | null>(null);
    const [isInitialized, setIsInitialized] = createSignal(false);

    // Initialize blocks from props
    createEffect(() => {
        if (!isInitialized() && props.initialBlocks && props.initialBlocks.length > 0) {
            const editorBlocks = props.initialBlocks.map((block, index) => ({
                ...block,
                id: `block-${block.id || index}`,
                selected: false,
                editing: false,
            }));
            setBlocks(editorBlocks);
            setIsInitialized(true);
        } else if (!isInitialized() && blocks.length === 0) {
            addBlock('SIMPLE_TEXT', 0);
            setIsInitialized(true);
        }
    });

    // Notify parent of changes
    createEffect(() => {
        if (props.onChange && isInitialized()) {
            const outputBlocks = blocks.map((block, index) => ({
                ...block,
                id: parseInt(block.id.replace('block-', '')) || 0,
                postId: 0,
                order: index,
                createdAt: new Date(),
                updatedAt: new Date(),
            })) as ContentBlockWithChildren[];
            props.onChange(outputBlocks);
        }
    });

    const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const addBlock = (blockType: string, position: number = blocks.length, content?: BlockContent) => {
        if (props.readonly) return;

        const blockDef = blockRegistry()[blockType];
        if (!blockDef) return;

        const newBlock: EditorBlock = {
            id: generateBlockId(),
            blockType: blockType as any,
            customType: blockType.startsWith('custom-') ? blockType : null,
            order: position,
            parentId: null,
            content: content || blockDef.defaultContent || {} as any,
            attributes: blockDef.defaultAttributes || {} as any,
            pluginId: null,
            selected: false,
            editing: true,
        };

        setBlocks(produce(draft => {
            draft.splice(position, 0, newBlock);
            for (let i = position + 1; i < draft.length; i++) {
                draft[i].order = i;
            }
        }));

        setSelectedBlockId(newBlock.id);
    };

    const addPattern = (pattern: BlockPattern, position: number = blocks.length) => {
        if (props.readonly) return;

        const newBlocks: EditorBlock[] = [];
        
        pattern.blocks.forEach((patternBlock, index) => {
            const blockDef = blockRegistry()[patternBlock.type];
            if (!blockDef) return;

            const newBlock: EditorBlock = {
                id: generateBlockId(),
                blockType: patternBlock.type as any,
                customType: patternBlock.type.startsWith('custom-') ? patternBlock.type : null,
                order: position + index,
                parentId: null,
                content: (patternBlock.content || blockDef.defaultContent || {}) as any,
                attributes: { ...blockDef.defaultAttributes, ...patternBlock.attributes } as any,
                pluginId: null,
                selected: false,
                editing: false,
            };

            newBlocks.push(newBlock);
        });

        if (newBlocks.length === 0) return;

        setBlocks(produce(draft => {
            draft.splice(position, 0, ...newBlocks);
            for (let i = position + newBlocks.length; i < draft.length; i++) {
                draft[i].order = i;
            }
        }));

        setSelectedBlockId(newBlocks[0].id);
    };

    const updateBlock = (blockId: string, updates: Partial<EditorBlock>) => {
        if (props.readonly) return;

        setBlocks(produce(draft => {
            const index = draft.findIndex(b => b.id === blockId);
            if (index !== -1) {
                Object.assign(draft[index], updates);
            }
        }));
    };

    const removeBlock = (blockId: string) => {
        if (props.readonly) return;

        setBlocks(produce(draft => {
            const index = draft.findIndex(b => b.id === blockId);
            if (index !== -1) {
                draft.splice(index, 1);
                for (let i = index; i < draft.length; i++) {
                    draft[i].order = i;
                }
            }
        }));

        if (selectedBlockId() === blockId) {
            setSelectedBlockId(null);
        }
    };

    const moveBlock = (fromIndex: number, toIndex: number) => {
        if (props.readonly || fromIndex === toIndex) return;

        setBlocks(produce(draft => {
            const [movedBlock] = draft.splice(fromIndex, 1);
            draft.splice(toIndex, 0, movedBlock);
            
            draft.forEach((block, index) => {
                block.order = index;
            });
        }));
    };

    const selectBlock = (blockId: string | null) => {
        if (props.readonly) return;

        setBlocks(produce(draft => {
            draft.forEach(block => {
                block.selected = block.id === blockId;
                if (block.id !== blockId) {
                    block.editing = false;
                }
            });
        }));
        
        setSelectedBlockId(blockId);
    };

    const duplicateBlock = (blockId: string) => {
        if (props.readonly) return;

        const blockIndex = blocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return;

        const originalBlock = blocks[blockIndex];
        const duplicatedBlock: EditorBlock = {
            ...originalBlock,
            id: generateBlockId(),
            selected: false,
            editing: false,
        };

        setBlocks(produce(draft => {
            draft.splice(blockIndex + 1, 0, duplicatedBlock);
            for (let i = blockIndex + 2; i < draft.length; i++) {
                draft[i].order = i;
            }
        }));
    };

    // Simple drag and drop
    const handleDragStart = (e: DragEvent, block: EditorBlock) => {
        if (props.readonly) return;
        setDraggedBlock(block);
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', block.id);
    };

    const handleDragEnd = () => {
        setDraggedBlock(null);
    };

    const handleDrop = (e: DragEvent, dropIndex: number) => {
        e.preventDefault();
        
        const draggedBlockId = e.dataTransfer!.getData('text/plain');
        const draggedBlockIndex = blocks.findIndex(b => b.id === draggedBlockId);
        
        if (draggedBlockIndex !== -1 && draggedBlockIndex !== dropIndex) {
            moveBlock(draggedBlockIndex, dropIndex);
        }
        
        setDraggedBlock(null);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const renderBlock = (block: EditorBlock, index: number): JSX.Element => {
        const blockDef = blockRegistry()[block.blockType] || blockRegistry()[block.customType || ''];
        
        if (!blockDef) {
            return (
                <div class="p-2 border border-red-300 bg-red-50 text-red-700 rounded text-sm">
                    Unknown block type: {block.blockType}
                </div>
            );
        }

        const BlockComponent = blockDef.component;

        return (
            <div
                class={`block-item ${block.selected ? 'selected' : ''} ${block.editing ? 'editing' : ''}`}
                onClick={(e) => {
                    if (block.editing && e.target !== e.currentTarget) return;
                    e.stopPropagation();
                    selectBlock(block.id);
                }}
                onDblClick={(e) => {
                    e.stopPropagation();
                    if (!props.readonly) {
                        updateBlock(block.id, { editing: true });
                    }
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
            >
                <BlockComponent
                    block={block}
                    isSelected={block.selected}
                    isEditing={block.editing}
                    readonly={props.readonly}
                    onUpdate={(content: BlockContent, attributes?: BlockAttributes) => {
                        updateBlock(block.id, { content: content as any, attributes: attributes as any });
                    }}
                    onStopEditing={() => updateBlock(block.id, { editing: false })}
                    onSquireReady={() => {}}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onRemove={() => removeBlock(block.id)}
                    onDragStart={(e: DragEvent) => handleDragStart(e, block)}
                    onDragEnd={handleDragEnd}
                />
            </div>
        );
    };

    // Simple keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
        if (props.readonly) return;

        const selectedBlock = blocks.find(b => b.selected);
        if (!selectedBlock) return;

        const selectedIndex = blocks.findIndex(b => b.id === selectedBlock.id);

        if (selectedBlock.editing) {
            if (e.key === 'Escape') {
                e.preventDefault();
                updateBlock(selectedBlock.id, { editing: false });
            }
            return;
        }

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (e.shiftKey) {
                    addBlock('SIMPLE_TEXT', selectedIndex + 1);
                } else {
                    updateBlock(selectedBlock.id, { editing: true });
                }
                break;
            case 'Backspace':
                if (selectedBlock.blockType === 'PARAGRAPH' && 
                    (!selectedBlock.content || (selectedBlock.content as any)?.text === '')) {
                    e.preventDefault();
                    removeBlock(selectedBlock.id);
                }
                break;
            case 'ArrowUp':
                if (selectedIndex > 0) {
                    e.preventDefault();
                    selectBlock(blocks[selectedIndex - 1].id);
                }
                break;
            case 'ArrowDown':
                if (selectedIndex < blocks.length - 1) {
                    e.preventDefault();
                    selectBlock(blocks[selectedIndex + 1].id);
                }
                break;
        }
    };

    onMount(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    return (
        <div 
            class={`block-editor-simple ${props.className || ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    selectBlock(null);
                }
            }}
        >
            <Show when={blocks.length === 0 && !props.readonly}>
                <div class="empty-editor">
                    <BlockInserter
                        position={0}
                        onInsert={(blockType, content) => addBlock(blockType, 0, content)}
                        onInsertPattern={(pattern) => addPattern(pattern, 0)}
                        blockRegistry={blockRegistry()}
                        showTitle={true}
                    />
                </div>
            </Show>

            <div class="block-list-simple">
                <For each={blocks}>
                    {(block, index) => renderBlock(block, index())}
                </For>
            </div>

            <Show when={blocks.length > 0 && !props.readonly}>
                <div class="add-block">
                    <BlockInserter
                        position={blocks.length}
                        onInsert={(blockType, content) => addBlock(blockType, blocks.length, content)}
                        onInsertPattern={(pattern) => addPattern(pattern, blocks.length)}
                        blockRegistry={blockRegistry()}
                    />
                </div>
            </Show>
        </div>
    );
}