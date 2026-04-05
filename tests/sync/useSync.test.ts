import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CoreModule } from "../../src/core/initializer";
import { SyncQueue } from "../../src/sync/queue";
import { useSync } from "../../src/sync/useSync";
import type { StorageAdapter } from "../../src/storage/adapter";
import type { SyncTask } from "../../src/sync/types";

function createMockStorageAdapter<T>(): StorageAdapter<T> {
  const store = new Map<string, T>();

  return {
    async get(key: string): Promise<T | undefined> {
      return store.get(key);
    },

    async set(key: string, value: T): Promise<void> {
      store.set(key, value);
    },

    async delete(key: string): Promise<boolean> {
      return store.delete(key);
    },

    async clear(): Promise<void> {
      store.clear();
    },

    async getAll(): Promise<T[]> {
      return Array.from(store.values());
    },

    async keys(): Promise<string[]> {
      return Array.from(store.keys());
    },

    async has(key: string): Promise<boolean> {
      return store.has(key);
    },
  };
}

describe("useSync", () => {
  beforeEach(() => {
    CoreModule.reset();
  });

  afterEach(() => {
    CoreModule.reset();
  });

  it("should create SyncQueue instance", () => {
    const storage = createMockStorageAdapter<SyncTask>();
    const sync = useSync(storage);

    expect(sync).toBeInstanceOf(SyncQueue);
  });

  it("should consume sync config from CoreModule when local config is not provided", () => {
    CoreModule.init({
      sync: {
        maxRetries: 5,
        retryDelay: 2000,
      },
    });

    const storage = createMockStorageAdapter<SyncTask>();
    const sync = useSync(storage);

    expect(sync).toBeInstanceOf(SyncQueue);
  });

  it("should allow local config to override CoreModule sync config", () => {
    CoreModule.init({
      sync: {
        maxRetries: 5,
        retryDelay: 2000,
      },
    });

    const storage = createMockStorageAdapter<SyncTask>();
    const sync = useSync(storage, {
      maxRetries: 10,
      retryDelay: 500,
    });

    expect(sync).toBeInstanceOf(SyncQueue);
  });

  it("should fallback safely when CoreModule is not initialized", () => {
    CoreModule.reset();

    const storage = createMockStorageAdapter<SyncTask>();
    const sync = useSync(storage);

    expect(sync).toBeInstanceOf(SyncQueue);
  });
});
