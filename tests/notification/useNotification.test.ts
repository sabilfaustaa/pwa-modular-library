import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoreModule } from "../../src/core/initializer";
import { useNotification } from "../../src/notification/useNotification";

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn<[], Promise<NotificationPermission>>();

  title: string;
  options?: NotificationOptions;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }
}

describe("useNotification", () => {
  beforeEach(() => {
    CoreModule.reset();
    vi.restoreAllMocks();

    Object.defineProperty(globalThis, "Notification", {
      value: MockNotification,
      configurable: true,
      writable: true,
    });

    MockNotification.permission = "default";
    MockNotification.requestPermission.mockResolvedValue("granted");
  });

  afterEach(() => {
    CoreModule.reset();
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "Notification");
  });

  it("should detect notification support", () => {
    const notification = useNotification();

    expect(notification.isSupported()).toBe(true);
  });

  it("should return current permission", () => {
    MockNotification.permission = "granted";

    const notification = useNotification();

    expect(notification.getPermission()).toBe("granted");
  });

  it("should request permission", async () => {
    const notification = useNotification();

    const result = await notification.requestPermission();

    expect(result).toBe("granted");
    expect(MockNotification.requestPermission).toHaveBeenCalled();
  });

  it("should show notification when permission is granted", async () => {
    MockNotification.permission = "granted";

    const notification = useNotification();

    const instance = await notification.show("Hello", {
      body: "World",
    });

    expect(instance).toBeInstanceOf(MockNotification);
  });

  it("should return null when permission is not granted", async () => {
    MockNotification.permission = "denied";

    const notification = useNotification();

    const instance = await notification.show("Hello");

    expect(instance).toBeNull();
  });

  it("should consume notification config from CoreModule", async () => {
    CoreModule.init({
      notification: {
        requestPermissionOnInit: true,
      },
    });

    useNotification();

    expect(MockNotification.requestPermission).toHaveBeenCalled();
  });
});
