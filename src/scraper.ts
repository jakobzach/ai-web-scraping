// Main scraper implementation using proven patterns from manual-debug.ts
// Target: ~100-150 lines, focus on reliability over features

import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
import { CompanyInput, JobListing, JobExtractionSchema, ScrapingMetadata, JobType, LanguageOfListing } from './types.js';
import { readCompaniesFromCSV, writeCompaniesCSV, writeJobsJSON, generateJobId, cleanJobData, isValidUrl, ensureUrlProtocol } from './utils.js';

dotenv.config();

export class SimpleScraper {
  private stagehand: Stagehand;
  private runId: string;

  constructor() {
    this.runId = generateJobId();
    
    // Proven working configuration from manual-debug.ts
    this.stagehand = new Stagehand({
      env: "LOCAL",
      modelName: "gpt-4o-mini",
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    });
  }

  async init(): Promise<void> {
    await this.stagehand.init();
  }

  async close(): Promise<void> {
    await this.stagehand.close();
  }



  /**
   * Handle cookie banners using proven observe→act pattern from manual-debug.ts
   */
  private async handleCookies(): Promise<void> {
    const page = this.stagehand.page;
    
    console.log("Waiting for page load...");
    await page.waitForTimeout(1000);

    console.log("Handling cookies...");
    
    // Proven pattern: observe first, then act (multilingual support)
    let actions = await page.observe("Click the Accept All button, Alle akzeptieren, Akzeptieren, or Cookies annehmen button");
    
    if (actions && actions.length > 0) {
      console.log("Found cookie actions via observe, acting...");
      await page.act(actions[0]!);
    } else {
      console.log("No actions found via observe, trying direct act...");
      try {
        await page.act("Click the Accept All button or Alle akzeptieren button");
      } catch (error) {
        console.log("Direct act failed, continuing anyway:", error);
      }
    }
    
    await page.waitForTimeout(1000);
  }

  /**
   * Navigate to careers page - smart handling with CSV URL discovery
   */
  private async navigateToCareers(company: CompanyInput): Promise<{ url: string | null; discovered: boolean }> {
    const page = this.stagehand.page;
    
    // If CSV has careers URL, navigate directly
    if (company.careers_url) {
      console.log(`Using known careers URL: ${company.careers_url}`);
      try {
        await page.goto(company.careers_url);
        await page.waitForTimeout(2000);
        return { url: company.careers_url, discovered: false };
      } catch (error) {
        console.log(`Failed to navigate to known careers URL: ${error}`);
        // Fall through to discovery method
      }
    }
    
    // Discovery method for unknown careers URLs
    console.log("Discovering careers page...");
    
    const actions = await page.observe("Navigate to careers, jobs, karriere, stellenangebote, bewerbung, or arbeitsplätze page");
    
    if (actions && actions.length > 0) {
      console.log("Found careers navigation via observe, acting...");
      await page.act(actions[0]!);
      await page.waitForTimeout(2000);
      const discoveredUrl = page.url();
      
      // Basic URL validation to confirm success
      if (discoveredUrl && discoveredUrl !== company.website && !discoveredUrl.includes('#')) {
        console.log(`Successfully discovered careers URL: ${discoveredUrl}`);
        return { url: discoveredUrl, discovered: true };
      } else {
        console.log("Navigation didn't lead to a valid careers page");
        return { url: null, discovered: false };
      }
    } else {
      console.log("No careers navigation found");
      return { url: null, discovered: false };
    }
  }

