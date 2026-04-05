export class PWAError extends Error {
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);

    this.name = new.target.name;
    this.code = code;
    this.cause = cause;

    // Fix prototype chain (important for instanceof)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigValidationError extends PWAError {
  constructor(message: string, cause?: unknown) {
    super("CONFIG_VALIDATION_ERROR", message, cause);
  }
}

export class InitializationError extends PWAError {
  constructor(message: string, cause?: unknown) {
    super("INITIALIZATION_ERROR", message, cause);
  }
}

export class CapabilityNotSupportedError extends PWAError {
  constructor(feature: string, cause?: unknown) {
    super("CAPABILITY_NOT_SUPPORTED", `Feature not supported: ${feature}`, cause);
  }
}

/**
 * CACHE ERRORS
 */
export class CacheError extends PWAError {
  constructor(message: string, cause?: unknown) {
    super("CACHE_ERROR", message, cause);
  }
}

export class CacheNotSupportedError extends CacheError {
  constructor(message = "Cache API is not supported in this environment", cause?: unknown) {
    super(message, cause);
  }
}

export class CacheStrategyError extends CacheError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class CacheNetworkError extends CacheError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * STORAGE ERRORS
 */
export class StorageError extends PWAError {
  constructor(message: string, cause?: unknown) {
    super("STORAGE_ERROR", message, cause);
  }
}

export class StorageNotSupportedError extends StorageError {
  constructor(message = "Storage feature is not supported in this environment", cause?: unknown) {
    super(message, cause);
  }
}

/**
 * SYNC ERRORS
 */
export class SyncError extends PWAError {
  constructor(message: string, cause?: unknown) {
    super("SYNC_ERROR", message, cause);
  }
}

export class SyncQueueError extends SyncError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
