import { AxiosInstance } from "axios";
import { TTSHistoryResponse } from "../types/response.js";
export interface GetTTSHistoryOptions {
    limit?: number;
    offset?: number;
    status?: "success" | "failed";
    tts_type?: "regular" | "reference";
    language?: string;
    date_from?: string;
    date_to?: string;
    device_id?: number;
}
export declare function getTTSHistory(client: AxiosInstance, options?: GetTTSHistoryOptions): Promise<TTSHistoryResponse>;
//# sourceMappingURL=getHistory.d.ts.map