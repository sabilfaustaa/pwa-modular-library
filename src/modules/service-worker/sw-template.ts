/**
 * SW Template — Generate kode service worker string dari cache rules.
 *
 * Digunakan oleh developer yang ingin custom service worker dengan
 * aturan caching dari library.
 *
 * @module modules/service-worker/sw-template
 */

import type { CacheRule } from "../../types/cache.types";

/** Opsi untuk {@link generateSW}. */
export interface GenerateSWOptions {
  /**
   * Jika `true`, SW meminta rules dari main thread via postMessage
   * (mode dinamis, berpasangan dengan useCacheConfig).
   * Jika `false` (default), rules di-embed langsung ke dalam kode SW (mode statis).
   */
  kirimRulesViaPostMessage?: boolean;
}

/**
 * Generate kode service worker yang menerapkan aturan caching.
 *
 * Dua mode:
 *   - **static embed** (default): rules ditanam langsung saat build.
 *   - **dynamic postMessage**: rules dikirim runtime dari main thread
 *     (`useCacheConfig`) lewat pesan `SABIL_PWA_CACHE_RULES_UPDATE`.
 *
 * @param rules - Daftar aturan caching
 * @param options - Lihat {@link GenerateSWOptions}
 * @returns String kode JavaScript service worker
 */
export function generateSW(rules: readonly CacheRule[], options?: GenerateSWOptions): string {
  if (options?.kirimRulesViaPostMessage) {
    return generateSWWithPostMessage();
  }
  return generateSWWithEmbeddedRules(rules);
}

/**
 * Generate SW dengan rules yang di-embed langsung.
 */
function generateSWWithEmbeddedRules(rules: readonly CacheRule[]): string {
  const rulesJson = JSON.stringify(rules, null, 2);

  return `
// Auto-generated oleh pwa-modular-library
// Jangan edit manual — regenerate via useCacheConfig

const CACHE_RULES = ${rulesJson};

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  for (const rule of CACHE_RULES) {
    if (matchPattern(url, rule.pattern)) {
      event.respondWith(applyStrategy(event.request, rule));
      return;
    }
  }

  // Tidak ada rule cocok → network default
  event.respondWith(fetch(event.request));
});

function matchPattern(url, pattern) {
  if (typeof pattern === "string") {
    const escaped = pattern.replace(/[.+^$\\{}()|[\\]\\\\\\\\]/g, "\\\\$&");
    const regexStr = escaped.replace(/\\\\*/g, ".*");
    return new RegExp("^" + regexStr + "$").test(url);
  }
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }
  return false;
}

async function applyStrategy(request, rule) {
  const cache = await caches.open(rule.cacheName || "pwa-cache-v1");

  switch (rule.strategy) {
    case "cache-first": {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const networkResponse = await fetch(request);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (e) {
        throw e;
      }
    }

    case "network-first": {
      try {
        const networkResponse = await fetch(request);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (e) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw e;
      }
    }

    case "stale-while-revalidate": {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((res) => {
        cache.put(request, res.clone());
        return res;
      }).catch(() => {});
      return cached || fetchPromise;
    }

    case "network-only":
      return fetch(request);

    case "cache-only": {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw new Error("cache-only: no cached entry for " + request.url);
    }

    default:
      return fetch(request);
  }
}
`.trim();
}

/**
 * Generate SW minimal yang meminta rules dari main thread via postMessage.
 */
function generateSWWithPostMessage(): string {
  return `
// Auto-generated oleh pwa-modular-library
// Rules dikirim dari main thread via postMessage

let CACHE_RULES = [];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  // Minta rules dari main thread
  self.clients.matchAll({ type: "window" }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "SABIL_PWA_CACHE_RULES_REQUEST" });
    });
  });
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SABIL_PWA_CACHE_RULES_UPDATE") {
    CACHE_RULES = event.data.payload || [];
  }
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  for (const rule of CACHE_RULES) {
    if (matchPattern(url, rule.pattern)) {
      event.respondWith(applyStrategy(event.request, rule));
      return;
    }
  }

  event.respondWith(fetch(event.request));
});

// matchPattern dan applyStrategy sama seperti di atas...
function matchPattern(url, pattern) {
  if (typeof pattern === "string") {
    const escaped = pattern.replace(/[.+^$\\{}()|[\\]\\\\\\\\]/g, "\\\\$&");
    const regexStr = escaped.replace(/\\\\*/g, ".*");
    return new RegExp("^" + regexStr + "$").test(url);
  }
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }
  return false;
}

async function applyStrategy(request, rule) {
  const cache = await caches.open(rule.cacheName || "pwa-cache-v1");
  switch (rule.strategy) {
    case "cache-first": {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const networkResponse = await fetch(request);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (e) { throw e; }
    }
    case "network-first": {
      try {
        const networkResponse = await fetch(request);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (e) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw e;
      }
    }
    case "stale-while-revalidate": {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((res) => {
        cache.put(request, res.clone());
        return res;
      }).catch(() => {});
      return cached || fetchPromise;
    }
    case "network-only": return fetch(request);
    case "cache-only": {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw new Error("cache-only: no cached entry for " + request.url);
    }
    default: return fetch(request);
  }
}
`.trim();
}
