import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"; // <-- NEW: Import the Postgres adapter

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 1. Initialize the adapter with your connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// 2. Pass the adapter directly into the PrismaClient
export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}