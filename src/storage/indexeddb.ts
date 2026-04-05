import { DEFAULT_DB_NAME, DEFAULT_STORE_NAME } from "../core/constants";
import type { StorageConfig } from "../types/config";
import type { StorageAdapter } from "./adapter";

export class IndexedDBStorage<T = unknown> implements StorageAdapter<T> {
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly version: number;

  constructor(config?: StorageConfig) {
    this.dbName = config?.dbName ?? DEFAULT_DB_NAME;
    this.storeName = config?.storeName ?? DEFAULT_STORE_NAME;
    this.version = 1;
  }

  private getIndexedDB(): IDBFactory {
    if (typeof indexedDB === "undefined") {
      throw new Error("IndexedDB is not supported in this environment");
    }

    return indexedDB;
  }

  private async openDB(): Promise<IDBDatabase> {
    const indexedDBFactory = this.getIndexedDB();

    return await new Promise((resolve, reject) => {
      const request = indexedDBFactory.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async withStore<R>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => Promise<R>): Promise<R> {
    const db = await this.openDB();

    try {
      const transaction = db.transaction(this.storeName, mode);
      const store = transaction.objectStore(this.storeName);
      const result = await operation(store);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });

      return result;
    } finally {
      db.close();
    }
  }

  async get(key: string): Promise<T | undefined> {
    return this.withStore("readonly", async (store) => {
      return await new Promise<T | undefined>((resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async set(key: string, value: T): Promise<void> {
    await this.withStore("readwrite", async (store) => {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async delete(key: string): Promise<boolean> {
    const existing = await this.get(key);

    if (existing === undefined) {
      return false;
    }

    await this.withStore("readwrite", async (store) => {
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    return true;
  }

  async clear(): Promise<void> {
    await this.withStore("readwrite", async (store) => {
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getAll(): Promise<T[]> {
    return this.withStore("readonly", async (store) => {
      return await new Promise<T[]>((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => resolve((request.result as T[]) ?? []);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async keys(): Promise<string[]> {
    return this.withStore("readonly", async (store) => {
      return await new Promise<string[]>((resolve, reject) => {
        const request = store.getAllKeys();

        request.onsuccess = () => resolve((request.result as IDBValidKey[]).map((key) => String(key)));
        request.onerror = () => reject(request.error);
      });
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }
}
