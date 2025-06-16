import { CompanyInput, BatchScrapingResult, ProgressTracker } from '../types/index.js';
export declare class BatchScraper {
    private runId;
    private stagehandManager;
    private delayMs;
    private useRandomDelay;
    private progress;
    private isInterrupted;
    constructor(delayMs?: number, useRandomDelay?: boolean);
    processCompanies(companies: CompanyInput[]): Promise<BatchScrapingResult>;
    private scrapeCompany;
    private createFailedResult;
    private getRandomDelay;
    private delay;
    private displayProgressHeader;
    private displayProgressStatus;
    private createProgressBar;
    private updateEstimatedTime;
    private displayFinalProgress;
    getProgress(): ProgressTracker;
    private setupInterruptionHandling;
    private displayInterruptionSummary;
    private createBatchResult;
}
//# sourceMappingURL=BatchScraper.d.ts.map