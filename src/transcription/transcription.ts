import type { TranscriptionRequest } from "../types/request";
import type {
  TranscriptionResponse,
  TranscriptionResponseFull,
} from "../types/response";
import { AxiosInstance } from "axios";
import { BASE_URL } from "../common/constants";
import FormData from "form-data";
import fs from "fs";
import { LanguageEnum } from "../common/languageEnum";
import { HasabValidationError, HasabApiError } from "../common/errors.js";

export async function transcribe(
  request: TranscriptionRequest,
  apikey: string,
  client: AxiosInstance
): Promise<TranscriptionResponse> {
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
    if (!fs.existsSync(request.audio_file)) {
      throw new HasabValidationError("Invalid or missing file path.");
    }
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
    if (key !== "audio_file" && value !== undefined) {
      form.append(key, String(value));
    }
  });
  try {
    const response = await client.post<TranscriptionResponseFull>(
      `${BASE_URL}/upload-audio/`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apikey}`,
        },

        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const data = response.data;
    const metadata = data.metadata || {
      tokens_charged: 0,
      remaining_tokens: 0,
      charge_message: "",
    };

    if (data.success) {
      const text = data.transcription || data.audio?.transcription || "";
      return {
        success: true,
        text,
        metadata,
      };
    } else {
      throw new HasabApiError(
        data.message || "API processing failed",
        response.status || 500,
        data
      );
    }
  } catch (error: any) {
    if (error instanceof HasabValidationError) {
      throw error;
    }

    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message || `API call failed with status ${status}`;
      throw new HasabApiError(message, status, error.response.data);
    }

    throw error;
  }
}
