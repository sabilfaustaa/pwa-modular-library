import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/**/index.ts", "src/**/*.types.ts", "src/types/**"],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    setupFiles: ["./tests/setup.ts"],
  },
});
