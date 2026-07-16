import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb"
    }
  }
};

export default nextConfig;
