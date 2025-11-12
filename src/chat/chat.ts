import axios, { AxiosInstance } from "axios";
import { Readable } from "stream";
import { HasabError, HasabApiError, HasabNetworkError } from "../common/errors";

export interface ChatSuccess {
  success: true;
  data: any;
}
export interface ChatFailure {
  success: false;
  message: string;
}
export type ChatResponse = ChatSuccess | ChatFailure;

export async function chat(
  message: string,
  model: string,
  stream: boolean,
  client: AxiosInstance,
  apikey: string
): Promise<ChatResponse> {
  try {
    const payload = { model, message, stream: false };

    const { data } = await client.post("/chat", payload, {
      headers: {
        Authorization: `Bearer ${apikey}`,
        "Content-Type": "application/json",
      },
    });

    if (!data.success) {
      return { success: false, message: data.message ?? "Chat request failed" };
    }

    return { success: true, data };
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

export type StreamCallback = (chunk: string) => void;

export interface ChatStreamOptions {
  message: string;
  model?: string;
  apikey: string;
  onData: StreamCallback;
  onError?: (err: HasabError) => void;
  onComplete?: () => void;
}

export async function chatStream({
  message,
  model = "hasab-1-lite",
  apikey,
  onData,
  onError,
  onComplete,
}: ChatStreamOptions): Promise<() => void> {
  let cancelled = false;
  const abortController = new AbortController();

  let stream: Readable;
  try {
    const payload = { model, message, stream: true };

    const response = await axios.post("/chat-stream", payload, {
      baseURL: (axios.defaults.baseURL ?? "").replace(/\/$/, ""),
      headers: {
        Authorization: `Bearer ${apikey}`,
        "Content-Type": "application/json",
      },
      responseType: "stream",
      signal: abortController.signal,
    });

    stream = response.data as Readable;
  } catch (err: any) {
    if (!cancelled) {
      const error =
        axios.isAxiosError(err) && err.response
          ? new HasabApiError(
              err.response.data?.message ?? "Stream init error",
              err.response.status,
              err.response.data
            )
          : new HasabNetworkError("Failed to start stream");
      onError?.(error);
    }
    return () => {};
  }

  const decoder = new TextDecoder();
  let buffer = "";

  const processChunk = (raw: Uint8Array) => {
    if (cancelled) return;
    buffer += decoder.decode(raw, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      if (line.startsWith("data: ")) {
        const json = line.slice(6);
        if (json === "[DONE]") {
          onComplete?.();
          return true;
        }
        try {
          const parsed = JSON.parse(json);
          if (typeof parsed.content === "string") {
            onData(parsed.content);
          }
        } catch {}
      }
    }
    return false;
  };

  stream.on("data", (chunk: Buffer) => {
    if (processChunk(chunk)) stream.destroy();
  });

  stream.on("end", () => {
    if (buffer) processChunk(new Uint8Array());
    if (!cancelled) onComplete?.();
  });

  stream.on("error", (err: any) => {
    if (!cancelled) {
      onError?.(new HasabNetworkError(err.message ?? "Stream error"));
    }
  });

  return () => {
    if (cancelled) return;
    cancelled = true;
    abortController.abort();
    stream.destroy();
  };
}
