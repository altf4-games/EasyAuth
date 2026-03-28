import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000, // mongodb-memory-server downloads binary on first run
  },
});
