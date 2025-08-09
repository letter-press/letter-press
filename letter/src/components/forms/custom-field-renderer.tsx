import { For, Show, createSignal, type JSX } from "solid-js";
import type { CustomFieldDefinition } from "~/lib/types";
import { MediaPicker } from "~/components/ui/media-picker";

interface CustomFieldRendererProps {
    fields: CustomFieldDefinition[];
    values: Record<string, any>;
    onChange: (fieldName: string, value: any) => void;
    errors?: Record<string, string>;
}

export function CustomFieldRenderer(props: CustomFieldRendererProps): JSX.Element {
    return (
        <div class="custom-fields-renderer space-y-4">
            <For each={props.fields}>
                {(field) => (
                    <CustomFieldInput
                        field={field}
                        value={props.values[field.name]}
                        onChange={(value) => props.onChange(field.name, value)}
                        error={props.errors?.[field.name]}
                    />
                )}
            </For>
        </div>
    );
}

interface CustomFieldInputProps {
    field: CustomFieldDefinition;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

function CustomFieldInput(props: CustomFieldInputProps): JSX.Element {
    const [showMediaPicker, setShowMediaPicker] = createSignal(false);

    const getFieldIcon = () => {
        switch (props.field.type) {
            case 'TEXT': return '📝';
            case 'TEXTAREA': return '📄';
            case 'NUMBER': return '🔢';
            case 'DATE': return '📅';
            case 'SELECT': return '📋';
            case 'CHECKBOX': return '☑️';
            case 'JSON': return '🗂️';
            case 'FILE': return '📎';
            case 'FILE_IMAGE': return '🖼️';
            case 'FILE_VIDEO': return '🎥';
            case 'FILE_AUDIO': return '🎵';
            case 'FILE_PDF': return '📕';
            case 'HTML': return '🌐';
            default: return '📝';
        }
    };

    const parseSelectOptions = (options?: string | null): string[] => {
        if (!options) return [];
        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(options);
            if (Array.isArray(parsed)) return parsed;
            return [];
        } catch {
            // Fall back to line-separated options
            return options.split('\n').filter(opt => opt.trim());
        }
    };

    const inputBaseClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const inputClass = props.error 
        ? `${inputBaseClass} border-red-300 focus:ring-red-500 focus:border-red-500`
        : `${inputBaseClass} border-gray-300`;

