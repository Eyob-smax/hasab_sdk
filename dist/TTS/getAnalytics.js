import { AxiosError } from "axios";
import { HasabApiError, HasabNetworkError, HasabValidationError, HasabAuthError, HasabRateLimitError, HasabTimeoutError, HasabUnknownError, } from "../common/errors.js";
export async function getTTSAnalytics(client, options = {}) {
    const { date_from, date_to } = options;
    if (date_from && date_to && new Date(date_from) > new Date(date_to)) {
        throw new HasabValidationError("date_from cannot be after date_to.");
    }
    const params = {};
    if (date_from)
        params.date_from = date_from.split("T")[0];
    if (date_to)
        params.date_to = date_to.split("T")[0];
    try {
        const response = await client.get("/tts/analytics", {
            params,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const data = response.data;
        if (!data || typeof data !== "object") {
            throw new HasabApiError("Invalid response format", 500);
        }
        return {
            success: true,
            overview: data.overview,
            language_breakdown: data.language_breakdown,
            daily_usage: data.daily_usage,
        };
    }
    catch (error) {
        if (error instanceof HasabValidationError)
            throw error;
        if (error instanceof AxiosError) {
            const axiosErr = error;
            if (axiosErr.response) {
                const status = axiosErr.response.status;
                const msg = axiosErr.response.data?.message || "Analytics API error";
                switch (status) {
                    case 400:
                        throw new HasabValidationError(`Bad request: ${msg}`);
                    case 401:
                    case 403:
                        throw new HasabAuthError("Unauthorized: Invalid API key");
                    case 404:
                        throw new HasabApiError("TTS analytics endpoint not found", 404);
                    case 408:
                        throw new HasabTimeoutError("Request timed out");
                    case 429:
                        const retryAfter = axiosErr.response.headers["retry-after"];
                        throw new HasabRateLimitError("Rate limit exceeded", retryAfter ? Number(retryAfter) : undefined);
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new HasabApiError(`Server error: ${msg}`, status);
                    default:
                        throw new HasabApiError(msg, status);
                }
            }
            if (axiosErr.request) {
                throw new HasabNetworkError("No response from server.");
            }
            if (axiosErr.code === "ECONNABORTED") {
                throw new HasabTimeoutError("Request timeout exceeded");
            }
            throw new HasabUnknownError(axiosErr.message);
        }
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new HasabUnknownError(`Failed to fetch TTS analytics: ${msg}`);
    }
}
//# sourceMappingURL=getAnalytics.js.map