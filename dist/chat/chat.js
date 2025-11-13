"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../common/errors");
async function chat(message, client, options) {
    try {
        const { model = "hasab-1-lite", maxTokens = 1024, tools = [], temperature = 0.7, } = options || {};
        const payload = {
            model,
            message,
            stream: false,
            temperature,
            tools,
            max_tokens: maxTokens,
        };
        if (!message) {
            throw new errors_1.HasabValidationError("Message is required");
        }
        const { data } = await client.post(`/chat`, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!data || !data.message) {
            throw new errors_1.HasabApiError(data.message, data.status);
        }
        return {
            success: true,
            message: data.message,
            usage: data.usage,
        };
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            if (error.response) {
                throw new errors_1.HasabApiError(error.response.data?.message ?? "Chat API error", error.response.status, error.response.data);
            }
            if (error.request) {
                throw new errors_1.HasabNetworkError("No response from chat service");
            }
        }
        throw new errors_1.HasabError(error.message ?? "Unknown chat error");
    }
}
//# sourceMappingURL=chat.js.map