import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { IndexedDBStorage } from "../../src/storage/indexeddb";

describe("IndexedDBStorage", () => {
  let storage: IndexedDBStorage<{ value: string }>;

  beforeEach(async () => {
    storage = new IndexedDBStorage<{ value: string }>({
      dbName: "test-db",
      storeName: "test-store",
    });

    await storage.clear();
  });

  it("should set and get a value", async () => {
    await storage.set("key1", { value: "hello" });

    const result = await storage.get("key1");

    expect(result).toEqual({ value: "hello" });
  });

  it("should return undefined for missing key", async () => {
    const result = await storage.get("missing");

    expect(result).toBeUndefined();
  });

  it("should delete a value", async () => {
    await storage.set("key1", { value: "hello" });
    await storage.delete("key1");

    const result = await storage.get("key1");

    expect(result).toBeUndefined();
  });

  it("should clear all values", async () => {
    await storage.set("key1", { value: "one" });
    await storage.set("key2", { value: "two" });

    await storage.clear();

    const all = await storage.getAll();

    expect(all).toEqual([]);
  });

  it("should get all values", async () => {
    await storage.set("key1", { value: "one" });
    await storage.set("key2", { value: "two" });

    const all = await storage.getAll();

    expect(all).toHaveLength(2);
    expect(all).toContainEqual({ value: "one" });
    expect(all).toContainEqual({ value: "two" });
  });

  it("should return true when deleting existing key", async () => {
    const storage = new IndexedDBStorage<string>();

    await storage.set("foo", "bar");
    const deleted = await storage.delete("foo");

    expect(deleted).toBe(true);
    expect(await storage.get("foo")).toBeUndefined();
  });

  it("should return false when deleting missing key", async () => {
    const storage = new IndexedDBStorage<string>();

    const deleted = await storage.delete("missing");

    expect(deleted).toBe(false);
  });

  it("should return all keys", async () => {
    const storage = new IndexedDBStorage<string>();

    await storage.set("a", "A");
    await storage.set("b", "B");

    const keys = await storage.keys();

    expect(keys).toContain("a");
    expect(keys).toContain("b");
  });
});
