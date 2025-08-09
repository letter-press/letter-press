import { createSignal, onMount, onCleanup, Show, createEffect } from "solid-js";
import type { BlockContent, BlockAttributes, ContentBlockWithChildren } from "~/lib/types";
import { ClientOnly } from "~/components/ui/client-only";

// Basic types for compatibility
export interface SquireInstance {
  focus(): void;
  getHTML(): string;
  setHTML(html: string): void;
  bold(): void;
  italic(): void;
  underline(): void;
  strikethrough(): void;
  undo(): void;
  redo(): void;
  makeLink(url: string): void;
  removeLink(): void;
  makeUnorderedList(): void;
  makeOrderedList(): void;
  increaseQuoteLevel(): void;
  decreaseQuoteLevel(): void;
  setTextAlignment(alignment: string): void;
}

export function RichTextToolbar(props: {
  quire?: SquireInstance | null;
  visible?: boolean;
  onClose?: () => void;
  compact?: boolean;
}) {
  return (
    <div class="rich-text-toolbar">
      {/* Placeholder toolbar */}
    </div>
  );
}

export function RichTextBlock(props: {
  block: ContentBlockWithChildren;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: BlockContent, attributes?: BlockAttributes) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
}) {
  // Get the current content, ensuring it has the right structure
  const getBlockContent = () => {
    const content = props.block.content as any;
    if (!content) return { text: "", html: "", format: {} };
    
    // Handle different content formats
    if (typeof content === 'string') {
      return { text: content, html: content, format: {} };
    }
    
    return {
      text: content.text || "",
      html: content.html || content.text || "",
      format: content.format || {}
    };
  };

  const [content, setContent] = createSignal(getBlockContent());
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [squire, setSquire] = createSignal<any>(null);
  const [showLinkDialog, setShowLinkDialog] = createSignal(false);
  const [linkUrl, setLinkUrl] = createSignal("");

  createEffect(() => {
    if (props.block.content !== undefined) {
      setContent(getBlockContent());
    }
  });

  const handleContentChange = (html: string) => {
    // Use ClientOnly approach for DOM manipulation to prevent hydration issues
    if (typeof document === 'undefined') return;
    
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = div.textContent || "";
    
    const newContent = { 
      text, 
      html, 
      format: content().format || {} 
    };
    
    setContent(newContent);
    props.onUpdate(newContent, props.block.attributes as BlockAttributes);
  };

  return (
    <div class="block-wrapper">
      <div class="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="cursor-move"
            draggable={true}
            onDragStart={props.onDragStart}
            onDragEnd={props.onDragEnd}
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
          <span class="text-sm text-gray-600">Rich Text</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            onClick={props.onDuplicate}
            class="p-1 text-gray-500 hover:text-gray-700"
            title="Duplicate"
          >
            ⧉
          </button>
          <button
            type="button"
            onClick={props.onRemove}
            class="p-1 text-gray-500 hover:text-red-600"
            title="Remove"
          >
            ×
          </button>
        </div>
      </div>

      <Show when={props.isEditing}>
        <ClientOnly fallback={<div class="p-2 border-b bg-gray-50 text-sm text-gray-500">Loading editor...</div>}>
          <SquireToolbar squire={squire} onShowLinkDialog={() => setShowLinkDialog(true)} />
        </ClientOnly>
      </Show>

      <div class="p-4">
        <ClientOnly 
          fallback={
            <div 
              class="min-h-[3rem] p-2 border rounded text-gray-600 bg-gray-50"
              innerHTML={content().html || content().text || "Rich text content will load shortly..."}
            />
          }
        >
          <SquireEditor
            content={content()}
            isEditing={props.isEditing}
            onContentChange={handleContentChange}
            onSetSquire={setSquire}
            onSetContainer={setContainer}
          />
        </ClientOnly>
      </div>

      <Show when={showLinkDialog()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded p-4 w-80">
            <h3 class="font-medium mb-2">Insert Link</h3>
            <input
              type="url"
              value={linkUrl()}
              onInput={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              class="w-full p-2 border rounded mb-3"
            />
            <div class="flex gap-2 justify-end">
              <button
                onClick={() => setShowLinkDialog(false)}
                class="px-3 py-1 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (linkUrl() && squire()) {
                    squire().makeLink(linkUrl());
                    setShowLinkDialog(false);
                    setLinkUrl("");
                  }
                }}
                disabled={!linkUrl()}
                class="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

// Separated Squire editor component to run only on client
function SquireEditor(props: {
  content: any;
  isEditing: boolean;
  onContentChange: (html: string) => void;
  onSetSquire: (instance: any) => void;
  onSetContainer: (el: HTMLDivElement) => void;
}) {
  const [container, setContainer] = createSignal<HTMLDivElement>();

  onMount(async () => {
    const containerEl = container();
    if (!containerEl) return;

    props.onSetContainer(containerEl);

    try {
      const { default: Squire } = await import("squire-rte");
      const instance = new Squire(containerEl, {
        blockTag: "div",
        tagAttributes: {
          ul: { class: "list-disc list-inside space-y-1" },
          ol: { class: "list-decimal list-inside space-y-1" },
          a: { class: "text-blue-600 hover:text-blue-800 underline" },
          strong: { class: "font-bold" },
          em: { class: "italic" },
          u: { class: "underline" },
          s: { class: "line-through" },
          blockquote: { class: "border-l-4 border-gray-300 pl-4 italic text-gray-600" },
        },
      });

      props.onSetSquire(instance);
      
      // Set initial content
      if (props.content.html) {
        instance.setHTML(props.content.html);
      }
      
      instance.addEventListener("input", () => {
        props.onContentChange(instance.getHTML());
      });

      instance.addEventListener("keydown", (e: Event) => {
        const keyboardEvent = e as KeyboardEvent;
        if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
          switch (keyboardEvent.key.toLowerCase()) {
            case "b": keyboardEvent.preventDefault(); instance.bold(); break;
            case "i": keyboardEvent.preventDefault(); instance.italic(); break;
            case "u": keyboardEvent.preventDefault(); instance.underline(); break;
            case "z": keyboardEvent.preventDefault(); keyboardEvent.shiftKey ? instance.redo() : instance.undo(); break;
          }
        }
      });

      containerEl.addEventListener("click", (e) => e.stopPropagation());
      containerEl.addEventListener("mousedown", (e) => e.stopPropagation());
      containerEl.contentEditable = props.isEditing ? "true" : "false";
    } catch (error) {
      console.error("Failed to load Squire:", error);
      if (containerEl) {
        containerEl.contentEditable = "true";
        containerEl.addEventListener("input", () => {
          props.onContentChange(containerEl.innerHTML);
        });
      }
    }
  });

  onCleanup(() => {
    // Cleanup will be handled by parent component
  });

  return (
    <div
      ref={setContainer}
      class="min-h-[3rem] focus:outline-none"
      style={{ "min-height": "1.5rem", outline: "none" }}
    />
  );
}

