/** Public API barrel — hanya export yang sesuai PRD §4. */

import { LIBRARY_VERSION } from "./core/constants";

// Versi library — diturunkan dari satu sumber (core/constants.ts).
export const version = LIBRARY_VERSION;

// --- Composables (public API utama) ---
export { usePWA } from "./composables/usePWA";
export { useCacheConfig } from "./composables/useCacheConfig";
export { useNotifications } from "./composables/useNotifications";
export { useBackgroundSync } from "./composables/useBackgroundSync";
export { useInstallPrompt } from "./composables/useInstallPrompt";

// --- Modul utilitas (non-composable) ---
// Modul Manifest: validasi & diagnostik kelengkapan web app manifest
// (progressive enhancement — instalasi homescreen ditangani useInstallPrompt).
export { validateManifest } from "./modules/manifest";
export type { ManifestWarning } from "./modules/manifest";

// Modul Service Worker: generator kode SW dari cache rules (static embed /
// dynamic postMessage). Dipakai sebagai langkah build untuk menghasilkan sw.js.
export { generateSW } from "./modules/service-worker";
export type { GenerateSWOptions } from "./modules/service-worker";

// --- Public types ---
export type { UsePWAOptions, UsePWAReturn } from "./types/pwa.types";

export type { CacheRule, CacheStrategy, UseCacheConfigReturn } from "./types/cache.types";

export type {
  UseNotificationsOptions,
  UseNotificationsReturn,
  PermissionStatus,
  NotificationPayload,
} from "./types/notification.types";

export type { UseBackgroundSyncOptions, UseBackgroundSyncReturn, SyncEntry } from "./types/sync.types";

export type { UseInstallPromptReturn } from "./types/install.types";

// --- Errors ---
export {
  PWAError,
  ConfigValidationError,
  InitializationError,
  CapabilityNotSupportedError,
  CacheError,
  CacheNotSupportedError,
  CacheStrategyError,
  CacheNetworkError,
  StorageError,
  StorageNotSupportedError,
  SyncError,
  SyncQueueError,
} from "./core/errors";

// --- Constants ---
export {
  LIBRARY_VERSION,
  DEFAULT_CACHE_NAME,
  DEFAULT_DB_NAME,
  DEFAULT_STORE_NAME,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY,
} from "./core/constants";
