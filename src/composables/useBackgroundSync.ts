/**
 * useBackgroundSync — Queue HTTP request saat offline, auto-retry saat online.
 *
 * @module composables/useBackgroundSync
 */

import { ref, readonly, onUnmounted, type Ref } from "vue";
import { SyncQueue } from "../modules/push-sync/sync-queue";
import type { SyncQueueOptions } from "../modules/push-sync/sync-queue";
import type { UseBackgroundSyncOptions, UseBackgroundSyncReturn, SyncEntry } from "../types/sync.types";

/**
 * Composable untuk mengantrekan request HTTP saat offline dan auto-retry saat online.
 *
 * @param queueName - Nama queue (wajib). Digunakan sebagai key di IndexedDB.
 * @param options - Konfigurasi retry, backoff, dan callback.
 * @returns Object dengan state reactif dan method operasi queue.
 *
 * @example
 * ```ts
 * const { pendingCount, enqueue, flush } = useBackgroundSync('exam-answers', {
 *   maxRetries: 5,
 *   onSyncSuccess: (entry) => console.log('OK:', entry.id),
 *   onSyncFailure: (entry, err) => console.error('FAIL:', entry.id, err),
 * })
 *
 * // Saat offline:
 * await enqueue({
 *   url: '/api/exams/submit',
 *   method: 'POST',
 *   body: { examId: 1, answers: [...] },
 * })
 * // → otomatis flush saat online kembali
 * ```
 */
export function useBackgroundSync(queueName: string, options?: UseBackgroundSyncOptions): UseBackgroundSyncReturn {
  const queueSyncOptions: SyncQueueOptions = {
    maxRetries: options?.maxRetries,
    backoff: options?.backoff,
    onSyncSuccess: options?.onSyncSuccess,
    onSyncFailure: options?.onSyncFailure,
  };

  const queue = new SyncQueue(queueName, queueSyncOptions);

  // State reactif
  const entries = ref<SyncEntry[]>([]);
  const pendingCount = ref(0);

  // Auto-flush saat online
  queue.attachOnlineListener();

  // Jika saat ini online, auto-flush
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void queue.flush().then(refreshState);
  }

  // Refresh state dari IDB
  void refreshState();

  // Cleanup
  onUnmounted(() => {
    queue.detachOnlineListener();
  });

  async function refreshState(): Promise<void> {
    entries.value = await queue.getAll();
    pendingCount.value = await queue.pendingCount();
  }

  async function enqueue(entry: Omit<SyncEntry, "id" | "createdAt" | "retryCount">): Promise<string> {
    const id = await queue.enqueue(entry);
    await refreshState();

    // Jika online, segera flush
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void queue.flush().then(refreshState);
    }

    return id;
  }

  async function flush(): Promise<void> {
    await queue.flush();
    await refreshState();
  }

  async function remove(id: string): Promise<boolean> {
    const result = await queue.remove(id);
    await refreshState();
    return result;
  }

  async function clear(): Promise<void> {
    await queue.clear();
    await refreshState();
  }

  return {
    queue: readonly(entries) as Readonly<Ref<SyncEntry[]>>,
    pendingCount: readonly(pendingCount) as Readonly<Ref<number>>,
    enqueue,
    flush,
    remove,
    clear,
  };
}

export type { UseBackgroundSyncOptions, UseBackgroundSyncReturn, SyncEntry };
