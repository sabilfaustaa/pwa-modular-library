import { CacheNetworkError, CacheStrategyError } from "../../core/errors";
import type { CacheStrategy, StrategyContext, StrategyResult } from "./cache-types";

/**
 * Ambil respons dari network, lalu simpan ke cache.
 * @internal
 */
async function fetchAndCache(context: StrategyContext): Promise<Response> {
  const networkResponse = await fetch(context.request.url);

  if (!networkResponse.ok) {
    throw new CacheNetworkError(
      `fetchAndCache: network returned non-ok status ${networkResponse.status} for ${context.request.url}`,
    );
  }

  await context.manager.put(context.request, networkResponse.clone(), context.cacheName, context.ttl);

  return networkResponse;
}

/**
 * Strategi **cache-first**: cek cache dulu, fallback ke network.
 * Cocok untuk aset statis (gambar, font, CSS).
 */
export async function cacheFirst(context: StrategyContext): Promise<StrategyResult> {
  const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

  if (cachedResponse) {
    return {
      response: cachedResponse,
      source: "cache",
    };
  }

  try {
    const networkResponse = await fetchAndCache(context);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    throw new CacheNetworkError(`cache-first strategy failed for request: ${context.request.url}`, error);
  }
}

/**
 * Strategi **network-first**: coba network dulu, fallback ke cache.
 * Cocok untuk data API yang sering berubah.
 */
export async function networkFirst(context: StrategyContext): Promise<StrategyResult> {
  try {
    const networkResponse = await fetchAndCache(context);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

    if (cachedResponse) {
      return {
        response: cachedResponse,
        source: "cache",
      };
    }

    throw new CacheNetworkError(
      `network-first strategy failed and no cache fallback found for request: ${context.request.url}`,
      error,
    );
  }
}

/**
 * Strategi **stale-while-revalidate**: kembalikan cache dulu, refresh di background.
 * Cocok untuk data yang boleh sedikit basi (avatar, list berita).
 */
export async function staleWhileRevalidate(context: StrategyContext): Promise<StrategyResult> {
  const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

  if (cachedResponse) {
    void fetchAndCache(context).catch(() => {
      // Silent fail: gagal revalidasi background tidak boleh mengganggu UX
    });

    return {
      response: cachedResponse,
      source: "cache",
    };
  }

  try {
    const networkResponse = await fetchAndCache(context);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    throw new CacheNetworkError(`stale-while-revalidate strategy failed for request: ${context.request.url}`, error);
  }
}

/**
 * Strategi **network-only**: selalu ambil dari network, tidak simpan ke cache.
 * Cocok untuk data real-time yang tidak boleh di-cache.
 */
export async function networkOnly(context: StrategyContext): Promise<StrategyResult> {
  try {
    const networkResponse = await fetch(context.request.url);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    throw new CacheNetworkError(`network-only strategy failed for request: ${context.request.url}`, error);
  }
}

/**
 * Strategi **cache-only**: hanya ambil dari cache, gagal kalau tidak ada.
 * Cocok untuk resource yang wajib ada di cache (pre-cached assets).
 */
export async function cacheOnly(context: StrategyContext): Promise<StrategyResult> {
  const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

  if (cachedResponse) {
    return {
      response: cachedResponse,
      source: "cache",
    };
  }

  throw new CacheNetworkError(`cache-only strategy failed: no cached entry for ${context.request.url}`);
}

/**
 * Resolve strategy string ke fungsi strategy.
 */
export function resolveStrategy(strategy: CacheStrategy): (context: StrategyContext) => Promise<StrategyResult> {
  switch (strategy) {
    case "cache-first":
      return cacheFirst;
    case "network-first":
      return networkFirst;
    case "stale-while-revalidate":
      return staleWhileRevalidate;
    case "network-only":
      return networkOnly;
    case "cache-only":
      return cacheOnly;
    default:
      throw new CacheStrategyError(`Unsupported cache strategy: ${strategy}`);
  }
}
