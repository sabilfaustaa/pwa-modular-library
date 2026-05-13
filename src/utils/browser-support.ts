/**
 * browser-support — Feature detection untuk semua API yang digunakan library.
 *
 * @module utils/browser-support
 */

export interface BrowserCapabilities {
  serviceWorker: boolean;
  indexedDB: boolean;
  notifications: boolean;
  cacheAPI: boolean;
  backgroundSync: boolean;
  pushManager: boolean;
  installPrompt: boolean;
}

/**
 * Cek semua kapabilitas browser yang dibutuhkan library.
 */
export function checkCapabilities(): BrowserCapabilities {
  const hasWindow = typeof window !== "undefined";
  const hasNavigator = typeof navigator !== "undefined";

  return {
    serviceWorker: hasNavigator && "serviceWorker" in navigator,
    indexedDB: hasWindow && "indexedDB" in window,
    notifications: hasWindow && "Notification" in window,
    cacheAPI: typeof caches !== "undefined",
    backgroundSync: hasNavigator && "serviceWorker" in navigator && "SyncManager" in window,
    pushManager: hasNavigator && "serviceWorker" in navigator && "PushManager" in window,
    installPrompt: hasWindow,
  };
}
