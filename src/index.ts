export const version = "0.1.0";

export type {
  PWAConfig,
  ServiceWorkerConfig,
  CacheConfig,
  StorageConfig,
  SyncConfig,
  NotificationConfig,
} from "./types/config";

export type { BrowserCapabilities } from "./core/capability";

export { CoreModule } from "./core/initializer";
export { validateConfig } from "./core/validator";
export { checkCapabilities } from "./core/capability";

export { PWAError, ConfigValidationError, InitializationError } from "./core/errors";

export {
  LIBRARY_VERSION,
  DEFAULT_CACHE_NAME,
  DEFAULT_DB_NAME,
  DEFAULT_STORE_NAME,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY,
} from "./core/constants";

export { usePWA } from "./modules/usePWA";
export { useCapability } from "./modules/useCapability";
export { createPWA } from "./modules/createPWA";
export type { PWARuntime } from "./modules/createPWA";

export type { StorageAdapter } from "./storage/adapter";

export { IndexedDBStorage } from "./storage/indexeddb";
export { useStorage } from "./storage/useStorage";

export type { SyncTask, SyncTaskStatus, SyncQueueConfig, SyncTaskExecutor } from "./sync/types";

export { SyncQueue } from "./sync/queue";
export { useSync } from "./sync/useSync";

// Cache module exports
export {
  DefaultCacheManager,
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  resolveStrategy,
  useCache,
} from "./cache";

export type {
  CacheManager,
  CacheStrategy,
  CacheMatchOptions,
  CacheFetchOptions,
  StrategyContext,
  StrategyResult,
  UseCacheReturn,
} from "./cache";
