import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Prisma runs with `engineType = "client"` (the query compiler — no Rust/wasm
// engine, no `fs`), so a driver adapter is required everywhere:
//   • Cloudflare Workers → the D1 binding (resolved per request).
//   • Local (next dev / scripts) → better-sqlite3 against prisma/dev.db.
// The better-sqlite3 adapter is a native addon, so it's loaded via a
// bundler-invisible `eval("require")` inside the local-only branch — it never
// enters the Workers bundle. Call sites import the `prisma` proxy unchanged.

const globalForPrisma = globalThis as unknown as { localPrisma?: PrismaClient };

function localClient(): PrismaClient {
  if (!globalForPrisma.localPrisma) {
    const req = eval("require") as NodeRequire;
    const { PrismaBetterSQLite3 } = req("@prisma/adapter-better-sqlite3");
    const path = req("node:path") as typeof import("node:path");
    const url = "file:" + path.join(process.cwd(), "prisma", "dev.db");
    globalForPrisma.localPrisma = new PrismaClient({
      adapter: new PrismaBetterSQLite3({ url }),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.localPrisma;
}

let d1Cache: { db: unknown; client: PrismaClient } | null = null;

function resolveClient(): PrismaClient {
  try {
    const { env } = getCloudflareContext();
    const db = (env as Record<string, unknown>)?.DB;
    if (db) {
      if (!d1Cache || d1Cache.db !== db) {
        d1Cache = { db, client: new PrismaClient({ adapter: new PrismaD1(db as never) }) };
      }
      return d1Cache.client;
    }
  } catch {
    // Not running on Cloudflare — fall through to the local client.
  }
  return localClient();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = resolveClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
