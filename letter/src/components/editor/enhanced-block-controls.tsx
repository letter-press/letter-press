import { Show, createSignal, createEffect, onCleanup, For, type JSX, untrack } from "solid-js";
import type { BlockRegistry } from "~/lib/types";
import type { SquireInstance } from "./squire-editor";
import type { EditorBlock } from "./block-editor";

interface EnhancedBlockControlsProps {
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

export function EnhancedBlockControls(props: EnhancedBlockControlsProps): JSX.Element {
    const [showBlockMenu, setShowBlockMenu] = createSignal(false);
    const [showMoreMenu, setShowMoreMenu] = createSignal(false);
    
    const blockDef = props.blockRegistry[props.block.blockType] || props.blockRegistry[props.block.customType || ''];
    
    // Close menus when clicking outside
    createEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.enhanced-block-controls')) {
                setShowBlockMenu(false);
                setShowMoreMenu(false);
            }
        };

        if (showBlockMenu() || showMoreMenu()) {
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

    const getQuickBlocks = () => {
        const common = ['PARAGRAPH', 'HEADING', 'IMAGE', 'QUOTE'];
        return Object.entries(props.blockRegistry).filter(([key]) => 
            common.includes(key) && key !== props.block.blockType
        );
    };

    const handleAddBlock = (blockType: string, position: 'before' | 'after') => {
        props.onAddBlock(blockType, position);
        setShowBlockMenu(false);
    };

    const handleConvertTo = (blockType: string) => {
        props.onConvertTo(blockType);
        setShowMoreMenu(false);
    };

    // Text formatting functions
    const formatText = (command: string) => {
        // Use untrack to avoid creating computations outside createRoot
        const squireInstance = untrack(() => props.squireInstance);
        console.log('Format command:', command, 'Squire instance:', squireInstance, 'Is editing:', props.isEditing);
        
        if (squireInstance) {
            // Ensure Squire has focus before applying formatting
            squireInstance.focus();
            
            switch (command) {
                case 'bold':
                    squireInstance.bold();
                    break;
                case 'italic':
                    squireInstance.italic();
                    break;
                case 'underline':
                    squireInstance.underline();
                    break;
                case 'strikethrough':
                    squireInstance.strikethrough();
                    break;
                case 'link':
                    const url = prompt('Enter URL:');
                    if (url) squireInstance.makeLink(url);
                    break;
                case 'unlink':
                    squireInstance.removeLink();
                    break;
                case 'code':
                    // Use browser execCommand for code formatting since Squire doesn't have direct code() method
                    document.execCommand('fontName', false, 'monospace');
                    break;
                case 'unorderedList':
                    squireInstance.makeUnorderedList();
                    break;
                case 'orderedList':
                    squireInstance.makeOrderedList();
                    break;
                case 'quote':
                    squireInstance.increaseQuoteLevel();
                    break;
                case 'removeQuote':
                    squireInstance.decreaseQuoteLevel();
                    break;
                case 'alignLeft':
                    squireInstance.setTextAlignment('left');
                    break;
                case 'alignCenter':
                    squireInstance.setTextAlignment('center');
                    break;
                case 'alignRight':
                    squireInstance.setTextAlignment('right');
                    break;
            }
            console.log('Applied formatting:', command);
        } else {
            console.warn('No Squire instance available for formatting');
        }
    };

  return (
    <div class="w-full p-2 bg-gray-50 rounded border">
      <div class="flex flex-wrap items-center gap-1.5">
        {/* Text Formatting Group - only show when editing and Squire is available */}
        <Show when={props.isEditing && props.squireInstance && isTextBlock()}>
          <div class="flex items-center bg-white rounded border px-1 py-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => formatText('bold')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm font-medium"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm italic"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => formatText('underline')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm underline"
              title="Underline"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => formatText('strikethrough')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm line-through"
              title="Strikethrough"
            >
              S
            </button>
          </div>

          {/* Lists Group */}
          <div class="flex items-center bg-white rounded border px-1 py-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => formatText('unorderedList')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Bullet List"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => formatText('orderedList')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          {/* Alignment Group */}
          <div class="flex items-center bg-white rounded border px-1 py-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => formatText('alignLeft')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Align Left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => formatText('alignCenter')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Align Center"
            >
              ↔
            </button>
            <button
              type="button"
              onClick={() => formatText('alignRight')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Align Right"
            >
              →
            </button>
          </div>

          {/* Additional Tools Group */}
          <div class="flex items-center bg-white rounded border px-1 py-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => formatText('link')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Insert Link"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => formatText('code')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm font-mono"
              title="Code"
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              onClick={() => formatText('quote')}
              class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
              title="Quote"
            >
              "
            </button>
          </div>
        </Show>

        {/* Block Actions - always visible */}
        <div class="flex items-center bg-white rounded border px-1 py-0.5 gap-0.5 ml-auto">
          {/* Add block controls here */}
        </div>
      </div>
    </div>
  );
}