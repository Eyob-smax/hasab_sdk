import axios, { AxiosInstance, AxiosError } from "axios";
import { transcribe } from "./transcription/transcription.js";
import type { TranscriptionResponse } from "./types/response";
import {
  HasabError,
  HasabApiError,
  HasabNetworkError,
  HasabValidationError,
  HasabAuthError,
  HasabRateLimitError,
  HasabTimeoutError,
  HasabUnknownError,
} from "./common/errors";
import { BASE_URL } from "./common/constants";
import { ChatSendMessage } from "./types/request.js";
import { chat } from "./chat/chat.js";

export class HasabClient {
  private apikey: string;
  private client: AxiosInstance;

  constructor(apikey: string) {
    if (!apikey) throw new HasabAuthError("API key is required.");
    this.apikey = apikey;

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${apikey}` },
      timeout: 30000,
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${this.apikey}`;
        return config;
      },
      (error) => Promise.reject(new HasabValidationError(error.message))
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;

          switch (status) {
            case 400:
              throw new HasabValidationError(
                (error.response.data as any)?.message || "Bad request"
              );
            case 401:
            case 403:
              throw new HasabAuthError("Unauthorized or invalid API key.");
            case 404:
              throw new HasabApiError("Endpoint not found", 404);
            case 408:
              throw new HasabTimeoutError("Request timed out.");
            case 429:
              throw new HasabRateLimitError(
                "Rate limit exceeded. Try again later.",
                Number(error.response.headers["retry-after"]) || undefined
              );
            case 500:
            case 502:
            case 503:
            case 504:
              throw new HasabApiError(
                "Server error. Please retry later.",
                status
              );
            default:
              throw new HasabApiError(
                (error.response.data as any)?.message || "API Error",
                status
              );
          }
        } else if (error.request) {
          throw new HasabNetworkError(
            "No response received. Check your connection."
          );
        } else if (error.code === "ECONNABORTED") {
          throw new HasabTimeoutError("Request timeout exceeded.");
        } else {
          throw new HasabUnknownError(error.message);
        }
      }
    );
  }

  async transcribe(file: File | Blob | string): Promise<TranscriptionResponse> {
    try {
      const result = await transcribe(
        { audio_file: file },
        this.apikey,
        this.client
      );
      return result;
    } catch (error: any) {
      if (error instanceof HasabError) {
        return { success: false, message: `[${error.code}] ${error.message}` };
      }
      return {
        success: false,
        message: "Unexpected error: " + (error?.message || "Unknown issue"),
      };
    }
  }

  public chat = {
    sendMessage: async ({
      message,
      model = "hasab-1-lite",
      stream = false,
    }: ChatSendMessage) => {
      try {
        const result = await chat(
          message,
          model,
          stream,
          this.client,
          this.apikey
        );
        return;
      } catch (error: any) {
        if (error instanceof HasabError) {
          return {
            success: false,
            message: `[${error.code}] ${error.message}`,
          };
        }
        return {
          success: false,
          message: "Unexpected error: " + (error?.message || "Unknown issue"),
        };
      }
    },
  };
}
