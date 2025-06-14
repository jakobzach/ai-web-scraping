import { Page } from "@browserbasehq/stagehand";
import { z } from "zod";
import { CareerPageResult, CareerLink, CareerPageDetectionStrategy } from "../types/index.js";

export class CareerPageFinder {
  private page: Page;
  private baseUrl: string;
  
  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = new URL(baseUrl).origin; // Normalize to get base domain
  }

  /**
   * Main method to find the career page for a given company URL
   * Uses pure Stagehand approach with multilingual support
   */
  async findCareerPage(companyUrl: string): Promise<CareerPageResult> {
    const startTime = Date.now();
    const strategiesAttempted: string[] = ['stagehand_multilingual'];

    try {
      // Navigate to the company's main page first
      await this.page.goto(companyUrl, { waitUntil: 'domcontentloaded' });
      
      // Let Stagehand handle everything with multilingual commands
      await this.page.act("navigate to the careers, jobs, karriere, stellenangebote, or hiring section");
      
      // Wait for potential navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Validate current page
      const validation = await this.validateCurrentPage();
      
      const result: CareerPageResult = {
        success: validation.isCareerPage,
        confidence: validation.confidence,
        metadata: {
          searchTimeMs: Date.now() - startTime,
          strategiesAttempted,
          linksAnalyzed: 0
        }
      };

      if (validation.isCareerPage) {
        const currentUrl = this.page.url();
        if (currentUrl) {
          result.careerPageUrl = currentUrl;
          result.detectionStrategy = CareerPageDetectionStrategy.STAGEHAND_NAVIGATION;
        }
      } else {
        result.error = 'No career page found';
      }

      return result;

    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Error during career page navigation',
        metadata: {
          searchTimeMs: Date.now() - startTime,
          strategiesAttempted,
          linksAnalyzed: 0
        }
      };
    }
  }

  /**
   * Check if a URL appears to be a career page (English + German patterns)
     */
  private isCareerUrl(url: string): boolean {
    const careerPatterns = [
      // English patterns
      '/career', '/job', '/hiring', '/work-with-us', '/opportunities', '/join-us', '/employment', '/positions',
      // German patterns
      '/karriere', '/stellenangebote', '/jobs', '/arbeitsplätze', '/bewerbung', '/offene-stellen'
    ];
    
    return careerPatterns.some(pattern => url.toLowerCase().includes(pattern));
  }

  /**
   * Validates the current page to determine if it's a career page
   * Returns validation result with confidence score
   */
  private async validateCurrentPage(): Promise<{ isCareerPage: boolean; confidence: number }> {
    try {
      const currentUrl = this.page.url();
      
      // Check URL patterns (English + German)
      const urlIndicatesCareer = currentUrl && this.isCareerUrl(currentUrl);
      
      // Use Stagehand to check page content
      const hasJobContent = await this.checkForJobContent();
      
      // Calculate confidence based on URL and content
      let confidence = 0;
      if (urlIndicatesCareer) confidence += 0.3;
      if (hasJobContent) confidence += 0.7;
      
      return {
        isCareerPage: confidence > 0.5,
        confidence: Math.min(confidence, 1.0)
      };
      
    } catch (error) {
      console.error('Error validating current page:', error);
      return { isCareerPage: false, confidence: 0 };
    }
  }

  /**
   * Use Stagehand to check if the page contains job-related content
   */
  private async checkForJobContent(): Promise<boolean> {
    try {
      const result = await this.page.extract({
        instruction: "check if this page contains job listings, career opportunities, stellenangebote, or hiring information",
        schema: z.object({
          hasJobContent: z.boolean(),
          indicators: z.array(z.string()).optional()
        })
      });
      
      return result?.hasJobContent || false;
      
    } catch (error) {
      console.error('Error checking job content:', error);
      return false;
    }
  }


} 