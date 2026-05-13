/**
 * Bundle size verification script (M6.3).
 *
 * Mengukur gzip size per-composable import menggunakan esbuild.
 * Dipanggil dengan: node scripts/check-bundle-size.mjs
 *
 * Acceptance: setiap composable < 5KB gzip, full library < 25KB gzip.
 */

import * as esbuild from "esbuild";
import { gzipSync } from "zlib";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_INDEX = resolve(ROOT, "src", "index.ts");

const COMPOSABLES = [
  "usePWA",
  "useCacheConfig",
  "useNotifications",
  "useBackgroundSync",
  "useInstallPrompt",
];

const LIMIT_KB = 5;
const FULL_LIMIT_KB = 25;

function kb(bytes) {
  return (bytes / 1024).toFixed(2);
}

async function measureImport(importLine, resolveDir) {
  // Write temporary entry file
  const tmpFile = resolve(resolveDir, "_bundle_tmp.ts");
  writeFileSync(tmpFile, importLine, "utf-8");

  try {
    const result = await esbuild.build({
      entryPoints: [tmpFile],
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      external: ["vue", "idb", "date-fns"],
      platform: "browser",
      target: "es2020",
      logLevel: "silent",
    });

    return gzipSync(result.outputFiles[0].contents).length;
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }
}

async function main() {
  console.log("\n📦 Bundle Size Verification (M6.3)\n");
  console.log(`  Target: per-composable < ${LIMIT_KB} KB gzip, full library < ${FULL_LIMIT_KB} KB gzip\n`);

  const results = [];
  let failed = 0;

  for (const name of COMPOSABLES) {
    const importLine = `export { ${name} } from "${SRC_INDEX.replace(/\\/g, "/")}"`;
    const size = await measureImport(importLine, ROOT);
    const passed = size <= LIMIT_KB * 1024;
    const icon = passed ? "✅" : "❌";
    console.log(`  ${icon} ${name.padEnd(25)} ${kb(size).padStart(7)} KB gzip  (limit: ${LIMIT_KB} KB)`);
    results.push({ name, size, passed });
    if (!passed) failed++;
  }

  // Full library (import everything from dist)
  const distFile = resolve(ROOT, "dist", "index.mjs");
  if (existsSync(distFile)) {
    const fullSize = gzipSync(readFileSync(distFile)).length;
    const fullPassed = fullSize <= FULL_LIMIT_KB * 1024;
    const icon = fullPassed ? "✅" : "❌";
    console.log(`  ${icon} Full library${"".padEnd(18)} ${kb(fullSize).padStart(7)} KB gzip  (limit: ${FULL_LIMIT_KB} KB)`);
    if (!fullPassed) failed++;
  }

  console.log("");
  if (failed > 0) {
    console.log(`❌ ${failed} over budget!\n`);
    process.exit(1);
  }

  console.log("✅ All bundle sizes within budget.\n");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
