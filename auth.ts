import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export class InvalidLoginError extends CredentialsSignin {
  code = "Invalid PIN.";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.pin) {
          throw new InvalidLoginError();
        }

        const pin = credentials.pin as string;
        const users = await prisma.user.findMany();

        for (const user of users) {
          let passwordMatch = false;
          try {
            passwordMatch = await bcrypt.compare(pin, user.password);
          } catch (err) {
            console.error("PIN verification error:", err);
          }

          if (passwordMatch) {
            return { 
              id: user.id.toString(), 
              name: user.name,
              default_split_percentage: user.default_split_percentage
            };
          }
        }

        throw new InvalidLoginError();
      },
    }),
  ],
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.name && session.user) {
        session.user.name = token.name;
      }
      if (token.default_split_percentage !== undefined && session.user) {
        session.user.default_split_percentage = token.default_split_percentage as number;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.default_split_percentage !== undefined) {
        token.default_split_percentage = session.default_split_percentage;
      }
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.default_split_percentage = user.default_split_percentage;
      }
      return token;
    }
  },
  session: { strategy: "jwt" },
});
