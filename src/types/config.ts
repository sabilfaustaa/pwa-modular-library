// CacheStrategy didefinisikan tunggal di cache.types.ts (5 nilai) — di-re-export di sini
// agar interface konfigurasi memakai definisi kanonik yang sama.
export type { CacheStrategy } from "./cache.types";
import type { CacheStrategy } from "./cache.types";

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
