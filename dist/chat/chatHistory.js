"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistory = getChatHistory;
const errors_1 = require("../common/errors");
const axios_1 = require("axios");
async function getChatHistory(apikey, client) {
    try {
        const response = await client.get("/chat/history", {
            headers: {
                Authorization: `Bearer ${apikey}`,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        });
        const data = response.data;
        if (!data || typeof data !== "object") {
            throw new errors_1.HasabApiError("Invalid response format", 500);
        }
        return {
            success: true,
            history: Array.isArray(data.history) ? data.history : [],
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
                        throw new errors_1.HasabAuthError("Unauthorized or invalid API key");
                    case 404:
                        throw new errors_1.HasabApiError("Chat history not found", 404);
                    case 408:
                        throw new errors_1.HasabTimeoutError("Request timed out");
                    case 429:
                        throw new errors_1.HasabRateLimitError("Rate limit exceeded", Number(axiosErr.response.headers["retry-after"]) || undefined);
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new errors_1.HasabApiError("Server error", status);
                    default:
                        throw new errors_1.HasabApiError(msg, status);
                }
            }
            else if (axiosErr.request) {
                throw new errors_1.HasabNetworkError("No response received");
            }
            else if (axiosErr.code === "ECONNABORTED") {
                throw new errors_1.HasabTimeoutError("Request timeout");
            }
            else {
                throw new errors_1.HasabUnknownError(axiosErr.message);
            }
        }
        throw new errors_1.HasabUnknownError(error instanceof Error ? error.message : "Unknown error");
    }
}
//# sourceMappingURL=chatHistory.js.map