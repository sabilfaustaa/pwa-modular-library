/**
 * SW Sync — Sinkronisasi cache rules antara main thread dan service worker.
 *
 * Protokol (D5):
 * - Main → SW: postMessage({ type: 'SABIL_PWA_CACHE_RULES_UPDATE', rules })
 * - SW → Main (cold-start): postMessage({ type: 'SABIL_PWA_CACHE_RULES_REQUEST' })
 *
 * @module modules/caching/sw-sync
 */

import { SW_MESSAGE_TYPES } from "../service-worker/messages";
import type { CacheRule } from "../../types/cache.types";
import { logger } from "../../utils/logger";

/**
 * Broadcast aturan caching ke semua client SW (termasuk SW sendiri).
 */
export function broadcastRules(rules: readonly CacheRule[]): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const sw = navigator.serviceWorker.controller;
  if (sw) {
    sw.postMessage({
      type: SW_MESSAGE_TYPES.CACHE_RULES_UPDATE,
      payload: rules,
    });
    logger.info("Cache rules broadcasted to SW", rules.length, "rules");
  }
}

/**
 * Dengarkan permintaan rules dari SW (cold-start).
 * Dipanggil saat aplikasi di-load.
 */
export function listenForRuleRequest(onRequest: () => readonly CacheRule[]): () => void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent): void => {
    if (event.data?.type === SW_MESSAGE_TYPES.CACHE_RULES_REQUEST) {
      const rules = onRequest();
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: SW_MESSAGE_TYPES.CACHE_RULES_UPDATE,
          payload: rules,
        });
        logger.info("Cache rules sent to SW (response to request)");
      }
    }
  };

  navigator.serviceWorker.addEventListener("message", handler);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handler);
  };
}

/**
 * Cek apakah SW controller aktif.
 */
export function hasActiveController(): boolean {
  return !!(typeof navigator !== "undefined" && navigator.serviceWorker?.controller);
}
