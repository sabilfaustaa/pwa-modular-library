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
});
