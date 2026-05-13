/**
 * Test: Tree-shakeability verification (M6.4).
 *
 * Memverifikasi bahwa mengimpor satu composable tidak membawa
 * kode composable lain ke dalam bundle (tree-shaking berfungsi).
 *
 * Acceptance: import usePWA tidak include useNotifications, dst.
 */

import { describe, it, expect } from "vitest";
import esbuild from "esbuild";
import { resolve } from "path";
import { existsSync, unlinkSync, writeFileSync } from "fs";

const ROOT = resolve(__dirname, "..");
const SRC_INDEX = resolve(ROOT, "src", "index.ts");

/**
 * Build sebuah import tunggal dan kembalikan konten bundle.
 */
async function buildImport(importLine: string): Promise<string> {
  const tmpFile = resolve(ROOT, "_tree_tmp.ts");
  writeFileSync(tmpFile, importLine, "utf-8");

  try {
    const result = await esbuild.build({
      entryPoints: [tmpFile],
      bundle: true,
      minify: false,
      format: "esm",
      write: false,
      external: ["vue", "idb", "date-fns"],
      platform: "browser",
      target: "es2020",
    });
    return result.outputFiles[0].text;
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }
}

describe("Tree-Shakeability (M6.4)", () => {
  /** Daftar export name per composable yang spesifik ke composable itu. */
  const SIGNATURES: Record<string, string[]> = {
    usePWA: ["usePWA", "registerServiceWorker"],
    useCacheConfig: ["useCacheConfig", "addRule", "CacheRule"],
    useNotifications: ["useNotifications", "PermissionStatus", "requestPermission"],
    useBackgroundSync: ["useBackgroundSync", "SyncEntry", "enqueue"],
    useInstallPrompt: ["useInstallPrompt", "canPrompt"],
  };

  const composables = Object.keys(SIGNATURES);

  for (const imp of composables) {
    it(`import ${imp} should not pull ${composables.filter((c) => c !== imp).join(", ")}`, async () => {
      const srcPath = SRC_INDEX.replace(/\\/g, "/");
      const code = await buildImport(`export { ${imp} } from "${srcPath}"`);

      for (const other of composables) {
        if (other === imp) continue;
        // Cek bahwa fungsi utama composable lain tidak muncul di bundle
        const mainExport = other; // "useXxx"
        // Look for the function definition pattern: "function useXxx" or "const useXxx"
        const regex = new RegExp(`(function\\s+${mainExport}|const\\s+${mainExport}\\s*=)`);
        expect(code).not.toMatch(regex, `import "${imp}" seharusnya tidak membawa "${mainExport}" ke bundle`);
      }
    });
  }

  it("import usePWA should include service worker registry code", async () => {
    const srcPath = SRC_INDEX.replace(/\\/g, "/");
    const code = await buildImport(`export { usePWA } from "${srcPath}"`);
    expect(code).toMatch(/registerServiceWorker/);
  });

  it("import useNotifications should include notification manager code", async () => {
    const srcPath = SRC_INDEX.replace(/\\/g, "/");
    const code = await buildImport(`export { useNotifications } from "${srcPath}"`);
    // Check runtime code, bukan type (type di-strip esbuild)
    expect(code).toMatch(/useNotifications/);
    expect(code).toMatch(/NotificationManager/);
  });
});
