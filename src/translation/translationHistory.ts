import { AxiosInstance, AxiosError } from "axios";
import {
  HasabApiError,
  HasabNetworkError,
  HasabValidationError,
  HasabAuthError,
  HasabRateLimitError,
  HasabTimeoutError,
  HasabUnknownError,
} from "../common/errors.js";
import {
  TranslationHistory,
  TranslationHistoryResponse,
} from "../types/index.js";

export async function getTranslationHistory(
  client: AxiosInstance
): Promise<TranslationHistoryResponse> {
  try {
    const response = await client.get<TranslationHistory>("/translations", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new HasabApiError("Invalid response format from server", 500);
    }

    return {
      success: true,
      history: data,
    };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const axiosErr = error as AxiosError<any>;

      if (axiosErr.response) {
        const status = axiosErr.response.status;
        const msg = axiosErr.response.data?.message || "API error";

        switch (status) {
          case 400:
            throw new HasabValidationError(`Bad request: ${msg}`);
          case 401:
          case 403:
            throw new HasabAuthError(
              "Unauthorized: Invalid or missing API key"
            );
          case 404:
            throw new HasabApiError(
              "Translation history endpoint not found",
              404
            );
          case 408:
            throw new HasabTimeoutError("Request timed out");
          case 429:
            const retryAfter = axiosErr.response.headers["retry-after"];
            throw new HasabRateLimitError(
              "Rate limit exceeded",
              retryAfter ? Number(retryAfter) : undefined
            );
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
        throw new HasabNetworkError(
          "No response from server. Check your connection."
        );
      }

      if (axiosErr.code === "ECONNABORTED") {
        throw new HasabTimeoutError("Request timeout exceeded");
      }

      throw new HasabUnknownError(axiosErr.message);
    }

    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new HasabUnknownError(`Unexpected error: ${msg}`);
  }
}
