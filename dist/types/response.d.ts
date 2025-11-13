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
interface TranslationDataItem {
    id: number;
    user_id: string;
    device_id: string | null;
    filename: string;
    original_filename: string;
    mime_type: string;
    duration_in_seconds: string;
    file_size: string;
    path: string;
    subtitle_path: string;
    description: string;
    transcription: string;
    translation: string;
    summary: string;
    audio_type: string;
    is_meeting: string;
    created_at: string;
    updated_at: string;
    tokens_used: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}
type TranslationResponse = {
    status: string;
    data: {
        current_page: number;
        data: Array<TranslationDataItem[]>;
        first_page_url: string;
        from: number;
        last_page: number;
        last_page_url: string;
        links: [
            {
                url: null;
                label: "&laquo; Previous";
                active: false;
            }
        ];
        next_page_url: string;
        path: string;
        per_page: number;
        prev_page_url: null;
        to: number;
        total: number;
    };
};
type TTSResponse = {
    languages: {
        [key: string]: string[];
    };
    total_speakers: number;
};
export type { ChatResponse, TranscriptionResponse, TranslationResponse, TTSResponse, TranscriptionResponseFull, ChatHistoryResponse, ChatTitle, ClearChat, UpcateChatTitle, };
//# sourceMappingURL=response.d.ts.map