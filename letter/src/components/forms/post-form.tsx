import { For, Show, createSignal, createEffect } from "solid-js";
import type { PostStatus, PostType } from "@prisma/client";
import type { CustomFieldDefinition, ContentBlockWithChildren } from "~/lib/types";
import { BlockEditor } from "~/components/editor/block-editor";
import { CustomFieldRenderer } from "./custom-field-renderer";
import { SEOFields } from "~/components/seo/seo-fields";
import { SEOAnalyzer } from "~/components/seo/seo-analyzer";

// Define a simplified interface for the post data we actually need
interface PostData {
  id?: number;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  slug?: string;
  status?: PostStatus;
  type?: PostType;
  blocks?: ContentBlockWithChildren[];
  postMeta?: Array<{
    metaKey: string;
    metaValue?: string | null;
  }>;
}

interface PostFormProps {
  initialData?: PostData | null;
  customFields?: CustomFieldDefinition[];
  isSubmitting: boolean;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  type?: 'POST' | 'PAGE';
}

export interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: PostStatus;
  type: 'POST' | 'PAGE';
  blocks: ContentBlockWithChildren[];
  customFields: Record<string, string | number | boolean | string[] | undefined>;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
}

export function PostForm(props: PostFormProps) {
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal(""); // Legacy content for backward compatibility
  const [excerpt, setExcerpt] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [status, setStatus] = createSignal<PostStatus>("DRAFT");
  const [blocks, setBlocks] = createSignal<ContentBlockWithChildren[]>([]);
  const [customFields, setCustomFields] = createSignal<
    Record<string, string | number | boolean | string[] | undefined>
  >({});
  const [metaTitle, setMetaTitle] = createSignal("");
  const [metaDescription, setMetaDescription] = createSignal("");
  const [focusKeyword, setFocusKeyword] = createSignal("");
  const [isInitialized, setIsInitialized] = createSignal(false);

  const postType = () => props.type || 'POST';

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
      } else if (data.content) {
        // Convert legacy content to blocks
        const legacyBlock: ContentBlockWithChildren = {
          id: 1,
          postId: data.id || 0,
          blockType: 'PARAGRAPH',
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
        const meta: Record<string, string | number | boolean | string[] | undefined> = {};
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
      .map(block => {
        if ((block.blockType === 'PARAGRAPH' || block.blockType === 'RICH_TEXT') && block.content) {
          const content = block.content as any;
          return content.text || content.html || '';
        }
        if (block.blockType === 'HEADING' && block.content) {
          const content = block.content as any;
          return content.text || content.html || '';
        }
        return '';
      })
      .filter(text => text)
      .join('\n\n');
    
    setContent(textContent);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    const formData: PostFormData = {
      title: title(),
      content: content(),
      excerpt: excerpt(),
      slug: slug(),
      status: status(),
      type: postType(),
      blocks: blocks(),
      customFields: customFields(),
      metaTitle: metaTitle(),
      metaDescription: metaDescription(),
      focusKeyword: focusKeyword(),
    };

    await props.onSubmit(formData);
  };

  const toggleEditor = () => {
    // No longer needed - always use block editor
  };

  return (
    <div class="max-w-none mx-auto">
      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Header section with title and slug */}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label
                for="title"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                {postType() === 'POST' ? 'Post Title' : 'Page Title'} *
              </label>
              <input
                type="text"
                id="title"
                value={title()}
                onInput={(e) => handleTitleChange(e.currentTarget.value)}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                placeholder={`Enter ${postType().toLowerCase()} title`}
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label
                for="slug"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                URL Slug *
              </label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {postType() === 'POST' ? '/posts/' : '/pages/'}
                </span>
                <input
                  type="text"
                  id="slug"
                  value={slug()}
                  onInput={(e) => setSlug(e.currentTarget.value)}
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="url-slug"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content editor - expanded */}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Content Editor
              </h3>
              <div class="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                Rich Text Editor
              </div>
            </div>
          </div>
          <div class="p-4">
            <BlockEditor
              initialBlocks={blocks()}
              onChange={handleBlocksChange}
              className="min-h-[600px] focus:outline-none"
            />
          </div>
        </div>

        {/* Side panel for metadata */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Excerpt */}
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label
                for="excerpt"
                class="block text-sm font-medium text-gray-700 mb-3"
              >
                <svg class="w-4 h-4 inline mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Excerpt (Optional)
              </label>
              <textarea
                id="excerpt"
                value={excerpt()}
                onInput={(e) => setExcerpt(e.currentTarget.value)}
                rows={4}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder={`Brief description of the ${postType().toLowerCase()} that will appear in previews and search results`}
              />
            </div>
          </div>

          {/* Right column - Status and actions */}
          <div class="space-y-4">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label
                for="status"
                class="block text-sm font-medium text-gray-700 mb-3"
              >
                <svg class="w-4 h-4 inline mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Publication Status
              </label>
              <select
                id="status"
                value={status()}
                onChange={(e) => setStatus(e.currentTarget.value as PostStatus)}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">📝 Draft</option>
                <option value="PUBLISHED">🌐 Published</option>
                <option value="PRIVATE">🔒 Private</option>
                <option value="REVIEW">👀 Review</option>
              </select>
            </div>

            {/* Action buttons */}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div class="space-y-3">
                <button
                  type="submit"
                  disabled={props.isSubmitting}
                  class="w-full px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {props.isSubmitting 
                    ? (
                      <span class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {props.initialData ? 'Updating...' : 'Creating...'}
                      </span>
                    )
                    : `✅ ${props.initialData ? 'Update' : 'Create'} ${postType() === 'POST' ? 'Post' : 'Page'}`
                  }
                </button>
                <button
                  type="button"
                  onClick={props.onCancel}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Fields */}
        <SEOFields
          title={title()}
          metaTitle={metaTitle()}
          metaDescription={metaDescription()}
          slug={slug()}
          focusKeyword={focusKeyword()}
          onMetaTitleChange={setMetaTitle}
          onMetaDescriptionChange={setMetaDescription}
          onSlugChange={setSlug}
          onFocusKeywordChange={setFocusKeyword}
          showSlugField={true}
        />

        {/* SEO Analyzer */}
        <Show when={content() || blocks().length > 0}>
          <SEOAnalyzer
            title={title()}
            content={content()}
            metaTitle={metaTitle()}
            metaDescription={metaDescription()}
            slug={slug()}
            focusKeyword={focusKeyword()}
          />
        </Show>

        {/* Custom Fields */}
        <Show when={props.customFields?.length}>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Custom Fields
            </h3>
            <CustomFieldRenderer
              fields={props.customFields || []}
              values={customFields()}
              onChange={(fieldName, value) => {
                setCustomFields({
                  ...customFields(),
                  [fieldName]: value
                });
              }}
            />
          </div>
        </Show>
      </form>
    </div>
  );
}