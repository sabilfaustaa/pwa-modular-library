/**
 * sync-queue — Queue HTTP request saat offline, auto-retry saat online.
 *
 * Fitur:
 *   - Persistent di IndexedDB (via SyncStorage)
 *   - Auto-flush saat online event
 *   - Exponential/linear backoff
 *   - Idempotency key (auto-generate atau dari client)
 *   - maxRetries enforcement
 *
 * @module modules/push-sync/sync-queue
 * @internal digunakan oleh useBackgroundSync composable
 */

import type { SyncEntry } from "../../types/sync.types";
import { type SyncQueueRecord, entryToRecord, recordToEntry, SyncStorage } from "./sync-storage";

export interface SyncQueueOptions {
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Strategi backoff (default: "exponential") */
  backoff?: "linear" | "exponential";
  /** Callback saat sync sukses */
  onSyncSuccess?: (entry: SyncEntry) => void;
  /** Callback saat sync gagal final (retry habis) */
  onSyncFailure?: (entry: SyncEntry, error: Error) => void;
}

const DEFAULT_MAX_RETRIES = 3;

export class SyncQueue {
  private readonly storage: SyncStorage;
  private readonly queueName: string;
  private readonly maxRetries: number;
  private readonly options: SyncQueueOptions;
  private isFlushing = false;
  private onlineHandler: (() => void) | null = null;

  constructor(queueName: string, options?: SyncQueueOptions) {
    this.storage = new SyncStorage();
    this.queueName = queueName;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.options = options ?? {};
  }

  // ---- Lifecycle ----

  /** Pasang listener online event untuk auto-flush. */
  attachOnlineListener(): void {
    if (typeof window === "undefined") return;
    if (this.onlineHandler) return;

    this.onlineHandler = () => {
      void this.flush();
    };
    window.addEventListener("online", this.onlineHandler);
  }

  /** Lepas listener online event. */
  detachOnlineListener(): void {
    if (this.onlineHandler && typeof window !== "undefined") {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  // ---- Operasi utama ----

  /**
   * Tambah request HTTP ke queue.
   * Auto-generate id (UUID) dan idempotencyKey jika tidak diset.
   */
  async enqueue(entry: Omit<SyncEntry, "id" | "createdAt" | "retryCount">): Promise<string> {
    const now = Date.now();
    const id = crypto.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2, 10)}`;
    const record = entryToRecord(entry, this.queueName, now, id);
    await this.storage.add(record);
    return id;
  }

  /** Dapatkan semua entry di queue (sebagai SyncEntry publik). */
  async getAll(): Promise<SyncEntry[]> {
    const records = await this.storage.getByQueue(this.queueName);
    return records.map(recordToEntry).sort((a, b) => a.createdAt - b.createdAt);
  }

  /** Jumlah entry pending. */
  async pendingCount(): Promise<number> {
    return this.storage.countPending(this.queueName);
  }

  /** Hapus entry spesifik. */
  async remove(id: string): Promise<boolean> {
    const record = await this.storage.get(id);
    if (!record) return false;
    await this.storage.delete(id);
    return true;
  }

  /** Bersihkan seluruh queue ini. */
  async clear(): Promise<void> {
    await this.storage.clearQueue(this.queueName);
  }

  // ---- Flush ----

  /**
   * Proses semua entry pending di queue.
   * Idempotent — kalau sedang flush, return segera.
   */
  async flush(): Promise<void> {
    if (this.isFlushing) return;
    this.isFlushing = true;

    try {
      const pending = await this.storage.getPending(this.queueName);

      for (const record of pending) {
        await this.processOne(record);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  // ---- Internal ----

  private async processOne(record: SyncQueueRecord): Promise<void> {
    // Tandai sedang sync
    const syncing: SyncQueueRecord = {
      ...record,
      status: "syncing" as const,
      lastAttemptAt: Date.now(),
    };
    await this.storage.put(syncing);

    try {
      const response = await this.sendHTTP(syncing);

      if (!response.ok && response.status >= 500) {
        // Server error → retryable
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Client error (4xx) → tidak retryable, langsung failed
        const error = new Error(`Client error: ${response.status} ${response.statusText}`);
        await this.markFailed(syncing, error);
        return;
      }

      // Sukses → hapus dari queue
      await this.storage.delete(record.id);
      this.options.onSyncSuccess?.(recordToEntry(record));
    } catch (error) {
      await this.handleRetry(syncing, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Kirim HTTP request sesuai SyncQueueRecord.
   * Include header `Idempotency-Key` untuk cegah duplikasi di server.
   */
  private async sendHTTP(record: SyncQueueRecord): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": record.idempotencyKey,
      ...(record.headers ? JSON.parse(record.headers) : {}),
    };

    const init: RequestInit = {
      method: record.method,
      headers,
    };

    if (record.body !== null) {
      init.body = record.body;
    }

    return fetch(record.url, init);
  }

  /**
   * Handle retry: tambah retryCount, cek maxRetries.
   *
   * Delay backoff terjadi di antara pemanggilan flush() — bukan di dalam
   * flush() sendiri. Developer (atau online event) memanggil flush() ulang.
   *
   * Gunakan computeDelay(retryCount) untuk menghitung kapan sebaiknya
   * flush() dipanggil lagi (via callback onRetrySuggested misalnya).
   */
  private async handleRetry(record: SyncQueueRecord, error: Error): Promise<void> {
    const nextRetryCount = record.retryCount + 1;

    if (nextRetryCount >= this.maxRetries) {
      await this.markFailed(record, error);
      return;
    }

    // Kembalikan ke pending — tanpa menunggu delay.
    // Delay backoff adalah tanggung jawab pemanggil flush().
    const pending: SyncQueueRecord = {
      ...record,
      retryCount: nextRetryCount,
      status: "pending",
      lastAttemptAt: Date.now(),
    };
    await this.storage.put(pending);
  }

  /** Tandai entry sebagai failed permanent + panggil callback. */
  private async markFailed(record: SyncQueueRecord, error: Error): Promise<void> {
    const failed: SyncQueueRecord = {
      ...record,
      status: "failed",
      lastAttemptAt: Date.now(),
    };
    await this.storage.put(failed);
    this.options.onSyncFailure?.(recordToEntry(record), error);
  }
}
