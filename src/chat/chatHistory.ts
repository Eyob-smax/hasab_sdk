import { AxiosInstance } from "axios";
import type { ChatHistoryResponse } from "../types/response.js";
import {
  HasabApiError,
  HasabNetworkError,
  HasabValidationError,
  HasabAuthError,
  HasabRateLimitError,
  HasabTimeoutError,
  HasabUnknownError,
} from "../common/errors.js";
import { AxiosError } from "axios";

export async function getChatHistory(
  apikey: string,
  client: AxiosInstance
): Promise<ChatHistoryResponse> {
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
      throw new HasabApiError("Invalid response format", 500);
    }

    return {
      success: true,
      history: Array.isArray(data.history) ? data.history : [],
    };
  } catch (error: unknown) {
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
            throw new HasabAuthError("Unauthorized or invalid API key");
          case 404:
            throw new HasabApiError("Chat history not found", 404);
          case 408:
            throw new HasabTimeoutError("Request timed out");
          case 429:
            throw new HasabRateLimitError(
              "Rate limit exceeded",
              Number(axiosErr.response.headers["retry-after"]) || undefined
            );
          case 500:
          case 502:
          case 503:
          case 504:
            throw new HasabApiError("Server error", status);
          default:
            throw new HasabApiError(msg, status);
        }
      } else if (axiosErr.request) {
        throw new HasabNetworkError("No response received");
      } else if (axiosErr.code === "ECONNABORTED") {
        throw new HasabTimeoutError("Request timeout");
      } else {
        throw new HasabUnknownError(axiosErr.message);
      }
    }

    throw new HasabUnknownError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
