export type CacheStrategy = "cache-first" | "network-first" | "stale-while-revalidate";

export interface ServiceWorkerConfig {
  enabled?: boolean;
  url?: string;
  scope?: string;
  updateViaCache?: "all" | "imports" | "none";
}

export interface CacheConfig {
  enabled?: boolean;
  cacheName?: string;
  defaultStrategy?: CacheStrategy;
  cleanupOnInit?: boolean;
  ttl?: number;
  cacheableMethods?: string[];
}

export interface StorageConfig {
  dbName?: string;
  storeName?: string;
}

export interface SyncConfig {
  maxRetries?: number;
  retryDelay?: number;
}

export interface NotificationConfig {
  requestPermissionOnInit?: boolean;
}

export interface PWAConfig {
  serviceWorker?: ServiceWorkerConfig;
  cache?: CacheConfig;
  storage?: StorageConfig;
  sync?: SyncConfig;
  notification?: NotificationConfig;
}
