/** Public types untuk useBackgroundSync composable. */

import type { Ref } from "vue";

export interface UseBackgroundSyncOptions {
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Strategi backoff (default: exponential) */
  backoff?: "linear" | "exponential";
  /** Callback saat sync sukses */
  onSyncSuccess?: (entry: SyncEntry) => void;
  /** Callback saat sync gagal final (sudah habis retry) */
  onSyncFailure?: (entry: SyncEntry, error: Error) => void;
}

export interface SyncEntry {
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Idempotency key (auto-generated jika tidak diset) */
  idempotencyKey?: string;
  /** Timestamp saat dibuat (client-side) */
  createdAt: number;
  /** Berapa kali sudah di-retry */
  retryCount: number;
}

export interface UseBackgroundSyncReturn {
  /** Daftar entry di queue */
  queue: Readonly<Ref<SyncEntry[]>>;
  /** Jumlah entry pending */
  pendingCount: Readonly<Ref<number>>;
  /** Tambah request ke queue */
  enqueue: (entry: Omit<SyncEntry, "id" | "createdAt" | "retryCount">) => Promise<string>;
  /** Force trigger sync */
  flush: () => Promise<void>;
  /** Hapus entry */
  remove: (id: string) => Promise<boolean>;
  /** Bersihkan queue */
  clear: () => Promise<void>;
}
