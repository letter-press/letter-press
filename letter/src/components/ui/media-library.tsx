import { createSignal, createResource, For, Show, onMount, type JSX } from "solid-js";
import { uploadMedia, getMediaLibrary, updateMedia, deleteMedia } from "~/lib/media-actions";
import type { Media } from "@prisma/client";

interface MediaLibraryProps {
    onSelect?: (media: Media) => void;
    allowMultiple?: boolean;
    filterType?: 'image' | 'video' | 'audio' | 'document';
    className?: string;
}

interface MediaWithPosts extends Media {
    posts: Array<{
        id: number;
        title: string;
        slug: string;
    }>;
}

export function MediaLibrary(props: MediaLibraryProps): JSX.Element {
    const [selectedMedia, setSelectedMedia] = createSignal<Media[]>([]);
    const [searchTerm, setSearchTerm] = createSignal('');
    const [currentPage, setCurrentPage] = createSignal(1);
    const [filterType, setFilterType] = createSignal(props.filterType || '');
    const [isUploading, setIsUploading] = createSignal(false);
    const [editingMedia, setEditingMedia] = createSignal<Media | null>(null);

    // Load media library
    const [mediaLibrary, { refetch }] = createResource(
        () => ({
            page: currentPage(),
            search: searchTerm(),
            type: filterType(),
        }),
        getMediaLibrary
    );

    const handleFileUpload = async (files: FileList) => {
        if (!files.length) return;

        setIsUploading(true);
        
        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                await uploadMedia(formData);
            } catch (error) {
                console.error('Upload failed:', error);
                // You might want to show a toast notification here
            }
        }
        
        setIsUploading(false);
        refetch();
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files) {
            handleFileUpload(files);
        }
    };

    const selectMedia = (media: Media) => {
        if (props.allowMultiple) {
            const selected = selectedMedia();
            const isSelected = selected.some(m => m.id === media.id);
            
            if (isSelected) {
                setSelectedMedia(selected.filter(m => m.id !== media.id));
            } else {
                setSelectedMedia([...selected, media]);
            }
        } else {
            setSelectedMedia([media]);
            props.onSelect?.(media);
        }
    };

    const isSelected = (media: Media) => {
        return selectedMedia().some(m => m.id === media.id);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getMediaType = (fileType: string) => {
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('video/')) return 'video';
        if (fileType.startsWith('audio/')) return 'audio';
        return 'document';
    };

    const handleUpdateMedia = async (media: Media, updates: { title?: string; caption?: string; altText?: string }) => {
        try {
            await updateMedia(media.id, updates);
            setEditingMedia(null);
            refetch();
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const handleDeleteMedia = async (media: Media) => {
        if (confirm(`Are you sure you want to delete "${media.fileName}"?`)) {
            try {
                await deleteMedia(media.id);
                refetch();
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    return (
        <div class={`media-library ${props.className || ''}`}>
            {/* Header */}
            <div class="media-library-header mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold text-gray-900">Media Library</h2>
                    
                    <label class="media-upload-button">
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                            onChange={(e) => {
                                const files = e.currentTarget.files;
                                if (files) handleFileUpload(files);
                            }}
                            class="hidden"
                        />
                        <span class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                            {isUploading() ? 'Uploading...' : 'Upload Files'}
                        </span>
                    </label>
                </div>

                {/* Search and Filters */}
                <div class="flex space-x-4">
                    <input
                        type="text"
                        placeholder="Search media..."
                        value={searchTerm()}
                        onInput={(e) => setSearchTerm(e.currentTarget.value)}
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <select
                        value={filterType()}
                        onChange={(e) => setFilterType(e.currentTarget.value)}
                        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="audio">Audio</option>
                        <option value="application">Documents</option>
                    </select>
                </div>
            </div>

            {/* Upload Drop Zone */}
            <div
                class="media-drop-zone mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:border-blue-400"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div class="text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p class="text-lg font-medium">Drop files here to upload</p>
                    <p class="text-sm">Or click "Upload Files" above</p>
                </div>
            </div>

            {/* Media Grid */}
            <Show when={mediaLibrary()}>
                {(library) => (
                    <>
                        <div class="media-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                            <For each={library().media}>
                                {(media: MediaWithPosts) => (
                                    <MediaItem
                                        media={media}
                                        isSelected={isSelected(media)}
                                        onSelect={() => selectMedia(media)}
                                        onEdit={() => setEditingMedia(media)}
                                        onDelete={() => handleDeleteMedia(media)}
                                    />
                                )}
                            </For>
                        </div>

                        {/* Pagination */}
                        <Show when={library().pagination.totalPages > 1}>
                            <div class="media-pagination flex items-center justify-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage() - 1))}
                                    disabled={!library().pagination.hasPrev}
                                    class="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                
                                <span class="px-3 py-2 text-sm text-gray-600">
                                    Page {library().pagination.page} of {library().pagination.totalPages}
                                </span>
                                
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(currentPage() + 1)}
                                    disabled={!library().pagination.hasNext}
                                    class="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </Show>
                    </>
                )}
            </Show>

            {/* Media Edit Modal */}
            <Show when={editingMedia()}>
                {(media) => (
                    <MediaEditModal
                        media={media()}
                        onSave={(updates) => handleUpdateMedia(media(), updates)}
                        onCancel={() => setEditingMedia(null)}
                    />
                )}
            </Show>
        </div>
    );
}

interface MediaItemProps {
    media: MediaWithPosts;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function MediaItem(props: MediaItemProps): JSX.Element {
    const getMediaType = (fileType: string) => {
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('video/')) return 'video';
        if (fileType.startsWith('audio/')) return 'audio';
        return 'document';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const mediaType = getMediaType(props.media.fileType);

    return (
        <div
            class={`media-item relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                props.isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
            onClick={props.onSelect}
        >
            {/* Media Preview */}
            <div class="media-preview aspect-square bg-gray-100 flex items-center justify-center">
                <Show
                    when={mediaType === 'image'}
                    fallback={
                        <div class="text-gray-400 text-center">
                            <div class="text-2xl mb-1">
                                {mediaType === 'video' && '🎥'}
                                {mediaType === 'audio' && '🎵'}
                                {mediaType === 'document' && '📄'}
                            </div>
                            <div class="text-xs font-medium">{props.media.fileType.split('/')[1]?.toUpperCase()}</div>
                        </div>
                    }
                >
                    <img
                        src={props.media.filePath}
                        alt={props.media.altText || props.media.title || props.media.fileName}
                        class="w-full h-full object-cover"
                        loading="lazy"
                    />
                </Show>
            </div>

            {/* Media Info */}
            <div class="media-info p-2">
                <div class="text-xs font-medium text-gray-900 truncate" title={props.media.title || props.media.fileName}>
                    {props.media.title || props.media.fileName}
                </div>
                <div class="text-xs text-gray-500">
                    {formatFileSize(props.media.fileSize)}
                </div>
            </div>

            {/* Actions */}
            <div class="media-actions absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="flex space-x-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onEdit();
                        }}
                        class="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                        title="Edit"
                    >
                        <svg class="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onDelete();
                        }}
                        class="p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-600"
                        title="Delete"
                    >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Selection Indicator */}
            <Show when={props.isSelected}>
                <div class="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </Show>
        </div>
    );
}

interface MediaEditModalProps {
    media: Media;
    onSave: (updates: { title?: string; caption?: string; altText?: string }) => void;
    onCancel: () => void;
}

function MediaEditModal(props: MediaEditModalProps): JSX.Element {
    const [title, setTitle] = createSignal(props.media.title || '');
    const [caption, setCaption] = createSignal(props.media.caption || '');
    const [altText, setAltText] = createSignal(props.media.altText || '');

    const handleSave = () => {
        props.onSave({
            title: title(),
            caption: caption(),
            altText: altText(),
        });
    };

    return (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Media</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title()}
                            onInput={(e) => setTitle(e.currentTarget.value)}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                        <textarea
                            value={caption()}
                            onInput={(e) => setCaption(e.currentTarget.value)}
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                        <input
                            type="text"
                            value={altText()}
                            onInput={(e) => setAltText(e.currentTarget.value)}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe this image for accessibility"
                        />
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={props.onCancel}
                        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}