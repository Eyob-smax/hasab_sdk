export class HasabError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = new.target.name;
        if (cause instanceof Error && cause.stack) {
            this.stack += "\nCaused by: " + cause.stack;
        }
    }
}
export class HasabValidationError extends HasabError {
    constructor(message) {
        super(message, "VALIDATION_ERROR");
    }
}
export class HasabNetworkError extends HasabError {
    constructor(message) {
        super(message, "NETWORK_ERROR");
    }
}
export class HasabApiError extends HasabError {
    constructor(message, status, details) {
        super(message, "API_ERROR");
        this.status = status;
        this.details = details;
    }
}
export class HasabAuthError extends HasabError {
    constructor(message) {
        super(message, "AUTH_ERROR");
    }
}
export class HasabRateLimitError extends HasabError {
    constructor(message, retryAfter) {
        super(message, "RATE_LIMIT_ERROR");
        this.retryAfter = retryAfter;
    }
}
export class HasabTimeoutError extends HasabError {
    constructor(message) {
        super(message, "TIMEOUT_ERROR");
    }
}
export class HasabUnknownError extends HasabError {
    constructor(message) {
        super(message, "UNKNOWN_ERROR");
    }
}
//# sourceMappingURL=errors.js.map