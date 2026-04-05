import { CoreModule } from "../core/initializer";
import type { ServiceWorkerConfig } from "../types/config";
import { DefaultServiceWorkerManager } from "./manager";

function getCoreConfig(): Partial<ServiceWorkerConfig> {
  const core = CoreModule.getConfigOrNull?.();
  return core?.serviceWorker ?? {};
}

function resolveConfig(config?: ServiceWorkerConfig): ServiceWorkerConfig {
  const coreConfig = getCoreConfig();

  return {
    enabled: config?.enabled ?? coreConfig.enabled ?? true,
    url: config?.url ?? coreConfig.url,
    scope: config?.scope ?? coreConfig.scope,
    updateViaCache: config?.updateViaCache ?? coreConfig.updateViaCache,
  };
}

export function useServiceWorker(config?: ServiceWorkerConfig) {
  const resolved = resolveConfig(config);
  const manager = new DefaultServiceWorkerManager(resolved);

  return {
    isSupported: () => manager.isSupported(),
    register: () => manager.register(),
    unregister: () => manager.unregister(),
    update: () => manager.update(),
  };
}
