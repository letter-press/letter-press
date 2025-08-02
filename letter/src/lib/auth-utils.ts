import { redirect } from "@solidjs/router";
import { Auth } from "~/server/auth";

/**
 * Utility function for protecting routes that require authentication
 * This should be used in server-side contexts (queries, actions, route components)
 * NOT in middleware (as per SolidStart documentation)
 */
export async function requireAuth(redirectTo: string = "/login") {
  const session = await Auth();
  
  if (!session?.user) {
    throw redirect(redirectTo);
  }
  
  return session;
}

/**
 * Utility function for protecting admin routes
 */
export async function requireAdmin(redirectTo: string = "/login") {
  const session = await requireAuth(redirectTo);
  
  if (session.user.role !== "ADMIN") {
    throw redirect("/", 403);
  }
  
  return session;
}

/**
 * Utility function to get session without throwing if not authenticated
 */
export async function getSessionOptional() {
  try {
    return await Auth();
  } catch {
    return null;
  }
}
