import { createSignal, Show, type JSX } from "solid-js";
import { MediaLibrary } from "./media-library";
import type { Media } from "@prisma/client";

interface MediaPickerProps {
    onSelect: (media: Media) => void;
    onCancel: () => void;
    filterType?: 'image' | 'video' | 'audio' | 'document';
    title?: string;
}

export function MediaPicker(props: MediaPickerProps): JSX.Element {
    const [selectedMedia, setSelectedMedia] = createSignal<Media | null>(null);

    const handleSelect = (media: Media) => {
        setSelectedMedia(media);
    };

    const handleConfirm = () => {
        const media = selectedMedia();
        if (media) {
            props.onSelect(media);
        }
    };

    return (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] mx-4 overflow-hidden">
                {/* Header */}
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-gray-900">
                        {props.title || 'Select Media'}
                    </h2>
                    <button
                        type="button"
                        onClick={props.onCancel}
                        class="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <MediaLibrary
                        onSelect={handleSelect}
                        filterType={props.filterType}
                        className="media-picker-library"
                    />
                </div>

                {/* Footer */}
                <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div class="text-sm text-gray-600">
                        <Show when={selectedMedia()}>
                            {(media) => (
                                <span>Selected: {media().title || media().fileName}</span>
                            )}
                        </Show>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button
                            type="button"
                            onClick={props.onCancel}
                            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!selectedMedia()}
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Select Media
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MediaPickerButtonProps {
    onSelect: (media: Media) => void;
    filterType?: 'image' | 'video' | 'audio' | 'document';
    title?: string;
    children?: JSX.Element;
    className?: string;
}

export function MediaPickerButton(props: MediaPickerButtonProps): JSX.Element {
    const [isOpen, setIsOpen] = createSignal(false);

    const handleSelect = (media: Media) => {
        props.onSelect(media);
        setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                class={props.className || "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"}
            >
                {props.children || "Select Media"}
            </button>

            <Show when={isOpen()}>
                <MediaPicker
                    onSelect={handleSelect}
                    onCancel={() => setIsOpen(false)}
                    filterType={props.filterType}
                    title={props.title}
                />
            </Show>
        </>
    );
}