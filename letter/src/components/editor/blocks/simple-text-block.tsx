import { createSignal, createEffect, type JSX } from "solid-js";
import type { ParagraphBlockContent, BlockAttributes } from "~/lib/types";
import { useTheme } from "~/lib/theme-manager";

interface SimpleTextBlockProps {
    block: {
        content?: ParagraphBlockContent;
        attributes?: BlockAttributes;
    };
    isSelected: boolean;
    isEditing: boolean;
    readonly?: boolean;
    onUpdate: (content: ParagraphBlockContent, attributes?: BlockAttributes) => void;
    onStopEditing: () => void;
    onSquireReady?: () => void;
    onDuplicate?: () => void;
    onRemove?: () => void;
    onDragStart?: (e: DragEvent) => void;
    onDragEnd?: () => void;
}

export function SimpleTextBlock(props: SimpleTextBlockProps): JSX.Element {
    const [text, setText] = createSignal(props.block.content?.text || '');
    const theme = useTheme();
    let inputRef: HTMLDivElement | undefined;

    createEffect(() => {
        if (props.block.content?.text !== undefined) {
            setText(props.block.content.text);
        }
    });

    createEffect(() => {
        if (props.isEditing && inputRef) {
            inputRef.focus();
            // Place cursor at end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(inputRef);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    });

    const handleInput = (e: Event) => {
        const target = e.target as HTMLDivElement;
        const newText = target.textContent || '';
        setText(newText);
        
        props.onUpdate({
            text: newText,
            html: newText,
            format: {
                color: props.block.content?.format?.color || undefined,
                backgroundColor: props.block.content?.format?.backgroundColor || undefined,
            },
        }, props.block.attributes);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            props.onStopEditing();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            props.onStopEditing();
        }
    };

    const handleBlur = () => {
        if (props.isEditing) {
            props.onStopEditing();
        }
    };

    // Get theme colors for styling
    const colors = theme.getThemeColors();

    return (
        <div class="block-wrapper" classList={{ selected: props.isSelected }}>
            {/* Topbar */}
            <div class="block-topbar">
                <div class="block-controls-left">
                    <button 
                        type="button"
                        class="block-control-btn drag-handle" 
                        title="Drag to reorder"
                        draggable={true}
                        onDragStart={props.onDragStart}
                        onDragEnd={props.onDragEnd}
                    >
                        ⋮⋮
                    </button>
                    <span class="block-type-label">Text</span>
                </div>
                <div class="block-controls-right">
                    <button 
                        type="button"
                        class="block-control-btn" 
                        onClick={props.onDuplicate}
                        title="Duplicate block"
                    >
                        ⧉
                    </button>
                    <button 
                        type="button"
                        class="block-control-btn block-remove" 
                        onClick={props.onRemove}
                        title="Remove block"
                        style={{ color: colors.error }}
                    >
                        ×
                    </button>
                </div>
            </div>
            
            {/* Content area */}
            <div class="block-content">
                <div
                    ref={inputRef}
                    class="simple-text-input"
                    contentEditable={props.isEditing && !props.readonly}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    innerHTML={text() || ''}
                    data-placeholder="Type some text..."
                    style={{
                        color: props.block.content?.format?.color || colors.text,
                        "background-color": props.block.content?.format?.backgroundColor || 'transparent',
                        "border-left": props.isSelected ? `3px solid ${colors.primary}` : 'none',
                        "padding-left": props.isSelected ? '1rem' : '0',
                        transition: 'all 150ms ease-in-out',
                    }}
                />
            </div>
        </div>
    );
}