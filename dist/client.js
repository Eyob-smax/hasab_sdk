"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasabClient = void 0;
const axios_1 = __importDefault(require("axios"));
const transcription_js_1 = require("./transcription/transcription.js");
const errors_1 = require("./common/errors");
const constants_1 = require("./common/constants");
const chat_js_1 = require("./chat/chat.js");
class HasabClient {
    constructor(apikey) {
        this.chat = {
            sendMessage: async ({ message, model = "hasab-1-lite", stream = false, }) => {
                try {
                    const result = await (0, chat_js_1.chat)(message, model, stream, this.client, this.apikey);
                    return;
                }
                catch (error) {
                    if (error instanceof errors_1.HasabError) {
                        return {
                            success: false,
                            message: `[${error.code}] ${error.message}`,
                        };
                    }
                    return {
                        success: false,
                        message: "Unexpected error: " + (error?.message || "Unknown issue"),
                    };
                }
            },
        };
        if (!apikey)
            throw new errors_1.HasabAuthError("API key is required.");
        this.apikey = apikey;
        this.client = axios_1.default.create({
            baseURL: constants_1.BASE_URL,
            headers: { Authorization: `Bearer ${apikey}` },
            timeout: 30000,
        });
        this.initializeInterceptors();
    }
    initializeInterceptors() {
        this.client.interceptors.request.use((config) => {
            config.headers.Authorization = `Bearer ${this.apikey}`;
            return config;
        }, (error) => Promise.reject(new errors_1.HasabValidationError(error.message)));
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                const status = error.response.status;
                switch (status) {
                    case 400:
                        throw new errors_1.HasabValidationError(error.response.data?.message || "Bad request");
                    case 401:
                    case 403:
                        throw new errors_1.HasabAuthError("Unauthorized or invalid API key.");
                    case 404:
                        throw new errors_1.HasabApiError("Endpoint not found", 404);
                    case 408:
                        throw new errors_1.HasabTimeoutError("Request timed out.");
                    case 429:
                        throw new errors_1.HasabRateLimitError("Rate limit exceeded. Try again later.", Number(error.response.headers["retry-after"]) || undefined);
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new errors_1.HasabApiError("Server error. Please retry later.", status);
                    default:
                        throw new errors_1.HasabApiError(error.response.data?.message || "API Error", status);
                }
            }
            else if (error.request) {
                throw new errors_1.HasabNetworkError("No response received. Check your connection.");
            }
            else if (error.code === "ECONNABORTED") {
                throw new errors_1.HasabTimeoutError("Request timeout exceeded.");
            }
            else {
                throw new errors_1.HasabUnknownError(error.message);
            }
        });
    }
    async transcribe(file) {
        try {
            const result = await (0, transcription_js_1.transcribe)({ audio_file: file }, this.apikey, this.client);
            return result;
        }
        catch (error) {
            if (error instanceof errors_1.HasabError) {
                return { success: false, message: `[${error.code}] ${error.message}` };
            }
            return {
                success: false,
                message: "Unexpected error: " + (error?.message || "Unknown issue"),
            };
        }
    }
}
exports.HasabClient = HasabClient;
//# sourceMappingURL=client.js.map