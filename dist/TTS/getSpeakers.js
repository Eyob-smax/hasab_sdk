import { AxiosError } from "axios";
import { HasabApiError, HasabNetworkError, HasabValidationError, HasabAuthError, HasabRateLimitError, HasabTimeoutError, HasabUnknownError, } from "../common/errors.js";
export async function getSpeakers(client, language) {
    if (language !== undefined &&
        (typeof language !== "string" || language.trim() === "")) {
        throw new HasabValidationError("Language filter must be a non-empty string if provided.");
    }
    const params = {};
    if (language) {
        params.language = language.trim().toLowerCase();
    }
    try {
        const response = await client.get("/tts/speakers", {
            params,
            headers: {
                Accept: "application/json",
            },
        });
        const data = response.data;
        if (!data || typeof data !== "object") {
            throw new HasabApiError("Invalid response format from server", 500);
        }
        for (const [lang, speakers] of Object.entries(data.languages)) {
            if (!Array.isArray(speakers) ||
                speakers.some((s) => typeof s !== "string")) {
                throw new HasabApiError(`Invalid speakers list for language '${lang}'`, 500);
            }
        }
        return {
            success: true,
            languages: data.languages,
            total_speakers: data.total_speakers,
            message: data.message || "Speakers retrieved successfully",
        };
    }
    catch (error) {
        if (error instanceof HasabValidationError) {
            throw error;
        }
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
                        throw new HasabAuthError("Unauthorized: Invalid or missing API key");
                    case 404:
                        throw new HasabApiError("TTS speakers endpoint not found", 404);
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
                throw new HasabNetworkError("No response from server. Check your connection.");
            }
            if (axiosErr.code === "ECONNABORTED") {
                throw new HasabTimeoutError("Request timeout exceeded");
            }
            throw new HasabUnknownError(axiosErr.message);
        }
        // Fallback
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new HasabUnknownError(`Unexpected error fetching speakers: ${msg}`);
    }
}
//# sourceMappingURL=getSpeakers.js.map