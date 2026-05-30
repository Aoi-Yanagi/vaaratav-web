import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // The "engine" property has been completely removed!
  datasource: {
    url: env("DATABASE_URL"),
  },
});