import { DEFAULT_CACHE_NAME } from "../core/constants";
import { CoreModule } from "../core/initializer";
import { DefaultCacheManager } from "./manager";
import { resolveStrategy } from "./strategies";
import type { CacheConfig } from "../types/config";
import type { CacheFetchOptions, StrategyContext, UseCacheReturn } from "./types";

type ResolvedCacheConfig = Required<
  Pick<CacheConfig, "enabled" | "cacheName" | "defaultStrategy" | "cleanupOnInit" | "cacheableMethods">
> &
  Omit<CacheConfig, "enabled" | "cacheName" | "defaultStrategy" | "cleanupOnInit" | "cacheableMethods">;

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

function getCoreCacheConfig(): Partial<CacheConfig> {
  const coreConfig = CoreModule.getConfigOrNull();
  return coreConfig?.cache ?? {};
}

function resolveConfig(config?: CacheConfig): ResolvedCacheConfig {
  const coreConfig = getCoreCacheConfig();

  return {
    enabled: config?.enabled ?? coreConfig.enabled ?? true,
    cacheName: config?.cacheName ?? coreConfig.cacheName ?? DEFAULT_CACHE_NAME,
    defaultStrategy: config?.defaultStrategy ?? coreConfig.defaultStrategy ?? "cache-first",
    cleanupOnInit: config?.cleanupOnInit ?? coreConfig.cleanupOnInit ?? false,
    ttl: config?.ttl ?? coreConfig.ttl,
    cacheableMethods: config?.cacheableMethods ?? coreConfig.cacheableMethods ?? ["GET"],
  };
}

export function useCache(config?: CacheConfig): UseCacheReturn {
  const resolvedConfig = resolveConfig(config);
  const manager = new DefaultCacheManager(resolvedConfig);

  function createContext(request: RequestInfo | URL, options?: CacheFetchOptions): StrategyContext {
    return {
      request: toRequest(request),
      cacheName: options?.cacheName ?? resolvedConfig.cacheName,
      ttl: options?.ttl ?? resolvedConfig.ttl,
      matchOptions: options?.matchOptions,
      manager,
    };
  }

  return {
    match(request, options) {
      return manager.match(request, options, resolvedConfig.cacheName);
    },

    put(request, response, ttl) {
      return manager.put(request, response, resolvedConfig.cacheName, ttl);
    },

    remove(request) {
      return manager.delete(request, resolvedConfig.cacheName);
    },

    clear() {
      return manager.clear(resolvedConfig.cacheName);
    },

    invalidate(requests) {
      return manager.invalidate(requests, resolvedConfig.cacheName);
    },

    async cacheFirst(request, options) {
      const strategy = resolveStrategy("cache-first");
      return strategy(createContext(request, options));
    },

    async networkFirst(request, options) {
      const strategy = resolveStrategy("network-first");
      return strategy(createContext(request, options));
    },

    async staleWhileRevalidate(request, options) {
      const strategy = resolveStrategy("stale-while-revalidate");
      return strategy(createContext(request, options));
    },

    async fetchWithStrategy(request, options = {}) {
      const strategyName = options.strategy ?? resolvedConfig.defaultStrategy;
      const strategy = resolveStrategy(strategyName);

      return strategy(createContext(request, options));
    },
  };
}
