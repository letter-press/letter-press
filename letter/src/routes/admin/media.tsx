import { createResource, type JSX } from "solid-js";
import { getMediaLibrary } from "~/lib/media-actions";
import { MediaLibrary } from "~/components/ui/media-library";
import { PageHeader } from "~/components/ui/page-header";

export default function MediaPage(): JSX.Element {
    return (
        <div class="media-admin-page">
            <PageHeader
                title="Media Library"
            />
            
            <div class="mt-8">
                <MediaLibrary />
            </div>
        </div>
    );
}