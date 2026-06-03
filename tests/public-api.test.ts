/**
 * Test: Public API surface
 *
 * Memastikan utilitas non-composable benar-benar dapat diakses dari
 * entry point publik library (src/index.ts) — bukan hanya lewat path internal.
 */

import { describe, it, expect } from "vitest";
import { validateManifest, generateSW } from "../src";

describe("public API exports", () => {
  it("mengekspos validateManifest dari entry publik", () => {
    expect(typeof validateManifest).toBe("function");
    const warnings = validateManifest({});
    expect(Array.isArray(warnings)).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("mengekspos generateSW dari entry publik", () => {
    expect(typeof generateSW).toBe("function");
    const code = generateSW([{ pattern: "/api/*", strategy: "network-first" }]);
    expect(code).toContain('addEventListener("fetch"');
  });
});
