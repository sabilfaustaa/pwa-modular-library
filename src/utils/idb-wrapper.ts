/**
 * idb-wrapper — Adapter sederhana untuk library `idb` (Jake Archibald).
 *
 * @module utils/idb-wrapper
 */

import { openDB, type IDBPDatabase } from "idb";

export class IDBWrapper {
  private db: IDBPDatabase | null = null;
  private readonly dbName: string;
  private readonly storeName: string;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      const storeName = this.storeName;
      this.db = await openDB(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        },
      });
    }
    return this.db;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.getDB();
    return db.get(this.storeName, key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    await db.put(this.storeName, value, key);
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(this.storeName, key);
  }

  async getAll<T>(): Promise<T[]> {
    const db = await this.getDB();
    return db.getAll(this.storeName);
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear(this.storeName);
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    return (await db.getAllKeys(this.storeName)).map((k) => String(k));
  }
}
