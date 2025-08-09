import { createSignal, Show, For, type JSX } from "solid-js";
import { createAsync, action, useAction, type Action } from "@solidjs/router";
import { PageHeader } from "~/components/ui/page-header";
import { CustomFieldBuilder } from "~/components/forms/custom-field-builder";
import AdminLayout from "./layout";
import { getSessionOptional } from "~/lib/auth-utils";
import { db } from "~/lib/db";
import type { CustomField, CustomFieldType } from "@prisma/client";

// Server functions
async function getCustomFieldsData() {
    "use server";
    const session = await getSessionOptional();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const customFields = await db.customField.findMany({
        include: {
            postType: true
        },
        orderBy: { createdAt: 'asc' }
    });

    return { user: session.user, customFields };
}

// Server actions
const saveCustomFields: Action<[CustomFieldDraft[]], void> = action(async (fields: CustomFieldDraft[]) => {
    "use server";
    const session = await getSessionOptional();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Save each field
    for (const field of fields) {
        if (field.id) {
            // Update existing field
            await db.customField.update({
                where: { id: field.id },
                data: {
                    name: field.name,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    options: field.options || null,
                    postTypeId: field.postTypeId || null
                }
            });
        } else {
            // Create new field
            await db.customField.create({
                data: {
                    name: field.name,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    options: field.options || null,
                    postTypeId: field.postTypeId || null
                }
            });
        }
    }
});

const deleteCustomField: Action<[number], void> = action(async (fieldId: number) => {
    "use server";
    const session = await getSessionOptional();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    await db.customField.delete({
        where: { id: fieldId }
    });
});

interface CustomFieldDraft {
    id?: number;
    name: string;
    label: string;
    type: CustomFieldType;
    required: boolean;
    options?: string;
    postTypeId?: number;
}

