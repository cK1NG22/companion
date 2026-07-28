import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray ~/package-lock.json makes Turbopack infer the home directory as the
  // workspace root. Pin it to this app so builds resolve from here.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
