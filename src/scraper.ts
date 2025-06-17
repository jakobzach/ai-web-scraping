// Main scraper implementation using proven patterns from manual-debug.ts
// Target: ~100-150 lines, focus on reliability over features

import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from '../stagehand.config.js';
import { CompanyInput, JobListing, JobExtractionSchema, ScrapingMetadata, JobType, LanguageOfListing } from './types.js';
import { z } from 'zod';
import { readCompaniesFromCSV, writeCompaniesCSV, writeJobsJSON, generateJobId, cleanJobData, isValidUrl, ensureUrlProtocol } from './utils.js';

export class SimpleScraper {
  private stagehand: Stagehand;
  private runId: string;

  constructor() {
    this.runId = generateJobId();
    this.stagehand = new Stagehand(StagehandConfig); // Use centralized Stagehand configuration with German language support
  }

  async init(): Promise<void> {
    await this.stagehand.init();
  }

  async close(): Promise<void> {
    await this.stagehand.close();
  }

  getPage(): any {
    return this.stagehand.page;
  }



  /**
   * Handle cookie banners using proven observe→act pattern
   */
  async handleCookies(): Promise<void> {
    const page = this.stagehand.page;
    
    console.log("Waiting for page load...");
    await page.waitForTimeout(1000);

    console.log("Handling cookies...");
    
    // Proven pattern: observe first, then act (multilingual support)
    let actions = await page.observe("Click the 'Accept All', 'Alle akzeptieren', 'Akzeptieren', or 'Cookies annehmen' button");
    
    if (actions && actions.length > 0) {
      console.log("Found cookie actions via observe, acting...");
      await page.act(actions[0]!);
    } else {
      console.log("No actions found via observe, trying direct act...");
      try {
        await page.act("Click the 'Accept All' button or 'Alle akzeptieren' button");
      } catch (error) {
        console.log("Direct act failed, continuing anyway:", error);
      }
    }
    
    await page.waitForTimeout(1000);
  }

  /**
   * Navigate to careers page - smart handling with CSV URL discovery and validation
   */
  private async navigateToJobListings(company: CompanyInput): Promise<{ 
    url: string | null; 
    discovered: boolean; 
    confidence: 'high' | 'medium' | 'low';
    validationNotes: string[];
  }> {
    const page = this.stagehand.page;
    
    // If CSV has careers URL, navigate directly
    if (company.careers_url) {
      console.log(`Using known job listings URL: ${company.careers_url}`);
      try {
        await page.goto(company.careers_url);
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`Failed to navigate to known job listings URL: ${error}`);
        // Fall through to discovery method
      }
    }
    
    // Discovery method for unknown careers URLs
    console.log("Discovering careers page...");

    console.log("Extracting hrefs...");

    // href extraction approach for job listings page discovery
    const hrefs = await page.$$eval('a', links => 
      links.map(link => link.href).filter(href => href)
    );

    const uniqueHrefs = hrefs.filter((href, index, self) => 
      self.indexOf(href) === index
    );

    const jobListingsHrefs = uniqueHrefs.filter(href => href.includes("stellen"));
    console.log("Job listings hrefs:", jobListingsHrefs);

    const careersHrefs = uniqueHrefs.filter(href => href.includes("karriere") || href.includes("jobs") || href.includes("career"));
    console.log("Careers hrefs:", careersHrefs);

    // Choose best href with priority: stellenangebote > karriere/jobs/careers
    let bestHref = null;
    if (jobListingsHrefs.length > 0) {
      bestHref = jobListingsHrefs[0];
      console.log(`Selected job listings href: ${bestHref}`);
    } else if (careersHrefs.length > 0) {
      bestHref = careersHrefs[0];
      console.log(`Selected careers href: ${bestHref}`);
    }

