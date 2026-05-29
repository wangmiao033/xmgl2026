import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    "https://*.space-chatglm.site",
    "https://*.space-z.ai",
    "https://*.space.chatglm.site",
  ],
};

export default nextConfig;
