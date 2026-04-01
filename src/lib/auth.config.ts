import type { NextAuthConfig } from "next-auth";

// Lightweight config safe for Edge runtime (no DB/native imports)
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // filled in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAppRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/lessons") ||
        nextUrl.pathname.startsWith("/quiz") ||
        nextUrl.pathname.startsWith("/flashcards") ||
        nextUrl.pathname.startsWith("/workbooks");
      const isAuthRoute =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

      if (isAppRoute && !isLoggedIn) return false; // redirect to /login
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
