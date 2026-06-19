import type { MetadataRoute } from "next";

// Generated at build so start_url / scope / icons include the GitHub Pages
// basePath (/todoist-clone). Next auto-injects the <link rel="manifest">.
const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tasks — a Todoist clone",
    short_name: "Tasks",
    description: "A personal task manager with projects, labels, filters, reminders and more.",
    start_url: `${bp}/today`,
    scope: `${bp}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#dc4c3e",
    icons: [
      { src: `${bp}/icons/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${bp}/icons/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
