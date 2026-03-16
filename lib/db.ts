import { PrismaClient } from "@prisma/client";

// This tells TypeScript that there might be a global Prisma variable
declare global {
  var prisma: PrismaClient | undefined;
}

// If we are in development, use the existing global connection. 
// If not, create a new one.
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}