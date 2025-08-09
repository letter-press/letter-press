import { For, Show, createSignal, createEffect } from "solid-js";
import type { PostStatus } from "@prisma/client";
import type {
  CustomFieldDefinition,
  ContentBlockWithChildren,
} from "~/lib/types";
import { BlockEditor } from "~/components/editor/block-editor";

// Define a simplified interface for the page data we actually need
interface PageData {
  id?: number;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  slug?: string;
  status?: PostStatus;
  blocks?: ContentBlockWithChildren[];
  postMeta?: Array<{
    metaKey: string;
    metaValue?: string | null;
  }>;
}

interface PageFormProps {
  initialData?: PageData | null;
  customFields?: CustomFieldDefinition[];
  isSubmitting: boolean;
  onSubmit: (data: PageFormData) => Promise<void>;
  onCancel: () => void;
}

export interface PageFormData {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: PostStatus;
  blocks: ContentBlockWithChildren[];
  customFields: Record<
    string,
    string | number | boolean | string[] | undefined
  >;
}

export function PageForm(props: PageFormProps) {
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal(""); // Legacy content for backward compatibility
  const [excerpt, setExcerpt] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [status, setStatus] = createSignal<PostStatus>("DRAFT");
  const [blocks, setBlocks] = createSignal<ContentBlockWithChildren[]>([]);
  const [customFields, setCustomFields] = createSignal<
    Record<string, string | number | boolean | string[] | undefined>
  >({});
  const [isInitialized, setIsInitialized] = createSignal(false);
  const [useBlockEditor, setUseBlockEditor] = createSignal(true);

  // Initialize form with data
  createEffect(() => {
    const data = props.initialData;
    if (data && !isInitialized()) {
      setTitle(data.title || "");
      setContent(data.content || "");
      setExcerpt(data.excerpt || "");
      setSlug(data.slug || "");
      setStatus(data.status || "DRAFT");

      if (data.blocks && data.blocks.length > 0) {
        setBlocks(data.blocks);
        setUseBlockEditor(true);
      } else if (data.content) {
        // Convert legacy content to blocks
        const legacyBlock: ContentBlockWithChildren = {
          id: 1,
          postId: data.id || 0,
          blockType: "PARAGRAPH",
          customType: null,
          order: 0,
          parentId: null,
          content: { text: data.content },
          attributes: {},
          pluginId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setBlocks([legacyBlock]);
      }

      if (data.postMeta) {
        const meta: Record<
          string,
          string | number | boolean | string[] | undefined
        > = {};
        for (const item of data.postMeta) {
          meta[item.metaKey] = item.metaValue || "";
        }
        setCustomFields(meta);
      }
      setIsInitialized(true);
    }
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug() || slug() === generateSlug(title())) {
      setSlug(generateSlug(value));
    }
  };

  const handleBlocksChange = (newBlocks: ContentBlockWithChildren[]) => {
    setBlocks(newBlocks);

    // Update legacy content field with plain text from blocks for backward compatibility
    const textContent = newBlocks
      .map((block) => {
        if (block.blockType === "PARAGRAPH" && block.content) {
          return (block.content as any).text || "";
        }
        if (block.blockType === "HEADING" && block.content) {
          return (block.content as any).text || "";
        }
        return "";
      })
      .filter((text) => text)
      .join("\n\n");

    setContent(textContent);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const formData: PageFormData = {
      title: title(),
      content: content(),
      excerpt: excerpt(),
      slug: slug(),
      status: status(),
      blocks: blocks(),
      customFields: customFields(),
    };

    await props.onSubmit(formData);
  };

  const toggleEditor = () => {
    if (useBlockEditor()) {
      // Convert blocks to legacy content
      const textContent = blocks()
        .map((block) => {
          if (block.blockType === "PARAGRAPH" && block.content) {
            return (block.content as any).text || "";
          }
          if (block.blockType === "HEADING" && block.content) {
            return (block.content as any).text || "";
          }
          return "";
        })
        .filter((text) => text)
        .join("\n\n");
      setContent(textContent);
    } else {
      // Convert legacy content to blocks
      if (content()) {
        const legacyBlock: ContentBlockWithChildren = {
          id: Date.now(),
          postId: 0,
          blockType: "PARAGRAPH",
          customType: null,
          order: 0,
          parentId: null,
          content: { text: content() },
          attributes: {},
          pluginId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setBlocks([legacyBlock]);
      }
    }
    setUseBlockEditor(!useBlockEditor());
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Title */}
        <div class="mb-6">
          <label
            for="title"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Page Title *
          </label>
          <input
            type="text"
            id="title"
            value={title()}
            onInput={(e) => handleTitleChange(e.currentTarget.value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="Enter page title"
            required
          />
        </div>

        {/* Slug */}
        <div class="mb-6">
          <label
            for="slug"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            URL Slug *
          </label>
          <div class="flex">
            <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              /pages/
            </span>
            <input
              type="text"
              id="slug"
              value={slug()}
              onInput={(e) => setSlug(e.currentTarget.value)}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="page-url-slug"
              required
            />
          </div>
        </div>

        {/* Content Editor Toggle */}
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Content</h3>
          <button
            type="button"
            onClick={toggleEditor}
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            {useBlockEditor()
              ? "Switch to Text Editor"
              : "Switch to Block Editor"}
          </button>
        </div>

        {/* Content Editor */}
        <div class="mb-6">
          <Show
            when={useBlockEditor()}
            fallback={
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Content (Plain Text)
                </label>
                <textarea
                  value={content()}
                  onInput={(e) => setContent(e.currentTarget.value)}
                  rows={15}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your content here..."
                />
              </div>
            }
          >
            <div class="border border-gray-300 rounded-lg overflow-hidden">
              <div class="bg-gray-50 px-4 py-2 border-b border-gray-300">
                <span class="text-sm font-medium text-gray-700">
                  Block Editor
                </span>
              </div>
              <div class="">
                <BlockEditor
                  initialBlocks={blocks()}
                  onChange={handleBlocksChange}
                  className=""
                />
              </div>
            </div>
          </Show>
        </div>

        {/* Excerpt */}
        <div class="mb-6">
          <label
            for="excerpt"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={excerpt()}
            onInput={(e) => setExcerpt(e.currentTarget.value)}
            rows={3}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of the page (optional)"
          />
        </div>

        {/* Custom Fields */}
        <Show when={props.customFields?.length}>
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Custom Fields
            </h3>
            <div class="space-y-4">
              <For each={props.customFields}>
                {(field) => (
                  <div>
                    <label
                      for={`custom-field-${field.name}`}
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {field.label}
                    </label>
                    <Show when={field.type === "TEXT"}>
                      <input
                        type="text"
                        id={`custom-field-${field.name}`}
                        value={(customFields()[field.name] as string) || ""}
                        onInput={(e) =>
                          setCustomFields({
                            ...customFields(),
                            [field.name]: e.currentTarget.value,
                          })
                        }
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </Show>
                    <Show when={field.type === "TEXTAREA"}>
                      <textarea
                        id={`custom-field-${field.name}`}
                        value={(customFields()[field.name] as string) || ""}
                        onInput={(e) =>
                          setCustomFields({
                            ...customFields(),
                            [field.name]: e.currentTarget.value,
                          })
                        }
                        rows={5}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Status */}
        <div class="mb-6">
          <label
            for="status"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={status()}
            onChange={(e) => setStatus(e.currentTarget.value as PostStatus)}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="PRIVATE">Private</option>
            <option value="REVIEW">Review</option>
          </select>
        </div>
      </div>

      {/* Submit */}
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          onClick={props.onCancel}
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={props.isSubmitting}
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {props.isSubmitting ? "Updating..." : "Update Page"}
        </button>
      </div>
    </form>
  );
}
