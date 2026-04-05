import { CoreModule } from "../core/initializer";

export function useCapability() {
  const { capabilities } = CoreModule.getInstance();

  return {
    capabilities,
    isServiceWorkerSupported: capabilities.serviceWorker,
    isIndexedDBSupported: capabilities.indexedDB,
    isNotificationSupported: capabilities.notifications,
    isCacheSupported: capabilities.cacheAPI,
  };
}
