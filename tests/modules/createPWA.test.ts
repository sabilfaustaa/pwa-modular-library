import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CoreModule } from "../../src/core/initializer";
import { createPWA } from "../../src/modules/createPWA";

describe("createPWA", () => {
  beforeEach(() => {
    CoreModule.reset();
  });

  afterEach(() => {
    CoreModule.reset();
  });

  it("should create unified PWA runtime with all main modules", () => {
    const pwa = createPWA();

    expect(pwa.core).toBeDefined();
    expect(pwa.config).toEqual({});
    expect(pwa.capabilities).toBeDefined();
    expect(pwa.capability).toBeDefined();
    expect(pwa.cache).toBeDefined();
    expect(pwa.storage).toBeDefined();
    expect(pwa.sync).toBeDefined();
  });

  it("should initialize CoreModule with provided config", () => {
    const pwa = createPWA({
      cache: {
        cacheName: "exam-cache",
      },
      storage: {
        dbName: "exam-db",
        storeName: "answers",
      },
      sync: {
        maxRetries: 5,
        retryDelay: 2000,
      },
    });

    expect(pwa.config.cache?.cacheName).toBe("exam-cache");
    expect(pwa.config.storage?.dbName).toBe("exam-db");
    expect(pwa.config.storage?.storeName).toBe("answers");
    expect(pwa.config.sync?.maxRetries).toBe(5);
    expect(pwa.config.sync?.retryDelay).toBe(2000);
  });

  it("should reuse existing CoreModule instance after initialization", () => {
    const first = createPWA({
      cache: {
        cacheName: "first-cache",
      },
    });

    const second = createPWA({
      cache: {
        cacheName: "second-cache",
      },
    });

    expect(second.core).toBe(first.core);
    expect(second.config.cache?.cacheName).toBe("first-cache");
  });
});
