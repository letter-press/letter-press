import { json } from "@solidjs/router";
import { db } from "~/lib/db";
import { requirePermission } from "~/lib/auth-utils";
import { Permission } from "~/lib/permissions";
import type { UserRole } from "@prisma/client";
import { 
  UserRoleUpdateSchema,
  UserQuerySchema,
  PositiveIntegerSchema,
  type UserRoleUpdate,
  type UserQuery
} from "~/lib/validation-schemas";
import { 
  createValidatedAPIHandler,
  extractAndValidateJSON,
  extractAndValidateSearchParams,
  createErrorResponse,
  createSuccessResponse,
  validateData
} from "~/lib/validation-utils";

export async function PUT({ request }: { request: Request }) {
  try {
    // Require permission to manage roles
    await requirePermission(Permission.MANAGE_ROLES);
    
    const result = await extractAndValidateJSON(request, UserRoleUpdateSchema, "User Role Update");
    
    if (!result.success) {
      return createErrorResponse(result.error, 400, 'VALIDATION_ERROR');
    }
    
    const { userId, role } = result.data;
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return createErrorResponse("User not found", 404, 'USER_NOT_FOUND');
    }
    
    // Update user role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return createSuccessResponse({ user: updatedUser });
  } catch (error) {
    console.error('Update user role error:', error);
    return createErrorResponse("Failed to update user role", 500, 'SERVER_ERROR');
  }
}

export async function GET({ url }: { url: URL }) {
  try {
    // Require permission to read users
    await requirePermission(Permission.READ_USERS);
    
    const paramResult = extractAndValidateSearchParams(url, UserQuerySchema, "User Query");
    
    if (!paramResult.success) {
      return createErrorResponse(paramResult.error, 400, 'VALIDATION_ERROR');
    }
    
    const { page = 1, limit = 20, role, search } = paramResult.data;
    
    const offset = (page - 1) * limit;
    
    const where: any = {};
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.user.count({ where })
    ]);
    
    // Get role statistics
    const roleStats = await db.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    
    return createSuccessResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      roleStats: roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.role;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Get users error:', error);
    return createErrorResponse("Failed to load users", 500, 'SERVER_ERROR');
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    // Require permission to delete users
    await requirePermission(Permission.DELETE_USERS);
    
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    if (!userIdParam) {
      return createErrorResponse("User ID is required", 400, 'MISSING_PARAMETER');
    }
    
    const userIdValidation = validateData(PositiveIntegerSchema, parseInt(userIdParam), "user ID");
    
    if (!userIdValidation.success) {
      return createErrorResponse(userIdValidation.error, 400, 'VALIDATION_ERROR');
    }
    
    const userId = userIdValidation.data;
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return createErrorResponse("User not found", 404, 'USER_NOT_FOUND');
    }
    
    // Prevent deleting admin users (safety measure)
    if (existingUser.role === 'ADMIN') {
      return createErrorResponse("Cannot delete admin users", 403, 'FORBIDDEN');
    }
    
    await db.user.delete({
      where: { id: userId }
    });
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse("Failed to delete user", 500, 'SERVER_ERROR');
  }
}