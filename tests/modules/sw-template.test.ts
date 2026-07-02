/**
 * Test: SW Template (generateSW)
 *
 * Memverifikasi generator kode service worker dari cache rules.
 * Module: src/modules/service-worker/sw-template.ts
 */

import { describe, it, expect } from "vitest";
import { generateSW } from "../../src/modules/service-worker/sw-template";
import type { CacheRule } from "../../src/types/cache.types";

const rules: CacheRule[] = [
  { pattern: "/api/*", strategy: "network-first", cacheName: "api-cache" },
  { pattern: "/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
];

describe("generateSW", () => {
  it("mode static embed: menanam rules langsung ke kode SW", () => {
    const code = generateSW(rules);
    expect(code).toContain("const CACHE_RULES =");
    expect(code).toContain("/api/*");
    expect(code).toContain("network-first");
    // listener fetch wajib ada untuk intersepsi request
    expect(code).toContain('addEventListener("fetch"');
    expect(code).toContain("applyStrategy");
  });

  it("mode static embed: memakai nama paket yang benar di komentar", () => {
    const code = generateSW(rules);
    expect(code).toContain("pwa-modular-library");
    expect(code).not.toContain("@sabil/pwa-library");
  });

  it("mode dynamic postMessage: tidak menanam rules, menunggu pesan dari main thread", () => {
    const code = generateSW(rules, { kirimRulesViaPostMessage: true });
    expect(code).toContain("let CACHE_RULES = []");
    expect(code).toContain("SABIL_PWA_CACHE_RULES_UPDATE");
    // rules tidak boleh tertanam di mode dinamis
    expect(code).not.toContain("/assets/*");
  });

  it("mendukung kelima strategi caching di handler", () => {
    const code = generateSW(rules);
    for (const s of ["cache-first", "network-first", "stale-while-revalidate", "network-only", "cache-only"]) {
      expect(code).toContain(s);
    }
  });

  // --- v1.1.0: opsi tambahan untuk paritas aplikasi nyata (KT-1) ---

  it("default: melewati request non-GET (cegah TypeError Cache API)", () => {
    const code = generateSW(rules);
    expect(code).toContain('event.request.method !== "GET"');
  });

  it("skipNonGet:false → tidak menambahkan guard non-GET", () => {
    const code = generateSW(rules, { skipNonGet: false });
    expect(code).not.toContain('event.request.method !== "GET"');
  });

  it("default: TIDAK auto-skipWaiting (menunggu konfirmasi user) + handle pesan SKIP_WAITING", () => {
    const code = generateSW(rules);
    expect(code).not.toContain("self.skipWaiting();\n      // di-handle install"); // sanity
    expect(code).toContain('event.data.type === "SKIP_WAITING"');
    expect(code).toContain("self.skipWaiting()");
  });

  it("skipWaiting:true → memanggil self.skipWaiting() saat install", () => {
    const code = generateSW(rules, { skipWaiting: true });
    // Blok install memuat skipWaiting (bukan hanya listener message)
    expect(code).toMatch(/install[\s\S]*self\.skipWaiting\(\)/);
  });

  it("precache: menanam daftar URL app-shell dan cache.addAll saat install", () => {
    const code = generateSW(rules, { precache: ["/", "/index.html", "/manifest.webmanifest"] });
    expect(code).toContain("PRECACHE_URLS");
    expect(code).toContain("/index.html");
    expect(code).toContain("cache.addAll(PRECACHE_URLS)");
  });

  it("cacheVersion: menyisipkan versi dan membersihkan cache lama saat activate", () => {
    const code = generateSW(rules, { cacheVersion: "v3" });
    expect(code).toContain('CACHE_VERSION = "v3"');
    expect(code).toContain('addEventListener("activate"');
    expect(code).toContain("caches.delete");
  });

  it("navigationFallback: menambahkan handler navigate dengan fallback offline", () => {
    const code = generateSW(rules, { navigationFallback: "/index.html" });
    expect(code).toContain('event.request.mode === "navigate"');
    expect(code).toContain('caches.match("/index.html")');
  });
});
