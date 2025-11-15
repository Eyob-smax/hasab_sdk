import { AxiosError } from "axios";
import { HasabApiError, HasabNetworkError, HasabValidationError, HasabAuthError, HasabRateLimitError, HasabTimeoutError, HasabUnknownError, } from "../common/errors.js";
export async function tts(text, language, speaker_name, client) {
    if (!text || typeof text !== "string") {
        throw new HasabValidationError("Text is required and must be a string.");
    }
    if (text.trim().length === 0) {
        throw new HasabValidationError("Text cannot be empty or whitespace.");
    }
    if (!language || typeof language !== "string") {
        throw new HasabValidationError("Language is required and must be a string.");
    }
    if (speaker_name !== undefined && typeof speaker_name !== "string") {
        throw new HasabValidationError("Speaker name must be a string if provided.");
    }
    const payload = {
        text: text.trim(),
        language: language,
    };
    if (speaker_name) {
        payload.speaker_name = speaker_name;
    }
    try {
        const response = await client.post("/tts/synthesize", payload, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        console.log(response.data);
        const data = response.data;
        if (!data) {
            throw new HasabApiError("Invalid response from server, no data received", 500);
        }
        return {
            success: true,
            audio_buffer: data,
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
                const msg = axiosErr.response.data?.message || "TTS API error";
                switch (status) {
                    case 400:
                        throw new HasabValidationError(`Bad request: ${msg}`);
                    case 401:
                    case 403:
                        throw new HasabAuthError("Unauthorized: Invalid or missing API key");
                    case 404:
                        throw new HasabApiError("TTS endpoint not found", 404);
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
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new HasabUnknownError(`Unexpected error during TTS: ${msg}`);
    }
}
//# sourceMappingURL=textToSpeech.js.map