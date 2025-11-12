type TranscriptionRequest = {
    audio_file: File | Blob | string;
};
type ChatRequest = {};
type ChatSendMessage = {
    message: string;
    model?: string;
    stream: boolean;
};
export type { TranscriptionRequest, ChatRequest, ChatSendMessage };
//# sourceMappingURL=request.d.ts.map