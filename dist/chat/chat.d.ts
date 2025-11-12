import { AxiosInstance } from "axios";
import { HasabError } from "../common/errors";
export interface ChatSuccess {
    success: true;
    data: any;
}
export interface ChatFailure {
    success: false;
    message: string;
}
export type ChatResponse = ChatSuccess | ChatFailure;
export declare function chat(message: string, model: string, stream: boolean, client: AxiosInstance, apikey: string): Promise<ChatResponse>;
export type StreamCallback = (chunk: string) => void;
export interface ChatStreamOptions {
    message: string;
    model?: string;
    apikey: string;
    onData: StreamCallback;
    onError?: (err: HasabError) => void;
    onComplete?: () => void;
}
export declare function chatStream({ message, model, apikey, onData, onError, onComplete, }: ChatStreamOptions): Promise<() => void>;
//# sourceMappingURL=chat.d.ts.map