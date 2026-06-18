import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

// Edge-safe config (no database / bcrypt access). Shared by the middleware
// instance and the full Node-runtime instance in auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isAuthPage = PUBLIC_PATHS.has(path);

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/today", nextUrl));
        return true;
      }
      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
