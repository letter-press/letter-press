import { createAsync, useNavigate, redirect } from "@solidjs/router";
import { createPage } from "../../../lib";
import { Auth } from "~/server/auth";

/**
 * Creates a new draft page and redirects to the edit page
 * This provides immediate editing capability without requiring initial form submission
 */
export default function NewPage() {
  const navigate = useNavigate();
  
  const session = createAsync(async () => {
    "use server";
    
    const session = await Auth();
    if (!session?.user) {
      throw redirect("/login");
    }
    
    return session;
  }, {
    deferStream: true,
  });

  // Create draft page immediately
  const createDraftPage = async () => {
    const currentUser = session();
    if (!currentUser?.user?.id) {
      navigate("/login");
      return;
    }

    const result = await createPage({
      title: "Untitled Page",
      content: "",
      excerpt: "",
      slug: `untitled-page-${Date.now()}`,
      status: "DRAFT",
      authorId: currentUser.user.id,
      publishedAt: undefined,
    });

    if (result.error) {
      console.error("Failed to create page:", result.error);
      navigate("/admin/pages?error=failed-to-create");
    } else if (result.data?.id) {
      navigate(`/admin/pages/edit/${result.data.id}`);
    } else {
      console.error("Created page but no ID returned");
      navigate("/admin/pages?error=failed-to-create");
    }
  };

  // Trigger draft creation
  createDraftPage();

  // Show loading state while creating
  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <div class="text-6xl mb-4 animate-bounce">📄</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Creating New Page</h2>
        <p class="text-gray-600 mb-6">Setting up your new page draft...</p>
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}
