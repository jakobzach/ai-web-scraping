import { Page } from "@browserbasehq/stagehand";
import { JobListing, JobExtractionResult } from "../types/index.js";
import { jobExtractionSchema } from "../types/schemas.js";
import { v4 as uuidv4 } from "uuid";

export class JobExtractor {
  private page: Page;
  private companyName: string;
  private scrapeRunId: string;
  
  constructor(page: Page, companyName: string, scrapeRunId: string) {
    this.page = page;
    this.companyName = companyName;
    this.scrapeRunId = scrapeRunId;
  }

  /**
   * Extract job listings from the current page using Stagehand's extract() method
   * Simple approach: let Stagehand handle the complexity of finding and parsing job data
   */
  async extractJobs(): Promise<JobExtractionResult> {
    const startTime = Date.now();
    const currentUrl = this.page.url() || '';

    try {
      // Use Stagehand to extract structured job data with multilingual support
      const result = await this.page.extract({
        instruction: "extract all job listings from this page including title, description, location, job type, and URL. Include jobs in English and German (stellenangebote, arbeitsplätze)",
        schema: jobExtractionSchema
      });

      const jobListings: JobListing[] = [];

      if (result?.jobs && Array.isArray(result.jobs)) {
        for (const job of result.jobs) {
          const jobListing: JobListing = {
            id: uuidv4(),
            company: this.companyName,
            title: job.title,
            description: job.description,
            scrapeTimestamp: new Date().toISOString(),
            scrapeRunId: this.scrapeRunId,
            url: job.url || currentUrl
          };
          
          // Only add optional properties if they exist
          if (job.location) {
            jobListing.location = job.location;
          }
          if (job.type) {
            jobListing.type = job.type;
          }
          
          jobListings.push(jobListing);
        }
      }

      return {
        success: jobListings.length > 0,
        jobListings,
        totalFound: jobListings.length,
        metadata: {
          extractionTimeMs: Date.now() - startTime,
          pageUrl: currentUrl
        }
      };

    } catch (error) {
      return {
        success: false,
        jobListings: [],
        totalFound: 0,
        error: error instanceof Error ? error.message : 'Unknown error during job extraction',
        metadata: {
          extractionTimeMs: Date.now() - startTime,
          pageUrl: currentUrl
        }
      };
    }
  }

  /**
   * Handle pagination by trying to load more jobs if available
   * Simple approach: try common "load more" patterns
   */
  async handlePagination(): Promise<boolean> {
    try {
      // Try to find and click load more buttons or pagination
      await this.page.act("click on load more jobs, show more, or next page if available");
      
      // Wait for potential content loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      // No pagination available or failed to load more
      return false;
    }
  }

  /**
   * Extract jobs with pagination handling
   * Automatically handles multiple pages of job listings
   */
  async extractAllJobs(): Promise<JobExtractionResult> {
    const allJobs: JobListing[] = [];
    let totalExtractionTime = 0;
    let hasMorePages = true;
    let pageCount = 0;
    const maxPages = 5; // Limit to prevent infinite loops

    try {
      while (hasMorePages && pageCount < maxPages) {
        pageCount++;
        
        // Extract jobs from current page
        const pageResult = await this.extractJobs();
        totalExtractionTime += pageResult.metadata.extractionTimeMs;
        
        if (pageResult.success && pageResult.jobListings.length > 0) {
          allJobs.push(...pageResult.jobListings);
          
          // Try to load more jobs
          hasMorePages = await this.handlePagination();
        } else {
          hasMorePages = false;
        }
      }

      return {
        success: allJobs.length > 0,
        jobListings: allJobs,
        totalFound: allJobs.length,
        metadata: {
          extractionTimeMs: totalExtractionTime,
          pageUrl: this.page.url() || ''
        }
      };

    } catch (error) {
      return {
        success: allJobs.length > 0, // Partial success if we got some jobs
        jobListings: allJobs,
        totalFound: allJobs.length,
        error: error instanceof Error ? error.message : 'Error during paginated extraction',
        metadata: {
          extractionTimeMs: totalExtractionTime,
          pageUrl: this.page.url() || ''
        }
      };
    }
  }
} 