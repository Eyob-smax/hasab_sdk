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
import { TTSHistoryResponse } from "../types/response.js";

export interface GetTTSHistoryOptions {
  limit?: number;
  offset?: number;
  status?: "success" | "failed";
  tts_type?: "regular" | "reference";
  language?: string;
  date_from?: string;
  date_to?: string;
  device_id?: number;
}

export async function getTTSHistory(
  client: AxiosInstance,
  options: GetTTSHistoryOptions = {}
): Promise<TTSHistoryResponse> {
  const {
    limit,
    offset = 0,
    status,
    tts_type,
    language,
    date_from,
    date_to,
    device_id,
  } = options;

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new HasabValidationError(
      "Limit must be an integer greater than or equal to 1."
    );
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new HasabValidationError("Offset must be a non-negative integer.");
  }
  if (status && !["success", "failed"].includes(status)) {
    throw new HasabValidationError("Status must be 'success' or 'failed'.");
  }
  if (tts_type && !["regular", "reference"].includes(tts_type)) {
    throw new HasabValidationError(
      "tts_type must be 'regular' or 'reference'."
    );
  }
  if (language && (typeof language !== "string" || language.length > 10)) {
    throw new HasabValidationError(
      "Language must be a string (max 10 characters)."
    );
  }
  if (date_from && typeof date_from !== "string") {
    throw new HasabValidationError(
      "date_from must be a valid ISO date string."
    );
  }
  if (date_to && typeof date_to !== "string") {
    throw new HasabValidationError("date_to must be a valid ISO date string.");
  }

  const params: Record<string, any> = {
    limit: limit ?? 50,
    offset,
  };
  if (status) params.status = status;
  if (tts_type) params.tts_type = tts_type;
  if (language) params.language = language;
  if (date_from) params.date_from = date_from;
  if (date_to) params.date_to = date_to;
  if (device_id !== undefined) params.device_id = device_id;

  try {
    const response = await client.get("/tts/history", {
      params,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new HasabApiError("Invalid response format", 500);
    }

    return {
      success: true,
      records: data.records,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
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
            throw new HasabApiError("TTS history endpoint not found", 404);
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
    throw new HasabUnknownError(`Failed to fetch TTS history: ${msg}`);
  }
}
