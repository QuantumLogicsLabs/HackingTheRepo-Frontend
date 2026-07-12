import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/metrics/:path*",
        destination: "http://localhost:9100/metrics/:path*",
      },
    ];
  },
};

export default nextConfig;
