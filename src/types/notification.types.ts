/** Public types untuk useNotifications composable. */

import type { Ref } from "vue";

export interface UseNotificationsOptions {
  /** VAPID public key (untuk subscribe push) */
  vapidPublicKey?: string;
  /** Endpoint server untuk simpan subscription */
  subscriptionEndpoint?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

export type PermissionStatus = "default" | "granted" | "denied" | "unsupported";

export interface UseNotificationsReturn {
  /** Status izin notifikasi */
  permission: Readonly<Ref<PermissionStatus>>;
  /** Apakah browser mendukung */
  isSupported: Readonly<Ref<boolean>>;
  /** Apakah sudah subscribe ke push */
  isSubscribed: Readonly<Ref<boolean>>;
  /** Minta izin notifikasi */
  requestPermission: () => Promise<PermissionStatus>;
  /** Subscribe ke push (otomatis kirim ke subscriptionEndpoint) */
  subscribe: () => Promise<PushSubscription | null>;
  /** Unsubscribe dari push */
  unsubscribe: () => Promise<boolean>;
  /** Tampilkan notifikasi lokal (tanpa server) */
  show: (payload: NotificationPayload) => Promise<void>;
}
