import { redirect } from "@solidjs/router";
import { Auth } from "~/server/auth";
import { query } from "@solidjs/router";
import type { Session } from "@auth/solid-start";
import type { UserRole } from "@prisma/client";
import { Permission, hasPermission } from "./permissions";

/**
 * Query function that maintains session state across requests
 * This prevents multiple auth checks on the same request
 */
export const getAuthSession = query(async (): Promise<Session | null> => {
  "use server";
  try {
    const session = await Auth();
    return session;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}, "auth-session");

/**
 * Utility function for protecting routes that require authentication
 * This should be used in server-side contexts (queries, actions, route components)
 */
export async function requireAuth(redirectTo: string = "/login"): Promise<Session> {
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw redirect(redirectTo);
  }
  
  return session;
}

/**
 * Utility function for protecting admin routes
 */
export async function requireAdmin(redirectTo: string = "/login"): Promise<Session> {
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw redirect(redirectTo);
  }
  
  if (!hasPermission(session.user.role as UserRole, Permission.ADMIN_ACCESS)) {
    throw redirect("/", 403);
  }
  
  return session;
}

/**
 * Utility function for protecting routes with specific permissions
 */
export async function requirePermission(permission: Permission, redirectTo: string = "/unauthorized"): Promise<Session> {
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw redirect("/login");
  }
  
  if (!hasPermission(session.user.role as UserRole, permission)) {
    throw redirect(redirectTo, 403);
  }
  
  return session;
}

/**
 * Check if current session has a specific permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const session = await getAuthSession();
  
  if (!session?.user?.role) {
    return false;
  }
  
  return hasPermission(session.user.role as UserRole, permission);
}

/**
 * Utility function to get session without throwing if not authenticated
 */
export async function getSessionOptional(): Promise<Session | null> {
  return await getAuthSession();
}

/**
 * Server function to check admin access and return user data
 * This is optimized for admin routes to reduce multiple auth calls
 */
export const getAdminSession = query(async (): Promise<Session> => {
  "use server";
  
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw redirect("/login");
  }
  
  if (!hasPermission(session.user.role as UserRole, Permission.ADMIN_ACCESS)) {
    throw redirect("/", 403);
  }
  
  return session;
}, "admin-session");
