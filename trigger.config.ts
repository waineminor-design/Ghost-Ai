import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // The CLI (`dev` and `deploy`) also fills this from TRIGGER_PROJECT_REF
  // in the project's env files (.env.local included).
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: "node",
  dirs: ["./trigger"],
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      randomize: true,
    },
  },
  // The CLI's bundler already stubs `server-only`, so tasks can import
  // the lib/ data and storage modules.
  build: {
    extensions: [
      // Prisma 7 `prisma-client` generator with a driver adapter. The
      // client in app/generated/prisma is built by `prisma generate`
      // (postinstall), not by this extension.
      prismaExtension({ mode: "modern" }),
    ],
  },
});