    // Try href approach first
    if (bestHref) {
      try {
        console.log(`Navigating to discovered href: ${bestHref}`);
        await page.goto(bestHref);
        await page.waitForTimeout(1000);
        const discoveredUrl = page.url();
        
        // Check for external career systems first
        const externalResult = await this.detectExternalCareerSystem(discoveredUrl, company);
        if (externalResult) {
          return externalResult;
        }
        
        // Validate discovered URL
        const validation = await this.validateCareersPage(discoveredUrl, company.website);
        
        if (validation.confidence === 'high') {
          console.log(`Href approach successful with high confidence: ${discoveredUrl}`);
          return { 
            url: discoveredUrl, 
            discovered: true,
            confidence: validation.confidence,
            validationNotes: validation.notes
          };
        } else if (validation.confidence === 'medium') {
          console.log(`Href approach found medium confidence page, trying deeper navigation...`);
          const deeperResult = await this.handleNestedCareersStructure(discoveredUrl, company);
          if (deeperResult) {
            return deeperResult;
          }
          
          // If deeper navigation fails, return the medium confidence result
          return { 
            url: discoveredUrl, 
            discovered: true,
            confidence: validation.confidence,
            validationNotes: validation.notes
          };
        } else {
          console.log(`Href approach failed validation: ${validation.notes.join(', ')}`);
          console.log("Falling back to page.observe approach...");
        }
        
      } catch (error) {
        console.log(`Href navigation failed: ${error}, falling back to page.observe approach...`);
      }
    } else {
      console.log("No suitable hrefs found, using page.observe approach...");
    }

    // Fallback to page.observe approach if href approach didn't work 
    const actions = await page.observe("Gehe zur Seite für Stellenangebote, Bewerbung, Karriere,Arbeitsplätze, Careers, Jobs. Der Link zu der Seite kann auch ein Unterpunkt in einem Menü sein.");
    console.log("Observed the following Actions:", JSON.stringify(actions, null, 2));

