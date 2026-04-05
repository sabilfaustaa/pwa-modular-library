import { beforeEach, describe, expect, it } from "vitest";
import { CoreModule } from "../../src/core/initializer";
import { useCapability } from "../../src/modules/useCapability";

describe("useCapability", () => {
  beforeEach(() => {
    CoreModule.reset();
  });

  it("should expose capability flags after initialization", () => {
    CoreModule.init();

    const capability = useCapability();

    expect(typeof capability.isServiceWorkerSupported).toBe("boolean");
    expect(typeof capability.isIndexedDBSupported).toBe("boolean");
    expect(typeof capability.isNotificationSupported).toBe("boolean");
    expect(typeof capability.isCacheSupported).toBe("boolean");
    expect(typeof capability.capabilities).toBe("object");
  });

  it("should throw if core is not initialized", () => {
    expect(() => useCapability()).toThrow();
  });
});
