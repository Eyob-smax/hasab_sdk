"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
exports.chatStream = chatStream;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../common/errors");
async function chat(message, model, stream, client, apikey) {
    try {
        const payload = { model, message, stream: false };
        const { data } = await client.post("/chat", payload, {
            headers: {
                Authorization: `Bearer ${apikey}`,
                "Content-Type": "application/json",
            },
        });
        if (!data.success) {
            return { success: false, message: data.message ?? "Chat request failed" };
        }
        return { success: true, data };
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
async function chatStream({ message, model = "hasab-1-lite", apikey, onData, onError, onComplete, }) {
    let cancelled = false;
    const abortController = new AbortController();
    let stream;
    try {
        const payload = { model, message, stream: true };
        const response = await axios_1.default.post("/chat-stream", payload, {
            baseURL: (axios_1.default.defaults.baseURL ?? "").replace(/\/$/, ""),
            headers: {
                Authorization: `Bearer ${apikey}`,
                "Content-Type": "application/json",
            },
            responseType: "stream",
            signal: abortController.signal,
        });
        stream = response.data;
    }
    catch (err) {
        if (!cancelled) {
            const error = axios_1.default.isAxiosError(err) && err.response
                ? new errors_1.HasabApiError(err.response.data?.message ?? "Stream init error", err.response.status, err.response.data)
                : new errors_1.HasabNetworkError("Failed to start stream");
            onError?.(error);
        }
        return () => { };
    }
    const decoder = new TextDecoder();
    let buffer = "";
    const processChunk = (raw) => {
        if (cancelled)
            return;
        buffer += decoder.decode(raw, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            if (!line.trim())
                continue;
            if (line.startsWith("data: ")) {
                const json = line.slice(6);
                if (json === "[DONE]") {
                    onComplete?.();
                    return true;
                }
                try {
                    const parsed = JSON.parse(json);
                    if (typeof parsed.content === "string") {
                        onData(parsed.content);
                    }
                }
                catch { }
            }
        }
        return false;
    };
    stream.on("data", (chunk) => {
        if (processChunk(chunk))
            stream.destroy();
    });
    stream.on("end", () => {
        if (buffer)
            processChunk(new Uint8Array());
        if (!cancelled)
            onComplete?.();
    });
    stream.on("error", (err) => {
        if (!cancelled) {
            onError?.(new errors_1.HasabNetworkError(err.message ?? "Stream error"));
        }
    });
    return () => {
        if (cancelled)
            return;
        cancelled = true;
        abortController.abort();
        stream.destroy();
    };
}
//# sourceMappingURL=chat.js.map