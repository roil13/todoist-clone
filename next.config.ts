import type { NextConfig } from "next";

// Static export served from GitHub Pages at https://<user>.github.io/todoist-clone/.
// basePath/assetPrefix scope all routes + assets under the project path.
const repo = "todoist-clone";

const nextConfig: NextConfig = {
  output: "export",
  basePath: `/${repo}`,
  images: { unoptimized: true },
  // App Router dynamic routes are avoided (we use ?id= query params), so no
  // generateStaticParams is needed for a clean export.
};

export default nextConfig;
