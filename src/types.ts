// Essential types for simplified AI web scraper
// Target: ~50 lines vs current 200+ lines in types/index.ts

import { z } from "zod";

/**
 * Company input from CSV - supports careers URL discovery
 */
export interface CompanyInput {
  name: string;
  website: string;
  careers_url?: string; // Gets populated when discovered and written back to CSV
}

/**
 * Job type enum
 */
export enum JobType {
  FULL_TIME = "Full-time",
  PART_TIME = "Part-time", 
  CONTRACT = "Contract",
  INTERNSHIP = "Internship"
}

/**
 * Language of the job listing enum
 */
export enum LanguageOfListing {
  ENGLISH = "en",
  GERMAN = "de", 
  FRENCH = "fr"
}

/**
 * SINGLE SOURCE OF TRUTH: Core job field definitions
 * To add a new field: Add it here once, then add one line to each schema below
 */
const jobFieldDefinitions = {
  title: z.string().describe("The exact job title as displayed on the page"),
  description: z.string().describe("The complete job description, summary, or requirements text"),
  location: z.string().describe("The job location (city, country, 'Remote', etc.) or null if not specified"),
  type: z.nativeEnum(JobType).describe("Employment type from predefined options"),
  url: z.string().url().describe("The actual href URL from the apply/view job button or link"),
  languageOfListing: z.nativeEnum(LanguageOfListing).describe("The language of the job listing using ISO language codes")
} as const;

/**
 * Schema for Stagehand extraction (nullable for AI that can return null)
 */
export const JobExtractionItemSchema = z.object({
  title: jobFieldDefinitions.title,
  description: jobFieldDefinitions.description,
  location: jobFieldDefinitions.location.nullable(),
  type: jobFieldDefinitions.type.nullable(),
  url: jobFieldDefinitions.url.nullable(),
  languageOfListing: jobFieldDefinitions.languageOfListing.nullable()
});

/**
 * Schema for Stagehand extraction (wraps multiple jobs)
 */
export const JobExtractionSchema = z.object({
  jobs: z.array(JobExtractionItemSchema)
});

/**
 * Schema for final job listing (optional for clean TypeScript)
 */
export const JobListingSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: jobFieldDefinitions.title,
  scrapeTimestamp: z.string(),
  scrapeRunId: z.string(),
  description: jobFieldDefinitions.description.optional(),
  location: jobFieldDefinitions.location.optional(),
  type: jobFieldDefinitions.type.optional(),
  url: jobFieldDefinitions.url.optional(),
  languageOfListing: jobFieldDefinitions.languageOfListing.optional()
});

/**
 * TypeScript type derived from the final schema - automatically stays in sync
 */
export type JobListing = z.infer<typeof JobListingSchema>;

/**
 * Simple metadata for the scraping run
 */
export interface ScrapingMetadata {
  runId: string;
  runTimestamp: string;
  totalJobs: number;
  companiesProcessed: number;
  companiesSuccessful: number;
  companiesFailed: number;
}

/**
 * Single JSON output structure for /public/jobs.json
 */
export interface JobsOutput {
  metadata: ScrapingMetadata;
  jobs: JobListing[];
} 