  /**
   * Extract jobs from current careers page using Stagehand's schema-based extract
   */
  private async extractJobs(company: CompanyInput, careersUrl: string): Promise<JobListing[]> {
    const page = this.stagehand.page;
    const jobs: JobListing[] = [];
    
    try {
      console.log("Extracting jobs from careers page...");
      
      // Use Stagehand's schema-based extract method with centralized schema
      const extractedData = await page.extract({
        instruction: "Extract all job listings visible on this careers page.",
        schema: JobExtractionSchema
      });
      
      console.log(`Raw extraction result:`, JSON.stringify(extractedData, null, 2));
      
      // Process extracted jobs using the schema-based data
      if (extractedData?.jobs && Array.isArray(extractedData.jobs)) {
        for (const jobData of extractedData.jobs) {
          const jobInput: Partial<JobListing> = {
            title: jobData.title,
            description: jobData.description || undefined,
            company: company.name,
            scrapeTimestamp: new Date().toISOString(),
            scrapeRunId: this.runId
          };
          
          // Only include optional fields if they have values (handling nullable)
          if (jobData.location && jobData.location.trim()) jobInput.location = jobData.location.trim();
          if (jobData.type && jobData.type.trim()) {
            const jobType = Object.values(JobType).find(t => t === jobData.type!.trim());
            if (jobType) jobInput.type = jobType;
          }
          if (jobData.languageOfListing && jobData.languageOfListing.trim()) {
            const language = Object.values(LanguageOfListing).find(l => l === jobData.languageOfListing!.trim());
            if (language) jobInput.languageOfListing = language;
          }
          
          // Handle URL with fallback to careers page
          const extractedUrl = jobData.url?.trim();
          if (extractedUrl && isValidUrl(extractedUrl)) {
            jobInput.url = extractedUrl;
          } else {
            // Use careers page URL as fallback when individual job URL not found
            jobInput.url = careersUrl;
          }
          
          const cleanedJob = cleanJobData(jobInput);
          
          if (cleanedJob) {
            jobs.push(cleanedJob);
          }
        }
      }
      
      console.log(`Successfully extracted ${jobs.length} jobs`);
      
      // Try to load more jobs if pagination exists
      try {
        const loadMoreActions = await page.observe("Click load more jobs or show more positions");
        if (loadMoreActions && loadMoreActions.length > 0) {
          console.log("Found load more button, clicking...");
          await page.act(loadMoreActions[0]!);
          await page.waitForTimeout(2000);
          
          // Extract additional jobs after pagination using centralized schema
          const moreData = await page.extract({
            instruction: "Extract all job listings visible on this careers page.",
            schema: JobExtractionSchema
          });
          
          if (moreData?.jobs && Array.isArray(moreData.jobs)) {
            for (const jobData of moreData.jobs) {
              const jobInput: Partial<JobListing> = {
                title: jobData.title,
                description: jobData.description || undefined,
                company: company.name,
                scrapeTimestamp: new Date().toISOString(),
                scrapeRunId: this.runId
              };
              
              // Only include optional fields if they have values (handling nullable)
              if (jobData.location && jobData.location.trim()) jobInput.location = jobData.location.trim();
              if (jobData.type && jobData.type.trim()) {
                const jobType = Object.values(JobType).find(t => t === jobData.type!.trim());
                if (jobType) jobInput.type = jobType;
              }
              if (jobData.languageOfListing && jobData.languageOfListing.trim()) {
                const language = Object.values(LanguageOfListing).find(l => l === jobData.languageOfListing!.trim());
                if (language) jobInput.languageOfListing = language;
              }
              
              // Handle URL with fallback to careers page
              const extractedUrl = jobData.url?.trim();
              if (extractedUrl && isValidUrl(extractedUrl)) {
                jobInput.url = extractedUrl;
              } else {
                // Use careers page URL as fallback when individual job URL not found
                jobInput.url = careersUrl;
                console.log(`Using careers page fallback for ${jobData.title}: ${careersUrl}`);
              }
              
              const cleanedJob = cleanJobData(jobInput);
              
              if (cleanedJob) {
                jobs.push(cleanedJob);
              }
            }
          }
          
          console.log(`Total jobs after pagination: ${jobs.length}`);
        }
      } catch (paginationError) {
        console.log("No pagination found or pagination failed:", paginationError);
      }
      
    } catch (error) {
      console.error(`Job extraction failed for ${company.name}:`, error);
    }
    
    return jobs;
  }

  /**
   * Scrape a single company using proven patterns
   */
  async scrapeCompany(company: CompanyInput): Promise<JobListing[]> {
    const page = this.stagehand.page;
    const jobs: JobListing[] = [];
    
    try {
      console.log(`\n=== Scraping ${company.name} ===`);
      console.log(`Website: ${company.website}`);
      
      // Navigate to company website (ensure protocol)
      await page.goto(ensureUrlProtocol(company.website));
      
      // Handle cookies using proven pattern
      await this.handleCookies();
      
      // Navigate to careers page (smart handling)
      const careersResult = await this.navigateToCareers(company);
      
      if (careersResult.url) {
        console.log(`Found careers page: ${careersResult.url}`);
        
        // If we discovered a new careers URL, update the company object
        if (careersResult.discovered) {
          company.careers_url = careersResult.url;
          console.log(`✅ Discovered and saved new careers URL for ${company.name}`);
        }
        
        // Extract jobs using Stagehand's extract method
        const extractedJobs = await this.extractJobs(company, careersResult.url);
        jobs.push(...extractedJobs);
        
      } else {
        console.log("Could not find careers page");
      }
      
    } catch (error) {
      console.error(`Error scraping ${company.name}:`, error);
    }
    
    return jobs;
  }

  /**
   * Process all companies from CSV
   */
  async scrapeAll(csvPath: string): Promise<void> {
    const startTime = new Date().toISOString();
    console.log(`Starting scrape run ${this.runId} at ${startTime}`);
    
    // Read companies from CSV
    const companies = await readCompaniesFromCSV(csvPath);
    console.log(`Loaded ${companies.length} companies from CSV`);
    
    const allJobs: JobListing[] = [];
    let successful = 0;
    let failed = 0;
    let newCareersUrlsDiscovered = 0;
    
    // Process each company
    for (const company of companies) {
      try {
        const originalCareersUrl = company.careers_url;
        const jobs = await this.scrapeCompany(company);
        allJobs.push(...jobs);
        successful++;
        
        // Track new careers URL discoveries
        if (!originalCareersUrl && company.careers_url) {
          newCareersUrlsDiscovered++;
        }
        
        // Rate limiting: 2-5 second delays between companies
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Failed to scrape ${company.name}:`, error);
        failed++;
      }
    }
    
    // Write updated companies back to CSV if any new careers URLs were discovered
    if (newCareersUrlsDiscovered > 0) {
      console.log(`\n💾 Writing updated CSV with ${newCareersUrlsDiscovered} new careers URLs...`);
      await writeCompaniesCSV(csvPath, companies);
    }
    
    // Create metadata
    const metadata: ScrapingMetadata = {
      runId: this.runId,
      runTimestamp: startTime,
      totalJobs: allJobs.length,
      companiesProcessed: companies.length,
      companiesSuccessful: successful,
      companiesFailed: failed
    };
    
    // Write output
    await writeJobsJSON('public/jobs.json', allJobs, metadata);
    
    console.log(`\n=== Scrape Complete ===`);
    console.log(`Total jobs found: ${allJobs.length}`);
    console.log(`Companies successful: ${successful}`);
    console.log(`Companies failed: ${failed}`);
  }
} 