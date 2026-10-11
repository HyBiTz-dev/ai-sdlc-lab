import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      // Seed data and generated docs are not logic worth asserting on.
      exclude: [
        "src/**/*.test.ts",
        "src/test/**",
        "src/db/seed-data.ts",
        "src/db/schema.ts",
        "src/lib/openapi.ts",
        "src/app/design/**",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
