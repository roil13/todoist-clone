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

type Row = Sync & { id: string };

/** Pure last-write-wins: remote rows that are new or newer than their local twin. */
export function pickUpdates(local: Row[], remote: Row[]): Row[] {
  const localById = new Map(local.map((r) => [r.id, r]));
  return remote.filter((r) => {
    const l = localById.get(r.id);
    return !l || (r.updatedAt ?? 0) > (l.updatedAt ?? 0);
  });
}

/**
 * Merge a remote snapshot into the local store, last-write-wins by `updatedAt`
 * (tombstones included, so deletes propagate). Returns the number of rows changed.
 */
export async function mergeSnapshot(remote: Snapshot): Promise<number> {
  let changed = 0;
  for (const name of SYNCED_TABLES) {
    const table = db.table(name);
    const local = (await table.toArray()) as Row[];
    const puts = pickUpdates(local, remote.tables[name] ?? []);
    if (puts.length) {
      await table.bulkPut(puts);
      changed += puts.length;
    }
  }
  return changed;
}
