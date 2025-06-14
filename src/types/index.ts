// Core job listing interface matching PRD schema
export interface JobListing {
  id: string;
  company: string;
  title: string;
  description: string;
  location?: string;
  type?: string;
  url?: string;
  scrapeTimestamp: string;
  scrapeRunId: string;
}

// Company input interface for CSV parsing
export interface CompanyInput {
  name: string;
  website: string;
}

// Scraping result for a single company
export interface CompanyScrapingResult {
  company: string;
  website: string;
  status: ScrapingStatus;
  jobListings: JobListing[];
  error?: string;
  metadata: ScrapingMetadata;
}

// Batch scraping result
export interface BatchScrapingResult {
  runId: string;
  startTime: string;
  endTime: string;
  totalCompanies: number;
  successfulCompanies: number;
  failedCompanies: number;
  results: CompanyScrapingResult[];
  summary: BatchSummary;
}

// Scraping metadata
export interface ScrapingMetadata {
  processingTimeMs: number;
  jobsFound: number;
  careersPageUrl?: string;
  retryCount: number;
  lastAttempt: string;
}

// Batch processing summary
export interface BatchSummary {
  totalJobsFound: number;
  averageJobsPerCompany: number;
  averageProcessingTimeMs: number;
  topPerformingCompanies: string[];
  problematicWebsites: string[];
}

// Enums
export enum ScrapingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
  SKIPPED = 'skipped'
}

export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  UNKNOWN = 'unknown'
}

export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  PAGE_STRUCTURE_ERROR = 'page_structure_error',
  EXTRACTION_ERROR = 'extraction_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// Error interfaces
export interface ScrapingError {
  type: ErrorType;
  message: string;
  company: string;
  website: string;
  timestamp: string;
  stack?: string;
  retryable: boolean;
}

export interface ErrorReport {
  runId: string;
  errors: ScrapingError[];
  errorsByType: Record<ErrorType, number>;
  mostProblematicWebsites: string[];
  retryableErrors: ScrapingError[];
}

// Configuration interfaces
export interface ScrapingConfig {
  delayMs: number;
  maxRetries: number;
  timeoutMs: number;
  headless: boolean;
  enableRecording: boolean;
}

// Page timeout configuration for different scraping operations
export interface PageTimeoutConfig {
  navigation: number;
  action: number;
  extraction: number;
  networkIdle: number;
  domContentLoaded: number;
}

// Progress tracking
export interface ProgressTracker {
  currentCompany: number;
  totalCompanies: number;
  completed: string[];
  failed: string[];
  inProgress?: string;
  startTime: string;
  estimatedTimeRemaining?: string;
}

// Data quality metrics
export interface DataQualityMetrics {
  totalRecords: number;
  recordsWithRequiredFields: number;
  recordsWithOptionalFields: Record<string, number>;
  averageDescriptionLength: number;
  duplicateCount: number;
  validUrlCount: number;
  dataQualityScore: number; // 0-100
} 