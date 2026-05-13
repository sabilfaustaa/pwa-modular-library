import { defineConfig } from "vite";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ["tests", "**/*.test.ts"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "PwaModularLibrary",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      external: ["vue", "idb", "date-fns"],
      output: {
        globals: {
          vue: "Vue",
          idb: "idb",
          "date-fns": "dateFns",
        },
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
});
