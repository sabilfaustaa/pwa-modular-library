import { DEFAULT_CACHE_NAME } from "../../core/constants";
import { CacheNotSupportedError } from "../../core/errors";
import type { CacheConfig, CacheManager, CacheMatchOptions } from "./cache-types";

const CACHE_CREATED_AT_HEADER = "x-pwa-cache-created-at";
const CACHE_TTL_HEADER = "x-pwa-cache-ttl";

/**
 * Normalisasi input ke objek Request.
 * Menghilangkan default port (80/443) dari origin untuk konsistensi key.
 */
function toRequest(input: RequestInfo | URL): Request {
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input;
  }

  if (typeof URL !== "undefined" && input instanceof URL) {
    return new Request(input.toString());
  }

  const baseUrl =
    typeof window !== "undefined" && window.location?.origin
      ? normalizeOrigin(window.location.origin)
      : "http://localhost";

  if (typeof input === "string") {
    try {
      return new Request(new URL(input, baseUrl).toString());
    } catch {
      return new Request(input);
    }
  }

  return new Request(String(input));
}

/**
 * Strip default port (80 untuk http, 443 untuk https) dari origin URL.
 */
function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (
      (url.protocol === "http:" && url.port === "80") ||
      (url.protocol === "https:" && url.port === "443") ||
      (url.hostname === "localhost" && (url.port === "3000" || url.port === ""))
    ) {
      url.port = "";
    }
    let result = url.toString();
    if (result.endsWith("/")) {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return origin;
  }
}

/**
 * Buat key unik untuk identifikasi request di cache.
 */
function requestKey(request: Request): string {
  return `${request.method.toUpperCase()}:${request.url}`;
}

function isSuccessfulResponse(response: Response): boolean {
  return response.ok;
}

function isCacheableMethod(method: string, allowedMethods: string[]): boolean {
  return allowedMethods.includes(method.toUpperCase());
}

/**
 * Bungkus ulang response dengan metadata cache (created-at, ttl).
 */
