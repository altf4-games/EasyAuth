import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["easy-auth-react"],
  serverExternalPackages: ["better-sqlite3", "easy-auth-sqlite"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("better-sqlite3");
      config.externals.push("easy-auth-sqlite");
    }
    return config;
  },
};

export default nextConfig;
