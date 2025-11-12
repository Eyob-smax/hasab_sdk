"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribe = transcribe;
const constants_1 = require("../common/constants");
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const languageEnum_1 = require("../common/languageEnum");
const errors_js_1 = require("../common/errors.js");
async function transcribe(request, apikey, client) {
    if (!request.audio_file) {
        throw new errors_js_1.HasabValidationError("Audio file is required.");
    }
    if (typeof request.audio_file === "string" &&
        !fs_1.default.existsSync(request.audio_file)) {
        throw new errors_js_1.HasabValidationError("Invalid or missing file path.");
    }
    const form = new form_data_1.default();
    if (typeof request.audio_file === "string") {
        if (!fs_1.default.existsSync(request.audio_file)) {
            throw new errors_js_1.HasabValidationError("Invalid or missing file path.");
        }
        form.append("file", fs_1.default.createReadStream(request.audio_file));
    }
    else if (request.audio_file instanceof Blob ||
        request.audio_file.buffer) {
        let filename = "audio.bin";
        if (request.audio_file.name) {
            filename = request.audio_file.name;
        }
        form.append("file", request.audio_file, filename);
    }
    else {
        throw new errors_js_1.HasabValidationError("Invalid type for audio file. Must be a path string, File, or Blob.");
    }
    const defaults = {
        transcribe: true,
        translate: false,
        summarize: false,
        language: "auto",
        timestamps: false,
        source_language: languageEnum_1.LanguageEnum.AUTO,
    };
    const payload = { ...defaults, ...request };
    Object.entries(payload).forEach(([key, value]) => {
        if (key !== "audio_file" && value !== undefined) {
            form.append(key, String(value));
        }
    });
    try {
        const response = await client.post(`${constants_1.BASE_URL}/upload-audio/`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${apikey}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        const data = response.data;
        const metadata = data.metadata || {
            tokens_charged: 0,
            remaining_tokens: 0,
            charge_message: "",
        };
        if (data.success) {
            const text = data.transcription || data.audio?.transcription || "";
            return {
                success: true,
                text,
                metadata,
            };
        }
        else {
            throw new errors_js_1.HasabApiError(data.message || "API processing failed", response.status || 500, data);
        }
    }
    catch (error) {
        if (error instanceof errors_js_1.HasabValidationError) {
            throw error;
        }
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || `API call failed with status ${status}`;
            throw new errors_js_1.HasabApiError(message, status, error.response.data);
        }
        throw error;
    }
}
//# sourceMappingURL=transcription.js.map