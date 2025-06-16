import { JobListing, ProcessingResult } from "../types/index.js";
export declare class DataProcessor {
    static processJobs(jobListings: JobListing[]): ProcessingResult;
    private static cleanText;
    private static normalizeJobType;
    private static cleanUrl;
    private static removeDuplicates;
    static validateJob(job: JobListing): {
        isValid: boolean;
        issues: string[];
    };
    static generateQualityReport(result: ProcessingResult): string;
}
//# sourceMappingURL=DataProcessor.d.ts.map