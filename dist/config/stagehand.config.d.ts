export declare const stagehandConfig: {
    env: "LOCAL" | "BROWSERBASE";
    apiKey: string | undefined;
    modelName: string;
    headless: boolean;
    enableRecording: boolean;
    domSettleTimeoutMs: number;
    defaultTimeout: number;
    viewport: {
        width: number;
        height: number;
    };
    browserLaunchOptions: {
        args: string[];
        userAgent: string;
    };
    actionTimeout: number;
    observeTimeout: number;
    extractionOptions: {
        useTextExtract: boolean;
        maxRetries: number;
    };
};
export default stagehandConfig;
//# sourceMappingURL=stagehand.config.d.ts.map