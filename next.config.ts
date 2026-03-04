// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "localhost:3001", "127.0.0.1:3001"] },
  },
};

export default nextConfig;
