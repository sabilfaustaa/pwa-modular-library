/**
 * @internal Shared message type constants antara main thread dan service worker.
 * Digunakan untuk sinkronisasi cache rules (D5).
 */
export const SW_MESSAGE_TYPES = {
  /** Main → SW: update cache rules */
  CACHE_RULES_UPDATE: "SABIL_PWA_CACHE_RULES_UPDATE",
  /** SW → Main: request cache rules (cold-start) */
  CACHE_RULES_REQUEST: "SABIL_PWA_CACHE_RULES_REQUEST",
  /** Main → SW: force skip waiting */
  SKIP_WAITING: "SABIL_PWA_SKIP_WAITING",
  /** SW → Main: update available notification */
  UPDATE_AVAILABLE: "SABIL_PWA_UPDATE_AVAILABLE",
} as const;

export type SWMessageType = (typeof SW_MESSAGE_TYPES)[keyof typeof SW_MESSAGE_TYPES];

export interface SWMessage {
  type: SWMessageType;
  payload?: unknown;
}
