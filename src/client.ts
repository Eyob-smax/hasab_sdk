import axios, { AxiosInstance, AxiosError } from "axios";
import { transcribe } from "./transcription/transcription.js";
import type {
  ChatHistoryResponse,
  ChatResponse,
  ChatTitle,
  TranscriptionResponse,
} from "./types/response.js";
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
import { updateTitle } from "./chat/updateTitle.js";

export class HasabClient {
  private apikey: string;
  private client: AxiosInstance;

  constructor(apikey: string) {
    if (!apikey) throw new HasabAuthError("API key is required.");
    this.apikey = apikey;

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${apikey}` },
      timeout: 50000,
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
              console.error("Endpoint not found:", error.response.data);

              throw new HasabApiError(
                "Server error. Please retry later.",
                status
              );
            default:
              console.error("Endpoint not found:", error.response.data);

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
    sendMessage: async (
      message: string,
      options?: ChatOptionsConfig
    ): Promise<ChatResponse> => {
      try {
        const result = await chat(message, this.client, options);
        return result;
      } catch (error: any) {
        console.error("Chat error:", error);
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
    streamResponse: (
      message: string,
      options?: ChatOptionsConfig
    ): Readable & { cancel: () => void } => {
      const stream = new Readable({
        read() {},
      }) as Readable & { cancel: () => void };

      let cancelFn: () => void = () => {};

      const startStream = async () => {
        try {
          const { model, maxTokens, tools, temperature, timeout } =
            options || {};

          const cancel = await chatStream(
            message,
            this.client,
            (chunk: string) => {
              console.log("Received chunk:", chunk);
              stream.push(chunk);
            },
            (err: any) => {
              stream.emit("error", err);
            },
            () => {
              stream.push(null);
            },
            { model, maxTokens, tools, temperature, timeout }
          );

          cancelFn = cancel;

          stream.cancel = () => {
            cancel();
            stream.push(null);
            stream.emit("close");
          };
        } catch (err: any) {
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
    getChatHistory: async (): Promise<ChatHistoryResponse> => {
      try {
        const result = await getChatHistory(this.apikey, this.client);
        return result;
      } catch (err) {
        return {
          success: false,
          message: (err as Error).message,
        };
      }
    },

    getChatTitle: async (): Promise<
      ChatTitle | { success: boolean; message: string }
    > => {
      try {
        const result = await getChatTitle(this.client);
        return result;
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message,
        };
      }
    },
    clearChat: async () => {
      try {
        const result = await clearChat(this.client);
        return result;
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message,
        };
      }
    },
    updateTitle: async (title: string) => {
      try {
        const result = await updateTitle(this.client, title);
        return result;
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message,
        };
      }
    },
  };
}

const hasab = new HasabClient("HASAB_KEY_o64D9FHJz9f9TQ6by0828gfrrwOK5S");

// hasab.chat
//   .streamResponse("Hello, can you tell me a joke?")
//   .on("data", (chunk) => {
//     console.log(chunk);
//     process.stdout.write(chunk);
//   })
//   .on("error", (err) => {
//     console.error("Stream error:", err);
//   })
//   .on("end", () => {
//     console.log("\nStream ended.");
//   });

const chatHistory = await hasab.chat.getChatHistory();
