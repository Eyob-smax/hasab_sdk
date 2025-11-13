"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatTitle = getChatTitle;
const axios_1 = require("axios");
const errors_1 = require("../common/errors");
async function getChatTitle(client) {
    try {
        const response = await client.get("/chat/title", {
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = response.data;
        if (!data || typeof data !== "object") {
            throw new errors_1.HasabApiError("Invalid response format from server", 500);
        }
        if (typeof data.title !== "string") {
            throw new errors_1.HasabApiError("Missing or invalid 'title' field in response", 500);
        }
        return {
            success: true,
            title: data.title.trim(),
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
                        throw new errors_1.HasabApiError("Chat title endpoint not found", 404);
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
//# sourceMappingURL=getChatTitle.js.map