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
import { LanguageEnum } from "../common/languageEnum.js";
import type {
  TranslationResponseMapped,
  TranslationResponseOriginal,
} from "../types/response.js";

export async function translate(
  text: string,
  client: AxiosInstance,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResponseMapped> {
  if (!text || typeof text !== "string") {
    throw new HasabValidationError(
      "Text to translate is required and must be a string."
    );
  }

  if (text.trim().length === 0) {
    throw new HasabValidationError(
      "Text to translate cannot be empty or whitespace."
    );
  }

  if (!targetLanguage || typeof targetLanguage !== "string") {
    throw new HasabValidationError(
      "Target language is required and must be a string."
    );
  }

  if (sourceLanguage && typeof sourceLanguage !== "string") {
    throw new HasabValidationError(
      "Source language must be a string if provided."
    );
  }

  const payload = {
    text: text.trim(),
    target_language: targetLanguage,
    source_language: sourceLanguage || LanguageEnum.AUTO,
  };

  try {
    const { data } = await client.post<TranslationResponseOriginal>(
      "/translate",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const mappedData = {
      success: data.status === "success",
      translatedText: data.data.translation.translated_text,
      metadata: {
        translation: data.data.translation,
        message: data.message,
        code: data.code,
        requestId: data.request_id,
      },
    };

    if (!mappedData.success || typeof mappedData.metadata !== "object") {
      throw new HasabApiError("Missing 'data' field in response", 500);
    }

    if (typeof mappedData.translatedText !== "string") {
      throw new HasabApiError("Missing or invalid translation result", 500);
    }

    return mappedData;
  } catch (error: unknown) {
    if (error instanceof HasabValidationError) {
      throw error;
    }

    if (error instanceof AxiosError) {
      const axiosErr = error as AxiosError<any>;

      if (axiosErr.response) {
        const status = axiosErr.response.status;
        const msg = axiosErr.response.data?.message || "Translation API error";

        switch (status) {
          case 400:
            throw new HasabValidationError(`Bad request: ${msg}`);
          case 401:
          case 403:
            throw new HasabAuthError(
              "Unauthorized: Invalid or missing API key"
            );
          case 404:
            throw new HasabApiError("Translation endpoint not found", 404);
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
    throw new HasabUnknownError(`Unexpected error during translation: ${msg}`);
  }
}
