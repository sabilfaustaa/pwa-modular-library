import { describe, expect, it } from "vitest";
import { DefaultCacheManager, useCache, cacheFirst, networkFirst, staleWhileRevalidate } from "../../src";

describe("cache exports", () => {
  it("should export cache public API from root index", () => {
    expect(DefaultCacheManager).toBeDefined();
    expect(useCache).toBeDefined();
    expect(cacheFirst).toBeDefined();
    expect(networkFirst).toBeDefined();
    expect(staleWhileRevalidate).toBeDefined();
  });
});
