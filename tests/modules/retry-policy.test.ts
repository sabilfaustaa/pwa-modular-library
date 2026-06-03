/**
 * Test: retry-policy (computeDelay)
 *
 * Memverifikasi perhitungan backoff exponential & linear.
 * Module: src/modules/push-sync/retry-policy.ts
 */

import { describe, it, expect } from "vitest";
import { computeDelay, DEFAULT_MAX_DELAY_MS } from "../../src/modules/push-sync/retry-policy";

describe("computeDelay", () => {
  it("exponential: base × 2^retryCount", () => {
    expect(computeDelay(0, { name: "exponential", baseDelayMs: 100 })).toBe(100);
    expect(computeDelay(1, { name: "exponential", baseDelayMs: 100 })).toBe(200);
    expect(computeDelay(2, { name: "exponential", baseDelayMs: 100 })).toBe(400);
    expect(computeDelay(3, { name: "exponential", baseDelayMs: 100 })).toBe(800);
  });

  it("linear: base × (retryCount + 1)", () => {
    expect(computeDelay(0, { name: "linear", baseDelayMs: 100 })).toBe(100);
    expect(computeDelay(1, { name: "linear", baseDelayMs: 100 })).toBe(200);
    expect(computeDelay(2, { name: "linear", baseDelayMs: 100 })).toBe(300);
  });

  it("dibatasi oleh maxDelayMs", () => {
    expect(computeDelay(50, { name: "exponential", baseDelayMs: 1000 })).toBe(DEFAULT_MAX_DELAY_MS);
    expect(computeDelay(10, { name: "linear", baseDelayMs: 1000, maxDelayMs: 5000 })).toBe(5000);
  });

  it("baseDelayMs 0 → tanpa jeda", () => {
    expect(computeDelay(0, { name: "exponential", baseDelayMs: 0 })).toBe(0);
    expect(computeDelay(5, { name: "linear", baseDelayMs: 0 })).toBe(0);
  });

  it("default strategi adalah exponential dengan base 1000", () => {
    expect(computeDelay(0)).toBe(1000);
    expect(computeDelay(1)).toBe(2000);
  });
});
