// Essential utilities for simplified AI web scraper
// Target: ~50 lines vs current 238+ lines in utils/CSVProcessor.ts

import fs from 'fs-extra';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { CompanyInput, JobListing, JobsOutput, ScrapingMetadata, JobType, LanguageOfListing } from './types.js';

/**
 * Read companies from CSV file - simple version
 * Expected columns: Name, Website, Careers-URL (optional)
 */
export async function readCompaniesFromCSV(filePath: string): Promise<CompanyInput[]> {
  if (!await fs.pathExists(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  return new Promise((resolve, reject) => {
    const companies: CompanyInput[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => {
          const h = header.toLowerCase().trim();
          if (h.includes('name') || h.includes('company')) return 'name';
          if (h.includes('website') || h.includes('url')) return 'website';  
          if (h.includes('careers') || h.includes('career')) return 'careers_url';
          return header;
        }
      }))
      .on('data', (row: any) => {
        if (row.name && row.website) {
          companies.push({
            name: row.name.trim(),
            website: row.website.trim(),
            careers_url: row.careers_url?.trim() || undefined
          });
        }
      })
      .on('end', () => resolve(companies))
      .on('error', reject);
  });
}

/**
 * Write companies back to CSV with discovered careers URLs
 */
export async function writeCompaniesCSV(filePath: string, companies: CompanyInput[]): Promise<void> {
  const csvContent = [
    'Name,Website,CareersPage',
    ...companies.map(c => `"${c.name}","${c.website}","${c.careers_url || ''}"`)
  ].join('\n');
  
  await fs.writeFile(filePath, csvContent, 'utf8');
}

/**
 * Write jobs to /public/jobs.json for frontend consumption
 */
export async function writeJobsJSON(filePath: string, jobs: JobListing[], metadata: ScrapingMetadata): Promise<void> {
  const output: JobsOutput = { metadata, jobs };
  await fs.ensureDir('public');
  await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf8');
}

/**
 * Generate unique job ID
 */
export function generateJobId(): string {
  return uuidv4();
}

/**
 * Ensure URL has proper protocol (adds https:// if missing)
 */
export function ensureUrlProtocol(url: string): string {
  if (!url) return url;
  return url.startsWith('http') ? url : `https://${url}`;
}

/**
 * Check if a string is a valid URL (http/https or relative path)
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for absolute URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  // Check for relative URLs (starts with / or contains . for file extensions)
  if (url.startsWith('/') || url.includes('.')) {
    return true;
  }

  return false;
}

/**
 * Convert string to JobType enum value
 */
function stringToJobType(value: string | null | undefined): JobType | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return Object.values(JobType).find(jobType => jobType === trimmed) || undefined;
}

/**
 * Convert string to LanguageOfListing enum value
 */
function stringToLanguageOfListing(value: string | null | undefined): LanguageOfListing | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return Object.values(LanguageOfListing).find(lang => lang === trimmed) || undefined;
}

/**
 * Basic job data cleaning
 */
export function cleanJobData(job: Partial<JobListing>): JobListing | null {
  if (!job.title || !job.company) return null;
  
  const cleaned: JobListing = {
    id: job.id || generateJobId(),
    company: job.company.trim(),
    title: job.title.trim(),
    scrapeTimestamp: job.scrapeTimestamp || new Date().toISOString(),
    scrapeRunId: job.scrapeRunId || '',
    // Include all optional fields (will be undefined if not provided)
    description: job.description?.trim() || undefined,
    location: job.location?.trim() || undefined,
    type: stringToJobType(job.type as string),
    url: job.url?.trim() || undefined,
    languageOfListing: stringToLanguageOfListing(job.languageOfListing as string)
  };
  
  return cleaned;
} 