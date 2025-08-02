import { getSession, type SolidAuthConfig } from "@auth/solid-start";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { serverEnv } from "~/env/server";
import { db } from "~/lib/db";
import Google from "@auth/core/providers/google";
import { getRequestEvent } from "solid-js/web";

declare module "@auth/core/types" {
  export interface Session {
    user: {
      id: number;
      role: string;
      username: string | null;
      name: string | null;
      email: string;
      image?: string | null;
    };
  }

  export interface User {
    id: number;
    role: string;
    username: string | null;
    name?: string | null;
    email: string;
    image?: string | null;
  }

  export interface JWT {
    id: number;
    role: string;
    username: string | null;
    name?: string | null;
    email: string;
    picture?: string | null;
  }
}

export const authOptions: SolidAuthConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientSecret: serverEnv.GOOGLE_SECRET,
      clientId: serverEnv.GOOGLE_ID,
    })
  ],
  session: {
    strategy: "jwt",
  },


  callbacks: {
    jwt: async ({ token, user }) => {
      // When user signs in for the first time
      if (user && user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, username: true, name: true, email: true, image: true }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user && token.id && token.role && token.email) {
        const user = session.user as {
          id: number;
          role: string;
          username: string | null;
          name: string | null;
          email: string;
          image?: string | null;
        };

        user.id = token.id as number;
        user.role = token.role as string;
        user.username = token.username as string | null;
        user.name = (token.name as string) || null;
        user.email = token.email as string;
        user.image = (token.picture as string) || null;
      }
      return session;
    },
    signIn: async ({ user }) => {
      // Allow sign in if user has email
      return !!user.email;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: serverEnv.AUTH_SECRET,
  basePath: import.meta.env.VITE_AUTH_PATH,
};


/**
 * Get the current authenticated user session
 */
export async function Auth() {
  const event = getRequestEvent();
  if (!event) return null;
  return await getSession(event.request, authOptions);
}

