/**
 * Service Worker Registry — register/unregister dengan lifecycle tracking.
 *
 * @module modules/service-worker/registry
 */

import { logger } from "../../utils/logger";
import { PWAError } from "../../core/errors";

export interface RegistrationOptions {
  swPath: string;
  scope: string;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

let activeRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker (idempotent).
 */
export async function registerServiceWorker(options: RegistrationOptions): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    logger.warn("Service Worker not supported in this browser");
    return null;
  }

  try {
    // Cek apakah sudah terdaftar dengan path yang sama
    const existing = await navigator.serviceWorker.getRegistration(options.scope);
    if (existing && existing.active?.scriptURL.endsWith(options.swPath)) {
      logger.info("Service Worker already registered", existing.active.scriptURL);
      activeRegistration = existing;
      options.onRegistered?.(existing);
      return existing;
    }

    // Register baru
    const registration = await navigator.serviceWorker.register(options.swPath, {
      scope: options.scope,
    });

    activeRegistration = registration;
    logger.info("Service Worker registered", registration.scope);
    options.onRegistered?.(registration);

    // Setup update detection
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          logger.info("Service Worker update available");
          options.onUpdateAvailable?.(registration);
        }
      });
    });

    return registration;
  } catch (error) {
    const pwaError = new PWAError(
      "SW_REGISTRATION_ERROR",
      `Failed to register service worker: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    logger.error("Service Worker registration failed", pwaError);
    options.onError?.(pwaError);
    throw pwaError;
  }
}

/**
 * Unregister service worker dan reset state.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!activeRegistration) {
    logger.warn("No active service worker to unregister");
    return false;
  }

  try {
    const success = await activeRegistration.unregister();
    if (success) {
      logger.info("Service Worker unregistered");
      activeRegistration = null;
    }
    return success;
  } catch (error) {
    logger.error("Failed to unregister service worker", error);
    return false;
  }
}

/**
 * Trigger update check untuk service worker aktif.
 */
export async function updateServiceWorker(): Promise<void> {
  if (!activeRegistration) {
    throw new PWAError("SW_UPDATE_ERROR", "No active service worker registration");
  }

  try {
    await activeRegistration.update();
    logger.info("Service Worker update check triggered");
  } catch (error) {
    throw new PWAError(
      "SW_UPDATE_ERROR",
      `Failed to update service worker: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Get active registration (untuk testing/debugging).
 */
export function getActiveRegistration(): ServiceWorkerRegistration | null {
  return activeRegistration;
}

/**
 * Reset internal state (hanya untuk testing).
 */
export function resetRegistry(): void {
  activeRegistration = null;
}
