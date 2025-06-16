import { z } from 'zod';
import { ScrapingStatus, ErrorType } from './index';
export const jobListingSchema = z.object({
    id: z.string().uuid(),
    company: z.string().min(1, 'Company name is required'),
    title: z.string().min(1, 'Job title is required'),
    description: z.string().min(10, 'Job description must be at least 10 characters'),
    location: z.string().optional(),
    type: z.string().optional(),
    url: z.string().url().optional(),
    scrapeTimestamp: z.string().datetime(),
    scrapeRunId: z.string().uuid()
});
export const extractedJobSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(10),
    location: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    url: z.string().url().nullable().optional()
});
export const jobExtractionSchema = z.object({
    jobs: z.array(extractedJobSchema)
});
export const companyInputSchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    website: z.string().url('Valid website URL is required')
});
export const scrapingMetadataSchema = z.object({
    processingTimeMs: z.number().nonnegative(),
    jobsFound: z.number().nonnegative(),
    careersPageUrl: z.string().url().optional(),
    retryCount: z.number().nonnegative(),
    lastAttempt: z.string().datetime()
});
export const companyScrapingResultSchema = z.object({
    company: z.string().min(1),
    website: z.string().url(),
    status: z.nativeEnum(ScrapingStatus),
    jobListings: z.array(jobListingSchema),
    error: z.string().optional(),
    metadata: scrapingMetadataSchema
});
export const batchSummarySchema = z.object({
    totalJobsFound: z.number().nonnegative(),
    averageJobsPerCompany: z.number().nonnegative(),
    averageProcessingTimeMs: z.number().nonnegative(),
    topPerformingCompanies: z.array(z.string()),
    problematicWebsites: z.array(z.string())
});
export const batchScrapingResultSchema = z.object({
    runId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    totalCompanies: z.number().nonnegative(),
    successfulCompanies: z.number().nonnegative(),
    failedCompanies: z.number().nonnegative(),
    results: z.array(companyScrapingResultSchema),
    summary: batchSummarySchema
});
export const scrapingErrorSchema = z.object({
    type: z.nativeEnum(ErrorType),
    message: z.string().min(1),
    company: z.string().min(1),
    website: z.string().url(),
    timestamp: z.string().datetime(),
    stack: z.string().optional(),
    retryable: z.boolean()
});
export const scrapingConfigSchema = z.object({
    delayMs: z.number().min(1000).max(10000),
    maxRetries: z.number().min(0).max(5),
    timeoutMs: z.number().min(5000).max(60000),
    headless: z.boolean(),
    enableRecording: z.boolean()
});
export const progressTrackerSchema = z.object({
    currentCompany: z.number().nonnegative(),
    totalCompanies: z.number().positive(),
    completed: z.array(z.string()),
    failed: z.array(z.string()),
    inProgress: z.string().optional(),
    startTime: z.string().datetime(),
    estimatedTimeRemaining: z.string().optional()
});
export const dataQualityMetricsSchema = z.object({
    totalRecords: z.number().nonnegative(),
    recordsWithRequiredFields: z.number().nonnegative(),
    recordsWithOptionalFields: z.record(z.number().nonnegative()),
    averageDescriptionLength: z.number().nonnegative(),
    duplicateCount: z.number().nonnegative(),
    validUrlCount: z.number().nonnegative(),
    dataQualityScore: z.number().min(0).max(100)
});
export function validateJobListing(data) {
    return jobListingSchema.parse(data);
}
export function validateCompanyInput(data) {
    return companyInputSchema.parse(data);
}
export function validateExtractedJob(data) {
    return extractedJobSchema.parse(data);
}
export function validateScrapingConfig(data) {
    return scrapingConfigSchema.parse(data);
}
//# sourceMappingURL=schemas.js.map