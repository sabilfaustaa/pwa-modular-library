/**
 * @internal Modul push-sync — Push notification + Background sync queue.
 *
 * File:
 *   - sync-storage.ts  — IndexedDB wrapper untuk sync queue
 *   - retry-policy.ts  — Strategi backoff (exponential / linear)
 *   - sync-queue.ts    — HTTP-specific queue manager
 *   - notification-manager.ts — Push subscriber + notifikasi lokal
 */

export { SyncStorage, recordToEntry, entryToRecord } from "./sync-storage";
export type { SyncQueueRecord } from "./sync-storage";

export { SyncQueue } from "./sync-queue";
export type { SyncQueueOptions } from "./sync-queue";

export { NotificationManager } from "./notification-manager";
export type { NotificationManagerOptions } from "./notification-manager";

export { computeDelay, wait } from "./retry-policy";
export type { RetryPolicy } from "./retry-policy";
