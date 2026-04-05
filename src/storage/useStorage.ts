import type { StorageConfig } from "../types/config";
import { CoreModule } from "../core/initializer";
import { IndexedDBStorage } from "./indexeddb";

function getCoreStorageConfig(): Partial<StorageConfig> {
  const coreConfig = CoreModule.getConfigOrNull();
  return coreConfig?.storage ?? {};
}

function resolveStorageConfig(config?: StorageConfig): StorageConfig | undefined {
  const coreConfig = getCoreStorageConfig();

  const resolved: StorageConfig = {
    dbName: config?.dbName ?? coreConfig.dbName,
    storeName: config?.storeName ?? coreConfig.storeName,
  };

  const hasValues = resolved.dbName !== undefined || resolved.storeName !== undefined;

  return hasValues ? resolved : undefined;
}

export function useStorage<T = unknown>(config?: StorageConfig) {
  return new IndexedDBStorage<T>(resolveStorageConfig(config));
}
