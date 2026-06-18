"use client";

import { PROJECT_COLORS, colorHex } from "@/lib/types";

export function ColorDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ backgroundColor: colorHex(color), width: size, height: size }}
    />
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-bg px-2 py-2 text-sm outline-none focus:border-accent"
    >
      {PROJECT_COLORS.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
