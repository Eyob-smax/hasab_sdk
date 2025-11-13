import { Readable } from "stream";
import {
  HasabApiError,
  HasabNetworkError,
  HasabUnknownError,
} from "../common/errors";
import { ChatOptionsConfig } from "../common/types";
import axios, { AxiosInstance, AxiosError } from "axios";

export async function chatStream(
  message: string,
  client: AxiosInstance,
  onData: (chunk: string) => void,
  onError: (err: any) => void,
  onComplete: () => void,
  options?: ChatOptionsConfig & { timeout?: number }
): Promise<() => void> {
  let cancelled = false;

  const {
    model = "hasab-1-lite",
    maxTokens = 1024,
    tools,
    temperature = 0.7,
    timeout = 60000,
  } = options || {};

  const abortController = new AbortController();
  let stream: Readable | null = null;

  try {
    const payload = {
      model,
      message,
      stream: true,
      maxTokens,
      tools: tools ?? [],
      temperature,
    };

    const response = await client.post("/chat", payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      responseType: "stream",
      signal: abortController.signal,
      timeout,
    });

    stream = response.data as Readable;
  } catch (err: unknown) {
    if (cancelled) return () => {};

    let error: HasabApiError | HasabNetworkError;
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      error = new HasabApiError(
        "Failed to start chat stream",
        axiosErr.response?.status ?? 500,
        axiosErr.response?.data
      );
    } else {
      error = new HasabNetworkError(
        err instanceof Error ? err.message : "Unknown network error"
      );
    }

    onError(error);
    return () => {};
  }

  // === 2. Stream Processing ===
  const decoder = new TextDecoder();
  let buffer = "";

  const processChunk = (raw: Uint8Array): boolean => {
    if (cancelled) return false;

    try {
      buffer += decoder.decode(raw, { stream: true });
    } catch (decodeErr) {
      onError(
        new HasabNetworkError(
          `Decode error: ${
            decodeErr instanceof Error
              ? decodeErr.message
              : "Unknown decode issue"
          }`
        )
      );
      return true; // Stop on decode failure
    }

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // Last line might be incomplete

    for (const line of lines) {
      if (!line.trim()) continue;

      if (!line.startsWith("data: ")) {
        onError(
          new HasabApiError(
            `Invalid line format: ${line.substring(0, 50)}...`,
            500
          )
        );
        continue;
      }

      const jsonStr = line.slice(6).trim();

      // End of stream
      if (jsonStr === "[DONE]") {
        return true; // Signal to stop
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.content;

        if (typeof content === "string" && content.length > 0) {
          onData(content);
        } else if (content != null) {
          onError(
            new HasabApiError(
              `Unexpected content type: ${typeof content}`,
              500,
              { parsed }
            )
          );
        }
      } catch (parseErr) {
        // Don't crash the stream — emit error and continue
        const parseError = new HasabApiError(
          `Invalid JSON in stream: ${
            parseErr instanceof Error ? parseErr.message : "Parse error"
          }`,
          500,
          { raw: jsonStr }
        );
        onError(parseError);
        // Continue processing other lines
      }
    }

    return false; // Continue streaming
  };

  // === 3. Event Listeners ===
  const onDataHandler = (chunk: Buffer) => {
    try {
      const shouldStop = processChunk(chunk);
      if (shouldStop) {
        cleanup();
        if (!cancelled) {
          onComplete();
        }
      }
    } catch (err: unknown) {
      const handlerError =
        err instanceof Error
          ? err
          : new HasabUnknownError("Unknown error in data handler");
      onError(handlerError);
      cleanup();
    }
  };

  const onEndHandler = () => {
    try {
      if (buffer) {
        processChunk(new Uint8Array()); // Flush remaining
      }
      if (!cancelled) {
        onComplete();
      }
    } catch (err: unknown) {
      const handlerError =
        err instanceof Error
          ? err
          : new HasabUnknownError("Unknown error in end handler");
      onError(handlerError);
    } finally {
      cleanup();
    }
  };

  const onErrorHandler = (err: Error) => {
    if (!cancelled) {
      onError(new HasabNetworkError(err.message || "Stream error"));
    }
    cleanup();
  };

  const cleanup = () => {
    if (stream) {
      stream.off("data", onDataHandler);
      stream.off("end", onEndHandler);
      stream.off("error", onErrorHandler);
    }
  };

  stream.on("data", onDataHandler);
  stream.on("end", onEndHandler);
  stream.on("error", onErrorHandler);

  // === 4. Return Cancel Function ===
  return () => {
    if (cancelled) return;
    cancelled = true;
    abortController.abort();
    if (stream) {
      stream.destroy();
    }
    cleanup();
  };
}
