import { Page } from "@browserbasehq/stagehand";
import { JobExtractionResult } from "../types/index.js";
export declare class JobExtractor {
    private page;
    private companyName;
    private scrapeRunId;
    constructor(page: Page, companyName: string, scrapeRunId: string);
    extractJobs(): Promise<JobExtractionResult>;
    handlePagination(): Promise<boolean>;
    extractAllJobs(): Promise<JobExtractionResult>;
}
//# sourceMappingURL=JobExtractor.d.ts.map