// Essential types for simplified AI web scraper
// Target: ~50 lines vs current 200+ lines in types/index.ts

/**
 * Company input from CSV - supports careers URL discovery
 */
export interface CompanyInput {
  name: string;
  website: string;
  careers_url?: string; // Gets populated when discovered and written back to CSV
}

/**
 * Job listing matching PRD schema, optimized for frontend consumption
 */
export interface JobListing {
  id: string;
  company: string;
  title: string;
  description?: string;
  location?: string;
  type?: string;
  url?: string;
  scrapeTimestamp: string;
  scrapeRunId: string;
}

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