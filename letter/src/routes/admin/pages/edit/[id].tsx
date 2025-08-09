import { createSignal } from "solid-js";
import { useNavigate, useParams, query, createAsync } from "@solidjs/router";
import AdminLayout from "../../layout";
import { getCustomFieldsForPostType } from "../../../../lib/admin-server-functions";
import { requireAdmin } from "~/lib/auth-utils";
import { getPost, updatePost } from "~/lib";
import { PageForm, type PageFormData } from "~/components/forms/page-form";
import { PageHeader } from "~/components/ui/page-header";
import { tryCatch } from "~/lib/try-catch";

// Query the session check
const getSession = query(async () => {
  "use server";
  const session = await requireAdmin();
  return session;
}, "session");

// Query the page data
const getPageData = query(async (id: string) => {
  "use server";
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    return { error: new Error("Invalid page ID") };
  }
  return await getPost(numericId);
}, "pageData");

// Query custom fields
const getCustomFields = query(async () => {
  "use server";
  return await getCustomFieldsForPostType("page");
}, "customFields");

export default function EditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Server-side data fetching - all resolved on server
  const session = createAsync(() => getSession());
  const pageData = createAsync(() => getPageData(params.id));
  const customFieldDefs = createAsync(() => getCustomFields());

  const handleSubmit = async (formData: PageFormData) => {
    setIsSubmitting(true);

    const result = await tryCatch(async () => {
      const currentUser = session();
      if (!currentUser?.user?.id) {
        throw new Error("You must be logged in to update a page");
      }

        return await updatePost({
          id: parseInt(params.id),
          title: formData.title,
          content: formData.content || undefined,
          excerpt: formData.excerpt || undefined,
          slug: formData.slug,
          status: formData.status,
          publishedAt: formData.status === "PUBLISHED" ? new Date() : undefined,
          blocks: formData.blocks,
        });
    });

    if (result.error) {
      alert(`Error updating page: ${result.error.message}`);
    } else {
      alert("Page updated successfully!");
      navigate("/admin/pages");
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    navigate("/admin/pages");
  };

  // Helper functions for safe data access
  const getPageDataSafe = () => {
    const data = pageData();
    return data && 'data' in data ? data.data : null;
  };

  const getCustomFieldsSafe = () => {
    const data = customFieldDefs();
    return data && 'data' in data ? data.data : [];
  };

  // Since getSession() throws redirect on server if no user, session().user will always exist
  const user = session()?.user;

  return (
    <AdminLayout user={user!}>
      <div class="p-6">
        <div class="max-w-4xl mx-auto">
          <PageHeader 
            title="Edit Page" 
            backLink={{ href: "/admin/pages", label: "Back to Pages" }}
          />

          <PageForm
            initialData={getPageDataSafe()}
            customFields={getCustomFieldsSafe()}
            isSubmitting={isSubmitting()}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
