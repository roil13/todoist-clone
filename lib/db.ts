import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// One libSQL adapter for every environment — only the connection URL differs:
//   • Local / tests / scripts → a local SQLite file (TURSO_DATABASE_URL unset).
//   • Production → Turso (libsql://… + TURSO_AUTH_TOKEN).
// Prisma runs with its normal Node engine here, so there are no edge/wasm/fs
// constraints.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
