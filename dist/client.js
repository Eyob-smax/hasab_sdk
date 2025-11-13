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
const chatStream_js_1 = require("./chat/chatStream.js");
const stream_1 = require("stream");
const chatHistory_js_1 = require("./chat/chatHistory.js");
const getChatTitle_js_1 = require("./chat/getChatTitle.js");
const clearChat_js_1 = require("./chat/clearChat.js");
const updateTitle_js_1 = require("./chat/updateTitle.js");
class HasabClient {
    constructor(apikey) {
        this.chat = {
            sendMessage: async (message, options) => {
                try {
                    const result = await (0, chat_js_1.chat)(message, this.client, options);
                    return result;
                }
                catch (error) {
                    console.error("Chat error:", error);
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
            streamResponse: (message, options) => {
                const stream = new stream_1.Readable({
                    read() { },
                });
                let cancelFn = () => { };
                const startStream = async () => {
                    try {
                        const { model, maxTokens, tools, temperature, timeout } = options || {};
                        const cancel = await (0, chatStream_js_1.chatStream)(message, this.client, (chunk) => {
                            console.log("Received chunk:", chunk);
                            stream.push(chunk);
                        }, (err) => {
                            stream.emit("error", err);
                        }, () => {
                            stream.push(null);
                        }, { model, maxTokens, tools, temperature, timeout });
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
                    const result = await (0, chatHistory_js_1.getChatHistory)(this.apikey, this.client);
                    return result;
                }
                catch (err) {
                    console.log(err);
                    return {
                        success: false,
                        message: err.message,
                    };
                }
            },
            getChatTitle: async () => {
                try {
                    const result = await (0, getChatTitle_js_1.getChatTitle)(this.client);
                    return result;
                }
                catch (error) {
                    return {
                        success: false,
                        message: error.message,
                    };
                }
            },
            clearChat: async () => {
                try {
                    const result = await (0, clearChat_js_1.clearChat)(this.client);
                    return result;
                }
                catch (error) {
                    return {
                        success: false,
                        message: error.message,
                    };
                }
            },
            updateTitle: async (title) => {
                try {
                    const result = await (0, updateTitle_js_1.updateTitle)(this.client, title);
                    return result;
                }
                catch (error) {
                    return {
                        success: false,
                        message: error.message,
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
            timeout: 50000,
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
                        console.error("Endpoint not found:", error.response.data);
                        throw new errors_1.HasabApiError("Server error. Please retry later.", status);
                    default:
                        console.error("Endpoint not found:", error.response.data);
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
const hasab = new HasabClient("HASAB_KEY_o64D9FHJz9f9TQ6by0828gfrrwOK5S");
// hasab.chat
//   .streamResponse("Hello, can you tell me a joke?")
//   .on("data", (chunk) => {
//     console.log(chunk);
//     process.stdout.write(chunk);
//   })
//   .on("error", (err) => {
//     console.error("Stream error:", err);
//   })
//   .on("end", () => {
//     console.log("\nStream ended.");
//   });
hasab.chat.sendMessage("selam new").then((response) => {
    console.log(response);
});
//# sourceMappingURL=client.js.map