import { describe, it, expect } from "vitest";
import { pickUpdates } from "./snapshot";

const row = (id: string, updatedAt: number, deletedAt: number | null = null) => ({ id, updatedAt, deletedAt });

describe("pickUpdates (last-write-wins merge)", () => {
  it("takes rows that don't exist locally", () => {
    expect(pickUpdates([], [row("a", 1)]).map((r) => r.id)).toEqual(["a"]);
  });

  it("takes remote rows that are newer", () => {
    const res = pickUpdates([row("a", 5)], [row("a", 9)]);
    expect(res).toEqual([row("a", 9)]);
  });

  it("ignores remote rows that are older or equal", () => {
    expect(pickUpdates([row("a", 9)], [row("a", 9)])).toEqual([]);
    expect(pickUpdates([row("a", 9)], [row("a", 3)])).toEqual([]);
  });

  it("propagates deletes as a newer tombstone", () => {
    const res = pickUpdates([row("a", 5, null)], [row("a", 8, 8)]);
    expect(res).toEqual([row("a", 8, 8)]);
  });

  it("keeps a local edit that is newer than a remote tombstone", () => {
    expect(pickUpdates([row("a", 10, null)], [row("a", 8, 8)])).toEqual([]);
  });
});
