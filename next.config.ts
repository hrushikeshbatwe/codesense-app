import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Using Turbopack (Next.js 16 default). No Node.js polyfills needed
  // since we use @babel/parser directly (no @babel/traverse which had fs deps).
  turbopack: {},
};

export default nextConfig;
