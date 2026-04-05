export interface ShowNotificationOptions extends NotificationOptions {}

export interface NotificationManager {
  isSupported(): boolean;
  getPermission(): NotificationPermission | "unsupported";
  requestPermission(): Promise<NotificationPermission | "unsupported">;
  show(title: string, options?: ShowNotificationOptions): Promise<Notification | null>;
}

export interface UseNotificationReturn {
  isSupported: () => boolean;
  getPermission: () => NotificationPermission | "unsupported";
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
  show: (title: string, options?: ShowNotificationOptions) => Promise<Notification | null>;
}
