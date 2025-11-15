import { AxiosInstance } from "axios";
import { TTSAnalyticsResponse } from "../types/index.js";
export interface GetTTSAnalyticsOptions {
    date_from?: string;
    date_to?: string;
}
export declare function getTTSAnalytics(client: AxiosInstance, options?: GetTTSAnalyticsOptions): Promise<TTSAnalyticsResponse>;
//# sourceMappingURL=getAnalytics.d.ts.map