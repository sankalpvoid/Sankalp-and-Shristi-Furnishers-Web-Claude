import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  // SQLite's native binding is loaded dynamically, so make sure serverless bundles include it.
  outputFileTracingIncludes: { "/**": ["./node_modules/better-sqlite3/build/Release/*.node", "./node_modules/better-sqlite3/lib/**"] },
  // Admin photo uploads go through server actions; the app itself caps images at 12 MB.
  experimental: { serverActions: { bodySizeLimit: "14mb" } },
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
