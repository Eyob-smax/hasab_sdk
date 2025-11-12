"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasabUnknownError = exports.HasabTimeoutError = exports.HasabRateLimitError = exports.HasabAuthError = exports.HasabApiError = exports.HasabNetworkError = exports.HasabValidationError = exports.HasabError = void 0;
class HasabError extends Error {
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
exports.HasabError = HasabError;
class HasabValidationError extends HasabError {
    constructor(message) {
        super(message, "VALIDATION_ERROR");
    }
}
exports.HasabValidationError = HasabValidationError;
class HasabNetworkError extends HasabError {
    constructor(message) {
        super(message, "NETWORK_ERROR");
    }
}
exports.HasabNetworkError = HasabNetworkError;
class HasabApiError extends HasabError {
    constructor(message, status, details) {
        super(message, "API_ERROR");
        this.status = status;
        this.details = details;
    }
}
exports.HasabApiError = HasabApiError;
class HasabAuthError extends HasabError {
    constructor(message) {
        super(message, "AUTH_ERROR");
    }
}
exports.HasabAuthError = HasabAuthError;
class HasabRateLimitError extends HasabError {
    constructor(message, retryAfter) {
        super(message, "RATE_LIMIT_ERROR");
        this.retryAfter = retryAfter;
    }
}
exports.HasabRateLimitError = HasabRateLimitError;
class HasabTimeoutError extends HasabError {
    constructor(message) {
        super(message, "TIMEOUT_ERROR");
    }
}
exports.HasabTimeoutError = HasabTimeoutError;
class HasabUnknownError extends HasabError {
    constructor(message) {
        super(message, "UNKNOWN_ERROR");
    }
}
exports.HasabUnknownError = HasabUnknownError;
//# sourceMappingURL=errors.js.map