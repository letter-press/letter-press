import { createSignal, Show, type JSX } from "solid-js";

interface SEOFieldsProps {
    title: string;
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    focusKeyword?: string;
    onMetaTitleChange: (value: string) => void;
    onMetaDescriptionChange: (value: string) => void;
    onSlugChange?: (value: string) => void;
    onFocusKeywordChange?: (value: string) => void;
    showSlugField?: boolean;
}

export function SEOFields(props: SEOFieldsProps): JSX.Element {
    const [expanded, setExpanded] = createSignal(false);

    // Calculate character counts and status
    const titleLength = () => props.metaTitle?.length || 0;
    const descriptionLength = () => props.metaDescription?.length || 0;
    
    const titleStatus = () => {
        const len = titleLength();
        if (len === 0) return { color: 'text-gray-500', message: 'No meta title' };
        if (len < 30) return { color: 'text-yellow-600', message: 'Too short' };
        if (len > 60) return { color: 'text-red-600', message: 'Too long' };
        return { color: 'text-green-600', message: 'Good length' };
    };

    const descriptionStatus = () => {
        const len = descriptionLength();
        if (len === 0) return { color: 'text-gray-500', message: 'No meta description' };
        if (len < 120) return { color: 'text-yellow-600', message: 'Too short' };
        if (len > 160) return { color: 'text-red-600', message: 'Too long' };
        return { color: 'text-green-600', message: 'Good length' };
    };

    const generateSlugFromTitle = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100);
    };

    return (
        <div class="seo-fields bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    SEO & Social Media
                </h3>
                <button
                    onClick={() => setExpanded(!expanded())}
                    class="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                    {expanded() ? 'Collapse' : 'Expand'}
                </button>
            </div>

            {/* SEO Status Overview */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">Meta Title</span>
                        <span class={`text-xs ${titleStatus().color}`}>
                            {titleLength()}/60 - {titleStatus().message}
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                            class={`h-2 rounded-full transition-all ${
                                titleLength() === 0 ? 'bg-gray-300' :
                                titleLength() < 30 ? 'bg-yellow-400' :
                                titleLength() > 60 ? 'bg-red-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min((titleLength() / 60) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">Meta Description</span>
                        <span class={`text-xs ${descriptionStatus().color}`}>
                            {descriptionLength()}/160 - {descriptionStatus().message}
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                            class={`h-2 rounded-full transition-all ${
                                descriptionLength() === 0 ? 'bg-gray-300' :
                                descriptionLength() < 120 ? 'bg-yellow-400' :
                                descriptionLength() > 160 ? 'bg-red-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min((descriptionLength() / 160) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <Show when={expanded()}>
                <div class="space-y-4">
                    {/* Meta Title */}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Meta Title
                            <span class="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            value={props.metaTitle || ''}
                            onInput={(e) => props.onMetaTitleChange(e.currentTarget.value)}
                            placeholder={`Use a custom title or default to: "${props.title}"`}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p class="text-xs text-gray-500 mt-1">
                            The title that appears in search engine results. Keep it between 30-60 characters.
                        </p>
                    </div>

                    {/* Meta Description */}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Meta Description
                            <span class="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                            value={props.metaDescription || ''}
                            onInput={(e) => props.onMetaDescriptionChange(e.currentTarget.value)}
                            placeholder="Write a compelling description that encourages clicks from search results"
                            rows={3}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                        />
                        <p class="text-xs text-gray-500 mt-1">
                            The description that appears in search engine results. Keep it between 120-160 characters.
                        </p>
                    </div>

                    {/* Focus Keyword */}
                    <Show when={props.onFocusKeywordChange}>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Focus Keyword (Optional)
                            </label>
                            <input
                                type="text"
                                value={props.focusKeyword || ''}
                                onInput={(e) => props.onFocusKeywordChange!(e.currentTarget.value)}
                                placeholder="e.g., 'best coffee beans'"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p class="text-xs text-gray-500 mt-1">
                                The main keyword you want this content to rank for. This helps with SEO analysis.
                            </p>
                        </div>
                    </Show>

                    {/* URL Slug */}
                    <Show when={props.showSlugField && props.onSlugChange}>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                URL Slug
                            </label>
                            <div class="flex items-center space-x-2">
                                <span class="text-sm text-gray-500">yoursite.com/</span>
                                <input
                                    type="text"
                                    value={props.slug || ''}
                                    onInput={(e) => props.onSlugChange!(e.currentTarget.value)}
                                    placeholder="url-friendly-slug"
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    onClick={() => props.onSlugChange!(generateSlugFromTitle(props.title))}
                                    class="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="Generate from title"
                                >
                                    Generate
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                                The URL-friendly version of your title. Use lowercase letters, numbers, and hyphens only.
                            </p>
                        </div>
                    </Show>

                    {/* Search Engine Preview */}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Search Engine Preview
                        </label>
                        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div class="text-blue-600 text-lg hover:underline cursor-pointer">
                                {props.metaTitle || props.title || 'Your Page Title'}
                            </div>
                            <div class="text-green-700 text-sm">
                                yoursite.com/{props.slug || 'page-url'}
                            </div>
                            <div class="text-gray-600 text-sm mt-1">
                                {props.metaDescription || 'Your meta description will appear here. Make it compelling to encourage clicks from search results.'}
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            This is how your page might appear in Google search results.
                        </p>
                    </div>

                    {/* SEO Tips */}
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-blue-900 mb-2">💡 SEO Tips</h4>
                        <ul class="text-xs text-blue-800 space-y-1">
                            <li>• Include your main keyword in the title and description</li>
                            <li>• Write for humans first, search engines second</li>
                            <li>• Make your title and description unique and compelling</li>
                            <li>• Avoid keyword stuffing - it can hurt your rankings</li>
                            <li>• Test your titles and descriptions to see what works best</li>
                        </ul>
                    </div>
                </div>
            </Show>
        </div>
    );
}