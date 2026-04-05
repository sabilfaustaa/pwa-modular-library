import type { NotificationConfig } from "../types/config";
import type { NotificationManager, ShowNotificationOptions } from "./types";

export class DefaultNotificationManager implements NotificationManager {
  private readonly config: NotificationConfig;

  constructor(config: NotificationConfig = {}) {
    this.config = config;
  }

  isSupported(): boolean {
    return typeof Notification !== "undefined";
  }

  getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) {
      return "unsupported";
    }

    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!this.isSupported()) {
      return "unsupported";
    }

    return Notification.requestPermission();
  }

  async show(title: string, options?: ShowNotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      return null;
    }

    const permission = this.getPermission();

    if (permission !== "granted") {
      return null;
    }

    return new Notification(title, options);
  }

  async initialize(): Promise<void> {
    if (this.config.requestPermissionOnInit) {
      await this.requestPermission();
    }
  }
}
