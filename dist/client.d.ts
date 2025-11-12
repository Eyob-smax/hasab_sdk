import type { TranscriptionResponse } from "./types/response";
import { ChatSendMessage } from "./types/request.js";
export declare class HasabClient {
    private apikey;
    private client;
    constructor(apikey: string);
    private initializeInterceptors;
    transcribe(file: File | Blob | string): Promise<TranscriptionResponse>;
    chat: {
        sendMessage: ({ message, model, stream, }: ChatSendMessage) => Promise<{
            success: boolean;
            message: string;
        } | undefined>;
    };
}
//# sourceMappingURL=client.d.ts.map