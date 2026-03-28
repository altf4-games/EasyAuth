import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@altf4-auth/react"],
  serverExternalPackages: ["better-sqlite3", "@altf4-auth/sqlite"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("better-sqlite3");
      config.externals.push("@altf4-auth/sqlite");
    }
    return config;
  },
};

export default nextConfig;
