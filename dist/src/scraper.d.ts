import { CompanyInput, JobListing } from './types.js';
export declare class SimpleScraper {
    private stagehand;
    private runId;
    private testMode;
    constructor(testMode?: 'full' | 'career-detection-only');
    init(): Promise<void>;
    close(): Promise<void>;
    getPage(): any;
    private handleCookies;
    private navigateToCareers;
    private validateCareersPage;
    private tryFallbackNavigation;
    private processJobData;
    private extractJobs;
    scrapeCompany(company: CompanyInput): Promise<JobListing[]>;
    scrapeAll(csvPath: string): Promise<void>;
}
//# sourceMappingURL=scraper.d.ts.map