import type { ChatHistoryResponse, ChatResponse, ChatTitle, TranscriptionResponse } from "./types/response.js";
import { ChatOptionsConfig } from "./common/types.js";
import { Readable } from "stream";
export declare class HasabClient {
    private apikey;
    private client;
    constructor(apikey: string);
    private initializeInterceptors;
    transcribe(file: File | Blob | string): Promise<TranscriptionResponse>;
    chat: {
        sendMessage: (message: string, options?: ChatOptionsConfig) => Promise<ChatResponse>;
        streamResponse: (message: string, options?: ChatOptionsConfig) => Readable & {
            cancel: () => void;
        };
        getChatHistory: () => Promise<ChatHistoryResponse>;
        getChatTitle: () => Promise<ChatTitle | {
            success: boolean;
            message: string;
        }>;
        clearChat: () => Promise<{
            success: boolean;
            message: string;
        }>;
        updateTitle: (title: string) => Promise<import("./chat/updateTitle.js").UpdateTitleResponse>;
    };
}
//# sourceMappingURL=client.d.ts.map