import { AxiosInstance } from "axios";
import { TranscriptionHistoryResponse } from "../types/response.js";
/**
 * Options for fetching transcription history
 */
export interface GetTranscriptionHistoryOptions {
    /** Page number (default: 1) */
    page?: number;
}
/**
 * Fetches paginated list of user's transcription jobs.
 *
 * @param apikey - Your Hasab API key
 * @param client - Pre-configured Axios instance
 * @param options - Pagination options
 * @returns TranscriptionHistoryResponse
 */
export declare function getTranscriptionHistory(apikey: string, client: AxiosInstance, options?: GetTranscriptionHistoryOptions): Promise<TranscriptionHistoryResponse>;
//# sourceMappingURL=getHistory.d.ts.map