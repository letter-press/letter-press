import { createEffect, onMount, createSignal, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";

export function HtmlEditor(props: {
  value: string;
  onChange: (value: string) => void;
}) {
  let editorRef: HTMLDivElement | undefined;
  const [isMounted, setIsMounted] = createSignal(false);
  let editor: any = null;

  onMount(() => {
    setIsMounted(true);
  });

  onCleanup(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });

  createEffect(async () => {
    if (isServer || !isMounted() || !editorRef) return;
    
    try {
      // Clean up existing editor
      if (editor) {
        editor.destroy();
        editor = null;
      }

      // Dynamic imports to avoid SSR issues
      const [{ default: Squire }, { default: DOMPurify }] = await Promise.all([
        import("squire-rte"),
        import("dompurify")
      ]);
      
      // Initialize editor with better configuration
      editor = new Squire(editorRef, {
        blockTag: "p",
        blockAttributes: {},
        tagAttributes: {
          blockquote: {},
          ul: {},
          ol: {},
          li: {},
          a: { rel: "noopener" }
        },
        sanitizeToDOMFragment: (html: string) => {
          return DOMPurify.sanitize(html, {
            RETURN_DOM_FRAGMENT: true,
            ALLOWED_TAGS: [
              'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
              'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code'
            ],
            ALLOWED_ATTR: ['href', 'title', 'rel']
          });
        },
      });

      // Set initial content
      editor.setHTML(props.value || "");

      // Handle content changes with debouncing
      let timeoutId: ReturnType<typeof setTimeout>;
      const handleInput = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const html = editor.getHTML();
          props.onChange(html);
        }, 300);
      };

      // Use passive listeners for performance optimization
      editor.addEventListener("input", handleInput, { passive: true });
      editor.addEventListener("pathChange", handleInput, { passive: true });

      // Add some basic styling
      if (editorRef) {
        editorRef.style.minHeight = "200px";
        editorRef.style.padding = "12px";
        editorRef.style.border = "1px solid #d1d5db";
        editorRef.style.borderRadius = "6px";
        editorRef.style.outline = "none";

        // Focus/blur handlers for visual feedback - use passive for performance
        editor.addEventListener("focus", () => {
          if (editorRef) {
            editorRef.style.borderColor = "#3b82f6";
            editorRef.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.1)";
          }
        }, { passive: true });

        editor.addEventListener("blur", () => {
          if (editorRef) {
            editorRef.style.borderColor = "#d1d5db";
            editorRef.style.boxShadow = "none";
          }
        }, { passive: true });
      }

    } catch (error) {
      console.error("Failed to initialize HTML editor:", error);
    }
  });

  // Update editor content when props change
  createEffect(() => {
    if (editor && props.value !== editor.getHTML()) {
      editor.setHTML(props.value || "");
    }
  });

  return (
    <div class="html-editor-container">
      {!isServer && isMounted() ? (
        <div>
          {/* Simple toolbar */}
          <div class="border border-gray-300 border-b-0 rounded-t-md bg-gray-50 px-3 py-2 flex gap-2">
            <button
              type="button"
              onClick={() => editor?.bold()}
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => editor?.italic()}
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => editor?.underline()}
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              title="Underline"
            >
              <u>U</u>
            </button>
            <div class="border-l border-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => editor?.makeUnorderedList()}
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              title="Bullet List"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => editor?.makeOrderedList()}
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              title="Numbered List"
            >
              1.
            </button>
          </div>
          <div ref={editorRef} class="html-editor rounded-b-md"></div>
        </div>
      ) : (
        <textarea
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={10}
          placeholder="Loading rich text editor..."
        />
      )}
    </div>
  );
}
