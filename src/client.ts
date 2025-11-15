import axios, { AxiosInstance, AxiosError } from "axios";
import { transcribe } from "./transcription/transcription.js";
import type {
  ChatHistoryResponse,
  ChatResponse,
  ChatTitle,
  ClearChat,
  DeleteTTSRecordResponse,
  GetTTSRecordResponse,
  Languages,
  SpeakersResponse,
  TranscriptionHistoryResponse,
  TranscriptionResponseFull,
  TranslationHistoryResponse,
  TranslationResponseMapped,
  TTSAnalyticsResponse,
  TTSHistoryResponse,
  TTSResponse,
} from "./types/index.js";
import {
  HasabError,
  HasabApiError,
  HasabNetworkError,
  HasabValidationError,
  HasabAuthError,
  HasabRateLimitError,
  HasabTimeoutError,
  HasabUnknownError,
} from "./common/errors.js";
import { BASE_URL } from "./common/constants.js";
import { chat } from "./chat/chat.js";
import { chatStream } from "./chat/chatStream.js";
import { ChatOptionsConfig } from "./common/types.js";
import { Readable } from "stream";
import { getChatHistory } from "./chat/chatHistory.js";
import { getChatTitle } from "./chat/getChatTitle.js";
import { clearChat } from "./chat/clearChat.js";
import { updateTitle, UpdateTitleResponse } from "./chat/updateTitle.js";
import { translate } from "./translation/translation.js";
import { getTranslationHistory } from "./translation/translationHistory.js";
import { tts } from "./TTS/textToSpeech.js";
import { getSpeakers } from "./TTS/getSpeakers.js";
import { getTTSHistory, GetTTSHistoryOptions } from "./TTS/getHistory.js";
import { getTTSAnalytics, GetTTSAnalyticsOptions } from "./TTS/getAnalytics.js";
import { getTTSRecord } from "./TTS/getRecord.js";
import { deleteTTSRecord } from "./TTS/deletRecord.js";
import { ttsStream, TTSStreamRequest } from "./TTS/textToSpeechStream.js";
import {
  getTranscriptionHistory,
  GetTranscriptionHistoryOptions,
} from "./transcription/getHistory.js";

type ErrorResponse = { success: false; message: string };
export class HasabClient {
  private apikey: string;
  private client: AxiosInstance;

