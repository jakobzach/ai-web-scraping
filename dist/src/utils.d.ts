import { CompanyInput, JobListing, ScrapingMetadata } from './types.js';
export declare function readCompaniesFromCSV(filePath: string): Promise<CompanyInput[]>;
export declare function writeCompaniesCSV(filePath: string, companies: CompanyInput[]): Promise<void>;
export declare function writeJobsJSON(filePath: string, jobs: JobListing[], metadata: ScrapingMetadata): Promise<void>;
export declare function generateJobId(): string;
export declare function ensureUrlProtocol(url: string): string;
export declare function isValidUrl(url: string): boolean;
export declare function cleanJobData(job: Partial<JobListing>): JobListing | null;
//# sourceMappingURL=utils.d.ts.map