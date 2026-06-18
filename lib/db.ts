import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// On Cloudflare Workers the database is the D1 binding (resolved per request via
// the OpenNext context); the Prisma wasm engine handles queries through it.
// Everywhere else (next dev, tests, scripts) we use the default client + engine
// against the local SQLite file (DATABASE_URL). No native modules are imported,
// so nothing platform-specific leaks into the Worker bundle. Call sites import
// the `prisma` proxy unchanged.

const globalForPrisma = globalThis as unknown as { localPrisma?: PrismaClient };

function localClient(): PrismaClient {
  if (!globalForPrisma.localPrisma) {
    globalForPrisma.localPrisma = new PrismaClient({
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
