export class HasabError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = new.target.name;
    if (cause instanceof Error && cause.stack) {
      this.stack += "\nCaused by: " + cause.stack;
    }
  }
}

export class HasabValidationError extends HasabError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class HasabNetworkError extends HasabError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR");
  }
}

export class HasabApiError extends HasabError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: any
  ) {
    super(message, "API_ERROR");
  }
}

export class HasabAuthError extends HasabError {
  constructor(message: string) {
    super(message, "AUTH_ERROR");
  }
}

export class HasabRateLimitError extends HasabError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, "RATE_LIMIT_ERROR");
  }
}

export class HasabTimeoutError extends HasabError {
  constructor(message: string) {
    super(message, "TIMEOUT_ERROR");
  }
}

export class HasabUnknownError extends HasabError {
  constructor(message: string) {
    super(message, "UNKNOWN_ERROR");
  }
}
