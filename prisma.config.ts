import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps local secrets in .env.local, not .env.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  // Multi-file schema: every *.prisma file under prisma/.
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // process.env (not env()) so `prisma generate` still runs on
    // installs without DATABASE_URL; migrate commands need it set.
    url: process.env["DATABASE_URL"],
  },
});
