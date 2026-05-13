import { describe, it, expect } from "vitest";
import { RuleRegistry } from "../../src/modules/caching/rule-registry";
import type { CacheRule } from "../../src/types/cache.types";

function makeRule(overrides?: Partial<CacheRule>): CacheRule {
  return {
    pattern: "/api/*",
    strategy: "cache-first",
    ...overrides,
  };
}

describe("RuleRegistry", () => {
  describe("addRule", () => {
    it("should add a new rule", () => {
      const registry = new RuleRegistry();
      const rule = makeRule({ pattern: "/api/*", strategy: "network-first" });

      registry.addRule(rule);

      expect(registry.size).toBe(1);
      expect(registry.getAll()[0]).toEqual(rule);
    });

    it("should replace rule with same pattern", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*", strategy: "cache-first" }));
      registry.addRule(makeRule({ pattern: "/api/*", strategy: "network-first" }));

      expect(registry.size).toBe(1);
      expect(registry.getAll()[0].strategy).toBe("network-first");
    });

    it("should handle multiple rules with different patterns", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*", strategy: "cache-first" }));
      registry.addRule(makeRule({ pattern: "*.png", strategy: "cache-first" }));
      registry.addRule(makeRule({ pattern: /\/data\/.*/, strategy: "network-first" }));

      expect(registry.size).toBe(3);
    });
  });

  describe("removeRule", () => {
    it("should remove rule by string pattern", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*" }));

      const result = registry.removeRule("/api/*");

      expect(result).toBe(true);
      expect(registry.size).toBe(0);
    });

    it("should remove rule by RegExp pattern", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: /\/data\/.*/ }));

      const result = registry.removeRule(/\/data\/.*/);

      expect(result).toBe(true);
      expect(registry.size).toBe(0);
    });

    it("should return false for non-existent pattern", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*" }));

      const result = registry.removeRule("/other/*");

      expect(result).toBe(false);
      expect(registry.size).toBe(1);
    });
  });

  describe("findMatch", () => {
    it("should match string pattern (exact)", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/users", strategy: "network-first" }));

      const match = registry.findMatch("/api/users");

      expect(match).not.toBeNull();
      expect(match?.strategy).toBe("network-first");
    });

    it("should match string pattern with glob (*)", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*", strategy: "cache-first" }));

      expect(registry.findMatch("/api/users")).not.toBeNull();
      expect(registry.findMatch("/api/users/123")).not.toBeNull();
      expect(registry.findMatch("/api/")).not.toBeNull();
      expect(registry.findMatch("/other")).toBeNull();
    });

    it("should match RegExp pattern", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: /\.(png|jpg)$/, strategy: "cache-first" }));

      expect(registry.findMatch("/images/photo.png")).not.toBeNull();
      expect(registry.findMatch("/images/photo.jpg")).not.toBeNull();
      expect(registry.findMatch("/images/photo.gif")).toBeNull();
    });

    it("should return first matching rule", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*", strategy: "cache-first" }));
      registry.addRule(makeRule({ pattern: "/api/users", strategy: "network-first" }));

      const match = registry.findMatch("/api/users");

      // First rule (/api/*) matches first
      expect(match?.strategy).toBe("cache-first");
    });

    it("should return null when no rule matches", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*" }));

      expect(registry.findMatch("/other/path")).toBeNull();
    });
  });

  describe("initial rules", () => {
    it("should accept initial rules in constructor", () => {
      const rules: CacheRule[] = [
        makeRule({ pattern: "/api/*", strategy: "network-first" }),
        makeRule({ pattern: "*.css", strategy: "cache-first" }),
      ];

      const registry = new RuleRegistry(rules);

      expect(registry.size).toBe(2);
    });
  });

  describe("clearAll", () => {
    it("should remove all rules", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/*" }));
      registry.addRule(makeRule({ pattern: "*.png" }));

      registry.clearAll();

      expect(registry.size).toBe(0);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe("glob matching edge cases", () => {
    it("should match / without wildcard", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/" }));

      expect(registry.findMatch("/")).not.toBeNull();
      expect(registry.findMatch("/api")).toBeNull();
    });

    it("should match with multiple wildcards", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "*/api/*/data/*" }));

      expect(registry.findMatch("/v1/api/users/data/123")).not.toBeNull();
      expect(registry.findMatch("https://host/api/v2/data/entries")).not.toBeNull();
    });

    it("should handle special regex characters in pattern safely", () => {
      const registry = new RuleRegistry();
      registry.addRule(makeRule({ pattern: "/api/v1+users" }));

      // '+' is literal, not regex quantifier
      expect(registry.findMatch("/api/v1+users")).not.toBeNull();
      expect(registry.findMatch("/api/v1users")).toBeNull();
    });
  });
});
