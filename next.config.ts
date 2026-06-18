import type { NextConfig } from "next";

// Static export served from GitHub Pages at https://<user>.github.io/todoist-clone/.
// basePath is applied for the production build only, so local `next dev` serves
// at the root (http://localhost:3000). Pages build sets BASE_PATH=/todoist-clone.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // App Router dynamic routes are avoided (we use ?id= query params), so no
  // generateStaticParams is needed for a clean export.
};

export default nextConfig;
