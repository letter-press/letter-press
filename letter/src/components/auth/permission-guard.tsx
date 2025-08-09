import { Show, type JSX } from "solid-js";
import type { UserRole } from "@prisma/client";
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from "~/lib/permissions";

interface PermissionGuardProps {
    userRole: UserRole;
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean; // If true, requires all permissions; if false, requires any
    fallback?: JSX.Element;
    children: JSX.Element;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard(props: PermissionGuardProps): JSX.Element {
    const hasAccess = () => {
        if (props.permission) {
            return hasPermission(props.userRole, props.permission);
        }
        
        if (props.permissions) {
            return props.requireAll 
                ? hasAllPermissions(props.userRole, props.permissions)
                : hasAnyPermission(props.userRole, props.permissions);
        }
        
        return false;
    };

    return (
        <Show when={hasAccess()} fallback={props.fallback}>
            {props.children}
        </Show>
    );
}

interface RoleGuardProps {
    userRole: UserRole;
    allowedRoles: UserRole[];
    fallback?: JSX.Element;
    children: JSX.Element;
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGuard(props: RoleGuardProps): JSX.Element {
    const hasAccess = () => props.allowedRoles.includes(props.userRole);

    return (
        <Show when={hasAccess()} fallback={props.fallback}>
            {props.children}
        </Show>
    );
}

interface AdminGuardProps {
    userRole: UserRole;
    fallback?: JSX.Element;
    children: JSX.Element;
}

/**
 * Component that only renders for admin users
 */
export function AdminGuard(props: AdminGuardProps): JSX.Element {
    return (
        <RoleGuard 
            userRole={props.userRole}
            allowedRoles={['ADMIN']}
            fallback={props.fallback}
        >
            {props.children}
        </RoleGuard>
    );
}

interface EditorGuardProps {
    userRole: UserRole;
    fallback?: JSX.Element;
    children: JSX.Element;
}

/**
 * Component that renders for editors and admins
 */
export function EditorGuard(props: EditorGuardProps): JSX.Element {
    return (
        <RoleGuard 
            userRole={props.userRole}
            allowedRoles={['EDITOR', 'ADMIN']}
            fallback={props.fallback}
        >
            {props.children}
        </RoleGuard>
    );
}

// Hook-like functions for use in components
export function usePermissions(userRole: UserRole) {
    return {
        can: (permission: Permission) => hasPermission(userRole, permission),
        canAny: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
        canAll: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
        isAdmin: () => userRole === 'ADMIN',
        isEditor: () => ['EDITOR', 'ADMIN'].includes(userRole),
        isAuthor: () => ['AUTHOR', 'EDITOR', 'ADMIN'].includes(userRole),
        isContributor: () => ['CONTRIBUTOR', 'AUTHOR', 'EDITOR', 'ADMIN'].includes(userRole),
    };
}