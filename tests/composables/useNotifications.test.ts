/**
 * Unit + integration test untuk useNotifications composable.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useNotifications } from "../../src/composables/useNotifications";

/** Drain microtask queue. */
function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

// ---- Mock Helpers ----

class MockPushSubscription {
  endpoint = "https://push.example.com/sub/123";
  expirationTime: null = null;
  options = { userVisibleOnly: true, applicationServerKey: new ArrayBuffer(8) };
  unsubscribe = vi.fn().mockResolvedValue(true);
  toJSON = () => ({
    endpoint: this.endpoint,
    expirationTime: this.expirationTime,
    keys: { p256dh: "key", auth: "auth" },
  });
}

function createMockSWRegistration(): ServiceWorkerRegistration {
  return {
    scope: "/",
    active: null,
    installing: null,
    waiting: null,
    update: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(true),
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(new MockPushSubscription()),
      permissionState: vi.fn().mockResolvedValue("granted"),
      getPermissionState: vi.fn().mockResolvedValue("granted"),
    } as unknown as PushManager,
    showNotification: vi.fn().mockResolvedValue(undefined),
    getNotifications: vi.fn().mockResolvedValue([]),
    navigationPreload: {} as unknown as NavigationPreloadManager,
    updateViaCache: "imports" as ServiceWorkerUpdateViaCache,
  } as unknown as ServiceWorkerRegistration;
}

