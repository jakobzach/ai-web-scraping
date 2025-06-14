import { JobListing, ProcessingResult } from "../types/index.js";

export class DataProcessor {
  /**
   * Process and clean job listings from extraction
   * Simple approach: validate, deduplicate, and standardize
   */
  static processJobs(jobListings: JobListing[]): ProcessingResult {
    const startTime = Date.now();
    const originalCount = jobListings.length;
    
    // Step 1: Basic validation - remove jobs with missing required fields
    const validJobs = jobListings.filter(job => 
      job.title?.trim() && 
      job.description?.trim() && 
      job.company?.trim()
    );
    
    // Step 2: Clean and standardize data
    const cleanedJobs = validJobs.map(job => {
      const cleaned: JobListing = {
        ...job,
        title: this.cleanText(job.title),
        description: this.cleanText(job.description)
      };
      
      // Only set optional fields if they exist
      if (job.location) cleaned.location = this.cleanText(job.location);
      if (job.type) cleaned.type = this.normalizeJobType(job.type);
      if (job.url) cleaned.url = this.cleanUrl(job.url);
      
      return cleaned;
    });
    
    // Step 3: Remove duplicates (same title + company)
    const deduplicatedJobs = this.removeDuplicates(cleanedJobs);
    
    const finalCount = deduplicatedJobs.length;
    const invalidJobsRemoved = originalCount - validJobs.length;
    const duplicatesRemoved = cleanedJobs.length - finalCount;
    
    return {
      processedJobs: deduplicatedJobs,
      duplicatesRemoved,
      invalidJobsRemoved,
      metadata: {
        originalCount,
        finalCount,
        processingTimeMs: Date.now() - startTime
      }
    };
  }
  
  /**
   * Clean and normalize text fields
   */
  private static cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
      .substring(0, 5000); // Limit length to prevent extremely long descriptions
  }
  
  /**
   * Normalize job type to standard values with comprehensive German support
   */
  private static normalizeJobType(type: string): string {
    const normalizedType = type.toLowerCase().trim();
    
    // Full-time variations (English & German)
    if (normalizedType.includes('full') || 
        normalizedType.includes('vollzeit') || 
        normalizedType.includes('festanstellung') ||
        normalizedType.includes('unbefristet') ||
        normalizedType.includes('permanent')) {
      return 'full-time';
    }
    
    // Part-time variations (English & German)
    if (normalizedType.includes('part') || 
        normalizedType.includes('teilzeit') ||
        normalizedType.includes('minijob') ||
        normalizedType.includes('geringfügig')) {
      return 'part-time';
    }
    
    // Contract/Freelance variations (English & German)
    if (normalizedType.includes('contract') || 
        normalizedType.includes('freelance') ||
        normalizedType.includes('befristet') ||
        normalizedType.includes('zeitarbeit') ||
        normalizedType.includes('projektarbeit') ||
        normalizedType.includes('freiberuflich') ||
        normalizedType.includes('selbstständig')) {
      return 'contract';
    }
    
    // Internship variations (English & German)
    if (normalizedType.includes('intern') || 
        normalizedType.includes('praktikum') ||
        normalizedType.includes('praktikant') ||
        normalizedType.includes('trainee') ||
        normalizedType.includes('volontariat') ||
        normalizedType.includes('ausbildung')) {
      return 'internship';
    }
    
    // Remote work variations (English & German)
    if (normalizedType.includes('remote') || 
        normalizedType.includes('home') ||
        normalizedType.includes('homeoffice') ||
        normalizedType.includes('fernarbeit') ||
        normalizedType.includes('mobil')) {
      return 'remote';
    }
    
    // Hybrid work variations (English & German)
    if (normalizedType.includes('hybrid') ||
        normalizedType.includes('flexibel') ||
        normalizedType.includes('mixed')) {
      return 'hybrid';
    }
    
    // Return original if no match found
    return type;
  }
  
  /**
   * Clean and validate URLs
   */
  private static cleanUrl(url: string): string {
    try {
      const cleanUrl = url.trim();
      // Basic URL validation
      new URL(cleanUrl);
      return cleanUrl;
    } catch {
      // Return original if URL parsing fails
      return url;
    }
  }
  
  /**
   * Remove duplicate jobs based on title + company combination
   */
  private static removeDuplicates(jobs: JobListing[]): JobListing[] {
    const seen = new Map<string, JobListing>();
    
    for (const job of jobs) {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      
      // Keep the job with more description content if duplicate found
      const existing = seen.get(key);
      if (!existing || job.description.length > existing.description.length) {
        seen.set(key, job);
      }
    }
    
    return Array.from(seen.values());
  }
  
  /**
   * Validate a single job listing for quality
   */
  static validateJob(job: JobListing): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Required field validation
    if (!job.title?.trim()) issues.push('Missing job title');
    if (!job.description?.trim()) issues.push('Missing job description');
    if (!job.company?.trim()) issues.push('Missing company name');
    
    // Quality checks
    if (job.title && job.title.length < 3) issues.push('Job title too short');
    if (job.description && job.description.length < 20) issues.push('Job description too short');
    
    // URL validation
    if (job.url) {
      try {
        new URL(job.url);
      } catch {
        issues.push('Invalid job URL');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Generate quality report for processed jobs
   */
  static generateQualityReport(result: ProcessingResult): string {
    const { processedJobs, duplicatesRemoved, invalidJobsRemoved, metadata } = result;
    
    const report = [
      `Job Processing Quality Report`,
      `================================`,
      `Original jobs: ${metadata.originalCount}`,
      `Invalid jobs removed: ${invalidJobsRemoved}`,
      `Duplicates removed: ${duplicatesRemoved}`,
      `Final job count: ${metadata.finalCount}`,
      `Processing time: ${metadata.processingTimeMs}ms`,
      ``,
      `Quality Metrics:`,
      `- Success rate: ${((metadata.finalCount / metadata.originalCount) * 100).toFixed(1)}%`,
      `- Average title length: ${Math.round(processedJobs.reduce((sum, job) => sum + job.title.length, 0) / processedJobs.length)}`,
      `- Average description length: ${Math.round(processedJobs.reduce((sum, job) => sum + job.description.length, 0) / processedJobs.length)}`,
      `- Jobs with location: ${processedJobs.filter(job => job.location).length}`,
      `- Jobs with type: ${processedJobs.filter(job => job.type).length}`,
      `- Jobs with URL: ${processedJobs.filter(job => job.url).length}`
    ].join('\n');
    
    return report;
  }
} 