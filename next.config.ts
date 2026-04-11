import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
    // Allow unoptimized local images in /public/Assets
    localPatterns: [
      {
        pathname: "/Assets/**",
      },
    ],
  },
};

export default nextConfig;
