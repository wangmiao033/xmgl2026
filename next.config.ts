import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://*.space-chatglm.site",
    "https://*.space-z.ai",
    "https://*.space.chatglm.site",
  ],
};

export default nextConfig;
