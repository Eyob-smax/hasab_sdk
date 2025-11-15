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
import { GetTTSRecordResponse } from "../types/index.js";

export async function getTTSRecord(
  client: AxiosInstance,
  recordId: number
): Promise<GetTTSRecordResponse> {
  if (!Number.isInteger(recordId) || recordId <= 0) {
    throw new HasabValidationError("recordId must be a positive integer.");
  }

  try {
    const response = await client.get(`/tts/record/${recordId}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new HasabApiError("Invalid response format", 500);
    }

    const record = data.record;

    return {
      success: true,
      record: {
        id: record?.id,
        text: record?.text,
        language: record?.language,
        speaker_name: record?.speaker_name,
        status: record?.status as "success" | "failed",
        audio_url: record?.audio_url,
        tokens_used: record?.tokens_used,
        created_at: record?.created_at,
        tts_type: record?.tts_type,
        device_id: record?.device_id,
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
            throw new HasabApiError(`TTS record ${recordId} not found`, 404);
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
      `Failed to fetch TTS record ${recordId}: ${msg}`
    );
  }
}
