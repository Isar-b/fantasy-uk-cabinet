import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const oauthEnabled =
  !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: oauthEnabled
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : [],
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.sub) {
        token.sub = profile.sub as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        // Stash the provider-stable id on the session.
        (session.user as { id?: string }).id = `google:${token.sub}`;
      }
      return session;
    },
  },
});
