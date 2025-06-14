import fs from 'fs-extra';
import csv from 'csv-parser';
import { CompanyInput } from '../types/index.js';

/**
 * CSV processing options for different formats and encodings
 */
export interface CSVProcessingOptions {
  /** Column separator (default: auto-detect) */
  separator?: ',' | ';' | '\t' | '|' | string;
  /** File encoding (default: 'utf8') */
  encoding?: BufferEncoding;
  /** Quote character (default: '"') */
  quote?: string;
  /** Escape character (default: quote character) */
  escape?: string;
  /** Skip empty lines (default: true) */
  skipEmptyLines?: boolean;
  /** Has headers (default: true) */
  headers?: boolean;
  /** Custom headers if no headers in file */
  customHeaders?: string[];
}

/**
 * Predefined CSV format presets for common standards
 */
export const CSV_FORMATS = {
  /** Standard US/UK format: comma-separated, UTF-8 */
  STANDARD: { separator: ',', encoding: 'utf8' as BufferEncoding, quote: '"' },
  /** European format: semicolon-separated, UTF-8 (common in Germany, France) */
  EUROPEAN: { separator: ';', encoding: 'utf8' as BufferEncoding, quote: '"' },
  /** Excel European: semicolon-separated, Latin1 encoding */
  EXCEL_EUROPEAN: { separator: ';', encoding: 'latin1' as BufferEncoding, quote: '"' },
  /** Tab-separated values */
  TSV: { separator: '\t', encoding: 'utf8' as BufferEncoding, quote: '"' },
  /** Pipe-separated (less common but used in some systems) */
  PIPE: { separator: '|', encoding: 'utf8' as BufferEncoding, quote: '"' }
} as const;

/**
 * CSV processor for reading company data (Name, Website columns)
 * Supports various CSV formats and encodings commonly used in Europe and globally
 */
export class CSVProcessor {
  
  /**
   * Read company data using a predefined format preset
   */
  async readCompaniesWithFormat(filePath: string, format: keyof typeof CSV_FORMATS, additionalOptions?: Partial<CSVProcessingOptions>): Promise<CompanyInput[]> {
    const formatOptions = CSV_FORMATS[format];
    const mergedOptions = { ...formatOptions, ...additionalOptions };
    return this.readCompanies(filePath, mergedOptions);
  }

  /**
   * Read company data from CSV file
   * Expected columns: Name, Website (case-insensitive)
   * Supports various CSV formats, encodings, and European standards
   */
  async readCompanies(filePath: string, options?: CSVProcessingOptions): Promise<CompanyInput[]> {
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    return new Promise((resolve, reject) => {
      const companies: CompanyInput[] = [];
      
      // File reading options with encoding support
      const readOptions: any = {
        encoding: options?.encoding || 'utf8'
      };
      
      // CSV parsing options with comprehensive format support
      const csvOptions: any = {
        // Headers configuration - auto-detect from first row
        skipEmptyLines: options?.skipEmptyLines !== false, // Default to true
        
        // Auto-detect common column name variations (multilingual support)
        mapHeaders: ({ header }: { header: string }) => {
          const normalizedHeader = header.toLowerCase().trim();
          
          // English variations
          if (['name', 'company', 'company name', 'company_name', 'companyname'].includes(normalizedHeader)) {
            return 'name';
          }
          if (['website', 'url', 'site', 'website url', 'website_url', 'web', 'homepage'].includes(normalizedHeader)) {
            return 'website';
          }
          
          // German variations
          if (['unternehmen', 'firma', 'firmenname', 'gesellschaft'].includes(normalizedHeader)) {
            return 'name';
          }
          if (['webseite', 'internetseite', 'homepage_url', 'webadresse'].includes(normalizedHeader)) {
            return 'website';
          }
          
          return header;
        }
      };

      // Set headers option - default to true unless explicitly disabled
      if (options?.headers === false) {
        csvOptions.headers = false;
      }

      // Handle different CSV formats
      this.configureCsvOptions(csvOptions, options);
      
      // Use custom headers if provided
      if (options?.customHeaders) {
        csvOptions.headers = options.customHeaders;
      }

      const stream = fs.createReadStream(filePath, readOptions)
        .pipe(csv(csvOptions));

      stream.on('data', (row: any) => {
        // Skip empty rows
        if (!row.name || !row.website) {
          console.warn(`Skipping row with missing data:`, row);
          return;
        }

        const validatedCompany = this.validateAndNormalizeCompany({
          name: row.name.trim(),
          website: row.website.trim()
        });

        if (validatedCompany) {
          companies.push(validatedCompany);
        }
      });

      stream.on('end', () => {
        console.log(`Successfully read ${companies.length} companies from CSV`);
        resolve(companies);
      });

      stream.on('error', (error: Error) => {
        reject(new Error(`Failed to read CSV file: ${error.message}`));
      });
    });
  }

  /**
   * Configure CSV parsing options for different formats
   * Supports European standards (semicolon separators) and various quote styles
   */
  private configureCsvOptions(csvOptions: any, options?: CSVProcessingOptions): void {
    // Handle different separators
    if (options?.separator) {
      csvOptions.separator = options.separator;
    } else {
      // Auto-detect common separators by trying to read first few lines
      // For now, use comma as default but csv-parser can handle auto-detection
    }

    // Handle different quote characters
    if (options?.quote) {
      csvOptions.quote = options.quote;
    }

    // Handle escape characters
    if (options?.escape) {
      csvOptions.escape = options.escape;
    }

    // Common European CSV format (semicolon separated)
    if (options?.separator === ';') {
      // Often used with different quote handling in European formats
      csvOptions.quote = csvOptions.quote || '"';
    }

    // Tab-separated values
    if (options?.separator === '\t') {
      csvOptions.quote = csvOptions.quote || '"';
    }
  }

  /**
   * Validate and normalize company data
   * - Ensures required fields are present and valid
   * - Normalizes URLs (adds protocol if missing)
   * - Returns null for invalid entries
   */
  private validateAndNormalizeCompany(company: CompanyInput): CompanyInput | null {
    // Validate required fields
    if (!company.name || company.name.length < 2) {
      console.warn(`Invalid company name: "${company.name}"`);
      return null;
    }

    if (!company.website || company.website.length < 4) {
      console.warn(`Invalid website for ${company.name}: "${company.website}"`);
      return null;
    }

    // Normalize website URL
    const normalizedWebsite = this.normalizeUrl(company.website);
    if (!normalizedWebsite) {
      console.warn(`Could not normalize website for ${company.name}: "${company.website}"`);
      return null;
    }

    return {
      name: company.name,
      website: normalizedWebsite
    };
  }

  /**
   * Normalize URL by adding protocol if missing
   * Simple approach - assumes https:// for most cases
   */
  private normalizeUrl(url: string): string | null {
    try {
      // Remove any whitespace
      url = url.trim();

      // If it already has a protocol, validate it
      if (url.includes('://')) {
        const urlObj = new URL(url);
        return urlObj.href;
      }

      // Add https:// protocol and validate
      const withProtocol = `https://${url}`;
      const urlObj = new URL(withProtocol);
      return urlObj.href;

    } catch (error) {
      return null;
    }
  }
} 