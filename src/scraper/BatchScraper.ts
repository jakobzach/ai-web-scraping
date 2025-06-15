import { CompanyInput, CompanyScrapingResult, BatchScrapingResult, ScrapingStatus, ScrapingMetadata, BatchSummary, ProgressTracker } from '../types/index.js';
import { StagehandManager } from './StagehandManager.js';
import { CareerPageFinder } from './CareerPageFinder.js';
import { JobExtractor } from './JobExtractor.js';
import { DataProcessor } from '../utils/DataProcessor.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simple batch scraper for sequential processing of multiple companies
 * Keeps it simple: one company at a time, basic error handling, clear progress
 */
export class BatchScraper {
  private runId: string;
  private stagehandManager: StagehandManager;
  private delayMs: number;
  private useRandomDelay: boolean;
  private progress: ProgressTracker;
  private isInterrupted: boolean = false;
  
  constructor(delayMs: number = 3000, useRandomDelay: boolean = true) {
    this.runId = uuidv4();
    this.stagehandManager = new StagehandManager();
    this.delayMs = Math.max(2000, Math.min(5000, delayMs)); // Enforce 2-5 second range
    this.useRandomDelay = useRandomDelay;
    
    // Initialize progress tracker
    this.progress = {
      currentCompany: 0,
      totalCompanies: 0,
      completed: [],
      failed: [],
      startTime: new Date().toISOString()
    };
    
    // Set up graceful interruption handling
    this.setupInterruptionHandling();
  }

