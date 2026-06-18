"use client";

export type Theme = "light" | "dark" | "kraft" | "moonstone";

export const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "kraft", label: "Kraft (warm)" },
  { value: "moonstone", label: "Moonstone (blue)" },
];

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {}
}

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem("theme") as Theme | null;
    if (t && THEMES.some((x) => x.value === t)) return t;
  } catch {}
  return "light";
}
