/**
 * @internal Modul caching — rule registry + SW sync + strategies + cache manager.
 */
export { RuleRegistry } from "./rule-registry";
export { broadcastRules, listenForRuleRequest, hasActiveController } from "./sw-sync";
export { DefaultCacheManager } from "./manager";
export { cacheFirst, networkFirst, staleWhileRevalidate, networkOnly, cacheOnly, resolveStrategy } from "./strategies";

export type {
  CacheManager,
  CacheMatchOptions,
  CacheFetchOptions,
  StrategyContext,
  StrategyResult,
} from "./cache-types";
