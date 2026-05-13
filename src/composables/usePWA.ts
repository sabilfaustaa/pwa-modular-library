/**
 * usePWA — Register service worker dan kelola lifecycle.
 *
 * @module composables/usePWA
 */

import { ref, readonly, onUnmounted, getCurrentInstance, type Ref } from "vue";
import type { UsePWAOptions, UsePWAReturn } from "../types/pwa.types";
import {
  registerServiceWorker,
  unregisterServiceWorker,
  updateServiceWorker,
} from "../modules/service-worker/registry";
import { logger } from "../utils/logger";

export function usePWA(options?: UsePWAOptions): UsePWAReturn {
  const isRegistered = ref(false);
  const hasUpdate = ref(false);
  const isOnline = ref(typeof navigator !== "undefined" ? navigator.onLine : true);

  const swPath = options?.swPath ?? "/sw.js";
  const scope = options?.scope ?? "/";
  const autoUpdate = options?.autoUpdate ?? true;

  // Online/offline listeners
  const handleOnline = () => {
    isOnline.value = true;
    logger.info("Network online");
  };

  const handleOffline = () => {
    isOnline.value = false;
    logger.info("Network offline");
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }

  // Cleanup listeners
  const cleanup = () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }
  };

  // Auto-cleanup kalau di Vue context
  if (getCurrentInstance()) {
    onUnmounted(cleanup);
  }

  // Register service worker
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    registerServiceWorker({
      swPath,
      scope,
      onRegistered: (registration) => {
        isRegistered.value = true;
        logger.info("Service Worker registered via usePWA", registration.scope);
        options?.onRegistered?.(registration);
      },
      onUpdateAvailable: (registration) => {
        hasUpdate.value = true;
        logger.info("Service Worker update detected via usePWA");
        options?.onUpdateAvailable?.();

        if (autoUpdate) {
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }
      },
    }).catch((error) => {
      logger.error("Service Worker registration failed in usePWA", error);
      options?.onError?.(error);
    });
  } else {
    logger.warn("Service Worker not supported, usePWA will not register");
  }

  async function update(): Promise<void> {
    try {
      await updateServiceWorker();
      logger.info("Service Worker update triggered via usePWA");
    } catch (error) {
      logger.error("Failed to update service worker via usePWA", error);
      throw error;
    }
  }

  async function unregister(): Promise<boolean> {
    const success = await unregisterServiceWorker();
    if (success) {
      isRegistered.value = false;
      hasUpdate.value = false;
      logger.info("Service Worker unregistered via usePWA");
    }
    return success;
  }

  return {
    isRegistered: readonly(isRegistered) as Readonly<Ref<boolean>>,
    hasUpdate: readonly(hasUpdate) as Readonly<Ref<boolean>>,
    isOnline: readonly(isOnline) as Readonly<Ref<boolean>>,
    update,
    unregister,
  };
}
