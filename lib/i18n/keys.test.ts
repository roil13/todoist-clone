import { describe, it, expect } from "vitest";
import { en } from "./messages/en";
import { he } from "./messages/he";

describe("i18n message parity", () => {
  const enKeys = Object.keys(en).sort();
  const heKeys = Object.keys(he).sort();

  it("he has exactly the same keys as en", () => {
    expect(heKeys).toEqual(enKeys);
  });

  it("no Hebrew value is left empty", () => {
    for (const [k, v] of Object.entries(he)) {
      expect(v, `empty translation for ${k}`).toBeTruthy();
    }
  });

  it("preserves interpolation placeholders", () => {
    for (const k of enKeys) {
      const enVars = (en[k as keyof typeof en].match(/\{(\w+)\}/g) ?? []).sort();
      const heVars = (he[k as keyof typeof he].match(/\{(\w+)\}/g) ?? []).sort();
      expect(heVars, `placeholder mismatch for ${k}`).toEqual(enVars);
    }
  });
});
