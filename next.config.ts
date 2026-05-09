import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
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
