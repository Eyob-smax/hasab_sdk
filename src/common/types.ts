import { AxiosInstance } from "axios";
import { HasabError } from "./errors";

export interface ChatStreamOptions {
  message: string;
  model?: string;
  apikey: string;
  client: AxiosInstance;
  onData: StreamCallback;
  onError?: (err: HasabError) => void;
  onComplete?: () => void;
}

export type ChatOptionsConfig = {
  maxTokens?: number;
  tools?: any | null;
  model?: string;
  temperature?: number;
  timeout?: number;
};

export type StreamCallback = (chunk: string) => void;
