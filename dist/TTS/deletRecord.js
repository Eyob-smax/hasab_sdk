import { AxiosError } from "axios";
import { HasabApiError, HasabNetworkError, HasabValidationError, HasabAuthError, HasabRateLimitError, HasabTimeoutError, HasabUnknownError, } from "../common/errors.js";
export async function deleteTTSRecord(client, recordId) {
    if (!Number.isInteger(recordId) || recordId <= 0) {
        throw new HasabValidationError("recordId must be a positive integer.");
    }
    try {
        const response = await client.delete(`/tts/record/${recordId}`, {
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
            message: data.message || "TTS record deleted successfully",
        };
    }
    catch (error) {
        if (error instanceof HasabValidationError)
            throw error;
        if (error instanceof AxiosError) {
            const axiosErr = error;
            if (axiosErr.response) {
                const status = axiosErr.response.status;
                const msg = axiosErr.response.data?.message || "API error";
                switch (status) {
                    case 400:
                        throw new HasabValidationError(`Bad request: ${msg}`);
                    case 401:
                    case 403:
                        throw new HasabAuthError("Unauthorized: Invalid API key");
                    case 404:
                        throw new HasabApiError(`TTS record ${recordId} not found`, 404);
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
        throw new HasabUnknownError(`Failed to delete TTS record ${recordId}: ${msg}`);
    }
}
//# sourceMappingURL=deletRecord.js.map