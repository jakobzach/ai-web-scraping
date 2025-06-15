import { z } from 'zod';
import { ScrapingStatus, JobType, ErrorType } from './index';

// Job listing schema for extraction validation
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

// Schema for extracting job data from websites (simpler validation)
export const extractedJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  location: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  url: z.string().url().nullable().optional()
});

// Schema for Stagehand job extraction (multiple jobs)
export const jobExtractionSchema = z.object({
  jobs: z.array(extractedJobSchema)
});

// Company input schema for CSV validation
export const companyInputSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Valid website URL is required')
});

// Scraping metadata schema
export const scrapingMetadataSchema = z.object({
  processingTimeMs: z.number().nonnegative(),
  jobsFound: z.number().nonnegative(),
  careersPageUrl: z.string().url().optional(),
  retryCount: z.number().nonnegative(),
  lastAttempt: z.string().datetime()
});

// Company scraping result schema
export const companyScrapingResultSchema = z.object({
  company: z.string().min(1),
  website: z.string().url(),
  status: z.nativeEnum(ScrapingStatus),
  jobListings: z.array(jobListingSchema),
  error: z.string().optional(),
  metadata: scrapingMetadataSchema
});

// Batch summary schema
export const batchSummarySchema = z.object({
  totalJobsFound: z.number().nonnegative(),
  averageJobsPerCompany: z.number().nonnegative(),
  averageProcessingTimeMs: z.number().nonnegative(),
  topPerformingCompanies: z.array(z.string()),
  problematicWebsites: z.array(z.string())
});

// Batch scraping result schema
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

// Error schema
export const scrapingErrorSchema = z.object({
  type: z.nativeEnum(ErrorType),
  message: z.string().min(1),
  company: z.string().min(1),
  website: z.string().url(),
  timestamp: z.string().datetime(),
  stack: z.string().optional(),
  retryable: z.boolean()
});

// Configuration schema
export const scrapingConfigSchema = z.object({
  delayMs: z.number().min(1000).max(10000), // 1-10 seconds
  maxRetries: z.number().min(0).max(5),
  timeoutMs: z.number().min(5000).max(60000), // 5-60 seconds
  headless: z.boolean(),
  enableRecording: z.boolean()
});

// Progress tracker schema
export const progressTrackerSchema = z.object({
  currentCompany: z.number().nonnegative(),
  totalCompanies: z.number().positive(),
  completed: z.array(z.string()),
  failed: z.array(z.string()),
  inProgress: z.string().optional(),
  startTime: z.string().datetime(),
  estimatedTimeRemaining: z.string().optional()
});

// Data quality metrics schema
export const dataQualityMetricsSchema = z.object({
  totalRecords: z.number().nonnegative(),
  recordsWithRequiredFields: z.number().nonnegative(),
  recordsWithOptionalFields: z.record(z.number().nonnegative()),
  averageDescriptionLength: z.number().nonnegative(),
  duplicateCount: z.number().nonnegative(),
  validUrlCount: z.number().nonnegative(),
  dataQualityScore: z.number().min(0).max(100)
});

// Helper function to validate and transform data
export function validateJobListing(data: unknown): z.infer<typeof jobListingSchema> {
  return jobListingSchema.parse(data);
}

export function validateCompanyInput(data: unknown): z.infer<typeof companyInputSchema> {
  return companyInputSchema.parse(data);
}

export function validateExtractedJob(data: unknown): z.infer<typeof extractedJobSchema> {
  return extractedJobSchema.parse(data);
}

export function validateScrapingConfig(data: unknown): z.infer<typeof scrapingConfigSchema> {
  return scrapingConfigSchema.parse(data);
}

// Type exports for convenience
export type JobListingInput = z.infer<typeof jobListingSchema>;
export type ExtractedJobInput = z.infer<typeof extractedJobSchema>;
export type CompanyInputData = z.infer<typeof companyInputSchema>;
export type ScrapingConfigData = z.infer<typeof scrapingConfigSchema>; 