async function withCacheMetadata(response: Response, ttl?: number): Promise<Response> {
  const bodyText = await response.text();
  const headers = new Headers(response.headers);
  headers.set(CACHE_CREATED_AT_HEADER, Date.now().toString());

  if (typeof ttl === "number" && ttl > 0) {
    headers.set(CACHE_TTL_HEADER, ttl.toString());
  }

  return new Response(bodyText, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isExpired(response: Response): boolean {
  const createdAtRaw = response.headers.get(CACHE_CREATED_AT_HEADER);
  const ttlRaw = response.headers.get(CACHE_TTL_HEADER);

  if (!createdAtRaw || !ttlRaw) {
    return false;
  }

  const createdAt = Number(createdAtRaw);
  const ttl = Number(ttlRaw);

  if (Number.isNaN(createdAt) || Number.isNaN(ttl) || ttl <= 0) {
    return false;
  }

  return Date.now() > createdAt + ttl;
}

export class DefaultCacheManager implements CacheManager {
  private readonly config: Required<
    Pick<CacheConfig, "enabled" | "cacheName" | "defaultStrategy" | "cleanupOnInit" | "cacheableMethods">
  > &
    Omit<CacheConfig, "enabled" | "cacheName" | "defaultStrategy" | "cleanupOnInit" | "cacheableMethods">;

  private maxEntries?: number;

  private lruMap = new Map<string, number>();

  constructor(config: CacheConfig & { maxEntries?: number } = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      cacheName: config.cacheName ?? DEFAULT_CACHE_NAME,
      defaultStrategy: config.defaultStrategy ?? "cache-first",
      cleanupOnInit: config.cleanupOnInit ?? false,
      ttl: config.ttl,
      cacheableMethods: config.cacheableMethods?.map((method: string) => method.toUpperCase()) ?? ["GET"],
    };
    this.maxEntries = config.maxEntries;
  }

  private ensureSupported(): void {
    if (!("caches" in globalThis) || !globalThis.caches) {
      throw new CacheNotSupportedError();
    }
  }

  private resolveCacheName(cacheName?: string): string {
    return cacheName ?? this.config.cacheName;
  }

  async open(cacheName?: string): Promise<Cache> {
    this.ensureSupported();
    return globalThis.caches.open(this.resolveCacheName(cacheName));
  }

  async match(
    request: RequestInfo | URL,
    options?: CacheMatchOptions,
    cacheName?: string,
  ): Promise<Response | undefined> {
    const cache = await this.open(cacheName);
    const normalizedRequest = toRequest(request);
    const matched = await cache.match(normalizedRequest, options);

    if (!matched) {
      return undefined;
    }

    if (isExpired(matched)) {
      await cache.delete(normalizedRequest);
      const rk = requestKey(normalizedRequest);
      this.lruMap.delete(rk);
      return undefined;
    }

    const rk = requestKey(normalizedRequest);
    this.lruMap.set(rk, Date.now());

    return matched;
  }

  async put(request: RequestInfo | URL, response: Response, cacheName?: string, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const normalizedRequest = toRequest(request);

    if (!isCacheableMethod(normalizedRequest.method, this.config.cacheableMethods)) {
      return;
    }

    if (!isSuccessfulResponse(response)) {
      return;
    }

    const cache = await this.open(cacheName);

    if (typeof this.maxEntries === "number" && this.maxEntries > 0) {
      const keys = await cache.keys();
      if (keys.length >= this.maxEntries) {
        await this.evictLRU(cache, keys);
      }
    }

    const finalResponse = await withCacheMetadata(response, ttl);

    await cache.put(normalizedRequest, finalResponse);

    const rk = requestKey(normalizedRequest);
    this.lruMap.set(rk, Date.now());
  }

  private async evictLRU(cache: Cache, keys: readonly Request[]): Promise<void> {
    let oldestKey: Request | null = null;
    let oldestTime = Infinity;

    for (const key of keys) {
      const rk = requestKey(key);

      const memTime = this.lruMap.get(rk);
      if (memTime !== undefined) {
        if (memTime < oldestTime) {
          oldestTime = memTime;
          oldestKey = key;
        }
        continue;
      }

      try {
        const cached = await cache.match(key);
        if (cached) {
          const createdAtRaw = cached.headers.get(CACHE_CREATED_AT_HEADER);
          const createdAt = createdAtRaw ? Number(createdAtRaw) : 0;
          if (createdAt < oldestTime) {
            oldestTime = createdAt;
            oldestKey = key;
          }
        }
      } catch {
        // Entry corrupt / unreadable, skip
      }
    }

    if (oldestKey) {
      const rk = requestKey(oldestKey);
      await cache.delete(oldestKey);
      this.lruMap.delete(rk);
    }
  }

  setMaxEntries(max: number | undefined): void {
    this.maxEntries = max;
  }

  async delete(request: RequestInfo | URL, cacheName?: string): Promise<boolean> {
    const cache = await this.open(cacheName);
    const normalizedRequest = toRequest(request);
    const result = await cache.delete(normalizedRequest);
    if (result) {
      this.lruMap.delete(requestKey(normalizedRequest));
    }
    return result;
  }

  async clear(cacheName?: string): Promise<boolean> {
    const cache = await this.open(cacheName);
    const keys = await cache.keys();
    const results = await Promise.all(keys.map((key) => cache.delete(key)));

    for (const key of keys) {
      this.lruMap.delete(requestKey(key));
    }

    return results.every(Boolean);
  }

  async invalidate(requests: Array<RequestInfo | URL>, cacheName?: string): Promise<void> {
    await Promise.all(requests.map((request) => this.delete(request, cacheName)));
  }

  async keys(cacheName?: string): Promise<readonly Request[]> {
    const cache = await this.open(cacheName);
    return cache.keys();
  }
}
