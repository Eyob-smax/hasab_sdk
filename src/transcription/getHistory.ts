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
import { TranscriptionHistoryResponse } from "../types/index.js";

export interface GetTranscriptionHistoryOptions {
  page?: number;
}

export async function getTranscriptionHistory(
  apikey: string,
  client: AxiosInstance,
  options: GetTranscriptionHistoryOptions = {}
): Promise<TranscriptionHistoryResponse> {
  const { page = 1 } = options;

  if (!Number.isInteger(page) || page < 1) {
    throw new HasabValidationError("Page must be a positive integer.");
  }

  const params = { page };

  try {
    const response = await client.get("/v1/audios", {
      params,
      headers: {
        Authorization: `Bearer ${apikey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new HasabApiError("Invalid response format", 500);
    }

    if (data.status !== "success") {
      throw new HasabApiError(data.message || "API returned error status", 500);
    }

    if (!data.data || typeof data.data !== "object") {
      throw new HasabApiError("Missing or invalid 'data' in response", 500);
    }

    const payload = data.data;

    const required = ["current_page", "data", "total", "per_page"] as const;
    for (const field of required) {
      if (!(field in payload)) {
        throw new HasabApiError(
          `Missing required field '${field}' in pagination data`,
          500
        );
      }
    }

    if (!Array.isArray(payload.data)) {
      throw new HasabApiError("Invalid 'data' array in response", 500);
    }

    return {
      status: data.status,
      data: {
        current_page: payload.current_page,
        data: payload.data,
        first_page_url: payload.first_page_url,
        from: payload.from,
        last_page: payload.last_page,
        last_page_url: payload.last_page_url,
        links: payload.links || [],
        next_page_url: payload.next_page_url,
        path: payload.path,
        per_page: payload.per_page,
        prev_page_url: payload.prev_page_url,
        to: payload.to,
        total: payload.total,
      },
      message: data.message,
    };
  } catch (error: unknown) {
    if (error instanceof HasabValidationError) throw error;

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
            throw new HasabAuthError("Unauthorized: Invalid API key");
          case 404:
            throw new HasabApiError(
              "Transcription history endpoint not found",
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
        throw new HasabNetworkError("No response from server.");
      }

      if (axiosErr.code === "ECONNABORTED") {
        throw new HasabTimeoutError("Request timeout exceeded");
      }

      throw new HasabUnknownError(axiosErr.message);
    }

    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new HasabUnknownError(
      `Failed to fetch transcription history: ${msg}`
    );
  }
}
