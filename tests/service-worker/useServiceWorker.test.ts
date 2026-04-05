import { describe, it, expect, vi, beforeEach } from "vitest";
import { useServiceWorker } from "../../src/service-worker/useServiceWorker";

describe("useServiceWorker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should detect support", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        serviceWorker: {},
      },
      configurable: true,
    });

    const sw = useServiceWorker();

    expect(sw.isSupported()).toBe(true);
  });

  it("should return false if not supported", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
    });

    const sw = useServiceWorker();

    expect(sw.isSupported()).toBe(false);
  });
});
