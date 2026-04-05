import type { PWAConfig } from "../types/config";
import type { BrowserCapabilities } from "../core/capability";
import { CoreModule } from "../core/initializer";
import { useCache } from "../cache/useCache";
import { useStorage } from "../storage/useStorage";
import { useSync } from "../sync/useSync";
import type { SyncTask } from "../sync/types";
import { useCapability } from "./useCapability";
import { useNotification } from "../notification/useNotification";

export interface PWARuntime {
  core: CoreModule;
  config: PWAConfig;
  capabilities: BrowserCapabilities;
  capability: ReturnType<typeof useCapability>;
  cache: ReturnType<typeof useCache>;
  storage: ReturnType<typeof useStorage<SyncTask>>;
  sync: ReturnType<typeof useSync>;
  notification: ReturnType<typeof useNotification>;
}

export function createPWA(config?: PWAConfig): PWARuntime {
  const core = CoreModule.init(config);
  const storage = useStorage<SyncTask>(core.config.storage);
  const sync = useSync(storage, core.config.sync);
  const cache = useCache(core.config.cache);
  const capability = useCapability();
  const notification = useNotification(core.config.notification);

  return {
    core,
    config: core.config,
    capabilities: core.capabilities,
    capability,
    cache,
    storage,
    sync,
    notification,
  };
}
