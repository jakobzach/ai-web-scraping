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
export interface CompanyInput {
    name: string;
    website: string;
}
export interface CompanyScrapingResult {
    company: string;
    website: string;
    status: ScrapingStatus;
    jobListings: JobListing[];
    error?: string;
    metadata: ScrapingMetadata;
}
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
export interface ScrapingMetadata {
    processingTimeMs: number;
    jobsFound: number;
    careersPageUrl?: string;
    retryCount: number;
    lastAttempt: string;
}
export interface BatchSummary {
    totalJobsFound: number;
    averageJobsPerCompany: number;
    averageProcessingTimeMs: number;
    topPerformingCompanies: string[];
    problematicWebsites: string[];
}
export declare enum ScrapingStatus {
    SUCCESS = "success",
    FAILED = "failed",
    PARTIAL = "partial",
    SKIPPED = "skipped"
}
export declare enum JobType {
    FULL_TIME = "full-time",
    PART_TIME = "part-time",
    CONTRACT = "contract",
    INTERNSHIP = "internship",
    REMOTE = "remote",
    HYBRID = "hybrid",
    UNKNOWN = "unknown"
}
export declare enum ErrorType {
    NETWORK_ERROR = "network_error",
    PAGE_STRUCTURE_ERROR = "page_structure_error",
    EXTRACTION_ERROR = "extraction_error",
    RATE_LIMIT_ERROR = "rate_limit_error",
    TIMEOUT_ERROR = "timeout_error",
    UNKNOWN_ERROR = "unknown_error"
}
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
export interface ScrapingConfig {
    delayMs: number;
    maxRetries: number;
    timeoutMs: number;
    headless: boolean;
    enableRecording: boolean;
}
export interface PageTimeoutConfig {
    navigation: number;
    action: number;
    extraction: number;
    networkIdle: number;
    domContentLoaded: number;
}
export interface ProgressTracker {
    currentCompany: number;
    totalCompanies: number;
    completed: string[];
    failed: string[];
    inProgress?: string;
    startTime: string;
    estimatedTimeRemaining?: string;
}
export interface DataQualityMetrics {
    totalRecords: number;
    recordsWithRequiredFields: number;
    recordsWithOptionalFields: Record<string, number>;
    averageDescriptionLength: number;
    duplicateCount: number;
    validUrlCount: number;
    dataQualityScore: number;
}
export interface CareerLink {
    url: string;
    text: string;
    confidence: number;
    strategy: 'pattern' | 'text' | 'navigation' | 'footer' | 'fallback';
}
export interface CareerPageResult {
    success: boolean;
    careerPageUrl?: string;
    detectionStrategy?: string | undefined;
    confidence: number;
    alternativeUrls?: string[];
    error?: string;
    metadata: {
        searchTimeMs: number;
        strategiesAttempted: string[];
        linksAnalyzed: number;
    };
}
export declare enum CareerPageDetectionStrategy {
    STAGEHAND_NAVIGATION = "stagehand_navigation",
    URL_PATTERN = "url_pattern",
    TEXT_SEARCH = "text_search",
    FOOTER_SCAN = "footer_scan",
    NAVIGATION_MENU = "navigation_menu",
    SITE_SEARCH = "site_search",
    CONTACT_PAGE = "contact_page"
}
export interface JobExtractionResult {
    success: boolean;
    jobListings: JobListing[];
    totalFound: number;
    error?: string;
    metadata: {
        extractionTimeMs: number;
        pageUrl: string;
    };
}
export interface ProcessingResult {
    processedJobs: JobListing[];
    duplicatesRemoved: number;
    invalidJobsRemoved: number;
    metadata: {
        originalCount: number;
        finalCount: number;
        processingTimeMs: number;
    };
}
//# sourceMappingURL=index.d.ts.map