import { CoreModule } from "../core/initializer";
import type { NotificationConfig } from "../types/config";
import { DefaultNotificationManager } from "./manager";
import type { UseNotificationReturn } from "./types";

function getCoreNotificationConfig(): Partial<NotificationConfig> {
  const coreConfig = CoreModule.getConfigOrNull();
  return coreConfig?.notification ?? {};
}

function resolveNotificationConfig(config?: NotificationConfig): NotificationConfig {
  const coreConfig = getCoreNotificationConfig();

  return {
    requestPermissionOnInit: config?.requestPermissionOnInit ?? coreConfig.requestPermissionOnInit ?? false,
  };
}

export function useNotification(config?: NotificationConfig): UseNotificationReturn {
  const resolvedConfig = resolveNotificationConfig(config);
  const manager = new DefaultNotificationManager(resolvedConfig);

  void manager.initialize();

  return {
    isSupported() {
      return manager.isSupported();
    },

    getPermission() {
      return manager.getPermission();
    },

    requestPermission() {
      return manager.requestPermission();
    },

    show(title, options) {
      return manager.show(title, options);
    },
  };
}
