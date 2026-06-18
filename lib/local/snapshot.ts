import { db, SYNCED_TABLES, type Sync } from "./db";

export type Snapshot = {
  version: number;
  exportedAt: string;
  tables: Record<string, (Sync & { id: string })[]>;
};

/** Read all synced tables into a single document (for backup + Drive sync). */
export async function buildSnapshot(): Promise<Snapshot> {
  const tables: Snapshot["tables"] = {};
  for (const name of SYNCED_TABLES) {
    tables[name] = (await db.table(name).toArray()) as (Sync & { id: string })[];
  }
  return { version: 2, exportedAt: new Date().toISOString(), tables };
}

/**
 * Merge a remote snapshot into the local store, last-write-wins by `updatedAt`
 * (tombstones included, so deletes propagate). Returns the number of rows changed.
 */
export async function mergeSnapshot(remote: Snapshot): Promise<number> {
  let changed = 0;
  for (const name of SYNCED_TABLES) {
    const table = db.table(name);
    const localById = new Map(
      ((await table.toArray()) as (Sync & { id: string })[]).map((r) => [r.id, r]),
    );
    const puts: (Sync & { id: string })[] = [];
    for (const r of remote.tables[name] ?? []) {
      const local = localById.get(r.id);
      if (!local || (r.updatedAt ?? 0) > (local.updatedAt ?? 0)) puts.push(r);
    }
    if (puts.length) {
      await table.bulkPut(puts);
      changed += puts.length;
    }
  }
  return changed;
}
