import { createSignal, For, Show, type JSX } from "solid-js";
import type { BlockRegistry, BlockDefinition, BlockContent } from "~/lib/types";
import type { BlockPattern } from "~/lib/pattern-types";
import { getPatternRegistry, getAllPatternCategories } from "~/lib/pattern-registry";
import { PatternInserter } from "./pattern-inserter";

interface BlockInserterProps {
    position: number;
    onInsert: (blockType: string, content?: BlockContent) => void;
    onInsertPattern?: (pattern: BlockPattern) => void;
    blockRegistry: BlockRegistry;
    showTitle?: boolean;
}

export function BlockInserter(props: BlockInserterProps): JSX.Element {
    const [isOpen, setIsOpen] = createSignal(false);
    const [searchTerm, setSearchTerm] = createSignal('');
    const [activeTab, setActiveTab] = createSignal<'blocks' | 'patterns'>('blocks');
    
    const patterns = () => Object.values(getPatternRegistry());
    const patternCategories = () => getAllPatternCategories();

    const categories = () => {
        const cats = new Set<string>();
        Object.values(props.blockRegistry).forEach(block => cats.add(block.category));
        return Array.from(cats).sort();
    };

    const filteredBlocks = () => {
        const search = searchTerm().toLowerCase();
        return Object.values(props.blockRegistry).filter(block => 
            block.title.toLowerCase().includes(search) ||
            block.description?.toLowerCase().includes(search) ||
            block.category.toLowerCase().includes(search)
        );
    };

    const blocksByCategory = () => {
        const blocks = filteredBlocks();
        const grouped: Record<string, BlockDefinition[]> = {};
        
        blocks.forEach(block => {
            if (!grouped[block.category]) {
                grouped[block.category] = [];
            }
            grouped[block.category].push(block);
        });
        
        return grouped;
    };

    const insertBlock = (blockType: string) => {
        props.onInsert(blockType);
        setIsOpen(false);
        setSearchTerm('');
    };

    const insertPattern = (pattern: BlockPattern) => {
        if (props.onInsertPattern) {
            props.onInsertPattern(pattern);
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    const closeInserter = () => {
        setIsOpen(false);
        setSearchTerm('');
        setActiveTab('blocks');
    };

    return (
        <div class="block-inserter relative">
            <Show when={!isOpen()}>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    class="w-full p-4 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl text-gray-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center space-x-3 group"
                    style={{
                        background: "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.4) 100%)",
                        "backdrop-filter": "blur(10px)"
                    }}
                >
                    <span class="plus-icon text-2xl font-light group-hover:scale-110 transition-transform duration-200">+</span>
                    <span class="font-medium">
                        {props.showTitle ? 'Click to add your first block' : 'Add block'}
                    </span>
                </button>
            </Show>

            <Show when={isOpen()}>
                {/* Modal overlay */}
                <div 
                    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={closeInserter}
                >
                    <div 
                        class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.95) 100%)",
                            "backdrop-filter": "blur(20px)"
                        }}
                    >
                        {/* Modal header */}
                        <div class="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 class="text-xl font-semibold text-gray-900">Add Block</h2>
                            <button
                                type="button"
                                onClick={closeInserter}
                                class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Modal content */}
                        <div class="p-6 overflow-y-auto max-h-[60vh]">
                        <div class="mb-4">
                            <div class="flex border-b border-gray-200 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('blocks')}
                                    class={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${
                                        activeTab() === 'blocks'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    🧱 Blocks
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('patterns')}
                                    class={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${
                                        activeTab() === 'patterns'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    🎨 Patterns
                                </button>
                            </div>
                            
                            <Show when={activeTab() === 'blocks'}>
                                <input
                                    type="text"
                                    placeholder="Search blocks..."
                                    value={searchTerm()}
                                    onInput={(e) => setSearchTerm(e.currentTarget.value)}
                                    class="block-picker-search"
                                    autofocus
                                />
                            </Show>
                        </div>

                        <Show when={activeTab() === 'blocks'}>
                            <Show 
                                when={searchTerm() === ''}
                                fallback={
                                    <div class="space-y-4">
                                        <Show when={filteredBlocks().length === 0}>
                                            <div class="text-center py-8 text-gray-500">
                                                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <p>No blocks found matching "{searchTerm()}"</p>
                                            </div>
                                        </Show>
                                        <For each={filteredBlocks()}>
                                            {(block) => (
                                                <BlockItem 
                                                    block={block} 
                                                    onClick={() => insertBlock(block.type)}
                                                />
                                            )}
                                        </For>
                                    </div>
                                }
                            >
                                <div class="space-y-6">
                                    <For each={categories()}>
                                        {(category) => (
                                            <div>
                                                <h3 class="block-category-header">
                                                    {category}
                                                </h3>
                                                <div class="space-y-4">
                                                    <For each={blocksByCategory()[category] || []}>
                                                        {(block) => (
                                                            <BlockItem 
                                                                block={block} 
                                                                onClick={() => insertBlock(block.type)}
                                                            />
                                                        )}
                                                    </For>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </Show>

                        <Show when={activeTab() === 'patterns'}>
                            <PatternInserter
                                patterns={patterns()}
                                categories={patternCategories()}
                                onInsertPattern={insertPattern}
                                onClose={closeInserter}
                            />
                        </Show>

                        
                        <Show when={activeTab() === 'blocks'}>
                            <div class="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                                <div class="text-gray-400">
                                    {Object.keys(props.blockRegistry).length} blocks available
                                </div>
                                <button
                                    type="button"
                                    onClick={closeInserter}
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </Show>
                        
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}

interface BlockItemProps {
    block: BlockDefinition;
    onClick: () => void;
}

function BlockItem(props: BlockItemProps): JSX.Element {
    return (
        <button
            type="button"
            onClick={props.onClick}
            class="group w-full text-left p-6 border-2 border-gray-200 hover:border-blue-400 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.6) 100%)"
            }}
        >
            <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                        <span class="text-2xl">{props.block.icon}</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-lg font-semibold text-gray-900 mb-1">
                        {props.block.title}
                    </div>
                    <div class="text-gray-600 leading-relaxed">
                        {props.block.description}
                    </div>
                </div>
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
            </div>
        </button>
    );
}