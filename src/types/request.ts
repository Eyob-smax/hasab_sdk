type TranscriptionRequest = {
  audio_file: File | Blob | string;
};

type ChatRequest = {};

type ChatSendMessage = {
  message: string;
  model?: string;
};
export type { TranscriptionRequest, ChatRequest, ChatSendMessage };