    if (actions && actions.length > 0) {
             console.log("Selected best action:", actions[0]);
       
       await page.act(actions[0]!);
      await page.waitForTimeout(1000);
      const discoveredUrl = page.url();
      
      // Check for external career systems first
      const externalResult = await this.detectExternalCareerSystem(discoveredUrl, company);
      if (externalResult) {
        return externalResult;
      }
      
      // Validate discovered URL
      const validation = await this.validateCareersPage(discoveredUrl, company.website);
      
      if (validation.confidence === 'high') {
        console.log(`Successfully discovered careers URL: ${discoveredUrl} (confidence: ${validation.confidence})`);
        return { 
          url: discoveredUrl, 
          discovered: true,
          confidence: validation.confidence,
          validationNotes: validation.notes
        };
      } else if (validation.confidence === 'medium') {
        console.log(`Medium confidence careers page found, trying deeper navigation...`);
        // Try to navigate deeper for better results
        const deeperResult = await this.handleNestedCareersStructure(discoveredUrl, company);
        if (deeperResult) {
          return deeperResult;
        }
        
        // If deeper navigation fails, return the medium confidence result
        return { 
          url: discoveredUrl, 
          discovered: true,
          confidence: validation.confidence,
          validationNotes: validation.notes
        };
      } else {
        console.log(`Navigation failed validation: ${validation.notes.join(', ')}`);
        console.log("Current URL:", page.url());
      
        
        return { 
          url: null, 
          discovered: false,
          confidence: 'low',
          validationNotes: ['No careers navigation found', ...validation.notes]
        };
      }
    } else {
      console.log("No careers navigation found");
      return { 
        url: null, 
        discovered: false,
        confidence: 'low',
        validationNotes: ['No careers navigation elements detected']
      };
    }
  }

  /**
   * Handle nested career page structures - navigate deeper to find actual job listings
   */
  private async handleNestedCareersStructure(currentUrl: string, company: CompanyInput): Promise<{
    url: string | null; 
    discovered: boolean; 
    confidence: 'high' | 'medium' | 'low';
    validationNotes: string[];
  } | null> {
    const page = this.stagehand.page;
    
    console.log(`Trying deeper navigation from: ${currentUrl}`);
    
    const actions = await page.observe("Finde die Seite für 'Stellenangebote', 'Offene Stellen', 'Alle Stellen', 'Aktuelle Stellen', 'Vakanz', 'Alle Jobs', 'Jobs anzeigen' oder 'Bewerbung'");
    console.log("Observed the following Actions:", JSON.stringify(actions, null, 2));
    
    if (actions && actions.length > 0) {
      await page.act(actions[0]!);
      await page.waitForTimeout(2000);
      
      const deeperUrl = page.url();
      
      // Don't navigate to the same page
      if (deeperUrl === currentUrl) {
        console.log(`Deeper navigation stayed on same page...`);
        return {
          url: currentUrl,
          discovered: true,
          confidence: 'medium',
          validationNotes: ['Deeper navigation stayed on same page']
        };
      }
      
      console.log(`Navigated deeper to: ${deeperUrl}`);
      
      // Validate the deeper page
      const validation = await this.validateCareersPage(deeperUrl, company.website);
      
      if (validation.confidence === 'high') {
        console.log(`Deeper navigation successful with high confidence: ${deeperUrl}`);
        return {
          url: deeperUrl,
          discovered: true,
          confidence: validation.confidence,
          validationNotes: validation.notes
        };
      } else if (validation.confidence === 'medium') {
        console.log(`Deeper navigation found medium confidence page: ${deeperUrl}`);
        return {
          url: deeperUrl,
          discovered: true,
          confidence: validation.confidence,
          validationNotes: validation.notes
        };
      }
    }
    
    console.log(`No successful deeper navigation found from ${currentUrl}`);
    return null;
  }

  /**
   * Detect external career systems (Workday, BambooHR, etc.) and handle appropriately
   */
  private async detectExternalCareerSystem(url: string, company: CompanyInput): Promise<{
    url: string | null; 
    discovered: boolean; 
    confidence: 'high' | 'medium' | 'low';
    validationNotes: string[];
  } | null> {
    const page = this.stagehand.page;
    
    // Known external career system domains
    const externalSystems = [
      'workday.com',
      'workdayjobs.com', 
      'myworkdayjobs.com',
      'bamboohr.com',
      'lever.co',
      'greenhouse.io',
      'smartrecruiters.com',
      'jobvite.com',
      'icims.com',
      'taleo.net',
      'successfactors.com'
    ];
    
    const isExternalSystem = externalSystems.some(domain => url.includes(domain));
    
    if (isExternalSystem) {
      console.log(`Detected external career system: ${url}`);
      
      try {
        // Wait for external system to load
        await page.waitForTimeout(2000);
        
        // Handle cookies using the existing method
        await this.handleCookies();
        
        // Validate the external system using the same method as regular career pages
        const validation = await this.validateCareersPage(url, company.website);
        
        console.log(`External career system validation: ${validation.confidence} confidence`);
        return {
          url: url,
          discovered: true,
          confidence: validation.confidence,
          validationNotes: ['External career system detected', ...validation.notes]
        };
        
      } catch (error) {
        console.log(`Error handling external career system: ${error}`);
        return {
          url: url,
          discovered: true,
          confidence: 'low',
          validationNotes: ['External career system detected', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
      }
    }
    
    // Skip complex external link extraction - too unreliable
    console.log("Skipping external link detection for simplicity");
    
    return null;
  }





  /**
   * Validate if a page is actually a careers page with hardcoded validation logic
   */
  private async validateCareersPage(url: string, websiteUrl: string): Promise<{
    confidence: 'high' | 'medium' | 'low';
    notes: string[];
    linkToJobListings: string | null;
  }> {
    const page = this.stagehand.page;
    const notes: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let linkToJobListings: string | null = null;
    
    // Critical failure: URL is same as website URL
    const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const normalizedWebsite = websiteUrl.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    if (normalizedUrl === normalizedWebsite) {
      notes.push('URL is same as website homepage - definitely not careers page');
      return { confidence: 'low', notes, linkToJobListings: null };
    }
    
    try { // Extract page content for validation
      const PageValidationSchema = z.object({
        hasJobListings: z.boolean().describe("Whether there are visible job listings"),
        hasLinksToJobListings: z.boolean().describe("Whether there are links to a job listings page"),
        linkToJobListingOverview: z.string().url().nullable().describe("The link to the page that contains the job listings"),
      });
      
      const validation = await page.extract({
        instruction: "Check if this page has job listings or links to a job listings page.",
        schema: PageValidationSchema
      });
      
      console.log(`Page validation: ${JSON.stringify(validation, null, 2)}`);
      
      // Implement validation logic based on existence of a link to a job listings page
      if (validation.hasLinksToJobListings) {
        notes.push('Page has links to job listings');
        confidence = 'medium';
      } else if (validation.hasJobListings) {
        notes.push('Page contains visible job listings');
        confidence = 'high';
      } else {
        notes.push('No job listings or links to job listings found');
        confidence = 'low';
      }
      
      // Add URL-based validation as backup
      const urlLower = url.toLowerCase();
      const hasCareerKeywords = ['job', 'career', 'karriere', 'bewerbung'].some(keyword => 
        urlLower.includes(keyword)
      );
      const hasStellenangeboteKeywords = ['stellenangebot', 'stellen'].some(keyword => 
        urlLower.includes(keyword)
      );

      if (validation.linkToJobListingOverview) {
        linkToJobListings = validation.linkToJobListingOverview;
      }
      
      if (hasStellenangeboteKeywords) {
        notes.push('URL contains stellenangebote-related keywords');
        confidence = 'high';
      }else if (hasCareerKeywords) {
        notes.push('URL contains career-related keywords');
        // Don't downgrade high confidence, but can upgrade low to medium
        if (confidence === 'low') {
          confidence = 'medium';
        }
      }
      
    } catch (error) {
      notes.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      confidence = 'low';
    }
    
    return { confidence, notes, linkToJobListings };
  }


  /**
   * Process raw job data from extraction into JobListing format
   */
  private processJobData(jobData: any, company: CompanyInput, careersUrl: string): JobListing | null {
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
    
    return cleanJobData(jobInput);
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
      
      // Process extracted jobs using the helper method
      if (extractedData?.jobs && Array.isArray(extractedData.jobs)) {
        for (const jobData of extractedData.jobs) {
          const cleanedJob = this.processJobData(jobData, company, careersUrl);
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
          
          // Process additional jobs using the same helper method
          if (moreData?.jobs && Array.isArray(moreData.jobs)) {
            for (const jobData of moreData.jobs) {
              const cleanedJob = this.processJobData(jobData, company, careersUrl);
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
      const careersResult = await this.navigateToJobListings(company);
      
      if (careersResult.url) {
        console.log(`Found careers page: ${careersResult.url} (confidence: ${careersResult.confidence})`);
        console.log(`Validation notes: ${careersResult.validationNotes.join(', ')}`);
        
        // If we discovered a new careers URL, update the company object
        if (careersResult.discovered) {
          company.careers_url = careersResult.url;
          console.log(`✅ Discovered and saved new careers URL for ${company.name}`);
        }
        
        // Extract jobs using Stagehand's extract method
        const extractedJobs = await this.extractJobs(company, careersResult.url);
        jobs.push(...extractedJobs);
        
      } else {
        console.log(`Could not find careers page. Validation notes: ${careersResult.validationNotes.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`Error scraping ${company.name}:`, error);
    }
    
    return jobs;
  }

  /**
   * Process all companies from CSV
   */
  async runFullPipeline(csvPath: string): Promise<void> {
    console.log(`Starting full scrape pipeline...`);
    
    // Phase 1: Discover careers URLs
    await this.scrapeAllCareersURLs(csvPath);
    
    // Phase 2: Extract job details
    await this.scrapeAllJobDetails(csvPath);
  }

  /**
   * Discover careers page URLs for all companies and write back to CSV
   * This method focuses purely on careers page discovery without job extraction
   */
  async scrapeAllCareersURLs(csvPath: string): Promise<void> {
    const startTime = new Date().toISOString();
    console.log(`\n=== Careers URL Discovery ===`);
    console.log(`Starting careers URL discovery run ${this.runId} at ${startTime}`);
    
    // Read companies from CSV
    const companies = await readCompaniesFromCSV(csvPath);
    console.log(`Loaded ${companies.length} companies from CSV`);
    
    let successful = 0;
    let failed = 0;
    let newCareersUrlsDiscovered = 0;
    
    // Process each company
    for (const company of companies) {
      try {
        console.log(`\n=== Discovering careers URL for ${company.name} ===`);
        console.log(`Website: ${company.website}`);
        
        const originalCareersUrl = company.careers_url;
        
        // Skip if we already have a careers URL
        if (originalCareersUrl) {
          console.log(`✅ Already have careers URL: ${originalCareersUrl}`);
          successful++;
          continue;
        }
        
        // Navigate to company website
        const page = this.stagehand.page;
        await page.goto(ensureUrlProtocol(company.website));
        
        // Handle cookies using proven pattern
        await this.handleCookies();

        // Navigate to careers page (smart handling) - this is the core logic from WP 2.5
        const careersResult = await this.navigateToJobListings(company);
        
        if (careersResult.url && careersResult.discovered) {
          console.log(`✅ Discovered careers URL: ${careersResult.url} (confidence: ${careersResult.confidence})`);
          console.log(`Validation notes: ${careersResult.validationNotes.join(', ')}`);
          
          // Update the company object with discovered URL
          company.careers_url = careersResult.url;
          newCareersUrlsDiscovered++;
          successful++;
        } else {
          console.log(`❌ Could not discover careers URL. Notes: ${careersResult.validationNotes.join(', ')}`);
          failed++;
        }
        
        // Rate limiting between companies
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to discover careers URL for ${company.name}:`, error);
        failed++;
      }
    }
    
    // Write updated companies back to CSV with new careers URLs
    if (newCareersUrlsDiscovered > 0) {
      console.log(`\n💾 Writing updated CSV with ${newCareersUrlsDiscovered} new careers URLs...`);
      await writeCompaniesCSV(csvPath, companies);
    }
    
    console.log(`\n=== Careers URL Discovery Complete ===`);
    console.log(`Companies processed: ${companies.length}`);
    console.log(`Careers URLs discovered: ${newCareersUrlsDiscovered}`);
    console.log(`Companies successful: ${successful}`);
    console.log(`Companies failed: ${failed}`);
  }

  /**
   * Extract job details from companies with known careers URLs
   * This method focuses purely on job extraction from discovered careers pages
   */
  async scrapeAllJobDetails(csvPath: string): Promise<void> {
    const startTime = new Date().toISOString();
    console.log(`\n=== Job Details Extraction ===`);
    console.log(`Starting job details extraction run ${this.runId} at ${startTime}`);
    
    // Read companies from CSV (now with careers URLs populated from Phase 1)
    const companies = await readCompaniesFromCSV(csvPath);
    const companiesWithCareersUrls = companies.filter(c => c.careers_url);
    
    console.log(`Loaded ${companies.length} companies from CSV`);
    console.log(`Companies with careers URLs: ${companiesWithCareersUrls.length}`);
    
    if (companiesWithCareersUrls.length === 0) {
      console.log(`⚠️  No companies have careers URLs. Run scrapeAllCareersURLs() first.`);
      return;
    }
    
    const allJobs: JobListing[] = [];
    let successful = 0;
    let failed = 0;
    
    // Process each company with careers URL for job extraction
    for (const company of companiesWithCareersUrls) {
      try {
        console.log(`\n=== Extracting jobs from ${company.name} ===`);
        console.log(`Careers URL: ${company.careers_url}`);
        
        const page = this.stagehand.page;
        
        // Navigate directly to careers page (we already have the URL)
        await page.goto(company.careers_url!);
        
        // Handle cookies using proven pattern
        await this.handleCookies();
        
        // Extract jobs using existing logic
        const extractedJobs = await this.extractJobs(company, company.careers_url!);
        allJobs.push(...extractedJobs);
        
        console.log(`✅ Extracted ${extractedJobs.length} jobs from ${company.name}`);
        successful++;
        
        // Rate limiting between companies
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`❌ Failed to extract jobs from ${company.name}:`, error);
        failed++;
      }
    }
    
    // Create metadata
    const metadata: ScrapingMetadata = {
      runId: this.runId,
      runTimestamp: startTime,
      totalJobs: allJobs.length,
      companiesProcessed: companiesWithCareersUrls.length,
      companiesSuccessful: successful,
      companiesFailed: failed
    };
    
    // Write output
    await writeJobsJSON('public/jobs.json', allJobs, metadata);
    
    console.log(`\n=== Job Details Extraction Complete ===`);
    console.log(`Total jobs extracted: ${allJobs.length}`);
    console.log(`Companies successful: ${successful}`);
    console.log(`Companies failed: ${failed}`);
    console.log(`Output written to: public/jobs.json`);
  }
} 