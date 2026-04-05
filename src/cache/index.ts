export { DefaultCacheManager } from "./manager";
export { cacheFirst, networkFirst, staleWhileRevalidate, resolveStrategy } from "./strategies";
export { useCache } from "./useCache";

export type {
  CacheManager,
  CacheStrategy,
  CacheMatchOptions,
  CacheFetchOptions,
  StrategyContext,
  StrategyResult,
  UseCacheReturn,
} from "./types";
