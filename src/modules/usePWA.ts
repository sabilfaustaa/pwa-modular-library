import { CoreModule } from "../core/initializer";

export function usePWA() {
  const instance = CoreModule.getInstance();

  return {
    config: instance.config,
    capabilities: instance.capabilities,
    isInitialized: instance.isInitialized,
  };
}
