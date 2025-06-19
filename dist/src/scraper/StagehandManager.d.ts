import { Stagehand } from '@browserbasehq/stagehand';
import { ScrapingConfig, PageTimeoutConfig } from '../types/index.js';
export declare class StagehandManager {
    private stagehand;
    private page;
    private config;
    private pageTimeouts;
    private userAgents;
    constructor(config?: Partial<ScrapingConfig>);
    initialize(): Promise<void>;
    getPage(): any;
    getStagehand(): Stagehand | null;
    isInitialized(): boolean;
    getConfig(): ScrapingConfig;
    private configurePageTimeouts;
    updateTimeouts(newTimeouts: Partial<PageTimeoutConfig>): void;
    getTimeouts(): PageTimeoutConfig;
    navigateWithTimeout(url: string, waitStrategy?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'): Promise<void>;
    waitForPageReady(): Promise<void>;
    handleCookieBanner(): Promise<boolean>;
    private applyStealthSettings;
    closePage(): Promise<void>;
    close(): Promise<void>;
    restart(): Promise<void>;
    createNewPage(): Promise<any>;
    setupGracefulShutdown(): void;
    getHealthStatus(): Promise<{
        healthy: boolean;
        details: string;
    }>;
}
//# sourceMappingURL=StagehandManager.d.ts.map