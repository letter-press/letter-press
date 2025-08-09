import type { UserRole } from "@prisma/client";
import type { Session } from "@auth/solid-start";

// Define permissions as bit flags for efficient checking
export enum Permission {
    // Content permissions
    READ_POSTS = 1 << 0,         // 1
    WRITE_POSTS = 1 << 1,        // 2
    EDIT_POSTS = 1 << 2,         // 4
    DELETE_POSTS = 1 << 3,       // 8
    PUBLISH_POSTS = 1 << 4,      // 16
    
    READ_PAGES = 1 << 5,         // 32
    WRITE_PAGES = 1 << 6,        // 64
    EDIT_PAGES = 1 << 7,         // 128
    DELETE_PAGES = 1 << 8,       // 256
    PUBLISH_PAGES = 1 << 9,      // 512
    
    // Media permissions
    UPLOAD_MEDIA = 1 << 10,      // 1024
    DELETE_MEDIA = 1 << 11,      // 2048
    MANAGE_MEDIA = 1 << 12,      // 4096
    
    // Comment permissions
    READ_COMMENTS = 1 << 13,     // 8192
    MODERATE_COMMENTS = 1 << 14, // 16384
    DELETE_COMMENTS = 1 << 15,   // 32768
    
    // User permissions
    READ_USERS = 1 << 16,        // 65536
    CREATE_USERS = 1 << 17,      // 131072
    EDIT_USERS = 1 << 18,        // 262144
    DELETE_USERS = 1 << 19,      // 524288
    MANAGE_ROLES = 1 << 20,      // 1048576
    
    // System permissions
    MANAGE_SETTINGS = 1 << 21,   // 2097152
    MANAGE_PLUGINS = 1 << 22,    // 4194304
    MANAGE_THEMES = 1 << 23,     // 8388608
    VIEW_ANALYTICS = 1 << 24,    // 16777216
    MANAGE_CUSTOM_FIELDS = 1 << 25, // 33554432
    