export default function CustomFieldsPage(): JSX.Element {
    const data = createAsync(() => getCustomFieldsData(), { deferStream: true });
    const saveAction = useAction(saveCustomFields) as any;
    const deleteAction = useAction(deleteCustomField) as any;
    
    const [showBuilder, setShowBuilder] = createSignal(false);
    const [editingField, setEditingField] = createSignal<CustomField | null>(null);

    const user = () => data()?.user;
    const customFields = () => data()?.customFields || [];

    const handleSaveFields = async (fields: CustomFieldDraft[]) => {
        try {
            await saveAction(fields);
            setShowBuilder(false);
            setEditingField(null);
        } catch (error) {
            console.error('Failed to save custom fields:', error);
            alert('Failed to save custom fields. Please try again.');
        }
    };

    const handleDeleteField = async (field: CustomField) => {
        if (!confirm(`Are you sure you want to delete the field "${field.label}"?`)) {
            return;
        }

        try {
            await deleteAction(field.id);
        } catch (error) {
            console.error('Failed to delete field:', error);
            alert('Failed to delete field. Please try again.');
        }
    };

    const getFieldTypeIcon = (type: string) => {
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
        <Show when={user()}>
            <AdminLayout user={user()!}>
                <div class="admin-page">
                    {/* Enhanced Page Header */}
                    <div class="mb-8 p-6 admin-surface-warm border-b-2 border-orange-200">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="p-3 admin-surface-accent rounded-lg border-2 border-blue-200">
                                        <span class="text-2xl">🏷️</span>
                                    </div>
                                    <div>
                                        <h1 class="text-3xl font-bold text-blue-900 mb-1">Custom Fields</h1>
                                        <p class="text-blue-700 font-medium">
                                            Create and manage custom fields for posts and pages
                                        </p>
                                        <div class="flex items-center space-x-4 mt-2 text-sm text-blue-600">
                                            <span class="flex items-center space-x-1">
                                                <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                                                <span>{customFields().length} field{customFields().length !== 1 ? 's' : ''} configured</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-4 sm:mt-0 flex space-x-3">
                                    <Show when={customFields().length > 0}>
                                        <button
                                            class="admin-button-secondary flex items-center space-x-2"
                                            title="Export fields configuration"
                                        >
                                            <span>📤</span>
                                            <span>Export</span>
                                        </button>
                                    </Show>
                                    <button
                                        onClick={() => setShowBuilder(true)}
                                        class="admin-button-primary flex items-center space-x-2"
                                        disabled={saveAction.pending}
                                    >
                                        <Show when={saveAction.pending} fallback={<span>🏷️</span>}>
                                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        </Show>
                                        <span>Add Custom Field</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                <Show when={!showBuilder()}>
                    <div class="max-w-7xl mx-auto px-6">
                        {/* Stats and Overview */}
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div class="admin-surface-blue border-2 border-blue-200 rounded-xl p-6 text-center">
                                <div class="text-3xl font-bold text-blue-900 mb-1">{customFields().length}</div>
                                <div class="text-sm font-medium text-blue-700">Total Fields</div>
                            </div>
                            <div class="admin-surface-accent border-2 border-green-200 rounded-xl p-6 text-center">
                                <div class="text-3xl font-bold text-green-900 mb-1">
                                    {customFields().filter(f => f.required).length}
                                </div>
                                <div class="text-sm font-medium text-green-700">Required Fields</div>
                            </div>
                            <div class="admin-surface-warm border-2 border-orange-200 rounded-xl p-6 text-center">
                                <div class="text-3xl font-bold text-orange-900 mb-1">
                                    {new Set(customFields().map(f => f.type)).size}
                                </div>
                                <div class="text-sm font-medium text-orange-700">Field Types</div>
                            </div>
                        </div>

                        {/* Custom Fields Grid */}
                        <div class="admin-container admin-surface-blue border-2 border-blue-200 rounded-xl shadow-lg">
                            <div class="p-6 border-b-2 border-blue-200 admin-surface-accent">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-2xl">📋</span>
                                        <div>
                                            <h2 class="text-xl font-bold text-blue-900">Field Configuration</h2>
                                            <p class="text-sm text-blue-700 mt-1">
                                                Manage your custom field definitions
                                            </p>
                                        </div>
                                    </div>
                                    <Show when={customFields().length > 0}>
                                        <div class="flex items-center space-x-2">
                                            <button class="admin-button-secondary text-sm">
                                                <span class="mr-1">🔄</span>
                                                Refresh
                                            </button>
                                            <button
                                                onClick={() => setShowBuilder(true)}
                                                class="admin-button-primary text-sm"
                                            >
                                                <span class="mr-1">➕</span>
                                                Add Field
                                            </button>
                                        </div>
                                    </Show>
                                </div>
                            </div>

                            <div class="p-6">
                                <Show 
                                    when={customFields().length > 0}
                                    fallback={
                                        <div class="text-center py-12 admin-surface-warm rounded-xl border-2 border-orange-200 mx-4">
                                            <div class="max-w-md mx-auto">
                                                <div class="inline-flex items-center justify-center w-16 h-16 admin-surface-accent rounded-full border-2 border-orange-300 mb-4">
                                                    <span class="text-2xl">🏷️</span>
                                                </div>
                                                <h3 class="text-xl font-bold text-orange-900 mb-2">No custom fields yet</h3>
                                                <p class="text-sm text-orange-700 mb-6 leading-relaxed">
                                                    Custom fields allow you to add extra data to your posts and pages. 
                                                    Create your first field to get started!
                                                </p>
                                                <button
                                                    onClick={() => setShowBuilder(true)}
                                                    class="admin-button-primary inline-flex items-center space-x-2"
                                                >
                                                    <span>🚀</span>
                                                    <span>Create Your First Field</span>
                                                </button>
                                            </div>
                                        </div>
                                    }
                                >
                                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        <For each={customFields()}>
                                            {(field) => (
                                                <div class="group admin-surface-cool border-2 border-blue-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                                    {/* Background gradient */}
                                                    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    
                                                    {/* Content */}
                                                    <div class="relative z-10">
                                                        {/* Header */}
                                                        <div class="flex items-start justify-between mb-4">
                                                            <div class="flex items-center space-x-3">
                                                                <div class="p-2 admin-surface-accent rounded-lg border-2 border-blue-200 group-hover:border-blue-300 transition-colors duration-200">
                                                                    <span class="text-xl">{getFieldTypeIcon(field.type)}</span>
                                                                </div>
                                                                <div>
                                                                    <h3 class="font-bold text-blue-900 text-lg group-hover:text-blue-800 transition-colors duration-200">
                                                                        {field.label}
                                                                    </h3>
                                                                    <p class="text-sm text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded border">
                                                                        {field.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div class="flex space-x-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingField(field);
                                                                        setShowBuilder(true);
                                                                    }}
                                                                    class="p-3 text-blue-500 hover:text-blue-700 border-2 border-transparent hover:border-blue-300 rounded-lg transition-all duration-200 hover:transform hover:scale-110 admin-surface-accent hover:shadow-md"
                                                                    title="Edit field"
                                                                >
                                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteField(field)}
                                                                    disabled={deleteAction.pending}
                                                                    class="p-3 text-red-500 hover:text-red-700 border-2 border-transparent hover:border-red-300 rounded-lg transition-all duration-200 hover:transform hover:scale-110 disabled:opacity-50 admin-surface-accent hover:shadow-md"
                                                                    title="Delete field"
                                                                >
                                                                    <Show 
                                                                        when={deleteAction.pending}
                                                                        fallback={
                                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        }
                                                                    >
                                                                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                                    </Show>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Field Details */}
                                                        <div class="space-y-3">
                                                            <div class="p-4 admin-surface-accent rounded-lg border-2 border-blue-100 group-hover:border-blue-200 transition-colors duration-200">
                                                                <div class="grid grid-cols-2 gap-3">
                                                                    <div class="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                                        <div class="text-xs font-medium text-blue-600 mb-1">Type</div>
                                                                        <div class="font-bold text-blue-900 text-sm capitalize">
                                                                            {field.type.toLowerCase().replace('_', ' ')}
                                                                        </div>
                                                                    </div>
                                                                    <div class={`text-center p-2 rounded-lg border ${
                                                                        field.required 
                                                                            ? 'bg-red-50 border-red-200' 
                                                                            : 'bg-green-50 border-green-200'
                                                                    }`}>
                                                                        <div class={`text-xs font-medium mb-1 ${
                                                                            field.required ? 'text-red-600' : 'text-green-600'
                                                                        }`}>
                                                                            Required
                                                                        </div>
                                                                        <div class={`font-bold text-sm flex items-center justify-center space-x-1 ${
                                                                            field.required ? 'text-red-900' : 'text-green-900'
                                                                        }`}>
                                                                            <span>{field.required ? '⚠️' : '✅'}</span>
                                                                            <span>{field.required ? 'Yes' : 'No'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Options preview for select fields */}
                                                                <Show when={field.type === 'SELECT' && field.options}>
                                                                    <div class="mt-3 pt-3 border-t border-blue-200">
                                                                        <div class="text-xs font-medium text-blue-600 mb-2">Options:</div>
                                                                        <div class="flex flex-wrap gap-1">
                                                                            <For each={field.options?.split('\n').slice(0, 3) || []}>
                                                                                {(option) => (
                                                                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border">
                                                                                        {option.trim()}
                                                                                    </span>
                                                                                )}
                                                                            </For>
                                                                            <Show when={(field.options?.split('\n').length || 0) > 3}>
                                                                                <span class="text-xs text-blue-600">
                                                                                    +{(field.options?.split('\n').length || 0) - 3} more
                                                                                </span>
                                                                            </Show>
                                                                        </div>
                                                                    </div>
                                                                </Show>
                                                            </div>
                                                        </div>

                                                        {/* Usage indicator */}
                                                        <div class="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-blue-600">
                                                            <span class="flex items-center space-x-1">
                                                                <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                                <span>Field ID: {field.id}</span>
                                                            </span>
                                                            <span class="opacity-75">
                                                                Created {new Date(field.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </div>
                </Show>

                <Show when={showBuilder()}>
                    <div class="max-w-7xl mx-auto px-6">
                        <CustomFieldBuilder
                            initialFields={editingField() ? [editingField()!] : []}
                            onSave={handleSaveFields}
                            onCancel={() => {
                                setShowBuilder(false);
                                setEditingField(null);
                            }}
                        />
                    </div>
                </Show>
                </div>
            </AdminLayout>
        </Show>
    );
}