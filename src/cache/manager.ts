import { DEFAULT_CACHE_NAME } from "../core/constants";
import { CacheNotSupportedError } from "../core/errors";
import type { CacheConfig, CacheManager, CacheMatchOptions } from "./types";

const CACHE_CREATED_AT_HEADER = "x-pwa-cache-created-at";
const CACHE_TTL_HEADER = "x-pwa-cache-ttl";

function toRequest(input: RequestInfo | URL): Request {
  if (input instanceof Request) {
    return input;
  }

  if (input instanceof URL) {
    return new Request(input.toString());
  }

  const baseUrl =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost";

  if (typeof input === "string") {
    return new Request(new URL(input, baseUrl).toString());
  }

  return new Request(String(input));
}

function isSuccessfulResponse(response: Response): boolean {
  return response.ok;
}

function isCacheableMethod(method: string, allowedMethods: string[]): boolean {
  return allowedMethods.includes(method.toUpperCase());
}

function withCacheMetadata(response: Response, ttl?: number): Response {
  const headers = new Headers(response.headers);
  headers.set(CACHE_CREATED_AT_HEADER, Date.now().toString());

  if (typeof ttl === "number" && ttl > 0) {
    headers.set(CACHE_TTL_HEADER, ttl.toString());
  }

  return new Response(response.clone().body, {
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

  constructor(config: CacheConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      cacheName: config.cacheName ?? DEFAULT_CACHE_NAME,
      defaultStrategy: config.defaultStrategy ?? "cache-first",
      cleanupOnInit: config.cleanupOnInit ?? false,
      ttl: config.ttl,
      cacheableMethods: config.cacheableMethods?.map((method) => method.toUpperCase()) ?? ["GET"],
    };
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
      return undefined;
    }

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
    const finalResponse = withCacheMetadata(response, ttl);

    await cache.put(normalizedRequest, finalResponse);
  }

  async delete(request: RequestInfo | URL, cacheName?: string): Promise<boolean> {
    const cache = await this.open(cacheName);
    return cache.delete(toRequest(request));
  }

  async clear(cacheName?: string): Promise<boolean> {
    const cache = await this.open(cacheName);
    const keys = await cache.keys();

    const results = await Promise.all(keys.map((key) => cache.delete(key)));
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
