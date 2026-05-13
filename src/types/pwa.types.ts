/** Public types untuk usePWA composable. */

import type { Ref } from "vue";

export interface UsePWAOptions {
  /** Path ke service worker file. Default: '/sw.js' */
  swPath?: string;
  /** Scope service worker. Default: '/' */
  scope?: string;
  /** Auto-update saat ada SW baru. Default: true */
  autoUpdate?: boolean;
  /** Callback saat ada update tersedia */
  onUpdateAvailable?: () => void;
  /** Callback saat SW berhasil register */
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  /** Callback saat error */
  onError?: (error: Error) => void;
}

export interface UsePWAReturn {
  /** Apakah service worker terdaftar */
  isRegistered: Readonly<Ref<boolean>>;
  /** Apakah ada update tersedia */
  hasUpdate: Readonly<Ref<boolean>>;
  /** Status koneksi */
  isOnline: Readonly<Ref<boolean>>;
  /** Force update service worker */
  update: () => Promise<void>;
  /** Unregister service worker (untuk testing/debugging) */
  unregister: () => Promise<boolean>;
}
