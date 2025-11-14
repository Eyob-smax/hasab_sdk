import { AxiosInstance } from "axios";
export interface TTSStreamRequest {
    text: string;
    language: string;
    speaker_name: string;
    sample_rate?: number;
}
export declare function ttsStream(request: TTSStreamRequest, client: AxiosInstance, onData: (chunk: Buffer) => void, onError: (err: any) => void, onComplete: () => void): Promise<() => void>;
//# sourceMappingURL=textToSpeechStream.d.ts.map