// Separated toolbar component
function SquireToolbar(props: {
  squire: () => any;
  onShowLinkDialog: () => void;
}) {
  return (
    <div class="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
      <button
        type="button"
        onClick={() => props.squire()?.bold()}
        class="p-1 rounded hover:bg-gray-200"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.italic()}
        class="p-1 rounded hover:bg-gray-200"
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.underline()}
        class="p-1 rounded hover:bg-gray-200"
        title="Underline"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.strikethrough()}
        class="p-1 rounded hover:bg-gray-200"
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <div class="w-px h-4 bg-gray-300 mx-1" />
      <select
        onChange={(e) => {
          const value = e.target.value;
          if (value === "h1") props.squire()?.setFontSize("2em");
          else if (value === "h2") props.squire()?.setFontSize("1.5em");
          else if (value === "h3") props.squire()?.setFontSize("1.25em");
          else props.squire()?.setFontSize("1em");
        }}
        class="text-sm border rounded px-2 py-1"
        title="Heading"
      >
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <div class="w-px h-4 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => props.squire()?.makeUnorderedList()}
        class="p-1 rounded hover:bg-gray-200"
        title="Bullet List"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.makeOrderedList()}
        class="p-1 rounded hover:bg-gray-200"
        title="Numbered List"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.increaseQuoteLevel()}
        class="p-1 rounded hover:bg-gray-200"
        title="Quote"
      >
        "
      </button>
      <div class="w-px h-4 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => props.squire()?.setTextAlignment("left")}
        class="p-1 rounded hover:bg-gray-200"
        title="Align Left"
      >
        ⬅
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.setTextAlignment("center")}
        class="p-1 rounded hover:bg-gray-200"
        title="Align Center"
      >
        ↔
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.setTextAlignment("right")}
        class="p-1 rounded hover:bg-gray-200"
        title="Align Right"
      >
        ➡
      </button>
      <div class="w-px h-4 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={props.onShowLinkDialog}
        class="p-1 rounded hover:bg-gray-200"
        title="Link"
      >
        🔗
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.removeLink()}
        class="p-1 rounded hover:bg-gray-200"
        title="Remove Link"
      >
        🔗⃠
      </button>
      <div class="w-px h-4 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => props.squire()?.undo()}
        class="p-1 rounded hover:bg-gray-200"
        title="Undo"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => props.squire()?.redo()}
        class="p-1 rounded hover:bg-gray-200"
        title="Redo"
      >
        ↷
      </button>
    </div>
  );
}
