import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export class InvalidLoginError extends CredentialsSignin {
  code = "Invalid email or password.";
}

export class UnverifiedEmailError extends CredentialsSignin {
  code = "Email needs to be verified.";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidLoginError();
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new InvalidLoginError();
        }
        
        let passwordMatch = false;
        try {
          passwordMatch = await bcrypt.compare(credentials.password as string, user.password);
        } catch (err) {
          console.error("Password verification error:", err);
        }

        if (passwordMatch) {
          if (!user.emailVerified) {
            throw new Error("AccessDenied");
          }
          return { 
            id: user.id.toString(), 
            email: user.email, 
            name: user.name,
            default_split_percentage: user.default_split_percentage
          };
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
