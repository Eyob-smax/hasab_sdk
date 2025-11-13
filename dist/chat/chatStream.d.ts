import { ChatOptionsConfig } from "../common/types";
import { AxiosInstance } from "axios";
export declare function chatStream(message: string, client: AxiosInstance, onData: (chunk: string) => void, onError: (err: any) => void, onComplete: () => void, options?: ChatOptionsConfig & {
    timeout?: number;
}): Promise<() => void>;
//# sourceMappingURL=chatStream.d.ts.map