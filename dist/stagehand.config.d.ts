declare const StagehandConfig: {
    env: "LOCAL";
    modelName: "gpt-4o-mini";
    modelClientOptions: {
        apiKey: string | undefined;
    };
    localBrowserLaunchOptions: {
        headless: boolean;
        args: string[];
        extraHTTPHeaders: {
            'User-Agent': string;
        };
        geolocation: {
            latitude: number;
            longitude: number;
        };
        permissions: string[];
        locale: string;
        viewport: {
            width: number;
            height: number;
        };
    };
};
export default StagehandConfig;
//# sourceMappingURL=stagehand.config.d.ts.map