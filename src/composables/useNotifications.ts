/**
 * useNotifications — Push notification subscriber + notifikasi lokal.
 *
 * @module composables/useNotifications
 */

import { ref, readonly, onUnmounted, type Ref } from "vue";
import { NotificationManager } from "../modules/push-sync/notification-manager";
import type {
  UseNotificationsOptions,
  UseNotificationsReturn,
  PermissionStatus,
  NotificationPayload,
} from "../types/notification.types";

/**
 * Composable untuk push notification dan notifikasi lokal.
 *
 * @param options - VAPID public key + subscription endpoint server.
 * @returns Object dengan state reactif dan method notifikasi.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useNotifications } from 'pwa-modular-library'
 *
 * const { permission, isSubscribed, subscribe, show } = useNotifications({
 *   vapidPublicKey: 'BDd3_h...',
 *   subscriptionEndpoint: '/api/push/register',
 * })
 *
 * async function enableNotifications() {
 *   const sub = await subscribe()
 *   if (sub) console.log('Subscribed:', sub.endpoint)
 * }
 * </script>
 * ```
 */
export function useNotifications(options?: UseNotificationsOptions): UseNotificationsReturn {
  const manager = new NotificationManager(options);

  // State reactif
  const permission = ref<PermissionStatus>(manager.getPermission());
  const isSupported = ref(manager.isSupported());
  const isSubscribed = ref(false);

  // Cek subscription awal
  void manager.checkSubscription().then((result) => {
    isSubscribed.value = result;
  });

  // Listener perubahan permission (Firefox/Safari tidak support onchange)
  // Kita poll secara periodik atau react terhadap perubahan lewat event
  let permissionWatchInterval: ReturnType<typeof setInterval> | null = null;

  if (typeof navigator !== "undefined" && "permissions" in navigator) {
    // Gunakan Permissions API jika tersedia
    navigator.permissions
      .query({ name: "notifications" })
      .then((status) => {
        permission.value = status.state as PermissionStatus;
        status.onchange = () => {
          permission.value = status.state as PermissionStatus;
        };
      })
      .catch(() => {
        // Fallback: cek ulang saat tab dapat focus
        startPermissionPolling();
      });
  } else {
    startPermissionPolling();
  }

  function startPermissionPolling(): void {
    permissionWatchInterval = setInterval(() => {
      const current = manager.getPermission();
      if (current !== permission.value) {
        permission.value = current;
      }
    }, 5000);
  }

  // Cleanup
  onUnmounted(() => {
    if (permissionWatchInterval) {
      clearInterval(permissionWatchInterval);
      permissionWatchInterval = null;
    }
  });

  async function requestPermission(): Promise<PermissionStatus> {
    const result = await manager.requestPermission();
    permission.value = result;
    return result;
  }

  async function subscribe(): Promise<PushSubscription | null> {
    // Minta izin dulu kalau belum granted
    if (permission.value !== "granted") {
      const perm = await manager.requestPermission();
      permission.value = perm;
      if (perm !== "granted") return null;
    }

    const subscription = await manager.subscribe();
    isSubscribed.value = subscription !== null;

    // Update permission jika berubah setelah subscribe
    permission.value = manager.getPermission();

    return subscription;
  }

  async function unsubscribe(): Promise<boolean> {
    const result = await manager.unsubscribe();
    isSubscribed.value = !result; // kalau berhasil unsubscribe, isSubscribed = false
    if (result) {
      isSubscribed.value = false;
    }
    return result;
  }

  async function show(payload: NotificationPayload): Promise<void> {
    await manager.show(payload);
  }

  return {
    permission: readonly(permission) as Readonly<Ref<PermissionStatus>>,
    isSupported: readonly(isSupported) as Readonly<Ref<boolean>>,
    isSubscribed: readonly(isSubscribed) as Readonly<Ref<boolean>>,
    requestPermission,
    subscribe,
    unsubscribe,
    show,
  };
}

export type { UseNotificationsOptions, UseNotificationsReturn, PermissionStatus, NotificationPayload };
