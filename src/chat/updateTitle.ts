import { AxiosInstance, AxiosError } from "axios";
import {
  HasabApiError,
  HasabNetworkError,
  HasabValidationError,
  HasabAuthError,
  HasabRateLimitError,
  HasabTimeoutError,
  HasabUnknownError,
} from "../common/errors";

export interface UpdateTitleResponse {
  success: boolean;
  message?: string;
}

export async function updateTitle(
  client: AxiosInstance,
  title: string
): Promise<UpdateTitleResponse> {
  if (!title || typeof title !== "string") {
    throw new HasabValidationError("Title is required and must be a string");
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    throw new HasabValidationError("Title cannot be empty");
  }
  if (trimmedTitle.length > 255) {
    throw new HasabValidationError("Title must not exceed 255 characters");
  }

  try {
    const response = await client.post(
      "/v1/chat/title",
      { title: trimmedTitle },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new HasabApiError("Invalid response from server", 500);
    }

    return {
      success: true,
      message: data.message || "Chat title updated successfully",
    };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const axiosErr = error;

      if (axiosErr.response) {
        const status = axiosErr.response.status;
        const msg = axiosErr.response.data?.message || "API error";

        switch (status) {
          case 400:
            throw new HasabValidationError(`Invalid title: ${msg}`);
          case 401:
          case 403:
            throw new HasabAuthError(
              "Unauthorized: Invalid or missing API key"
            );
          case 404:
            throw new HasabApiError("Chat title endpoint not found", 404);
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
