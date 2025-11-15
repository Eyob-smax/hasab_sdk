import { AxiosInstance } from "axios";
import { TranscriptionHistoryResponse } from "../types/index.js";
export interface GetTranscriptionHistoryOptions {
    page?: number;
}
export declare function getTranscriptionHistory(apikey: string, client: AxiosInstance, options?: GetTranscriptionHistoryOptions): Promise<TranscriptionHistoryResponse>;
//# sourceMappingURL=getHistory.d.ts.map