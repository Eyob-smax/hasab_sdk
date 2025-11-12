type TranscriptionResponse = {
    success: true;
    text: string;
    metadata: {
        tokens_charged: number;
        remaining_tokens: number;
        charge_message: string;
    };
} | {
    success: false;
    message: string;
};
export type { TranscriptionResponse };
//# sourceMappingURL=response.types.d.ts.map