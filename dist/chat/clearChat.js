"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearChat = clearChat;
const axios_1 = require("axios");
const errors_1 = require("../common/errors");
async function clearChat(client) {
    try {
        const response = await client.post("/chat/clear", {
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = response.data;
        if (!data || typeof data !== "object") {
            throw new errors_1.HasabApiError("Invalid response from server", 500);
        }
        return {
            success: true,
            message: data.message || "Chat cleared successfully",
        };
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            const axiosErr = error;
            if (axiosErr.response) {
                const status = axiosErr.response.status;
                const msg = axiosErr.response.data?.message || "API error";
                switch (status) {
                    case 400:
                        throw new errors_1.HasabValidationError(`Bad request: ${msg}`);
                    case 401:
                    case 403:
                        throw new errors_1.HasabAuthError("Unauthorized: Invalid or missing API key");
                    case 404:
                        throw new errors_1.HasabApiError("Clear chat endpoint not found", 404);
                    case 408:
                        throw new errors_1.HasabTimeoutError("Request timed out");
                    case 429:
                        const retryAfter = axiosErr.response.headers["retry-after"];
                        throw new errors_1.HasabRateLimitError("Rate limit exceeded", retryAfter ? Number(retryAfter) : undefined);
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new errors_1.HasabApiError(`Server error: ${msg}`, status);
                    default:
                        throw new errors_1.HasabApiError(msg, status);
                }
            }
            if (axiosErr.request) {
                throw new errors_1.HasabNetworkError("No response from server. Check your connection.");
            }
            if (axiosErr.code === "ECONNABORTED") {
                throw new errors_1.HasabTimeoutError("Request timeout exceeded");
            }
            throw new errors_1.HasabUnknownError(axiosErr.message);
        }
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new errors_1.HasabUnknownError(`Unexpected error: ${msg}`);
    }
}
//# sourceMappingURL=clearChat.js.map