    return (
        <div class="custom-field-input">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                <span class="mr-2">{getFieldIcon()}</span>
                {props.field.label}
                {props.field.required && <span class="text-red-500 ml-1">*</span>}
            </label>

            {/* Text Input */}
            <Show when={props.field.type === 'TEXT'}>
                <input
                    type="text"
                    value={props.value || ''}
                    onInput={(e) => props.onChange(e.currentTarget.value)}
                    class={inputClass}
                    placeholder={`Enter ${props.field.label.toLowerCase()}`}
                    required={props.field.required}
                />
            </Show>

            {/* Textarea */}
            <Show when={props.field.type === 'TEXTAREA'}>
                <textarea
                    value={props.value || ''}
                    onInput={(e) => props.onChange(e.currentTarget.value)}
                    rows={4}
                    class={`${inputClass} resize-y`}
                    placeholder={`Enter ${props.field.label.toLowerCase()}`}
                    required={props.field.required}
                />
            </Show>

            {/* Number Input */}
            <Show when={props.field.type === 'NUMBER'}>
                <input
                    type="number"
                    value={props.value || ''}
                    onInput={(e) => props.onChange(Number(e.currentTarget.value))}
                    class={inputClass}
                    placeholder={`Enter ${props.field.label.toLowerCase()}`}
                    required={props.field.required}
                />
            </Show>

            {/* Date Input */}
            <Show when={props.field.type === 'DATE'}>
                <input
                    type="date"
                    value={props.value || ''}
                    onInput={(e) => props.onChange(e.currentTarget.value)}
                    class={inputClass}
                    required={props.field.required}
                />
            </Show>

            {/* Select Dropdown */}
            <Show when={props.field.type === 'SELECT'}>
                <select
                    value={props.value || ''}
                    onChange={(e) => props.onChange(e.currentTarget.value)}
                    class={inputClass}
                    required={props.field.required}
                >
                    <option value="">Choose an option...</option>
                    <For each={parseSelectOptions(props.field.options)}>
                        {(option) => (
                            <option value={option}>{option}</option>
                        )}
                    </For>
                </select>
            </Show>

            {/* Checkbox */}
            <Show when={props.field.type === 'CHECKBOX'}>
                <div class="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={Boolean(props.value)}
                        onChange={(e) => props.onChange(e.currentTarget.checked)}
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-600">
                        Check to enable {props.field.label.toLowerCase()}
                    </span>
                </div>
            </Show>

            {/* File Upload - Images */}
            <Show when={props.field.type === 'FILE_IMAGE'}>
                <div class="space-y-2">
                    <Show when={props.value}>
                        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <img
                                src={props.value}
                                alt="Selected image"
                                class="w-16 h-16 object-cover rounded"
                            />
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900">Image selected</p>
                                <p class="text-xs text-gray-500">{props.value}</p>
                            </div>
                            <button
                                onClick={() => props.onChange(null)}
                                class="text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button>
                        </div>
                    </Show>
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        class="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                        📷 Choose Image
                    </button>
                </div>
            </Show>

            {/* File Upload - General */}
            <Show when={['FILE', 'FILE_VIDEO', 'FILE_AUDIO', 'FILE_PDF'].includes(props.field.type)}>
                <div class="space-y-2">
                    <Show when={props.value}>
                        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div class="text-2xl">
                                {props.field.type === 'FILE_VIDEO' && '🎥'}
                                {props.field.type === 'FILE_AUDIO' && '🎵'}
                                {props.field.type === 'FILE_PDF' && '📕'}
                                {props.field.type === 'FILE' && '📎'}
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900">File selected</p>
                                <p class="text-xs text-gray-500">{props.value}</p>
                            </div>
                            <button
                                onClick={() => props.onChange(null)}
                                class="text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button>
                        </div>
                    </Show>
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        class="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                        {getFieldIcon()} Choose File
                    </button>
                </div>
            </Show>

            {/* JSON Data */}
            <Show when={props.field.type === 'JSON'}>
                <textarea
                    value={typeof props.value === 'string' ? props.value : JSON.stringify(props.value || {}, null, 2)}
                    onInput={(e) => {
                        try {
                            const parsed = JSON.parse(e.currentTarget.value);
                            props.onChange(parsed);
                        } catch {
                            props.onChange(e.currentTarget.value);
                        }
                    }}
                    rows={6}
                    class={`${inputClass} resize-y font-mono text-sm`}
                    placeholder='{"key": "value"}'
                    required={props.field.required}
                />
                <p class="text-xs text-gray-500 mt-1">
                    Enter valid JSON data
                </p>
            </Show>

            {/* HTML Content */}
            <Show when={props.field.type === 'HTML'}>
                <textarea
                    value={props.value || ''}
                    onInput={(e) => props.onChange(e.currentTarget.value)}
                    rows={6}
                    class={`${inputClass} resize-y font-mono text-sm`}
                    placeholder="<div>HTML content here</div>"
                    required={props.field.required}
                />
                <p class="text-xs text-gray-500 mt-1">
                    Enter HTML markup
                </p>
            </Show>

            {/* Error Message */}
            <Show when={props.error}>
                <p class="text-sm text-red-600 mt-1">{props.error}</p>
            </Show>

            {/* Media Picker Modal */}
            <Show when={showMediaPicker()}>
                <MediaPicker
                    onSelect={(media) => {
                        props.onChange(media.filePath);
                        setShowMediaPicker(false);
                    }}
                    onCancel={() => { setShowMediaPicker(false); }}
                    filterType={
                        props.field.type === 'FILE_IMAGE' ? 'image' :
                        props.field.type === 'FILE_VIDEO' ? 'video' :
                        props.field.type === 'FILE_AUDIO' ? 'audio' :
                        undefined
                    }
                />
            </Show>
        </div>
    );
}