/**
 * sync-storage — wrapper khusus IndexedDB untuk sync queue.
 *
 * Menggunakan library `idb` dengan schema sesuai PRD §7:
 *   Database: 'sabil-pwa-library'
 *   Object Store: 'sync-queues'
 *   Indexes: by queueName, by createdAt, by status
 *
 * @module modules/push-sync/sync-storage
 * @internal
 */

import { openDB, type IDBPDatabase } from "idb";
import type { SyncEntry } from "../../types/sync.types";

/** Record yang disimpan di IndexedDB (SyncEntry + metadata queue). */
export interface SyncQueueRecord {
  id: string;
  queueName: string;
  url: string;
  method: SyncEntry["method"];
  body: string | null;
  headers: string | null;
  idempotencyKey: string;
  createdAt: number;
  retryCount: number;
  lastAttemptAt: number | null;
  status: "pending" | "syncing" | "failed";
}

export const SYNC_DB_NAME = "sabil-pwa-library";
export const SYNC_STORE_NAME = "sync-queues";
const DB_VERSION = 1;

/** Konversi SyncQueueRecord → SyncEntry (untuk konsumsi publik). */
export function recordToEntry(record: SyncQueueRecord): SyncEntry {
  return {
    id: record.id,
    url: record.url,
    method: record.method,
    body: record.body !== null ? JSON.parse(record.body) : undefined,
    headers: record.headers !== null ? JSON.parse(record.headers) : undefined,
    idempotencyKey: record.idempotencyKey,
    createdAt: record.createdAt,
    retryCount: record.retryCount,
  };
}

/** Konversi SyncEntry → SyncQueueRecord (untuk penyimpanan internal). */
export function entryToRecord(
  entry: Omit<SyncEntry, "id" | "createdAt" | "retryCount">,
  queueName: string,
  now: number,
  id: string,
): SyncQueueRecord {
  return {
    id,
    queueName,
    url: entry.url,
    method: entry.method,
    body: entry.body !== undefined ? JSON.stringify(entry.body) : null,
    headers: entry.headers ? JSON.stringify(entry.headers) : null,
    idempotencyKey: entry.idempotencyKey ?? id,
    createdAt: now,
    retryCount: 0,
    lastAttemptAt: null,
    status: "pending",
  };
}

export class SyncStorage {
  private db: IDBPDatabase | null = null;

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      this.db = await openDB(SYNC_DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
            const store = db.createObjectStore(SYNC_STORE_NAME, { keyPath: "id" });
            store.createIndex("byQueueName", "queueName");
            store.createIndex("byCreatedAt", "createdAt");
            store.createIndex("byStatus", "status");
          }
        },
      });
    }
    return this.db;
  }

  async add(record: SyncQueueRecord): Promise<void> {
    const db = await this.getDB();
    await db.add(SYNC_STORE_NAME, record);
  }

  async put(record: SyncQueueRecord): Promise<void> {
    const db = await this.getDB();
    await db.put(SYNC_STORE_NAME, record);
  }

  async get(id: string): Promise<SyncQueueRecord | undefined> {
    const db = await this.getDB();
    return db.get(SYNC_STORE_NAME, id);
  }

  async getByQueue(queueName: string): Promise<SyncQueueRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex(SYNC_STORE_NAME, "byQueueName", queueName);
  }

  async getPending(queueName: string): Promise<SyncQueueRecord[]> {
    const db = await this.getDB();
    const all = await db.getAllFromIndex(SYNC_STORE_NAME, "byQueueName", queueName);
    // Filter pending + sort by createdAt (FIFO)
    return all.filter((r) => r.status === "pending").sort((a, b) => a.createdAt - b.createdAt);
  }

  async count(): Promise<number> {
    const db = await this.getDB();
    return db.count(SYNC_STORE_NAME);
  }

  async countByQueue(queueName: string): Promise<number> {
    const db = await this.getDB();
    return db.countFromIndex(SYNC_STORE_NAME, "byQueueName", queueName);
  }

  async countPending(queueName: string): Promise<number> {
    const records = await this.getPending(queueName);
    return records.length;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(SYNC_STORE_NAME, id);
  }

  async clearQueue(queueName: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(SYNC_STORE_NAME, "readwrite");
    const index = tx.store.index("byQueueName");
    let cursor = await index.openCursor(IDBKeyRange.only(queueName));

    while (cursor) {
      cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    await db.clear(SYNC_STORE_NAME);
  }
}
