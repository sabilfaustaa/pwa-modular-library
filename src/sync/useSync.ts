import { DEFAULT_MAX_RETRIES, DEFAULT_RETRY_DELAY } from "../core/constants";
import { CoreModule } from "../core/initializer";
import type { SyncConfig } from "../types/config";
import type { StorageAdapter } from "../storage/adapter";
import { SyncQueue } from "./queue";
import type { SyncQueueConfig, SyncTask } from "./types";

function getCoreSyncConfig(): Partial<SyncConfig> {
  const coreConfig = CoreModule.getConfigOrNull();
  return coreConfig?.sync ?? {};
}

function resolveSyncConfig(config?: SyncQueueConfig): SyncQueueConfig {
  const coreConfig = getCoreSyncConfig();

  return {
    maxRetries: config?.maxRetries ?? coreConfig.maxRetries ?? DEFAULT_MAX_RETRIES,
    retryDelay: config?.retryDelay ?? coreConfig.retryDelay ?? DEFAULT_RETRY_DELAY,
  };
}

export function useSync<T = unknown>(storage: StorageAdapter<SyncTask<T>>, config?: SyncQueueConfig) {
  return new SyncQueue<T>(storage, resolveSyncConfig(config));
}