describe("useNotifications", () => {
  let originalNotification: typeof Notification | undefined;
  let originalPermissions: typeof navigator.permissions | undefined;
  let originalPushManager: unknown;
  let mockSWRegistration: ServiceWorkerRegistration;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Save original Notification
    originalNotification = (globalThis as Record<string, unknown>).Notification as typeof Notification;

    // Save permissions API
    originalPermissions = (navigator as Record<string, unknown>).permissions as typeof navigator.permissions;

    // Save original PushManager
    originalPushManager = (window as Record<string, unknown>).PushManager;

    // Mock PushManager (diperlukan untuk isPushSupported)
    Object.defineProperty(window, "PushManager", {
      value: class MockPushManager {},
      configurable: true,
      writable: true,
    });

    // Mock service worker registration
    mockSWRegistration = createMockSWRegistration();
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockSWRegistration),
        register: vi.fn(),
        ready: Promise.resolve(mockSWRegistration),
        controller: null,
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
      writable: true,
    });

    // Mock Permissions API (not implemented by default)
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockRejectedValue(new Error("Not implemented")),
      },
      configurable: true,
      writable: true,
    });

    // Mock global fetch untuk subscription endpoint
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  });

  afterEach(() => {
    // Restore Notification
    if (originalNotification !== undefined) {
      (globalThis as Record<string, unknown>).Notification = originalNotification;
    } else {
      delete (globalThis as Record<string, unknown>).Notification;
    }
    // Restore permissions
    if (originalPermissions !== undefined) {
      Object.defineProperty(navigator, "permissions", {
        value: originalPermissions,
        configurable: true,
        writable: true,
      });
    }
    // Restore PushManager
    if (originalPushManager !== undefined) {
      Object.defineProperty(window, "PushManager", {
        value: originalPushManager,
        configurable: true,
        writable: true,
      });
    } else {
      delete (window as Record<string, unknown>).PushManager;
    }
  });

  // =========================================================
  // M4.4.8 — permission detection
  // =========================================================

  describe("permission", () => {
    it("should detect unsupported when Notification API not available", () => {
      delete (globalThis as Record<string, unknown>).Notification;

      const { permission, isSupported } = useNotifications();

      expect(isSupported.value).toBe(false);
      expect(permission.value).toBe("unsupported");
    });

    it("should return current permission (default/granted/denied)", () => {
      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { permission, isSupported } = useNotifications();

      expect(isSupported.value).toBe(true);
      expect(permission.value).toBe("granted");
    });

    it("should return 'default' when permission not yet set", () => {
      class MockNotif {
        static permission = "default";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { permission } = useNotifications();
      expect(permission.value).toBe("default");
    });
  });

  // =========================================================
  // M4.4.9 — requestPermission
  // =========================================================

  describe("requestPermission", () => {
    it("should request permission and update reactive state", async () => {
      class MockNotif {
        static permission = "default";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { requestPermission } = useNotifications();

      const result = await requestPermission();

      expect(MockNotif.requestPermission).toHaveBeenCalled();
      expect(result).toBe("granted");
    });

    it("should return 'unsupported' when API not available", async () => {
      delete (globalThis as Record<string, unknown>).Notification;

      const { requestPermission } = useNotifications();

      const result = await requestPermission();
      expect(result).toBe("unsupported");
    });
  });

  // =========================================================
  // M4.4.10 — subscribe / unsubscribe
  // =========================================================

  describe("subscribe", () => {
    it("should subscribe to push and return PushSubscription", async () => {
      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      // Jangan set vapidPublicKey — subscribe tetap bisa tanpa applicationServerKey
      const { subscribe, isSubscribed } = useNotifications();

      const sub = await subscribe();
      await flushPromises();

      expect(sub).toBeTruthy();
      expect(sub!.endpoint).toBe("https://push.example.com/sub/123");
      expect(isSubscribed.value).toBe(true);
    });

    it("should request permission first if not granted", async () => {
      class MockNotif {
        static permission = "default";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { subscribe } = useNotifications();

      await subscribe();
      await flushPromises();

      expect(MockNotif.requestPermission).toHaveBeenCalled();
    });

    it("should return null when permission denied", async () => {
      class MockNotif {
        static permission = "denied";
        static requestPermission = vi.fn().mockResolvedValue("denied");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { subscribe, isSubscribed } = useNotifications();

      const sub = await subscribe();
      await flushPromises();

      expect(sub).toBeNull();
      expect(isSubscribed.value).toBe(false);
    });

    it("should throw PWAError when VAPID key invalid (not base64url)", async () => {
      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { subscribe } = useNotifications({
        vapidPublicKey: "INVALID_KEY!!!",
      });

      await expect(subscribe()).rejects.toThrow(/VAPID key tidak valid/);
    });

    it("should POST subscription to subscriptionEndpoint", async () => {
      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
      globalThis.fetch = mockFetch;

      const { subscribe } = useNotifications({
        subscriptionEndpoint: "/api/push/subscribe",
      });

      await subscribe();
      await flushPromises();

      // fetch dipanggil ke subscriptionEndpoint
      const postCalls = mockFetch.mock.calls.filter((call: [string]) => call[0] === "/api/push/subscribe");
      expect(postCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe and update isSubscribed", async () => {
      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const mockSubscription = new MockPushSubscription();

      // Mock getSubscription to return existing subscription
      const mockSW = createMockSWRegistration();
      (mockSW.pushManager.getSubscription as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          getRegistration: vi.fn().mockResolvedValue(mockSW),
          register: vi.fn(),
          ready: Promise.resolve(mockSW),
          controller: null,
          getRegistrations: vi.fn().mockResolvedValue([]),
        },
        configurable: true,
        writable: true,
      });

      const { unsubscribe, isSubscribed } = useNotifications();

      // Subscribe dulu untuk set state
      const mockSub = new MockPushSubscription();
      (mockSW.pushManager.subscribe as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSub);

      const { subscribe } = useNotifications();
      await subscribe();
      await flushPromises();

      const result = await unsubscribe();
      await flushPromises();

      expect(result).toBe(true);
      expect(isSubscribed.value).toBe(false);
    });
  });

  // =========================================================
  // M4.4.11 — show notification
  // =========================================================

  describe("show", () => {
    it("should show notification via service worker registration", async () => {
      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { show } = useNotifications();

      await show({
        title: "Test Notification",
        body: "Hello world",
        icon: "/icon.png",
      });

      await flushPromises();

      expect(mockSWRegistration.showNotification).toHaveBeenCalledWith(
        "Test Notification",
        expect.objectContaining({
          body: "Hello world",
          icon: "/icon.png",
        }),
      );
    });

    it("should not throw when permission is denied", async () => {
      class MockNotif {
        static permission = "denied";
        static requestPermission = vi.fn().mockResolvedValue("denied");
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      const { show } = useNotifications();

      await expect(show({ title: "Test", body: "Body" })).resolves.toBeUndefined();
    });

    it("should fallback to new Notification when SW not available", async () => {
      const mockConstructor = vi.fn();

      class MockNotif {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
        constructor(title: string, options?: NotificationOptions) {
          mockConstructor(title, options);
        }
      }

      Object.defineProperty(globalThis, "Notification", {
        value: MockNotif,
        configurable: true,
        writable: true,
      });

      // Remove SW
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          getRegistration: vi.fn().mockResolvedValue(null),
          register: vi.fn(),
          ready: Promise.resolve(null),
          controller: null,
          getRegistrations: vi.fn().mockResolvedValue([]),
        },
        configurable: true,
        writable: true,
      });

      const { show } = useNotifications();

      await show({ title: "Fallback", body: "No SW" });
      await flushPromises();

      expect(mockConstructor).toHaveBeenCalled();
    });
  });
});
