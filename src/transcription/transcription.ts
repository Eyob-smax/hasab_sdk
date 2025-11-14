import type { TranscriptionRequest } from "../types/request.js";
import type { TranscriptionResponseFull } from "../types/response.js";
import { AxiosInstance, AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import { LanguageEnum } from "../common/languageEnum.js";
import {
  HasabValidationError,
  HasabApiError,
  HasabNetworkError,
  HasabAuthError,
  HasabRateLimitError,
  HasabTimeoutError,
  HasabUnknownError,
} from "../common/errors.js";

export async function transcribe(
  request: TranscriptionRequest,
  client: AxiosInstance
): Promise<TranscriptionResponseFull> {
  if (!request.audio_file) {
    throw new HasabValidationError("Audio file is required.");
  }
  if (
    typeof request.audio_file === "string" &&
    !fs.existsSync(request.audio_file)
  ) {
    throw new HasabValidationError("Invalid or missing file path.");
  }

  const form = new FormData();
  if (typeof request.audio_file === "string") {
    form.append("file", fs.createReadStream(request.audio_file));
  } else if (
    request.audio_file instanceof Blob ||
    (request.audio_file as any).buffer
  ) {
    let filename: string = "audio.bin";
    if ((request.audio_file as any).name) {
      filename = (request.audio_file as any).name;
    }
    form.append("file", request.audio_file, filename);
  } else {
    throw new HasabValidationError(
      "Invalid type for audio file. Must be a path string, File, or Blob."
    );
  }

  const defaults = {
    transcribe: true,
    translate: false,
    summarize: false,
    language: "auto",
    timestamps: false,
    source_language: LanguageEnum.AUTO,
  };
  const payload = { ...defaults, ...request };
  Object.entries(payload).forEach(([key, value]) => {
    if (key !== "file" && value !== undefined) {
      form.append(key, String(value));
    }
  });

  try {
    const response = await client.post<TranscriptionResponseFull>(
      `/upload-audio`,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    const data = response.data;

    if (data.success) {
      return data;
    } else {
      throw new HasabApiError(
        data.message || "API processing failed",
        response.status || 500,
        data
      );
    }
  } catch (error: unknown) {
    console.log("Transcription error:", error);
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
            throw new HasabAuthError("Unauthorized or invalid API key");
          case 404:
            throw new HasabApiError("Endpoint not found", 404);
          case 408:
            throw new HasabTimeoutError("Request timed out");
          case 429:
            const retryAfter = axiosErr.response.headers["retry-after"];
            throw new HasabRateLimitError(
              "Rate limit exceeded",
              Number(retryAfter) || undefined
            );
          case 500:
          case 502:
          case 503:
          case 504:
            throw new HasabApiError(`Server error: ${msg}`, status);
          default:
            throw new HasabApiError(msg, status);
        }
      } else if (axiosErr.request) {
        throw new HasabNetworkError("No response received");
      } else if (axiosErr.code === "ECONNABORTED") {
        throw new HasabTimeoutError("Request timeout exceeded");
      } else {
        throw new HasabUnknownError(axiosErr.message);
      }
    }

    throw new HasabUnknownError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
