type ChatResponse = {
    success: boolean;
    message: {
        role: "assistant" | "user" | "system";
        content: string;
    };
    usage: any;
} | {
    success: false;
    message: string;
    error?: string;
};
type ChatMessage = {
    role: string;
    content: string;
    created_at: Date;
};
type ChatHistoryResponse = {
    success: boolean;
    history: {
        id: 1;
        title: string;
        created_at: Date;
        messages: ChatMessage[];
    }[];
} | {
    success: boolean;
    message: string;
};
type ChatTitle = {
    success: true;
    title: string;
};
type ClearChat = {
    success: true;
    message: string;
};
type UpcateChatTitle = {
    success: false;
    message: string;
};
type TranscriptionResponse = {
    success: true;
    text: string;
    metadata: {
        tokens_charged: number;
        remaining_tokens: number;
        charge_message: string;
    };
} | {
    success: false;
    message: string;
};
type TranscriptionResponseFull = {
    success: boolean;
    message: string;
    audio: {
        id: number;
        user_id: number;
        filename: string;
        original_filename: string;
        path: string;
        mime_type: string;
        file_size: string;
        duration_in_seconds: number;
        description: string;
        is_meeting: boolean;
        summary: string;
        transcription: string;
        translation: string;
        created_at: string;
        updated_at: string;
    };
    transcription: string;
    summary: string;
    translation: string;
    metadata: {
        tokens_charged: number;
        remaining_tokens: number;
        charge_message: string;
    };
    charge_message: string;
    remaining_tokens: number;
    tokens_charged: number;
    timestamp: any[];
};
type TranscriptionJobUser = {
    id: number;
    name: string;
    email: string;
};
type TranscriptionJob = {
    id: number;
    user_id: string;
    device_id: number | null;
    filename: string;
    original_filename: string;
    mime_type: string;
    duration_in_seconds: string;
    file_size: string;
    path: string;
    subtitle_path: string | null;
    description: string | null;
    transcription: string;
    translation: string;
    summary: string;
    audio_type: string;
    is_meeting: string;
    created_at: string;
    updated_at: string;
    tokens_used: string;
    user: TranscriptionJobUser;
};
type TranscriptionHistoryData = {
    current_page: number;
    data: TranscriptionJob[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};
type TranscriptionHistoryResponse = {
    status: "success" | "error";
    data: TranscriptionHistoryData;
    message?: string;
};
type TranslationResponseOriginal = {
    status: string;
    data: {
        translation: {
            id: number;
            source_text: string;
            translated_text: string;
            source_language: Languages;
            target_language: Languages;
            character_count: number;
            created_at: string;
        };
    };
    message: string;
    code: number;
    request_id: string;
};
type TranslationResponseMapped = {
    success: boolean;
    translatedText: string;
    metadata: {
        message: string;
        code: number;
        requestId: string;
        translation: {
            id: number;
            source_text: string;
            translated_text: string;
            source_language: Languages;
            target_language: Languages;
            character_count: number;
            created_at: string;
        };
    };
};
type TranslationHistoryItem = {
    id: number;
    user_id: string;
    device_id: null | string;
    source_text: string;
    source_language: Languages;
    target_language: Languages;
    translated_text: string;
    success: string;
    error_message: string | null;
    character_count: string;
    created_at: string;
    updated_at: string;
};
type TranslationHistoryLinks = {
    url: string | null;
    label: string;
    active: boolean;
};
type LanguageBreakdown = {
    [language: string]: number;
};
type DailyUsage = {
    date: string;
    requests: number;
    tokens_used: number;
};
type TTSAnalyticsResponse = {
    success: boolean;
    overview: {
        total_requests: number;
        successful_requests: number;
        failed_requests: number;
        total_tokens_used: number;
        avg_tokens_per_request: number;
    };
    language_breakdown: LanguageBreakdown;
    daily_usage: DailyUsage[];
};
type Languages = "amh" | "orm" | "tir" | "eng" | "auto";
import { AxiosInstance } from "axios";
import { HasabError } from "../common/errors.js";
export interface ChatStreamOptions {
    message: string;
    model?: string;
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
type TTSHistoryRecord = {
    success: boolean;
    recors: {
        id: number;
        text: string;
        language: Languages;
        speaker_name: string;
        status: "success" | "failed";
        audio_url?: string;
        tokens_used: number;
        created_at: string;
        tts_type?: "regular" | "reference";
        device_id?: number;
    };
};
type TTSRecord = {
    id: number;
    text: string;
    language: string;
    speaker_name: string;
    status: "success" | "failed";
    audio_url?: string;
    tokens_used: number;
    created_at: string;
    tts_type?: "regular" | "reference";
    device_id?: number;
};
type GetTTSRecordResponse = {
    success: boolean;
    record: TTSRecord;
    message?: string;
};
type TTSHistoryResponse = {
    success: boolean;
    records: TTSHistoryRecord[];
    total: number;
    limit: number;
    offset: number;
    message?: string;
};
type TranslationHistory = {
    status: "success";
    data: {
        translations: {
            current_page: 1;
            data: TranslationHistoryItem[];
            first_page_url: string;
            from: 1;
            last_page: 1;
            last_page_url: string;
            links: TranslationHistoryLinks[];
            next_page_url: null | string;
            path: string;
            per_page: number;
            prev_page_url: null | string;
            to: number;
            total: number;
        };
    };
    message: "Translation history retrieved successfully";
    code: 200;
};
type TTSResponse = {
    success: boolean;
    audio_buffer: ArrayBuffer | Uint8Array | string;
};
type DeleteTTSRecordResponse = {
    success: boolean;
    message?: string;
};
type TranslationHistoryResponse = {
    success: boolean;
    history: TranslationHistory;
};
type SpeakersResponse = {
    success: boolean;
    languages: Record<string, string[]>;
    total_speakers: number;
    message?: string;
};
type TTSStreamStartResponse = {
    success: boolean;
    session_id: string;
    status: "started" | "failed";
    message?: string;
};
type TranscriptionRequest = {
    audio_file: Buffer | Uint8Array | ArrayBuffer | string | File | Blob;
};
type ChatRequest = {};
type ChatSendMessage = {
    message: string;
    model?: string;
};
export type { TranscriptionRequest, ChatRequest, ChatSendMessage, ChatResponse, TranscriptionResponse, TranslationResponseMapped, TranslationResponseOriginal, TTSResponse, TranscriptionResponseFull, ChatHistoryResponse, ChatTitle, ClearChat, UpcateChatTitle, TranslationHistory, TranslationHistoryResponse, SpeakersResponse, TTSHistoryResponse, TTSHistoryRecord, TTSAnalyticsResponse, DailyUsage, GetTTSRecordResponse, DeleteTTSRecordResponse, TTSStreamStartResponse, TranscriptionHistoryResponse, Languages, };
//# sourceMappingURL=index.d.ts.map