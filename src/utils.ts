// Essential utilities for simplified AI web scraper
// Target: ~50 lines vs current 238+ lines in utils/CSVProcessor.ts

import fs from 'fs-extra';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { CompanyInput, JobListing, JobsOutput, ScrapingMetadata, JobType, LanguageOfListing } from './types.js';

/**
 * Normalize website URL for deduplication and matching
 */
export function normalizeWebsiteUrl(url: string): string {
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim();
}

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
    const seenWebsites = new Set<string>();
    
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
          const normalizedWebsite = normalizeWebsiteUrl(row.website.trim());
          
          // Skip duplicates based on normalized website URL
          if (seenWebsites.has(normalizedWebsite)) {
            console.log(`⚠️  Skipping duplicate website: ${row.website} (company: ${row.name})`);
            return;
          }
          
          seenWebsites.add(normalizedWebsite);
          companies.push({
            name: row.name.trim(),
            website: row.website.trim(),
            careers_url: row.careers_url?.trim() || undefined
          });
        }
      })
      .on('end', () => {
        console.log(`📊 Loaded ${companies.length} unique companies from CSV (deduplication applied)`);
        resolve(companies);
      })
      .on('error', reject);
  });
}

/**
 * Write companies back to CSV with discovered careers URLs
 * Can update specific companies by website URL or write entire array
 */
export async function writeCompaniesCSV(filePath: string, companies: CompanyInput[], updateCompany?: {
  website: string;
  careers_url: string;
}): Promise<void> {
  let finalCompanies = companies;
  
  // If we have an update for a specific company, apply it
  if (updateCompany) {
    const normalizedUpdateWebsite = normalizeWebsiteUrl(updateCompany.website);
    const companyIndex = companies.findIndex(c => 
      normalizeWebsiteUrl(c.website) === normalizedUpdateWebsite
    );
    
    if (companyIndex !== -1) {
      // Create a copy and update the specific company
      finalCompanies = [...companies];
      const existingCompany = finalCompanies[companyIndex]!;
      finalCompanies[companyIndex] = {
        name: existingCompany.name,
        website: existingCompany.website,
        careers_url: updateCompany.careers_url
      };
    } else {
      console.log(`⚠️  Company with website ${updateCompany.website} not found for update`);
    }
  }
  
  const csvContent = [
    'Name,Website,CareersPage',
    ...finalCompanies.map(c => `"${c.name}","${c.website}","${c.careers_url || ''}"`)
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
 * Ensure URL has proper protocol (guarantees https://)
 */
export function ensureUrlProtocol(url: string): string {
  if (!url) return url;
  
  // Convert http:// to https:// or add https:// if no protocol
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url.startsWith('https://') ? url : `https://${url}`;
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