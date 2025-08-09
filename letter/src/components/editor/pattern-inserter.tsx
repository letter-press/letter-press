import { createSignal, For, Show, type JSX } from "solid-js";
import type { BlockPattern, PatternCategory } from "~/lib/pattern-types";
import type { BlockContent } from "~/lib/types";

interface PatternInserterProps {
    patterns: BlockPattern[];
    categories: PatternCategory[];
    onInsertPattern: (pattern: BlockPattern) => void;
    onClose: () => void;
}

export function PatternInserter(props: PatternInserterProps): JSX.Element {
    const [searchTerm, setSearchTerm] = createSignal('');
    const [selectedCategory, setSelectedCategory] = createSignal<string>('all');

    const filteredPatterns = () => {
        const search = searchTerm().toLowerCase();
        let patterns = props.patterns;

        // Filter by category
        if (selectedCategory() !== 'all') {
            patterns = patterns.filter(pattern => pattern.category === selectedCategory());
        }

        // Filter by search term
        if (search) {
            patterns = patterns.filter(pattern => {
                const searchText = [
                    pattern.title,
                    pattern.description,
                    ...(pattern.keywords || [])
                ].join(' ').toLowerCase();
                return searchText.includes(search);
            });
        }

        return patterns;
    };

    const insertPattern = (pattern: BlockPattern) => {
        props.onInsertPattern(pattern);
    };

    return (
        <div class="pattern-inserter">
            <div 
                class="pattern-inserter-content"
                style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.9) 100%)",
                    "backdrop-filter": "blur(20px)"
                }}
            >
                <div class="pattern-header mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Block Patterns</h3>
                    <p class="text-sm text-gray-600">Choose from pre-designed block combinations to quickly build your content.</p>
                </div>

                <div class="mb-4">
                    <input
                        type="text"
                        placeholder="Search patterns..."
                        value={searchTerm()}
                        onInput={(e) => setSearchTerm(e.currentTarget.value)}
                        class="block-picker-search"
                        autofocus
                    />
                </div>

                <div class="mb-4">
                    <div class="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            class={`px-3 py-1 text-sm rounded-full transition-colors duration-150 ${
                                selectedCategory() === 'all'
                                    ? 'bg-blue-100 text-blue-800 font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <For each={props.categories}>
                            {(category) => (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory(category.name)}
                                    class={`px-3 py-1 text-sm rounded-full transition-colors duration-150 ${
                                        selectedCategory() === category.name
                                            ? 'bg-blue-100 text-blue-800 font-medium'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {category.icon} {category.title}
                                </button>
                            )}
                        </For>
                    </div>
                </div>

                <div class="pattern-grid space-y-4 max-h-96 overflow-y-auto">
                    <Show when={filteredPatterns().length === 0}>
                        <div class="text-center py-8 text-gray-500">
                            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <p class="text-sm">No patterns found matching your criteria</p>
                        </div>
                    </Show>
                    
                    <For each={filteredPatterns()}>
                        {(pattern) => (
                            <PatternItem 
                                pattern={pattern} 
                                onClick={() => insertPattern(pattern)}
                            />
                        )}
                    </For>
                </div>

                <div class="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div class="text-xs text-gray-400">
                        {filteredPatterns().length} patterns available
                    </div>
                    <button
                        type="button"
                        onClick={props.onClose}
                        class="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

interface PatternItemProps {
    pattern: BlockPattern;
    onClick: () => void;
}

function PatternItem(props: PatternItemProps): JSX.Element {
    return (
        <button
            type="button"
            onClick={props.onClick}
            class="pattern-item w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-150"
            style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.6) 100%)"
            }}
        >
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span class="text-lg">{props.pattern.icon}</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 mb-1">
                        {props.pattern.title}
                    </div>
                    <div class="text-sm text-gray-600 line-clamp-2">
                        {props.pattern.description}
                    </div>
                    <Show when={props.pattern.keywords && props.pattern.keywords.length > 0}>
                        <div class="mt-2 flex flex-wrap gap-1">
                            <For each={props.pattern.keywords?.slice(0, 3)}>
                                {(keyword) => (
                                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                        {keyword}
                                    </span>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
                <div class="flex-shrink-0">
                    <div class="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {props.pattern.blocks.length} blocks
                    </div>
                </div>
            </div>
        </button>
    );
}