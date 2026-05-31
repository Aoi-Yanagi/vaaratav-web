import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email"; // 1. Import Email Provider
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db"; 

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true, 
    }),
    // 2. Add the Email Provider using your existing Gmail credentials!
    EmailProvider({
      server: {
        host: "smtp.gmail.com",
        port: 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      from: process.env.EMAIL_USER,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.name = token.name;
      }
      return session;
    },
  },
};