  constructor({ apikey }: { apikey: string }) {
    if (!apikey || typeof apikey !== "string") {
      throw new HasabAuthError("API key is required and must be a string.");
    }
    this.apikey = apikey;

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${apikey}` },
      timeout: 60000,
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
          const data = error.response.data as any;

          switch (status) {
            case 400:
              throw new HasabValidationError(data?.error || "Bad request");
            case 401:
            case 403:
              throw new HasabAuthError(
                data?.error || "Unauthorized or invalid API key."
              );
            case 404:
              throw new HasabApiError(data?.error || "Endpoint not found", 404);
            case 408:
              throw new HasabTimeoutError("Request timed out.");
            case 429:
              throw new HasabRateLimitError(
                data?.error || "Rate limit exceeded. Try again later.",
                Number(error.response.headers["retry-after"]) || undefined
              );
            case 500:
            case 502:
            case 503:
            case 504:
              throw new HasabApiError(
                data?.error || "Server error. Please retry later.",
                status
              );
            default:
              console.log("Unhandled error response:", data);
              throw new HasabApiError(data?.error || "API Error", status);
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

  public transcription = {
    transcribe: async ({
      file,
    }: {
      file: Buffer | Uint8Array | ArrayBuffer | string | File | Blob;
    }): Promise<TranscriptionResponseFull | ErrorResponse> => {
      try {
        const result = await transcribe({ audio_file: file }, this.client);
        return result;
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
    getHistory: async (
      options?: GetTranscriptionHistoryOptions
    ): Promise<
      TranscriptionHistoryResponse | { success: false; message: string }
    > => {
      try {
        const result = await getTranscriptionHistory(
          this.apikey,
          this.client,
          options
        );
        return result;
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
  };

  public chat = {
    sendMessage: async (
      { message }: { message: string },
      options?: ChatOptionsConfig
    ): Promise<ChatResponse | ErrorResponse> => {
      try {
        const result = await chat(message, this.client, options);
        return result;
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    streamResponse: (
      { message }: { message: string },
      options?: ChatOptionsConfig
    ): Readable & { cancel: () => void } => {
      const stream = new Readable({ read() {} }) as Readable & {
        cancel: () => void;
      };
      let cancelFn: () => void = () => {};

      const startStream = async () => {
        try {
          const { model, maxTokens, tools, temperature, timeout } =
            options || {};

          const cancel = await chatStream(
            message,
            this.client,
            (chunk: string) => stream.push(chunk),
            (err: any) => stream.emit("error", err),
            () => stream.push(null),
            { model, maxTokens, tools, temperature, timeout }
          );

          cancelFn = cancel;
          stream.cancel = () => {
            cancel();
            stream.push(null);
            stream.emit("close");
          };
        } catch (err: unknown) {
          stream.emit("error", err);
          stream.push(null);
        }
      };

      startStream();

      const originalDestroy = stream.destroy.bind(stream);
      stream.destroy = function (this: typeof stream, error?: Error) {
        cancelFn();
        originalDestroy.call(this, error);
        return this;
      };

      return stream;
    },

    getChatHistory: async (): Promise<ChatHistoryResponse | ErrorResponse> => {
      try {
        return await getChatHistory(this.client);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    getChatTitle: async (): Promise<ChatTitle | ErrorResponse> => {
      try {
        return await getChatTitle(this.client);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    clearChat: async (): Promise<ClearChat | ErrorResponse> => {
      try {
        return await clearChat(this.client);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    updateTitle: async ({
      title,
    }: {
      title: string;
    }): Promise<UpdateTitleResponse | ErrorResponse> => {
      try {
        return await updateTitle(this.client, title);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
  };

  public translate = {
    translateText: async ({
      text,
      targetLanguage,
      sourceLanguage,
    }: {
      text: string;
      targetLanguage: Languages;
      sourceLanguage?: Languages;
    }): Promise<TranslationResponseMapped | ErrorResponse> => {
      try {
        return await translate(
          text,
          this.client,
          targetLanguage,
          sourceLanguage
        );
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
    getHistory: async (): Promise<
      TranslationHistoryResponse | ErrorResponse
    > => {
      try {
        const result = await getTranslationHistory(this.client);
        return result;
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
  };

  public tts = {
    synthesize: async ({
      text,
      language,
      speaker_name,
    }: {
      text: string;
      language: Languages;
      speaker_name?: string;
    }): Promise<TTSResponse | ErrorResponse> => {
      try {
        return await tts(text, language, speaker_name, this.client);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    streamResponse: (
      request: TTSStreamRequest
    ): Readable & { cancel: () => void } => {
      const stream = new Readable({ read() {} }) as Readable & {
        cancel: () => void;
      };
      let cancelFn: () => void = () => {};

      const startStream = async () => {
        try {
          const cancel = await ttsStream(
            request,
            this.client,
            (chunk: Buffer) => stream.push(chunk),
            (err: any) => stream.emit("error", err),
            () => stream.push(null)
          );

          cancelFn = cancel;
          stream.cancel = () => {
            cancel();
            stream.push(null);
            stream.emit("close");
          };
        } catch (err: unknown) {
          stream.emit("error", err);
          stream.push(null);
        }
      };

      startStream();

      const originalDestroy = stream.destroy.bind(stream);
      stream.destroy = function (this: typeof stream, error?: Error) {
        cancelFn();
        originalDestroy.call(this, error);
        return this;
      };

      return stream;
    },

    getSpeakers: async ({
      language,
    }: {
      language?: Languages;
    }): Promise<SpeakersResponse | { success: false; message: string }> => {
      try {
        return await getSpeakers(this.client, language);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
    getHistory: async (
      options?: GetTTSHistoryOptions
    ): Promise<TTSHistoryResponse | { success: false; message: string }> => {
      try {
        return await getTTSHistory(this.client, options);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
    getAnalytics: async (
      options?: GetTTSAnalyticsOptions
    ): Promise<TTSAnalyticsResponse | { success: false; message: string }> => {
      try {
        return await getTTSAnalytics(this.client, options);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    getRecord: async ({
      recordId,
    }: {
      recordId: number;
    }): Promise<GetTTSRecordResponse | { success: false; message: string }> => {
      try {
        return await getTTSRecord(this.client, recordId);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },

    deleteRecord: async ({
      recordId,
    }: {
      recordId: number;
    }): Promise<
      DeleteTTSRecordResponse | { success: false; message: string }
    > => {
      try {
        return await deleteTTSRecord(this.client, recordId);
      } catch (error: unknown) {
        return this.handleError(error);
      }
    },
  };

  private handleError(error: unknown): ErrorResponse {
    if (error instanceof HasabError) {
      return { success: false, message: `[${error.code}] ${error.message}` };
    }
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, message };
  }
}
