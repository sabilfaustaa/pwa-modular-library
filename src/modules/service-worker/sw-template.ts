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
  /**
   * Daftar URL yang di-precache saat event `install` (app-shell).
   * Berguna agar reload offline tetap menyajikan kerangka aplikasi
   * tanpa menunggu cache-on-fetch. Default: `[]`.
   */
  precache?: string[];
  /**
   * Jika `true` (default), request non-GET (POST/PUT/PATCH/DELETE) **tidak**
   * di-intercept SW. Ini mencegah `TypeError` dari Cache API yang menolak
   * `cache.put()` pada request non-GET (mis. `PUT /sesi/{id}/jawaban`).
   */
  skipNonGet?: boolean;
  /**
   * URL fallback untuk request navigasi (`mode === 'navigate'`) saat offline.
   * Mis. `'/index.html'` agar app-shell SPA tetap tampil offline.
   * Jika tidak diisi, navigasi mengikuti rule biasa / network default.
   */
  navigationFallback?: string;
  /**
   * Versi cache. Disisipkan ke seluruh nama cache (`<name>-<version>`).
   * Saat `activate`, cache dengan versi lama dibersihkan otomatis.
   * Default: `'v1'`.
   */
  cacheVersion?: string;
  /**
   * Jika `true`, SW memanggil `self.skipWaiting()` otomatis saat `install`
   * sehingga SW baru langsung aktif. Jika `false` (default), SW menunggu
   * pesan `{ type: 'SKIP_WAITING' }` dari main thread — memungkinkan
   * flow pembaruan **terkonfirmasi user** (banner "Perbarui").
   */
  skipWaiting?: boolean;
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
    return generateSWWithPostMessage(options);
  }
  return generateSWWithEmbeddedRules(rules, options);
}

/** Normalisasi opsi → nilai default yang aman. */
function resolveOptions(options?: GenerateSWOptions) {
  return {
    precache: options?.precache ?? [],
    skipNonGet: options?.skipNonGet ?? true,
    navigationFallback: options?.navigationFallback ?? null,
    cacheVersion: options?.cacheVersion ?? "v1",
    skipWaiting: options?.skipWaiting ?? false,
  };
}

/**
 * Blok `install`: precache app-shell (jika ada) + skipWaiting opsional.
 */
function installBlock(precache: string[], skipWaiting: boolean, versionedName: string): string {
  const precacheJson = JSON.stringify(precache);
  return `
const PRECACHE_URLS = ${precacheJson};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (PRECACHE_URLS.length > 0) {
        const cache = await caches.open(${versionedName}("precache"));
        await cache.addAll(PRECACHE_URLS);
      }
      ${skipWaiting ? "self.skipWaiting();" : "// Menunggu pesan SKIP_WAITING (flow update terkonfirmasi user)"}
    })()
  );
});`.trim();
}

/**
 * Blok `activate`: bersihkan cache versi lama, lalu clients.claim().
 */
function activateBlock(): string {
  return `
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.endsWith("-" + CACHE_VERSION) === false && key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});`.trim();
}

/** Listener pesan SKIP_WAITING agar pembaruan dapat dipicu user. */
function messageBlock(): string {
  return `
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});`.trim();
}

/** Helper runtime yang dibagikan kedua mode (pattern match + strategi + nama cache berversi). */
function sharedRuntimeHelpers(): string {
  return `
function versionedCacheName(base) {
  return CACHE_PREFIX + (base || "runtime") + "-" + CACHE_VERSION;
}

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
  const cache = await caches.open(versionedCacheName(rule.cacheName));

  switch (rule.strategy) {
    case "cache-first": {
      // Cek cache rule, lalu fallback ke seluruh cache (mis. precache app-shell).
      const cached = (await cache.match(request)) || (await caches.match(request));
      if (cached) return cached;
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }

    case "network-first": {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
        const cached = (await cache.match(request)) || (await caches.match(request));
        if (cached) return cached;
        throw e;
      }
    }

    case "stale-while-revalidate": {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((res) => {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    }

    case "network-only":
      return fetch(request);

    case "cache-only": {
      const cached = (await cache.match(request)) || (await caches.match(request));
      if (cached) return cached;
      throw new Error("cache-only: no cached entry for " + request.url);
    }

    default:
      return fetch(request);
  }
}`.trim();
}

/** Blok fetch yang dipakai kedua mode (skip non-GET, navigation fallback, rule match). */
function fetchBlock(skipNonGet: boolean, navigationFallback: string | null): string {
  const navHandler = navigationFallback
    ? `
  // Navigasi (mode navigate) → network-first dengan fallback app-shell offline.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (e) {
          const fallback = await caches.match(${JSON.stringify(navigationFallback)});
          if (fallback) return fallback;
          const cached = await caches.match(event.request);
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }`
    : "";

  return `
self.addEventListener("fetch", (event) => {
  ${skipNonGet ? `// Lewati non-GET — Cache API menolak cache.put() pada non-GET.\n  if (event.request.method !== "GET") return;\n` : ""}
  const url = event.request.url;
${navHandler}
  for (const rule of CACHE_RULES) {
    if (matchPattern(url, rule.pattern)) {
      event.respondWith(applyStrategy(event.request, rule));
      return;
    }
  }

  // Tidak ada rule cocok → network default
  event.respondWith(fetch(event.request));
});`.trim();
}

/**
 * Generate SW dengan rules yang di-embed langsung.
 */
function generateSWWithEmbeddedRules(rules: readonly CacheRule[], options?: GenerateSWOptions): string {
  const opts = resolveOptions(options);
  const rulesJson = JSON.stringify(rules, null, 2);

  return `
// Auto-generated oleh pwa-modular-library
// Jangan edit manual — regenerate via generateSW()/build step

const CACHE_VERSION = ${JSON.stringify(opts.cacheVersion)};
const CACHE_PREFIX = "pwa-";

const CACHE_RULES = ${rulesJson};

${installBlock(opts.precache, opts.skipWaiting, "versionedCacheName")}

${activateBlock()}

${messageBlock()}

${fetchBlock(opts.skipNonGet, opts.navigationFallback)}

${sharedRuntimeHelpers()}
`.trim();
}

/**
 * Generate SW minimal yang meminta rules dari main thread via postMessage.
 */
function generateSWWithPostMessage(options?: GenerateSWOptions): string {
  const opts = resolveOptions(options);

  return `
// Auto-generated oleh pwa-modular-library
// Rules dikirim dari main thread via postMessage

const CACHE_VERSION = ${JSON.stringify(opts.cacheVersion)};
const CACHE_PREFIX = "pwa-";

let CACHE_RULES = [];

${installBlock(opts.precache, opts.skipWaiting, "versionedCacheName")}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.endsWith("-" + CACHE_VERSION) === false && key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      // Minta rules dari main thread
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        client.postMessage({ type: "SABIL_PWA_CACHE_RULES_REQUEST" });
      });
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SABIL_PWA_CACHE_RULES_UPDATE") {
    CACHE_RULES = event.data.payload || [];
  }
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

${fetchBlock(opts.skipNonGet, opts.navigationFallback)}

${sharedRuntimeHelpers()}
`.trim();
}
