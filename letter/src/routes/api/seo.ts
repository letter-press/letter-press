import { json } from "@solidjs/router";
import { db } from "~/lib/db";
import { requireAuth } from "~/lib/auth-utils";
import { 
  SEODataSchema,
  PositiveIntegerSchema,
  type SEOData
} from "~/lib/validation-schemas";
import { 
  extractAndValidateJSON,
  extractAndValidateSearchParams,
  createErrorResponse,
  createSuccessResponse,
  validateData
} from "~/lib/validation-utils";

export async function POST({ request }: { request: Request }) {
  try {
    await requireAuth();
    
    const result = await extractAndValidateJSON(request, SEODataSchema, "SEO Data");
    
    if (!result.success) {
      return createErrorResponse(result.error, 400, 'VALIDATION_ERROR');
    }
    
    const data = result.data;

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: data.postId }
    });

    if (!post) {
      return createErrorResponse("Post not found", 404, 'POST_NOT_FOUND');
    }

    // Create or update SEO metadata in PostMeta table
    const seoFields = [
      { key: 'meta_title', value: data.metaTitle },
      { key: 'meta_description', value: data.metaDescription },
      { key: 'focus_keyword', value: data.focusKeyword },
      { key: 'canonical_url', value: data.canonicalUrl },
      { key: 'robots', value: data.robots },
      { key: 'og_title', value: data.ogTitle },
      { key: 'og_description', value: data.ogDescription },
      { key: 'og_image', value: data.ogImage },
      { key: 'twitter_title', value: data.twitterTitle },
      { key: 'twitter_description', value: data.twitterDescription },
      { key: 'twitter_image', value: data.twitterImage },
    ];

    // Update or create each SEO field
    for (const field of seoFields) {
      if (field.value !== undefined) {
        await db.postMeta.upsert({
          where: {
            postId_metaKey: {
              postId: data.postId,
              metaKey: field.key
            }
          },
          update: {
            metaValue: field.value || null
          },
          create: {
            postId: data.postId,
            metaKey: field.key,
            metaValue: field.value || null,
            metaType: 'STRING'
          }
        });
      }
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('SEO data save error:', error);
    return createErrorResponse("Failed to save SEO data", 500, 'SERVER_ERROR');
  }
}

export async function GET({ url }: { url: URL }) {
  try {
    await requireAuth();
    
    const postIdParam = url.searchParams.get('postId');
    
    if (!postIdParam) {
      return createErrorResponse("Post ID is required", 400, 'MISSING_PARAMETER');
    }
    
    const postIdValidation = validateData(PositiveIntegerSchema, parseInt(postIdParam), "post ID");
    
    if (!postIdValidation.success) {
      return createErrorResponse(postIdValidation.error, 400, 'VALIDATION_ERROR');
    }
    
    const postId = postIdValidation.data;

    // Get SEO metadata for the post
    const seoMeta = await db.postMeta.findMany({
      where: {
        postId: postId,
        metaKey: {
          in: [
            'meta_title',
            'meta_description', 
            'focus_keyword',
            'canonical_url',
            'robots',
            'og_title',
            'og_description',
            'og_image',
            'twitter_title',
            'twitter_description',
            'twitter_image'
          ]
        }
      }
    });

    // Convert to object format
    const seoData = seoMeta.reduce((acc, meta) => {
      const key = meta.metaKey.replace('_', '');
      acc[key] = meta.metaValue;
      return acc;
    }, {} as Record<string, string | null>);

    return createSuccessResponse({ seoData });
  } catch (error) {
    console.error('Get SEO data error:', error);
    return createErrorResponse("Failed to load SEO data", 500, 'SERVER_ERROR');
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const postIdParam = searchParams.get('postId');
    
    if (!postIdParam) {
      return createErrorResponse("Post ID is required", 400, 'MISSING_PARAMETER');
    }
    
    const postIdValidation = validateData(PositiveIntegerSchema, parseInt(postIdParam), "post ID");
    
    if (!postIdValidation.success) {
      return createErrorResponse(postIdValidation.error, 400, 'VALIDATION_ERROR');
    }
    
    const postId = postIdValidation.data;

    // Delete all SEO metadata for the post
    await db.postMeta.deleteMany({
      where: {
        postId: postId,
        metaKey: {
          in: [
            'meta_title',
            'meta_description', 
            'focus_keyword',
            'canonical_url',
            'robots',
            'og_title',
            'og_description',
            'og_image',
            'twitter_title',
            'twitter_description',
            'twitter_image'
          ]
        }
      }
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete SEO data error:', error);
    return createErrorResponse("Failed to delete SEO data", 500, 'SERVER_ERROR');
  }
}