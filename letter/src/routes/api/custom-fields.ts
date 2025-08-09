import { json } from "@solidjs/router";
import { db } from "~/lib/db";
import { requireAuth } from "~/lib/auth-utils";
import type { CustomFieldType } from "@prisma/client";
import { 
  CustomFieldCreateSchema,
  CustomFieldUpdateSchema,
  PositiveIntegerSchema,
  type CustomFieldCreate,
  type CustomFieldUpdate
} from "~/lib/validation-schemas";
import { 
  extractAndValidateJSON,
  extractAndValidateSearchParams,
  createErrorResponse,
  createSuccessResponse,
  validateData
} from "~/lib/validation-utils";

export async function GET({ url }: { url: URL }) {
  try {
    await requireAuth();
    
    const postTypeId = url.searchParams.get('postTypeId');
    
    const where = postTypeId ? { postTypeId: parseInt(postTypeId) } : {};
    
    const customFields = await db.customField.findMany({
      where,
      include: {
        postType: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return createSuccessResponse({ customFields });
  } catch (error) {
    console.error('Get custom fields error:', error);
    return createErrorResponse("Failed to load custom fields", 500, 'SERVER_ERROR');
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const session = await requireAuth();
    
    const result = await extractAndValidateJSON(request, CustomFieldCreateSchema, "Custom Field Creation");
    
    if (!result.success) {
      return createErrorResponse(result.error, 400, 'VALIDATION_ERROR');
    }
    
    const data = result.data;

    // Check if field name already exists for this post type
    const existingField = await db.customField.findFirst({
      where: {
        name: data.name,
        postTypeId: data.postTypeId || null
      }
    });

    if (existingField) {
      return createErrorResponse("A field with this name already exists", 400, 'DUPLICATE_FIELD');
    }

    const customField = await db.customField.create({
      data: {
        name: data.name,
        label: data.label,
        type: data.type,
        required: data.required,
        options: data.options || null,
        postTypeId: data.postTypeId || null
      },
      include: {
        postType: true
      }
    });

    return createSuccessResponse({ customField }, 201);
  } catch (error) {
    console.error('Create custom field error:', error);
    return createErrorResponse("Failed to create custom field", 500, 'SERVER_ERROR');
  }
}

export async function PUT({ request }: { request: Request }) {
  try {
    await requireAuth();
    
    const result = await extractAndValidateJSON(request, CustomFieldUpdateSchema, "Custom Field Update");
    
    if (!result.success) {
      return createErrorResponse(result.error, 400, 'VALIDATION_ERROR');
    }
    
    const { id, ...updateData } = result.data;

    const customField = await db.customField.update({
      where: { id },
      data: updateData,
      include: {
        postType: true
      }
    });

    return createSuccessResponse({ customField });
  } catch (error) {
    console.error('Update custom field error:', error);
    return createErrorResponse("Failed to update custom field", 500, 'SERVER_ERROR');
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return createErrorResponse("Field ID is required", 400, 'MISSING_PARAMETER');
    }
    
    const idValidation = validateData(PositiveIntegerSchema, parseInt(idParam), "field ID");
    
    if (!idValidation.success) {
      return createErrorResponse(idValidation.error, 400, 'VALIDATION_ERROR');
    }

    await db.customField.delete({
      where: { id: idValidation.data }
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete custom field error:', error);
    return createErrorResponse("Failed to delete custom field", 500, 'SERVER_ERROR');
  }
}