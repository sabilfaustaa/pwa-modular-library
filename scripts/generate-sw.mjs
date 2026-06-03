/**
 * Service Worker generator (langkah build).
 *
 * Membaca daftar cache rules dari sebuah file JSON, lalu menulis file
 * service worker (sw.js) menggunakan generateSW() dari library.
 *
 * Pemakaian:
 *   node scripts/generate-sw.mjs --rules ./cache-rules.json --out ./public/sw.js
 *   node scripts/generate-sw.mjs --rules ./cache-rules.json --out ./public/sw.js --post-message
 *
 * Catatan: di aplikasi konsumen, langkah ini cukup
 *   `import { generateSW } from "pwa-modular-library"` lalu tulis hasilnya ke sw.js.
 *   Skrip ini adalah implementasi rujukan yang mem-bundle generateSW dari src
 *   agar dapat dijalankan langsung di dalam repo library tanpa build penuh.
 */

import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SW_TEMPLATE = resolve(ROOT, "src", "modules", "service-worker", "sw-template.ts");

function parseArgs(argv) {
  const args = { rules: null, out: resolve(ROOT, "public", "sw.js"), postMessage: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--rules") args.rules = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--post-message") args.postMessage = true;
  }
  return args;
}

async function loadGenerateSW() {
  // Bundle sw-template.ts (tanpa dependensi runtime) ke ESM sementara, lalu import.
  const tmp = resolve(ROOT, "_generate_sw_tmp.mjs");
  const result = await esbuild.build({
    entryPoints: [SW_TEMPLATE],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "es2020",
    write: false,
    logLevel: "silent",
  });
  writeFileSync(tmp, result.outputFiles[0].text, "utf-8");
  try {
    const mod = await import(pathToFileURL(tmp).href);
    return mod.generateSW;
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let rules = [];
  if (args.rules) {
    const raw = readFileSync(resolve(process.cwd(), args.rules), "utf-8");
    rules = JSON.parse(raw);
    if (!Array.isArray(rules)) throw new Error("File rules harus berisi array CacheRule.");
  } else if (!args.postMessage) {
    throw new Error("Wajib --rules <file.json> kecuali memakai --post-message.");
  }

  const generateSW = await loadGenerateSW();
  const code = generateSW(rules, { kirimRulesViaPostMessage: args.postMessage });

  const outPath = resolve(process.cwd(), args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, code, "utf-8");

  const mode = args.postMessage ? "dynamic postMessage" : `static embed (${rules.length} rules)`;
  console.log(`✅ Service worker ditulis ke ${outPath} [mode: ${mode}]`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
