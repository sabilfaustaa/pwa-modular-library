/**
 * notification-manager — Manajemen notifikasi lokal dan push subscription.
 *
 * @module modules/push-sync/notification-manager
 * @internal digunakan oleh useNotifications composable
 */

import type { NotificationPayload, PermissionStatus } from "../../types/notification.types";
import { PWAError } from "../../core/errors";

export interface NotificationManagerOptions {
  /** VAPID public key (untuk subscribe push) */
  vapidPublicKey?: string;
  /** Endpoint server untuk simpan subscription */
  subscriptionEndpoint?: string;
}

/**
 * Konversi base64 string ke Uint8Array (untuk applicationServerKey).
 * Via https://datatracker.ietf.org/doc/html/rfc7515#appendix-C (base64url decode).
 */
function urlB64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch {
    throw new PWAError(
      "INVALID_VAPID_KEY",
      "VAPID key tidak valid: pastikan formatnya base64url (tanpa padding '=' dan pakai '-' '_' bukan '+' '/'). Dapat: '" +
        base64String.substring(0, 40) +
        (base64String.length > 40 ? "..." : "") +
        "'",
    );
  }
}

export class NotificationManager {
  private readonly options: NotificationManagerOptions;
  private currentSubscription: PushSubscription | null = null;

  constructor(options?: NotificationManagerOptions) {
    this.options = options ?? {};
  }

  // ---- Support & Permission ----

  isSupported(): boolean {
    return typeof Notification !== "undefined";
  }

  isPushSupported(): boolean {
    return typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  }

  getPermission(): PermissionStatus {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission as PermissionStatus;
  }

  async requestPermission(): Promise<PermissionStatus> {
    if (!this.isSupported()) return "unsupported";
    const result = await Notification.requestPermission();
    return result as PermissionStatus;
  }

  // ---- Subscription ----

  /**
   * Cek apakah sudah ada push subscription yang aktif.
   */
  async checkSubscription(): Promise<boolean> {
    if (!this.isPushSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      this.currentSubscription = await registration.pushManager.getSubscription();
      return this.currentSubscription !== null;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe ke push notification.
   *
   * Flow:
   * 1. Minta izin notifikasi (kalau belum granted)
   * 2. Ambil service worker registration
   * 3. pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
   * 4. (opsional) POST subscription ke subscriptionEndpoint
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isPushSupported()) return null;

    // Step 1: izin
    const permission = this.getPermission();
    if (permission !== "granted") {
      const requested = await this.requestPermission();
      if (requested !== "granted") return null;
    }

    try {
      // Step 2: dapatkan registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error("Service worker tidak terdaftar. Panggil usePWA() dulu.");
      }

      // Step 3: subscribe
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (this.options.vapidPublicKey) {
        subscribeOptions.applicationServerKey = urlB64ToUint8Array(this.options.vapidPublicKey) as BufferSource;
      }

      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      this.currentSubscription = subscription;

      // Step 4: kirim ke server (best-effort, tidak blocking)
      if (this.options.subscriptionEndpoint) {
        try {
          await this.saveSubscriptionToServer(subscription);
        } catch {
          // Silent fail — subscription sudah berhasil di sisi client.
          // Server bisa catch-up nanti.
        }
      }

      return subscription;
    } catch (error) {
      // PWAError → re-throw (kesalahan developer: config invalid, dsb)
      if (error instanceof PWAError) {
        throw error;
      }
      console.error("[sabil-pwa-library] subscribe gagal:", error);
      return null;
    }
  }

  /**
   * Unsubscribe dari push notification + hapus dari server.
   */
  async unsubscribe(): Promise<boolean> {
    try {
      // Ambil subscription saat ini
      let subscription = this.currentSubscription;
      if (!subscription) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          subscription = await registration.pushManager.getSubscription();
        }
      }

      if (!subscription) {
        // Tidak ada subscription → anggap sukses
        this.currentSubscription = null;
        return true;
      }

      const unsubscribed = await subscription.unsubscribe();

      if (unsubscribed) {
        this.currentSubscription = null;

        // Hapus dari server (best-effort)
        if (this.options.subscriptionEndpoint && subscription) {
          try {
            await this.deleteSubscriptionFromServer(subscription);
          } catch {
            // Silent fail
          }
        }
      }

      return unsubscribed;
    } catch {
      return false;
    }
  }

  // ---- Notifikasi lokal ----

  /**
   * Tampilkan notifikasi di browser (tanpa server push).
   * Prioritas: SW registration.showNotification() → new Notification() fallback
   */
  async show(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) return;

    const permission = this.getPermission();
    if (permission !== "granted") return;

    const notificationOptions: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: payload.data,
    };

    if (payload.actions) {
      (notificationOptions as Record<string, unknown>).actions = payload.actions;
    }

    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(payload.title, notificationOptions);
      } else {
        new Notification(payload.title, notificationOptions);
      }
    } catch {
      // Fallback terakhir
      if (this.isSupported()) {
        new Notification(payload.title, notificationOptions);
      }
    }
  }

  // ---- Helpers ----

  /**
   * POST subscription ke endpoint server.
   */
  private async saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    if (!this.options.subscriptionEndpoint) return;

    await fetch(this.options.subscriptionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  }

  /**
   * DELETE subscription dari endpoint server.
   */
  private async deleteSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    if (!this.options.subscriptionEndpoint) return;

    const { endpoint } = subscription;
    await fetch(this.options.subscriptionEndpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  }
}
