import dotenv from 'dotenv';
dotenv.config();
export const stagehandConfig = {
    env: process.env.STAGEHAND_ENV || 'LOCAL',
    apiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    headless: process.env.STAGEHAND_HEADLESS === 'true',
    enableRecording: process.env.STAGEHAND_ENABLE_RECORDING === 'true',
    domSettleTimeoutMs: 5000,
    defaultTimeout: 30000,
    viewport: {
        width: 1280,
        height: 720
    },
    browserLaunchOptions: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
        ],
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    actionTimeout: 5000,
    observeTimeout: 5000,
    extractionOptions: {
        useTextExtract: true,
        maxRetries: 2
    }
};
export default stagehandConfig;
//# sourceMappingURL=archived-stagehand.config.js.map