    // Admin permissions
    ADMIN_ACCESS = 1 << 26,      // 67108864
    SUPER_ADMIN = 1 << 27,       // 134217728
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, number> = {
    SUBSCRIBER: 
        Permission.READ_POSTS | 
        Permission.READ_PAGES,
    
    CONTRIBUTOR: 
        Permission.READ_POSTS | 
        Permission.READ_PAGES |
        Permission.WRITE_POSTS |
        Permission.UPLOAD_MEDIA,
    
    AUTHOR: 
        Permission.READ_POSTS | 
        Permission.READ_PAGES |
        Permission.WRITE_POSTS |
        Permission.EDIT_POSTS |
        Permission.PUBLISH_POSTS |
        Permission.UPLOAD_MEDIA |
        Permission.DELETE_MEDIA,
    
    EDITOR: 
        Permission.READ_POSTS | 
        Permission.READ_PAGES |
        Permission.WRITE_POSTS |
        Permission.EDIT_POSTS |
        Permission.DELETE_POSTS |
        Permission.PUBLISH_POSTS |
        Permission.WRITE_PAGES |
        Permission.EDIT_PAGES |
        Permission.DELETE_PAGES |
        Permission.PUBLISH_PAGES |
        Permission.UPLOAD_MEDIA |
        Permission.DELETE_MEDIA |
        Permission.MANAGE_MEDIA |
        Permission.READ_COMMENTS |
        Permission.MODERATE_COMMENTS |
        Permission.DELETE_COMMENTS |
        Permission.ADMIN_ACCESS,
    
    ADMIN: 
        Permission.READ_POSTS | 
        Permission.READ_PAGES |
        Permission.WRITE_POSTS |
        Permission.EDIT_POSTS |
        Permission.DELETE_POSTS |
        Permission.PUBLISH_POSTS |
        Permission.WRITE_PAGES |
        Permission.EDIT_PAGES |
        Permission.DELETE_PAGES |
        Permission.PUBLISH_PAGES |
        Permission.UPLOAD_MEDIA |
        Permission.DELETE_MEDIA |
        Permission.MANAGE_MEDIA |
        Permission.READ_COMMENTS |
        Permission.MODERATE_COMMENTS |
        Permission.DELETE_COMMENTS |
        Permission.READ_USERS |
        Permission.CREATE_USERS |
        Permission.EDIT_USERS |
        Permission.DELETE_USERS |
        Permission.MANAGE_ROLES |
        Permission.MANAGE_SETTINGS |
        Permission.MANAGE_PLUGINS |
        Permission.MANAGE_THEMES |
        Permission.VIEW_ANALYTICS |
        Permission.MANAGE_CUSTOM_FIELDS |
        Permission.ADMIN_ACCESS |
        Permission.SUPER_ADMIN,
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return (rolePermissions & permission) === permission;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    const permissions: Permission[] = [];
    
    for (const permission of Object.values(Permission)) {
        if (typeof permission === 'number' && (rolePermissions & permission) === permission) {
            permissions.push(permission);
        }
    }
    
    return permissions;
}

/**
 * Check if session user has permission
 */
export function sessionHasPermission(session: Session | null, permission: Permission): boolean {
    if (!session?.user?.role) return false;
    return hasPermission(session.user.role as UserRole, permission);
}

/**
 * Require permission middleware
 */
export function requirePermission(permission: Permission, redirectTo: string = "/unauthorized") {
    return async (session: Session | null) => {
        if (!sessionHasPermission(session, permission)) {
            throw new Error(`Access denied: Missing required permission`);
        }
        return session;
    };
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
    [Permission.READ_POSTS]: "View posts",
    [Permission.WRITE_POSTS]: "Create new posts",
    [Permission.EDIT_POSTS]: "Edit existing posts",
    [Permission.DELETE_POSTS]: "Delete posts",
    [Permission.PUBLISH_POSTS]: "Publish posts",
    
    [Permission.READ_PAGES]: "View pages",
    [Permission.WRITE_PAGES]: "Create new pages",
    [Permission.EDIT_PAGES]: "Edit existing pages",
    [Permission.DELETE_PAGES]: "Delete pages",
    [Permission.PUBLISH_PAGES]: "Publish pages",
    
    [Permission.UPLOAD_MEDIA]: "Upload media files",
    [Permission.DELETE_MEDIA]: "Delete media files",
    [Permission.MANAGE_MEDIA]: "Manage media library",
    
    [Permission.READ_COMMENTS]: "View comments",
    [Permission.MODERATE_COMMENTS]: "Moderate comments",
    [Permission.DELETE_COMMENTS]: "Delete comments",
    
    [Permission.READ_USERS]: "View users",
    [Permission.CREATE_USERS]: "Create new users",
    [Permission.EDIT_USERS]: "Edit user profiles",
    [Permission.DELETE_USERS]: "Delete users",
    [Permission.MANAGE_ROLES]: "Manage user roles",
    
    [Permission.MANAGE_SETTINGS]: "Manage system settings",
    [Permission.MANAGE_PLUGINS]: "Manage plugins",
    [Permission.MANAGE_THEMES]: "Manage themes",
    [Permission.VIEW_ANALYTICS]: "View analytics",
    [Permission.MANAGE_CUSTOM_FIELDS]: "Manage custom fields",
    
    [Permission.ADMIN_ACCESS]: "Access admin dashboard",
    [Permission.SUPER_ADMIN]: "Super administrator access",
};

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    SUBSCRIBER: "Can view published content",
    CONTRIBUTOR: "Can write posts but cannot publish them",
    AUTHOR: "Can write and publish their own posts",
    EDITOR: "Can manage all posts, pages, and moderate content",
    ADMIN: "Full access to all system features",
};

/**
 * Get permission groups for easier UI display
 */
export function getPermissionGroups(): Record<string, Permission[]> {
    return {
        "Content Management": [
            Permission.READ_POSTS,
            Permission.WRITE_POSTS,
            Permission.EDIT_POSTS,
            Permission.DELETE_POSTS,
            Permission.PUBLISH_POSTS,
            Permission.READ_PAGES,
            Permission.WRITE_PAGES,
            Permission.EDIT_PAGES,
            Permission.DELETE_PAGES,
            Permission.PUBLISH_PAGES,
        ],
        "Media Management": [
            Permission.UPLOAD_MEDIA,
            Permission.DELETE_MEDIA,
            Permission.MANAGE_MEDIA,
        ],
        "Comment Management": [
            Permission.READ_COMMENTS,
            Permission.MODERATE_COMMENTS,
            Permission.DELETE_COMMENTS,
        ],
        "User Management": [
            Permission.READ_USERS,
            Permission.CREATE_USERS,
            Permission.EDIT_USERS,
            Permission.DELETE_USERS,
            Permission.MANAGE_ROLES,
        ],
        "System Management": [
            Permission.MANAGE_SETTINGS,
            Permission.MANAGE_PLUGINS,
            Permission.MANAGE_THEMES,
            Permission.VIEW_ANALYTICS,
            Permission.MANAGE_CUSTOM_FIELDS,
            Permission.ADMIN_ACCESS,
            Permission.SUPER_ADMIN,
        ],
    };
}