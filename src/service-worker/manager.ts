import type { ServiceWorkerConfig } from "../types/config";
import type { ServiceWorkerManager } from "./types";

export class DefaultServiceWorkerManager implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private readonly config: ServiceWorkerConfig;

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = config;
  }

  isSupported(): boolean {
    return typeof navigator !== "undefined" && "serviceWorker" in navigator;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    if (this.config.enabled === false) {
      return null;
    }

    const url = this.config.url ?? "/service-worker.js";

    this.registration = await navigator.serviceWorker.register(url, {
      scope: this.config.scope,
      updateViaCache: this.config.updateViaCache,
    });

    return this.registration;
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;
    return this.registration.unregister();
  }

  async update(): Promise<void> {
    if (!this.registration) return;
    await this.registration.update();
  }
}
