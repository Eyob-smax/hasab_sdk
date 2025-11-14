import { LanguageEnum } from "../common/languageEnum.js";

type ChatResponse =
  | {
      success: boolean;
      message: {
        role: "assistant" | "user" | "system";
        content: string;
      };
      usage: any;
    }
  | { success: false; message: string; error?: string };

type ChatMessage = {
  role: string;
  content: string;
  created_at: Date;
};

type ChatHistoryResponse =
  | {
      success: boolean;
      history: {
        id: 1;
        title: string;
        created_at: Date;
        messages: ChatMessage[];
      }[];
    }
  | {
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

type TranscriptionResponse =
  | {
      success: true;
      text: string;
      metadata: {
        tokens_charged: number;
        remaining_tokens: number;
        charge_message: string;
      };
    }
  | {
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

// interface TranslationDataItem {
//   id: number;
//   user_id: string;
//   device_id: string | null;
//   filename: string;
//   original_filename: string;
//   mime_type: string;
//   duration_in_seconds: string;
//   file_size: string;
//   path: string;
//   subtitle_path: string;
//   description: string;
//   transcription: string;
//   translation: string;
//   summary: string;
//   audio_type: string;
//   is_meeting: string;
//   created_at: string;
//   updated_at: string;
//   tokens_used: string;
//   user: {
//     id: number;
//     name: string;
//     email: string;
//   };
// }

type TranslationResponseOriginal = {
  status: string;
  data: {
    translation: {
      id: number;
      source_text: string;
      translated_text: string;
      source_language: LanguageEnum;
      target_language: LanguageEnum;
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
      source_language: LanguageEnum;
      target_language: LanguageEnum;
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
  source_language: string;
  target_language: string;
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

export type {
  ChatResponse,
  TranscriptionResponse,
  TranslationResponseMapped,
  TranslationResponseOriginal,
  TTSResponse,
  TranscriptionResponseFull,
  ChatHistoryResponse,
  ChatTitle,
  ClearChat,
  UpcateChatTitle,
  TranslationHistory,
  TranslationHistoryResponse,
  SpeakersResponse,
};
