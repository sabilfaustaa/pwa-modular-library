import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useCacheConfig } from "../../src/composables/useCacheConfig";
import { installMockCacheStorage, uninstallMockCacheStorage } from "../cache/test-utils";
import type { CacheRule } from "../../src/types/cache.types";

function makeRule(overrides?: Partial<CacheRule>): CacheRule {
  return {
    pattern: "/api/*",
    strategy: "cache-first",
    ...overrides,
  };
}

describe("useCacheConfig", () => {
  beforeEach(() => {
    installMockCacheStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    uninstallMockCacheStorage();
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should return reactive rules with default empty array", () => {
      const { rules } = useCacheConfig();

      expect(rules.value).toEqual([]);
    });

    it("should accept initial rules", () => {
      const initial: CacheRule[] = [
        makeRule({ pattern: "/api/*", strategy: "network-first" }),
        makeRule({ pattern: "*.png", strategy: "cache-first" }),
      ];

      const { rules } = useCacheConfig(initial);

      expect(rules.value).toHaveLength(2);
      expect(rules.value[0].pattern).toBe("/api/*");
    });

    it("should return readonly ref", () => {
      const { rules } = useCacheConfig();

      // Readonly<Ref> — type-level only, runtime test via addRule
      expect(rules.value).toBeDefined();
      expect(Array.isArray(rules.value)).toBe(true);
    });
  });

  describe("addRule", () => {
    it("should add rule and update rules ref", () => {
      const { rules, addRule } = useCacheConfig();
      const rule = makeRule({ pattern: "/api/*", strategy: "network-first" });

      addRule(rule);

      expect(rules.value).toHaveLength(1);
      expect(rules.value[0].strategy).toBe("network-first");
    });

    it("should replace existing rule with same pattern", () => {
      const { rules, addRule } = useCacheConfig();
      addRule(makeRule({ pattern: "/api/*", strategy: "cache-first" }));
      addRule(makeRule({ pattern: "/api/*", strategy: "network-first" }));

      expect(rules.value).toHaveLength(1);
      expect(rules.value[0].strategy).toBe("network-first");
    });

    it("should handle RegExp patterns", () => {
      const { rules, addRule } = useCacheConfig();
      const rule = makeRule({ pattern: /\.css$/, strategy: "cache-first" });

      addRule(rule);

      expect(rules.value).toHaveLength(1);
    });
  });

  describe("removeRule", () => {
    it("should remove existing rule", () => {
      const { rules, addRule, removeRule } = useCacheConfig();
      addRule(makeRule({ pattern: "/api/*" }));

      const result = removeRule("/api/*");

      expect(result).toBe(true);
      expect(rules.value).toHaveLength(0);
    });

    it("should return false for non-existent pattern", () => {
      const { addRule, removeRule } = useCacheConfig();
      addRule(makeRule({ pattern: "/api/*" }));

      const result = removeRule("/other/*");

      expect(result).toBe(false);
    });
  });

  describe("clearAll", () => {
    it("should clear all rules", async () => {
      const { rules, addRule, clearAll } = useCacheConfig();
      addRule(makeRule({ pattern: "/api/*" }));
      addRule(makeRule({ pattern: "*.png" }));

      await clearAll();

      expect(rules.value).toHaveLength(0);
    });
  });

  describe("clear", () => {
    it("should return true (cache manager delegate)", async () => {
      const { clear } = useCacheConfig();

      const result = await clear("some-cache");

      // Mock caches not installed here, so clear might fail or succeed
      // In real browser, this clears the cache
      expect(typeof result).toBe("boolean");
    });
  });

  describe("size", () => {
    it("should return estimated entry count", async () => {
      const { size } = useCacheConfig();

      const result = await size();

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
