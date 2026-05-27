/** @type {import('next').NextConfig} */
// Project page lives at https://romansok.github.io/vuln-analyzer/, so all
// assets and routes must be prefixed accordingly. Set PAGES_BASE_PATH=""
// (or run `npm run dev`) to drop the prefix during local development.
const isProd = process.env.NODE_ENV === "production";
const basePath = process.env.PAGES_BASE_PATH ?? (isProd ? "/vuln-analyzer" : "");

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
