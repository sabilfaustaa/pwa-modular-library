import { beforeEach, describe, expect, it } from "vitest";
import { CoreModule } from "../../src/core/initializer";
import { usePWA } from "../../src/modules/usePWA";

describe("usePWA", () => {
  beforeEach(() => {
    CoreModule.reset();
  });

  it("should return core state after initialization", () => {
    CoreModule.init();

    const pwa = usePWA();

    expect(pwa.isInitialized).toBe(true);
    expect(pwa.config).toEqual({});
    expect(typeof pwa.capabilities).toBe("object");
  });

  it("should throw if core is not initialized", () => {
    expect(() => usePWA()).toThrow();
  });
});
