export interface BrowserCapabilities {
  serviceWorker: boolean
  indexedDB: boolean
  notifications: boolean
  cacheAPI: boolean
}

export function checkCapabilities(): BrowserCapabilities {
  const hasWindow = typeof window !== 'undefined'
  const hasNavigator = typeof navigator !== 'undefined'
  const hasGlobalThis = typeof globalThis !== 'undefined'

  return {
    serviceWorker: hasNavigator && 'serviceWorker' in navigator,
    indexedDB: hasWindow && 'indexedDB' in window,
    notifications: hasWindow && 'Notification' in window,
    cacheAPI: hasGlobalThis && 'caches' in globalThis
  }
}