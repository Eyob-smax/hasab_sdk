import { Readable } from "stream";
import {
  HasabApiError,
  HasabNetworkError,
  HasabUnknownError,
  HasabValidationError,
} from "../common/errors.js";
import axios, { AxiosInstance, AxiosError } from "axios";

export interface TTSStreamRequest {
  text: string;
  language: string;
  speaker_name: string;
  sample_rate?: number;
}

export async function ttsStream(
  request: TTSStreamRequest,
  client: AxiosInstance,
  onData: (chunk: Buffer) => void,
  onError: (err: any) => void,
  onComplete: () => void
): Promise<() => void> {
  let cancelled = false;

  const { text, language, speaker_name, sample_rate } = request;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    onError(
      new HasabValidationError("Text is required and must not be empty.")
    );
    return () => {};
  }
  if (!language || typeof language !== "string") {
    onError(new HasabValidationError("Language is required."));
    return () => {};
  }
  if (!speaker_name || typeof speaker_name !== "string") {
    onError(new HasabValidationError("Speaker name is required."));
    return () => {};
  }

  const abortController = new AbortController();
  let stream: Readable | null = null;

  try {
    const payload = {
      text: text.trim(),
      language,
      speaker_name,
      sample_rate,
    };

    const response = await client.post("/tts/stream", payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      responseType: "stream",
      signal: abortController.signal,
    });

    stream = response.data as Readable;
  } catch (err: unknown) {
    if (cancelled) return () => {};

    let error: HasabApiError | HasabNetworkError;
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      error = new HasabApiError(
        "Failed to start TTS stream",
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
            decodeErr instanceof Error ? decodeErr.message : "Unknown"
          }`
        )
      );
      return true;
    }

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (!part.trim()) continue;

      const lines = part.split("\n");
      let event = "chunk";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          data = line.slice(5).trim();
        }
      }

      if (!data) continue;

      if (event === "chunk") {
        try {
          const binary = Buffer.from(data, "base64");
          onData(binary);
        } catch (e) {
          onError(new HasabApiError("Invalid base64 audio chunk", 500));
        }
      } else if (event === "done") {
        return true;
      } else if (event === "error") {
        onError(new HasabApiError(data || "Stream error", 500));
        return true;
      }
    }

    return false;
  };

  const onDataHandler = (chunk: Buffer) => {
    try {
      const shouldStop = processChunk(chunk);
      if (shouldStop) {
        cleanup();
        if (!cancelled) onComplete();
      }
    } catch (err: unknown) {
      onError(
        err instanceof Error ? err : new HasabUnknownError("Handler error")
      );
      cleanup();
    }
  };

  const onEndHandler = () => {
    try {
      if (buffer) processChunk(new Uint8Array());
      if (!cancelled) onComplete();
    } catch (err: unknown) {
      onError(
        err instanceof Error ? err : new HasabUnknownError("End handler error")
      );
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

  return () => {
    if (cancelled) return;
    cancelled = true;
    abortController.abort();
    if (stream) stream.destroy();
    cleanup();
  };
}
