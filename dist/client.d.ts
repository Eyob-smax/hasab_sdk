import type { ChatHistoryResponse, ChatOptionsConfig, ChatResponse, ChatTitle, ClearChat, DeleteTTSRecordResponse, GetTTSRecordResponse, Languages, SpeakersResponse, TranscriptionHistoryResponse, TranscriptionResponseFull, TranslationHistoryResponse, TranslationResponseMapped, TTSAnalyticsResponse, TTSHistoryResponse, TTSResponse } from "./types/index.js";
import { Readable } from "stream";
import { UpdateTitleResponse } from "./chat/updateTitle.js";
import { GetTTSHistoryOptions } from "./TTS/getHistory.js";
import { GetTTSAnalyticsOptions } from "./TTS/getAnalytics.js";
import { TTSStreamRequest } from "./TTS/textToSpeechStream.js";
import { GetTranscriptionHistoryOptions } from "./transcription/getHistory.js";
type ErrorResponse = {
    success: false;
    message: string;
};
export declare class HasabClient {
    private apikey;
    private client;
    constructor({ apikey }: {
        apikey: string;
    });
    private initializeInterceptors;
    transcription: {
        transcribe: ({ file, }: {
            file: Buffer | Uint8Array | ArrayBuffer | string | File | Blob;
        }) => Promise<TranscriptionResponseFull | ErrorResponse>;
        getHistory: (options?: GetTranscriptionHistoryOptions) => Promise<TranscriptionHistoryResponse | {
            success: false;
            message: string;
        }>;
    };
    chat: {
        sendMessage: ({ message }: {
            message: string;
        }, options?: ChatOptionsConfig) => Promise<ChatResponse | ErrorResponse>;
        streamResponse: ({ message }: {
            message: string;
        }, options?: ChatOptionsConfig) => Readable & {
            cancel: () => void;
        };
        getChatHistory: () => Promise<ChatHistoryResponse | ErrorResponse>;
        getChatTitle: () => Promise<ChatTitle | ErrorResponse>;
        clearChat: () => Promise<ClearChat | ErrorResponse>;
        updateTitle: ({ title, }: {
            title: string;
        }) => Promise<UpdateTitleResponse | ErrorResponse>;
    };
    translate: {
        translateText: ({ text, targetLanguage, sourceLanguage, }: {
            text: string;
            targetLanguage: Languages;
            sourceLanguage?: Languages;
        }) => Promise<TranslationResponseMapped | ErrorResponse>;
        getHistory: () => Promise<TranslationHistoryResponse | ErrorResponse>;
    };
    tts: {
        synthesize: ({ text, language, speaker_name, }: {
            text: string;
            language: Languages;
            speaker_name?: string;
        }) => Promise<TTSResponse | ErrorResponse>;
        streamResponse: (request: TTSStreamRequest) => Readable & {
            cancel: () => void;
        };
        getSpeakers: ({ language, }: {
            language?: Languages;
        }) => Promise<SpeakersResponse | {
            success: false;
            message: string;
        }>;
        getHistory: (options?: GetTTSHistoryOptions) => Promise<TTSHistoryResponse | {
            success: false;
            message: string;
        }>;
        getAnalytics: (options?: GetTTSAnalyticsOptions) => Promise<TTSAnalyticsResponse | {
            success: false;
            message: string;
        }>;
        getRecord: ({ recordId, }: {
            recordId: number;
        }) => Promise<GetTTSRecordResponse | {
            success: false;
            message: string;
        }>;
        deleteRecord: ({ recordId, }: {
            recordId: number;
        }) => Promise<DeleteTTSRecordResponse | {
            success: false;
            message: string;
        }>;
    };
    private handleError;
}
export {};
//# sourceMappingURL=client.d.ts.map