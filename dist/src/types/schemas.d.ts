import { z } from 'zod';
import { ScrapingStatus, ErrorType } from './index';
export declare const jobListingSchema: z.ZodObject<{
    id: z.ZodString;
    company: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    scrapeTimestamp: z.ZodString;
    scrapeRunId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    id: string;
    company: string;
    scrapeTimestamp: string;
    scrapeRunId: string;
    location?: string | undefined;
    type?: string | undefined;
    url?: string | undefined;
}, {
    title: string;
    description: string;
    id: string;
    company: string;
    scrapeTimestamp: string;
    scrapeRunId: string;
    location?: string | undefined;
    type?: string | undefined;
    url?: string | undefined;
}>;
export declare const extractedJobSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    location?: string | null | undefined;
    type?: string | null | undefined;
    url?: string | null | undefined;
}, {
    title: string;
    description: string;
    location?: string | null | undefined;
    type?: string | null | undefined;
    url?: string | null | undefined;
}>;
export declare const jobExtractionSchema: z.ZodObject<{
    jobs: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        location?: string | null | undefined;
        type?: string | null | undefined;
        url?: string | null | undefined;
    }, {
        title: string;
        description: string;
        location?: string | null | undefined;
        type?: string | null | undefined;
        url?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    jobs: {
        title: string;
        description: string;
        location?: string | null | undefined;
        type?: string | null | undefined;
        url?: string | null | undefined;
    }[];
}, {
    jobs: {
        title: string;
        description: string;
        location?: string | null | undefined;
        type?: string | null | undefined;
        url?: string | null | undefined;
    }[];
}>;
export declare const companyInputSchema: z.ZodObject<{
    name: z.ZodString;
    website: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    website: string;
}, {
    name: string;
    website: string;
}>;
export declare const scrapingMetadataSchema: z.ZodObject<{
    processingTimeMs: z.ZodNumber;
    jobsFound: z.ZodNumber;
    careersPageUrl: z.ZodOptional<z.ZodString>;
    retryCount: z.ZodNumber;
    lastAttempt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    processingTimeMs: number;
    jobsFound: number;
    retryCount: number;
    lastAttempt: string;
    careersPageUrl?: string | undefined;
}, {
    processingTimeMs: number;
    jobsFound: number;
    retryCount: number;
    lastAttempt: string;
    careersPageUrl?: string | undefined;
}>;
export declare const companyScrapingResultSchema: z.ZodObject<{
    company: z.ZodString;
    website: z.ZodString;
    status: z.ZodNativeEnum<typeof ScrapingStatus>;
    jobListings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        company: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        scrapeTimestamp: z.ZodString;
        scrapeRunId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        id: string;
        company: string;
        scrapeTimestamp: string;
        scrapeRunId: string;
        location?: string | undefined;
        type?: string | undefined;
        url?: string | undefined;
    }, {
        title: string;
        description: string;
        id: string;
        company: string;
        scrapeTimestamp: string;
        scrapeRunId: string;
        location?: string | undefined;
        type?: string | undefined;
        url?: string | undefined;
    }>, "many">;
    error: z.ZodOptional<z.ZodString>;
    metadata: z.ZodObject<{
        processingTimeMs: z.ZodNumber;
        jobsFound: z.ZodNumber;
        careersPageUrl: z.ZodOptional<z.ZodString>;
        retryCount: z.ZodNumber;
        lastAttempt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        processingTimeMs: number;
        jobsFound: number;
        retryCount: number;
        lastAttempt: string;
        careersPageUrl?: string | undefined;
    }, {
        processingTimeMs: number;
        jobsFound: number;
        retryCount: number;
        lastAttempt: string;
        careersPageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    status: ScrapingStatus;
    company: string;
    website: string;
    metadata: {
        processingTimeMs: number;
        jobsFound: number;
        retryCount: number;
        lastAttempt: string;
        careersPageUrl?: string | undefined;
    };
    jobListings: {
        title: string;
        description: string;
        id: string;
        company: string;
        scrapeTimestamp: string;
        scrapeRunId: string;
        location?: string | undefined;
        type?: string | undefined;
        url?: string | undefined;
    }[];
    error?: string | undefined;
}, {
    status: ScrapingStatus;
    company: string;
    website: string;
    metadata: {
        processingTimeMs: number;
        jobsFound: number;
        retryCount: number;
        lastAttempt: string;
        careersPageUrl?: string | undefined;
    };
    jobListings: {
        title: string;
        description: string;
        id: string;
        company: string;
        scrapeTimestamp: string;
        scrapeRunId: string;
        location?: string | undefined;
        type?: string | undefined;
        url?: string | undefined;
    }[];
    error?: string | undefined;
}>;
export declare const batchSummarySchema: z.ZodObject<{
    totalJobsFound: z.ZodNumber;
    averageJobsPerCompany: z.ZodNumber;
    averageProcessingTimeMs: z.ZodNumber;
    topPerformingCompanies: z.ZodArray<z.ZodString, "many">;
    problematicWebsites: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    totalJobsFound: number;
    averageJobsPerCompany: number;
    averageProcessingTimeMs: number;
    topPerformingCompanies: string[];
    problematicWebsites: string[];
}, {
    totalJobsFound: number;
    averageJobsPerCompany: number;
    averageProcessingTimeMs: number;
    topPerformingCompanies: string[];
    problematicWebsites: string[];
}>;
export declare const batchScrapingResultSchema: z.ZodObject<{
    runId: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    totalCompanies: z.ZodNumber;
    successfulCompanies: z.ZodNumber;
    failedCompanies: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<{
        company: z.ZodString;
        website: z.ZodString;
        status: z.ZodNativeEnum<typeof ScrapingStatus>;
        jobListings: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            company: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            location: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            scrapeTimestamp: z.ZodString;
            scrapeRunId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            title: string;
            description: string;
            id: string;
            company: string;
            scrapeTimestamp: string;
            scrapeRunId: string;
            location?: string | undefined;
            type?: string | undefined;
            url?: string | undefined;
        }, {
            title: string;
            description: string;
            id: string;
            company: string;
            scrapeTimestamp: string;
            scrapeRunId: string;
            location?: string | undefined;
            type?: string | undefined;
            url?: string | undefined;
        }>, "many">;
        error: z.ZodOptional<z.ZodString>;
        metadata: z.ZodObject<{
            processingTimeMs: z.ZodNumber;
            jobsFound: z.ZodNumber;
            careersPageUrl: z.ZodOptional<z.ZodString>;
            retryCount: z.ZodNumber;
            lastAttempt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            processingTimeMs: number;
            jobsFound: number;
            retryCount: number;
            lastAttempt: string;
            careersPageUrl?: string | undefined;
        }, {
            processingTimeMs: number;
            jobsFound: number;
            retryCount: number;
            lastAttempt: string;
            careersPageUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        status: ScrapingStatus;
        company: string;
        website: string;
        metadata: {
            processingTimeMs: number;
            jobsFound: number;
            retryCount: number;
            lastAttempt: string;
            careersPageUrl?: string | undefined;
        };
        jobListings: {
            title: string;
            description: string;
            id: string;
            company: string;
            scrapeTimestamp: string;
            scrapeRunId: string;
            location?: string | undefined;
            type?: string | undefined;
            url?: string | undefined;
        }[];
        error?: string | undefined;
    }, {
        status: ScrapingStatus;
        company: string;
        website: string;
        metadata: {
            processingTimeMs: number;
            jobsFound: number;
            retryCount: number;
            lastAttempt: string;
            careersPageUrl?: string | undefined;
        };
        jobListings: {
            title: string;
            description: string;
            id: string;
            company: string;
            scrapeTimestamp: string;
            scrapeRunId: string;
            location?: string | undefined;
            type?: string | undefined;
            url?: string | undefined;
        }[];
        error?: string | undefined;
    }>, "many">;
    summary: z.ZodObject<{
        totalJobsFound: z.ZodNumber;
        averageJobsPerCompany: z.ZodNumber;
        averageProcessingTimeMs: z.ZodNumber;
        topPerformingCompanies: z.ZodArray<z.ZodString, "many">;
        problematicWebsites: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        totalJobsFound: number;
        averageJobsPerCompany: number;
        averageProcessingTimeMs: number;
        topPerformingCompanies: string[];
        problematicWebsites: string[];
    }, {
        totalJobsFound: number;
        averageJobsPerCompany: number;
        averageProcessingTimeMs: number;
        topPerformingCompanies: string[];
        problematicWebsites: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    runId: string;
    startTime: string;
    endTime: string;
    totalCompanies: number;
    successfulCompanies: number;
    failedCompanies: number;
    results: {
        status: ScrapingStatus;
        company: string;
        website: string;
        metadata: {
            processingTimeMs: number;
            jobsFound: number;
            retryCount: number;
            lastAttempt: string;
            careersPageUrl?: string | undefined;
        };
        jobListings: {
            title: string;
            description: string;
            id: string;
            company: string;
            scrapeTimestamp: string;
            scrapeRunId: string;
            location?: string | undefined;
            type?: string | undefined;
            url?: string | undefined;
        }[];
        error?: string | undefined;
    }[];
    summary: {
        totalJobsFound: number;
        averageJobsPerCompany: number;
        averageProcessingTimeMs: number;
        topPerformingCompanies: string[];
        problematicWebsites: string[];
    };
}, {
    runId: string;
    startTime: string;
    endTime: string;
    totalCompanies: number;
    successfulCompanies: number;
    failedCompanies: number;
    results: {
        status: ScrapingStatus;
        company: string;
        website: string;
        metadata: {
            processingTimeMs: number;
            jobsFound: number;
            retryCount: number;
            lastAttempt: string;
            careersPageUrl?: string | undefined;
        };
        jobListings: {
            title: string;
            description: string;
            id: string;
            company: string;
            scrapeTimestamp: string;
            scrapeRunId: string;
            location?: string | undefined;
            type?: string | undefined;
            url?: string | undefined;
        }[];
        error?: string | undefined;
    }[];
    summary: {
        totalJobsFound: number;
        averageJobsPerCompany: number;
        averageProcessingTimeMs: number;
        topPerformingCompanies: string[];
        problematicWebsites: string[];
    };
}>;
export declare const scrapingErrorSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof ErrorType>;
    message: z.ZodString;
    company: z.ZodString;
    website: z.ZodString;
    timestamp: z.ZodString;
    stack: z.ZodOptional<z.ZodString>;
    retryable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type: ErrorType;
    message: string;
    company: string;
    website: string;
    timestamp: string;
    retryable: boolean;
    stack?: string | undefined;
}, {
    type: ErrorType;
    message: string;
    company: string;
    website: string;
    timestamp: string;
    retryable: boolean;
    stack?: string | undefined;
}>;
export declare const scrapingConfigSchema: z.ZodObject<{
    delayMs: z.ZodNumber;
    maxRetries: z.ZodNumber;
    timeoutMs: z.ZodNumber;
    headless: z.ZodBoolean;
    enableRecording: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    delayMs: number;
    maxRetries: number;
    timeoutMs: number;
    headless: boolean;
    enableRecording: boolean;
}, {
    delayMs: number;
    maxRetries: number;
    timeoutMs: number;
    headless: boolean;
    enableRecording: boolean;
}>;
export declare const progressTrackerSchema: z.ZodObject<{
    currentCompany: z.ZodNumber;
    totalCompanies: z.ZodNumber;
    completed: z.ZodArray<z.ZodString, "many">;
    failed: z.ZodArray<z.ZodString, "many">;
    inProgress: z.ZodOptional<z.ZodString>;
    startTime: z.ZodString;
    estimatedTimeRemaining: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    failed: string[];
    startTime: string;
    totalCompanies: number;
    currentCompany: number;
    completed: string[];
    inProgress?: string | undefined;
    estimatedTimeRemaining?: string | undefined;
}, {
    failed: string[];
    startTime: string;
    totalCompanies: number;
    currentCompany: number;
    completed: string[];
    inProgress?: string | undefined;
    estimatedTimeRemaining?: string | undefined;
}>;
export declare const dataQualityMetricsSchema: z.ZodObject<{
    totalRecords: z.ZodNumber;
    recordsWithRequiredFields: z.ZodNumber;
    recordsWithOptionalFields: z.ZodRecord<z.ZodString, z.ZodNumber>;
    averageDescriptionLength: z.ZodNumber;
    duplicateCount: z.ZodNumber;
    validUrlCount: z.ZodNumber;
    dataQualityScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalRecords: number;
    recordsWithRequiredFields: number;
    recordsWithOptionalFields: Record<string, number>;
    averageDescriptionLength: number;
    duplicateCount: number;
    validUrlCount: number;
    dataQualityScore: number;
}, {
    totalRecords: number;
    recordsWithRequiredFields: number;
    recordsWithOptionalFields: Record<string, number>;
    averageDescriptionLength: number;
    duplicateCount: number;
    validUrlCount: number;
    dataQualityScore: number;
}>;
export declare function validateJobListing(data: unknown): z.infer<typeof jobListingSchema>;
export declare function validateCompanyInput(data: unknown): z.infer<typeof companyInputSchema>;
export declare function validateExtractedJob(data: unknown): z.infer<typeof extractedJobSchema>;
export declare function validateScrapingConfig(data: unknown): z.infer<typeof scrapingConfigSchema>;
export type JobListingInput = z.infer<typeof jobListingSchema>;
export type ExtractedJobInput = z.infer<typeof extractedJobSchema>;
export type CompanyInputData = z.infer<typeof companyInputSchema>;
export type ScrapingConfigData = z.infer<typeof scrapingConfigSchema>;
//# sourceMappingURL=schemas.d.ts.map