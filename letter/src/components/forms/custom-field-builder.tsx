import { For, Show, createSignal, createEffect, type JSX } from "solid-js";
import { createStore } from "solid-js/store";
import type { CustomField, CustomFieldType } from "@prisma/client";

interface CustomFieldBuilderProps {
    onSave: (fields: CustomFieldDraft[]) => void;
    onCancel: () => void;
    initialFields?: CustomField[];
    postTypeId?: number;
}

interface CustomFieldDraft {
    id?: number;
    name: string;
    label: string;
    type: CustomFieldType;
    required: boolean;
    options?: string; // JSON string for select options, validation rules, etc.
    postTypeId?: number;
}

export function CustomFieldBuilder(props: CustomFieldBuilderProps): JSX.Element {
    const [fields, setFields] = createStore<CustomFieldDraft[]>([]);
    const [isInitialized, setIsInitialized] = createSignal(false);

    // Initialize fields from props
    createEffect(() => {
        if (!isInitialized() && props.initialFields) {
            const initialFieldsData = props.initialFields.map(field => ({
                id: field.id,
                name: field.name,
                label: field.label,
                type: field.type,
                required: field.required,
                options: field.options || undefined,
                postTypeId: field.postTypeId || undefined
            }));
            setFields(initialFieldsData);
            setIsInitialized(true);
        }
    });

    const addField = () => {
        const newField: CustomFieldDraft = {
            name: '',
            label: '',
            type: 'TEXT',
            required: false,
            postTypeId: props.postTypeId
        };
        setFields(prev => [...prev, newField]);
    };

    const updateField = (index: number, updates: Partial<CustomFieldDraft>) => {
        setFields(index, updates);
    };

    const removeField = (index: number) => {
        setFields(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        props.onSave(fields);
    };

    const getFieldTypeIcon = (type: CustomFieldType) => {
        switch (type) {
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

    return (
        <div class="custom-field-builder admin-container admin-surface-blue border-2 border-blue-200 rounded-xl shadow-xl">
            <div class="p-6 border-b-2 border-blue-200 admin-surface-accent">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="p-3 admin-surface-warm rounded-lg border-2 border-orange-200">
                            <span class="text-2xl">🔧</span>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-blue-900">Custom Field Builder</h2>
                            <p class="text-sm text-blue-700 mt-1 font-medium">
                                Create and configure custom fields for posts and pages
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={addField}
                        class="admin-button-primary flex items-center space-x-2"
                    >
                        <span>➕</span>
                        <span>Add Field</span>
                    </button>
                </div>
            </div>

            <div class="p-8">
                <Show when={fields.length === 0}>
                    <div class="text-center py-12 admin-surface-warm rounded-xl border-2 border-orange-200 mx-4">
                        <div class="max-w-md mx-auto">
                            <div class="inline-flex items-center justify-center w-20 h-20 admin-surface-accent rounded-full border-2 border-orange-300 mb-6">
                                <span class="text-3xl">⚡</span>
                            </div>
                            <h3 class="text-xl font-bold text-orange-900 mb-3">Ready to build!</h3>
                            <p class="text-sm text-orange-700 mb-6 leading-relaxed">
                                Click "Add Field" above to create your first custom field. You can add multiple fields and configure them as needed.
                            </p>
                            <div class="text-xs text-orange-600 bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <strong>Tip:</strong> Each field will have a unique name and can be required or optional
                            </div>
                        </div>
                    </div>
                </Show>

                <div class="space-y-6">
                    <For each={fields}>
                        {(field, index) => (
                            <CustomFieldEditor
                                field={field}
                                index={index()}
                                onUpdate={(updates) => updateField(index(), updates)}
                                onRemove={() => removeField(index())}
                            />
                        )}
                    </For>
                </div>
            </div>

            <div class="p-6 border-t-2 border-blue-200 admin-surface-cool flex justify-between items-center">
                <div class="flex items-center space-x-3 text-sm text-blue-700">
                    <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span>{fields.length} field{fields.length !== 1 ? 's' : ''} configured</span>
                </div>
                <div class="flex space-x-3">
                    <button
                        onClick={props.onCancel}
                        class="admin-button-secondary flex items-center space-x-2"
                    >
                        <span>❌</span>
                        <span>Cancel</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={fields.length === 0}
                        class="admin-button-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>💾</span>
                        <span>Save Fields</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

interface CustomFieldEditorProps {
    field: CustomFieldDraft;
    index: number;
    onUpdate: (updates: Partial<CustomFieldDraft>) => void;
    onRemove: () => void;
}

function CustomFieldEditor(props: CustomFieldEditorProps): JSX.Element {
    const getFieldTypeIcon = (type: CustomFieldType) => {
        switch (type) {
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

    const generateFieldName = (label: string) => {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
    };

    return (
        <div class="admin-surface-cool border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                    <div class="p-3 admin-surface-accent rounded-lg border-2 border-blue-200">
                        <span class="text-xl">{getFieldTypeIcon(props.field.type)}</span>
                    </div>
                    <div>
                        <span class="font-bold text-blue-900 text-lg">
                            Field #{props.index + 1}
                        </span>
                        <div class="text-sm text-blue-600 mt-1">
                            Configure this field's properties
                        </div>
                    </div>
                </div>
                <button
                    onClick={props.onRemove}
                    class="text-red-600 hover:text-red-800 transition-all duration-200 p-3 border-2 border-transparent hover:border-red-200 rounded-lg hover:transform hover:scale-110 admin-surface-accent hover:shadow-md"
                    title="Remove field"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-2">
                    <label class="block text-sm font-bold text-blue-800 mb-2 flex items-center space-x-2">
                        <span>📝</span>
                        <span>Label *</span>
                    </label>
                    <input
                        type="text"
                        value={props.field.label}
                        onInput={(e) => {
                            const label = e.currentTarget.value;
                            const name = generateFieldName(label);
                            props.onUpdate({ label, name });
                        }}
                        placeholder="Field display name"
                        class="admin-input"
                    />
                    <div class="text-xs text-blue-600 mt-1">
                        This is what users will see when filling out the form
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-bold text-blue-800 mb-2 flex items-center space-x-2">
                        <span>🏷️</span>
                        <span>Name *</span>
                    </label>
                    <input
                        type="text"
                        value={props.field.name}
                        onInput={(e) => props.onUpdate({ name: e.currentTarget.value })}
                        placeholder="field_name"
                        class="admin-input font-mono"
                    />
                    <div class="text-xs text-blue-600 mt-1">
                        Used internally to store the data (no spaces, lowercase)
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-bold text-blue-800 mb-2 flex items-center space-x-2">
                        <span>🎛️</span>
                        <span>Field Type *</span>
                    </label>
                    <select
                        value={props.field.type}
                        onChange={(e) => props.onUpdate({ type: e.currentTarget.value as CustomFieldType })}
                        class="admin-select"
                    >
                        <option value="TEXT">📝 Text</option>
                        <option value="TEXTAREA">📄 Textarea</option>
                        <option value="NUMBER">🔢 Number</option>
                        <option value="DATE">📅 Date</option>
                        <option value="SELECT">📋 Select</option>
                        <option value="CHECKBOX">☑️ Checkbox</option>
                        <option value="FILE_IMAGE">🖼️ Image File</option>
                        <option value="FILE_VIDEO">🎥 Video File</option>
                        <option value="FILE_AUDIO">🎵 Audio File</option>
                        <option value="FILE_PDF">📕 PDF File</option>
                        <option value="FILE">📎 Any File</option>
                        <option value="JSON">🗂️ JSON Data</option>
                        <option value="HTML">🌐 HTML</option>
                    </select>
                    <div class="text-xs text-blue-600 mt-1">
                        Choose the type of data this field will store
                    </div>
                </div>

                <div class="flex items-center justify-center">
                    <div class="p-4 admin-surface-accent rounded-lg border-2 border-blue-200">
                        <label class="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={props.field.required}
                                onChange={(e) => props.onUpdate({ required: e.currentTarget.checked })}
                                class="admin-checkbox scale-125"
                            />
                            <div class="flex items-center space-x-2">
                                <span class="text-lg">{props.field.required ? '⚠️' : '✅'}</span>
                                <span class="text-sm font-bold text-blue-800">Required field</span>
                            </div>
                        </label>
                        <div class="text-xs text-blue-600 mt-2 text-center">
                            Users must fill this field
                        </div>
                    </div>
                </div>
            </div>

            <Show when={props.field.type === 'SELECT'}>
                <div class="mt-6 p-4 admin-surface-accent rounded-lg border-2 border-blue-200">
                    <label class="block text-sm font-bold text-blue-800 mb-3 flex items-center space-x-2">
                        <span>📋</span>
                        <span>Options (one per line)</span>
                    </label>
                    <textarea
                        value={props.field.options || ''}
                        onInput={(e) => props.onUpdate({ options: e.currentTarget.value })}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={4}
                        class="admin-textarea"
                    />
                    <div class="text-xs text-blue-600 mt-2">
                        Each line will be a selectable option for users
                    </div>
                </div>
            </Show>
        </div>
    );
}