  /**
   * Process a list of companies sequentially
   * Simple approach: iterate through companies one by one
   */
  async processCompanies(companies: CompanyInput[]): Promise<BatchScrapingResult> {
    const startTime = new Date().toISOString();
    const results: CompanyScrapingResult[] = [];
    
    // Initialize progress tracking
    this.progress.totalCompanies = companies.length;
    this.progress.startTime = startTime;
    
    console.log(`🚀 Starting batch scraping run ${this.runId}`);
    const delayInfo = this.useRandomDelay ? '2-5s random delays' : `${this.delayMs / 1000}s delays`;
    console.log(`📋 Processing ${companies.length} companies with ${delayInfo}...\n`);
    
    this.displayProgressHeader();

    // Initialize browser
    try {
      await this.stagehandManager.initialize();
      console.log('✅ Browser initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }

    // Process each company sequentially
    for (let i = 0; i < companies.length; i++) {
      // Check for interruption
      if (this.isInterrupted) {
        console.log('\n⚠️ Processing interrupted by user. Cleaning up...');
        break;
      }
      
      const company = companies[i];
      if (!company) continue; // Skip undefined entries
      
      // Update progress tracking
      this.progress.currentCompany = i + 1;
      this.progress.inProgress = company.name;
      this.updateEstimatedTime(i);
      
      this.displayProgressStatus();
      console.log(`📍 [${i + 1}/${companies.length}] Processing: ${company.name}`);
      
      const result = await this.scrapeCompany(company);
      results.push(result);
      
      // Update progress tracking with results
      if (result.status === ScrapingStatus.SUCCESS) {
        this.progress.completed.push(company.name);
        console.log(`   ✅ Success: ${result.jobListings.length} jobs found`);
      } else {
        this.progress.failed.push(company.name);
        console.log(`   ❌ Failed: ${result.error}`);
      }
      
      // Add delay between companies (except for the last one)
      if (i < companies.length - 1 && !this.isInterrupted) {
        const actualDelay = this.useRandomDelay ? this.getRandomDelay() : this.delayMs;
        console.log(`   ⏳ Waiting ${actualDelay / 1000}s before next company...`);
        await this.delay(actualDelay);
      }
      console.log(''); // Empty line for readability
    }
    
    // Clear in-progress status
    delete this.progress.inProgress;

    // Cleanup
    try {
      await this.stagehandManager.close();
      console.log('🧹 Browser cleanup completed');
    } catch (error) {
      console.warn('⚠️ Warning: Browser cleanup failed:', error);
    }

    const endTime = new Date().toISOString();
    
    if (this.isInterrupted) {
      this.displayInterruptionSummary(results);
    } else {
      this.displayFinalProgress();
    }
    
    return this.createBatchResult(startTime, endTime, companies.length, results);
  }

  /**
   * Scrape a single company
   * Simple workflow: find careers page → extract jobs → process data
   */
  private async scrapeCompany(company: CompanyInput): Promise<CompanyScrapingResult> {
    const startTime = Date.now();
    
    try {
      const page = await this.stagehandManager.createNewPage();
      
      // Step 1: Navigate to company website
      console.log(`   🌐 Navigating to ${company.website}`);
      await page.goto(company.website);
      
      // Step 1.5: Handle cookie consent banners
      await this.stagehandManager.handleCookieBanner();
      
      // Step 2: Find careers page
      console.log(`   🔍 Looking for careers page...`);
      const careerFinder = new CareerPageFinder(page, company.website);
      const careerResult = await careerFinder.findCareerPage(company.website);
      
      if (!careerResult.success) {
        return this.createFailedResult(company, 'Could not find careers page', startTime);
      }
      
      console.log(`   📄 Found careers page: ${careerResult.careerPageUrl}`);
      
      // Step 3: Extract jobs
      console.log(`   📊 Extracting job listings...`);
      const jobExtractor = new JobExtractor(page, company.name, this.runId);
      const jobResult = await jobExtractor.extractAllJobs();
      
      if (!jobResult.success || jobResult.jobListings.length === 0) {
        return this.createFailedResult(company, 'No job listings found', startTime);
      }
      
      // Step 4: Process and clean data
      const processedJobs = DataProcessor.processJobs(jobResult.jobListings);
      
      const metadata: ScrapingMetadata = {
        processingTimeMs: Date.now() - startTime,
        jobsFound: processedJobs.processedJobs.length,
        retryCount: 0,
        lastAttempt: new Date().toISOString()
      };
      
      // Only add careersPageUrl if it exists
      if (careerResult.careerPageUrl) {
        metadata.careersPageUrl = careerResult.careerPageUrl;
      }
      
      return {
        company: company.name,
        website: company.website,
        status: ScrapingStatus.SUCCESS,
        jobListings: processedJobs.processedJobs,
        metadata
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createFailedResult(company, errorMessage, startTime);
    }
  }

  /**
   * Create a failed result for a company
   */
  private createFailedResult(company: CompanyInput, error: string, startTime: number): CompanyScrapingResult {
    return {
      company: company.name,
      website: company.website,
      status: ScrapingStatus.FAILED,
      jobListings: [],
      error,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        jobsFound: 0,
        retryCount: 0,
        lastAttempt: new Date().toISOString()
      }
    };
  }

  /**
   * Get a random delay between 2-5 seconds
   */
  private getRandomDelay(): number {
    return Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000; // Random between 2000-5000ms
  }

  /**
   * Simple delay function to pause between requests
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Display progress header (simple table-like format)
   */
  private displayProgressHeader(): void {
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│                    BATCH PROGRESS TRACKER                  │');
    console.log('├────────────────────────────────────────────────────────────┤');
  }

  /**
   * Display current progress status
   */
  private displayProgressStatus(): void {
    const completed = this.progress.completed.length;
    const failed = this.progress.failed.length;
    const total = this.progress.totalCompanies;
    const current = this.progress.currentCompany;
    
    const progressBar = this.createProgressBar(completed + failed, total);
    const eta = this.progress.estimatedTimeRemaining || 'calculating...';
    
    console.log(`│ Progress: ${progressBar} [${completed + failed}/${total}]`);
    console.log(`│ Success: ${completed} | Failed: ${failed} | ETA: ${eta}`);
    console.log('├────────────────────────────────────────────────────────────┤');
  }

  /**
   * Create a simple progress bar
   */
  private createProgressBar(current: number, total: number): string {
    const width = 20;
    const filled = Math.round((current / total) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    const percentage = Math.round((current / total) * 100);
    return `${bar} ${percentage}%`;
  }

  /**
   * Update estimated time remaining
   */
  private updateEstimatedTime(currentIndex: number): void {
    if (currentIndex === 0) return; // Can't estimate from first company
    
    const elapsed = Date.now() - new Date(this.progress.startTime).getTime();
    const avgTimePerCompany = elapsed / currentIndex;
    const remaining = (this.progress.totalCompanies - currentIndex) * avgTimePerCompany;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      this.progress.estimatedTimeRemaining = `${minutes}m ${seconds}s`;
    } else {
      this.progress.estimatedTimeRemaining = `${seconds}s`;
    }
  }

  /**
   * Display final progress summary
   */
  private displayFinalProgress(): void {
    const completed = this.progress.completed.length;
    const failed = this.progress.failed.length;
    const total = this.progress.totalCompanies;
    const progressBar = this.createProgressBar(total, total);
    
    console.log(`│ FINAL: ${progressBar} [${total}/${total}] ✅ COMPLETE`);
    console.log(`│ Final Results: ${completed} successful, ${failed} failed`);
    console.log('└────────────────────────────────────────────────────────────┘\n');
  }

  /**
   * Get current progress information
   */
  getProgress(): ProgressTracker {
    return { ...this.progress };
  }

  /**
   * Set up graceful interruption handling for Ctrl+C
   */
  private setupInterruptionHandling(): void {
    const handleInterruption = () => {
      console.log('\n\n⚠️ Interrupt signal received (Ctrl+C)');
      console.log('🛑 Gracefully stopping batch processing...');
      this.isInterrupted = true;
    };

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', handleInterruption);
    
    // Handle SIGTERM (termination signal)
    process.on('SIGTERM', handleInterruption);
  }

  /**
   * Display interruption summary showing what was completed
   */
  private displayInterruptionSummary(results: CompanyScrapingResult[]): void {
    const completed = this.progress.completed.length;
    const failed = this.progress.failed.length;
    const total = this.progress.totalCompanies;
    const processed = completed + failed;
    
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    INTERRUPTED - PARTIAL RESULTS           │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Processed: ${processed}/${total} companies before interruption`);
    console.log(`│ Successful: ${completed} | Failed: ${failed}`);
    console.log(`│ Interrupted during: ${this.progress.inProgress || 'unknown'}`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ ✅ Browser cleaned up successfully                          │');
    console.log('│ 💾 Partial results available in batch summary              │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
  }

  /**
   * Create the final batch result with summary
   */
  private createBatchResult(startTime: string, endTime: string, totalCompanies: number, results: CompanyScrapingResult[]): BatchScrapingResult {
    const successful = results.filter(r => r.status === ScrapingStatus.SUCCESS);
    const failed = results.filter(r => r.status === ScrapingStatus.FAILED);
    
    const totalJobs = successful.reduce((sum, r) => sum + r.jobListings.length, 0);
    const avgJobsPerCompany = successful.length > 0 ? Math.round(totalJobs / successful.length) : 0;
    const avgProcessingTime = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.metadata.processingTimeMs, 0) / results.length) : 0;
    
    const summary: BatchSummary = {
      totalJobsFound: totalJobs,
      averageJobsPerCompany: avgJobsPerCompany,
      averageProcessingTimeMs: avgProcessingTime,
      topPerformingCompanies: successful
        .sort((a, b) => b.jobListings.length - a.jobListings.length)
        .slice(0, 3)
        .map(r => r.company),
      problematicWebsites: failed.map(r => r.website)
    };
    
    const result: BatchScrapingResult = {
      runId: this.runId,
      startTime,
      endTime,
      totalCompanies,
      successfulCompanies: successful.length,
      failedCompanies: failed.length,
      results,
      summary
    };

    // Add interruption information if applicable
    if (this.isInterrupted) {
      console.log('📊 Batch result includes partial data due to interruption');
    }

    return result;
  }
} 