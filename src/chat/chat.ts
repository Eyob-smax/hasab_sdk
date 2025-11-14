import axios, { AxiosInstance } from "axios";
import {
  HasabError,
  HasabApiError,
  HasabNetworkError,
  HasabValidationError,
} from "../common/errors.js";
import { ChatResponse } from "../types/response.js";
import { ChatOptionsConfig } from "../common/types.js";

export async function chat(
  message: string,
  client: AxiosInstance,
  options?: ChatOptionsConfig
): Promise<ChatResponse> {
  try {
    const {
      model = "hasab-1-lite",
      maxTokens = 1024,
      tools = [],
      temperature = 0.7,
    } = options || {};
    const payload = {
      model,
      message,
      stream: false,
      temperature,
      tools,
      max_tokens: maxTokens,
    };

    if (!message) {
      throw new HasabValidationError("Message is required");
    }

    const { data } = await client.post(`/chat`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!data) {
      throw new HasabApiError(data.message, data.status);
    }

    return {
      success: true,
      message: data.message,
      usage: data.usage,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new HasabApiError(
          error.response.data?.message ?? "Chat API error",
          error.response.status,
          error.response.data
        );
      }
      if (error.request) {
        throw new HasabNetworkError("No response from chat service");
      }
    }
    throw new HasabError(error.message ?? "Unknown chat error");
  }
}
