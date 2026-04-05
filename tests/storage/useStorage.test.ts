import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CoreModule } from "../../src/core/initializer";
import { useStorage } from "../../src/storage/useStorage";
import { IndexedDBStorage } from "../../src/storage/indexeddb";

describe("useStorage", () => {
  beforeEach(() => {
    CoreModule.reset();
  });

  afterEach(() => {
    CoreModule.reset();
  });

  it("should create IndexedDBStorage instance", () => {
    const storage = useStorage();

    expect(storage).toBeInstanceOf(IndexedDBStorage);
  });

  it("should consume storage config from CoreModule when local config is not provided", () => {
    CoreModule.init({
      storage: {
        dbName: "core-db",
        storeName: "core-store",
      },
    });

    const storage = useStorage();

    expect(storage).toBeInstanceOf(IndexedDBStorage);
  });

  it("should allow local config to override CoreModule storage config", () => {
    CoreModule.init({
      storage: {
        dbName: "core-db",
        storeName: "core-store",
      },
    });

    const storage = useStorage({
      dbName: "local-db",
      storeName: "local-store",
    });

    expect(storage).toBeInstanceOf(IndexedDBStorage);
  });

  it("should fallback safely when CoreModule is not initialized", () => {
    CoreModule.reset();

    const storage = useStorage();

    expect(storage).toBeInstanceOf(IndexedDBStorage);
  });
});
