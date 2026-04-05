import type { PWAConfig } from "../types/config";
import type { BrowserCapabilities } from "./capability";
import { checkCapabilities } from "./capability";
import { InitializationError } from "./errors";
import { validateConfig } from "./validator";

export class CoreModule {
  private static instance: CoreModule | null = null;

  public readonly config: PWAConfig;
  public readonly capabilities: BrowserCapabilities;
  public readonly isInitialized: boolean;

  private constructor(config: PWAConfig, capabilities: BrowserCapabilities) {
    this.config = config;
    this.capabilities = capabilities;
    this.isInitialized = true;
  }

  public static init(config?: unknown): CoreModule {
    if (CoreModule.instance) {
      return CoreModule.instance;
    }

    const validatedConfig = validateConfig(config);
    const capabilities = checkCapabilities();

    CoreModule.instance = new CoreModule(validatedConfig, capabilities);
    return CoreModule.instance;
  }

  public static getInstance(): CoreModule {
    if (!CoreModule.instance) {
      throw new InitializationError("CoreModule has not been initialized. Call CoreModule.init() first.");
    }

    return CoreModule.instance;
  }

  public static hasInstance(): boolean {
    return CoreModule.instance !== null;
  }

  public static getConfigOrNull(): PWAConfig | null {
    return CoreModule.instance?.config ?? null;
  }

  public static getCapabilitiesOrNull(): BrowserCapabilities | null {
    return CoreModule.instance?.capabilities ?? null;
  }

  public static reset(): void {
    CoreModule.instance = null;
  }
}
