import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultCacheManager } from "../../src/modules/caching/manager";
import { networkOnly, cacheOnly } from "../../src/modules/caching/strategies";
import { CacheNetworkError } from "../../src/core/errors";
import { installMockCacheStorage, uninstallMockCacheStorage } from "./test-utils";

describe("network-only strategy", () => {
  beforeEach(() => {
    installMockCacheStorage();
  });

  afterEach(() => {
    uninstallMockCacheStorage();
    vi.restoreAllMocks();
  });

  it("should return network response", async () => {
    const manager = new DefaultCacheManager({ cacheName: "test" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("network-data", { status: 200 }));

    const result = await networkOnly({
      request: new Request("http://localhost/api/data"),
      cacheName: "test",
      manager,
    });

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("network-data");
  });

  it("should not cache the response", async () => {
    const manager = new DefaultCacheManager({ cacheName: "test" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no-cache", { status: 200 }));

    await networkOnly({
      request: new Request("http://localhost/api/data"),
      cacheName: "test",
      manager,
    });

    const cached = await manager.match("http://localhost/api/data");
    expect(cached).toBeUndefined();
  });

  it("should throw CacheNetworkError when network fails", async () => {
    const manager = new DefaultCacheManager({ cacheName: "test" });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(
      networkOnly({
        request: new Request("http://localhost/api/data"),
        cacheName: "test",
        manager,
      }),
    ).rejects.toBeInstanceOf(CacheNetworkError);
  });
});

describe("cache-only strategy", () => {
  beforeEach(() => {
    installMockCacheStorage();
  });

  afterEach(() => {
    uninstallMockCacheStorage();
    vi.restoreAllMocks();
  });

  it("should return cached response when cache exists", async () => {
    const manager = new DefaultCacheManager({ cacheName: "test" });

    await manager.put("/cached-asset", new Response("from-cache", { status: 200 }));

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await cacheOnly({
      request: new Request("http://localhost/cached-asset"),
      cacheName: "test",
      manager,
    });

    expect(result.source).toBe("cache");
    expect(await result.response.text()).toBe("from-cache");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should throw CacheNetworkError when cache is missing", async () => {
    const manager = new DefaultCacheManager({ cacheName: "test" });

    await expect(
      cacheOnly({
        request: new Request("http://localhost/missing"),
        cacheName: "test",
        manager,
      }),
    ).rejects.toBeInstanceOf(CacheNetworkError);
  });
});
