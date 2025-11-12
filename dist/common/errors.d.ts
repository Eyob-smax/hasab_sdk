export declare class HasabError extends Error {
    readonly code?: string | undefined;
    readonly cause?: unknown | undefined;
    constructor(message: string, code?: string | undefined, cause?: unknown | undefined);
}
export declare class HasabValidationError extends HasabError {
    constructor(message: string);
}
export declare class HasabNetworkError extends HasabError {
    constructor(message: string);
}
export declare class HasabApiError extends HasabError {
    readonly status: number;
    readonly details?: any | undefined;
    constructor(message: string, status: number, details?: any | undefined);
}
export declare class HasabAuthError extends HasabError {
    constructor(message: string);
}
export declare class HasabRateLimitError extends HasabError {
    readonly retryAfter?: number | undefined;
    constructor(message: string, retryAfter?: number | undefined);
}
export declare class HasabTimeoutError extends HasabError {
    constructor(message: string);
}
export declare class HasabUnknownError extends HasabError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map