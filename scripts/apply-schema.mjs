// Applies the SQLite schema (migrations/0001_init.sql) to a libSQL/Turso database.
// Usage (env vars required):
//   TURSO_DATABASE_URL=libsql://...  TURSO_AUTH_TOKEN=...  node scripts/apply-schema.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN for remote).");
  process.exit(1);
}

const sql = readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");
const client = createClient(authToken ? { url, authToken } : { url });

await client.executeMultiple(sql);
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY name",
);
console.log("Schema applied. Tables:", tables.rows.map((r) => r.name).join(", "));
