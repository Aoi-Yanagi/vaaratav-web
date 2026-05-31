import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize NextAuth with the options we created in lib/auth.ts
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests (required by Next.js App Router)
export { handler as GET, handler as POST };