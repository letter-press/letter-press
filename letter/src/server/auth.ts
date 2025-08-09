import { getSession, type SolidAuthConfig } from "@auth/solid-start";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { serverEnv } from "~/env/server";
import { db } from "~/lib/db";
import Google from "@auth/core/providers/google";
import Credentials from "@auth/core/providers/credentials";
import { getRequestEvent } from "solid-js/web";
import argon2 from "argon2";

declare module "@auth/core/types" {
  export interface Session {
    user: {
      id: string;
      role: string;
      username: string | null;
      name: string | null;
      email: string;
      image?: string | null;
    };
  }

  export interface User {
    id: string;
    role: string;
    username: string | null;
    name?: string | null;
    email: string;
    image?: string | null;
  }

  export interface JWT {
    id: string;
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
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          select: { 
            id: true, 
            email: true, 
            password: true, 
            name: true, 
            role: true, 
            username: true,
            image: true 
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await argon2.verify(
          user.password,
          credentials.password as string
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email!,
          name: user.name,
          role: user.role,
          username: user.username,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
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
          token.id = dbUser.id.toString();
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.email = dbUser.email!;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user && token.id && token.role && token.email) {
        const user = session.user as {
          id: string;
          role: string;
          username: string | null;
          name: string | null;
          email: string;
          image?: string | null;
        };

        user.id = token.id as string;
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
  useSecureCookies: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  secret: serverEnv.AUTH_SECRET,
  trustHost: true,
  ...(import.meta.env.VITE_AUTH_PATH && { basePath: import.meta.env.VITE_AUTH_PATH }),
};


/**
 * Get the current authenticated user session
 */
export async function Auth() {
  const event = getRequestEvent();
  if (!event) return null;
  return await getSession(event.request, authOptions);
}

