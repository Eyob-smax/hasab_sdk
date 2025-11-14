import type { ChatHistoryResponse, ChatResponse, ChatTitle, ClearChat, SpeakersResponse, TranscriptionResponseFull, TranslationHistoryResponse, TranslationResponseMapped, TTSResponse } from "./types/response.js";
import { ChatOptionsConfig } from "./common/types.js";
import { Readable } from "stream";
import { UpdateTitleResponse } from "./chat/updateTitle.js";
import { LanguageEnum } from "./common/languageEnum.js";
type ErrorResponse = {
    success: false;
    message: string;
};
export declare class HasabClient {
    private apikey;
    private client;
    constructor(apikey: string);
    private initializeInterceptors;
    transcribe(file: File | Blob | string): Promise<TranscriptionResponseFull | ErrorResponse>;
    chat: {
        sendMessage: (message: string, options?: ChatOptionsConfig) => Promise<ChatResponse | ErrorResponse>;
        streamResponse: (message: string, options?: ChatOptionsConfig) => Readable & {
            cancel: () => void;
        };
        getChatHistory: () => Promise<ChatHistoryResponse | ErrorResponse>;
        getChatTitle: () => Promise<ChatTitle | ErrorResponse>;
        clearChat: () => Promise<ClearChat | ErrorResponse>;
        updateTitle: (title: string) => Promise<UpdateTitleResponse | ErrorResponse>;
    };
    translate: {
        translateText: (text: string, targetLanguage: LanguageEnum, sourceLanguage?: LanguageEnum) => Promise<TranslationResponseMapped | ErrorResponse>;
        getHistory: () => Promise<TranslationHistoryResponse | ErrorResponse>;
    };
    tts: {
        synthesize: (text: string, language: LanguageEnum, speaker_name?: string) => Promise<TTSResponse | ErrorResponse>;
        getSpeakers: (language?: string) => Promise<SpeakersResponse | {
            success: false;
            message: string;
        }>;
    };
    private handleError;
}
export {};
//# sourceMappingURL=client.d.ts.map