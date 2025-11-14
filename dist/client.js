import axios from "axios";
import { transcribe } from "./transcription/transcription.js";
import { HasabError, HasabApiError, HasabNetworkError, HasabValidationError, HasabAuthError, HasabRateLimitError, HasabTimeoutError, HasabUnknownError, } from "./common/errors.js";
import { BASE_URL } from "./common/constants.js";
import { chat } from "./chat/chat.js";
import { chatStream } from "./chat/chatStream.js";
import { Readable } from "stream";
import { getChatHistory } from "./chat/chatHistory.js";
import { getChatTitle } from "./chat/getChatTitle.js";
import { clearChat } from "./chat/clearChat.js";
import { updateTitle } from "./chat/updateTitle.js";
import { translate } from "./translation/translation.js";
import { getTranslationHistory } from "./translation/translationHistory.js";
import { tts } from "./TTS/textToSpeech.js";
import { getSpeakers } from "./TTS/getSpeakers.js";
import { getTTSHistory } from "./TTS/getHistory.js";
import { getTTSAnalytics } from "./TTS/getAnalytics.js";
import { getTTSRecord } from "./TTS/getRecord.js";
import { deleteTTSRecord } from "./TTS/deletRecord.js";
import { ttsStream } from "./TTS/textToSpeechStream.js";
import { getTranscriptionHistory, } from "./transcription/getHistory.js";
export class HasabClient {
    constructor(apikey) {
        this.transcription = {
            transcribe: async (file) => {
                try {
                    const result = await transcribe({ audio_file: file }, this.client);
                    return result;
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            getHistory: async (options) => {
                try {
                    const result = await getTranscriptionHistory(this.apikey, this.client, options);
                    return result;
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
        };
        this.chat = {
            sendMessage: async (message, options) => {
                try {
                    const result = await chat(message, this.client, options);
                    return result;
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            streamResponse: (message, options) => {
                const stream = new Readable({ read() { } });
                let cancelFn = () => { };
                const startStream = async () => {
                    try {
                        const { model, maxTokens, tools, temperature, timeout } = options || {};
                        const cancel = await chatStream(message, this.client, (chunk) => stream.push(chunk), (err) => stream.emit("error", err), () => stream.push(null), { model, maxTokens, tools, temperature, timeout });
                        cancelFn = cancel;
                        stream.cancel = () => {
                            cancel();
                            stream.push(null);
                            stream.emit("close");
                        };
                    }
                    catch (err) {
                        stream.emit("error", err);
                        stream.push(null);
                    }
                };
                startStream();
                const originalDestroy = stream.destroy.bind(stream);
                stream.destroy = function (error) {
                    cancelFn();
                    originalDestroy.call(this, error);
                    return this;
                };
                return stream;
            },
            getChatHistory: async () => {
                try {
                    return await getChatHistory(this.client);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            getChatTitle: async () => {
                try {
                    return await getChatTitle(this.client);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            clearChat: async () => {
                try {
                    return await clearChat(this.client);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            updateTitle: async (title) => {
                try {
                    return await updateTitle(this.client, title);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
        };
        this.translate = {
            translateText: async (text, targetLanguage, sourceLanguage) => {
                try {
                    return await translate(text, this.client, targetLanguage, sourceLanguage);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            getHistory: async () => {
                try {
                    const result = await getTranslationHistory(this.client);
                    return result;
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
        };
        this.tts = {
            synthesize: async (text, language, speaker_name) => {
                try {
                    return await tts(text, language, speaker_name, this.client);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            streamResponse: (request) => {
                const stream = new Readable({ read() { } });
                let cancelFn = () => { };
                const startStream = async () => {
                    try {
                        const cancel = await ttsStream(request, this.client, (chunk) => stream.push(chunk), (err) => stream.emit("error", err), () => stream.push(null));
                        cancelFn = cancel;
                        stream.cancel = () => {
                            cancel();
                            stream.push(null);
                            stream.emit("close");
                        };
                    }
                    catch (err) {
                        stream.emit("error", err);
                        stream.push(null);
                    }
                };
                startStream();
                const originalDestroy = stream.destroy.bind(stream);
                stream.destroy = function (error) {
                    cancelFn();
                    originalDestroy.call(this, error);
                    return this;
                };
                return stream;
            },
            getSpeakers: async (language) => {
                try {
                    return await getSpeakers(this.client, language);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            getHistory: async (options) => {
                try {
                    return await getTTSHistory(this.client, options);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            getAnalytics: async (options) => {
                try {
                    return await getTTSAnalytics(this.client, options);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            getRecord: async (recordId) => {
                try {
                    return await getTTSRecord(this.client, recordId);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
            deleteRecord: async (recordId) => {
                try {
                    return await deleteTTSRecord(this.client, recordId);
                }
                catch (error) {
                    return this.handleError(error);
                }
            },
        };
        if (!apikey || typeof apikey !== "string") {
            throw new HasabAuthError("API key is required and must be a string.");
        }
        this.apikey = apikey;
        this.client = axios.create({
            baseURL: BASE_URL,
            headers: { Authorization: `Bearer ${apikey}` },
            timeout: 60000,
        });
        this.initializeInterceptors();
    }
    initializeInterceptors() {
        this.client.interceptors.request.use((config) => {
            config.headers.Authorization = `Bearer ${this.apikey}`;
            return config;
        }, (error) => Promise.reject(new HasabValidationError(error.message)));
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                switch (status) {
                    case 400:
                        throw new HasabValidationError(data?.error || "Bad request");
                    case 401:
                    case 403:
                        throw new HasabAuthError(data?.error || "Unauthorized or invalid API key.");
                    case 404:
                        throw new HasabApiError(data?.error || "Endpoint not found", 404);
                    case 408:
                        throw new HasabTimeoutError("Request timed out.");
                    case 429:
                        throw new HasabRateLimitError(data?.error || "Rate limit exceeded. Try again later.", Number(error.response.headers["retry-after"]) || undefined);
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new HasabApiError(data?.error || "Server error. Please retry later.", status);
                    default:
                        console.log("Unhandled error response:", data);
                        throw new HasabApiError(data?.error || "API Error", status);
                }
            }
            else if (error.request) {
                throw new HasabNetworkError("No response received. Check your connection.");
            }
            else if (error.code === "ECONNABORTED") {
                throw new HasabTimeoutError("Request timeout exceeded.");
            }
            else {
                throw new HasabUnknownError(error.message);
            }
        });
    }
    handleError(error) {
        if (error instanceof HasabError) {
            return { success: false, message: `[${error.code}] ${error.message}` };
        }
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, message };
    }
}
//# sourceMappingURL=client.js.map