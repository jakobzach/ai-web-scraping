import fs from 'fs-extra';
import csv from 'csv-parser';
export const CSV_FORMATS = {
    STANDARD: { separator: ',', encoding: 'utf8', quote: '"' },
    EUROPEAN: { separator: ';', encoding: 'utf8', quote: '"' },
    EXCEL_EUROPEAN: { separator: ';', encoding: 'latin1', quote: '"' },
    TSV: { separator: '\t', encoding: 'utf8', quote: '"' },
    PIPE: { separator: '|', encoding: 'utf8', quote: '"' }
};
export class CSVProcessor {
    async readCompaniesWithFormat(filePath, format, additionalOptions) {
        const formatOptions = CSV_FORMATS[format];
        const mergedOptions = { ...formatOptions, ...additionalOptions };
        return this.readCompanies(filePath, mergedOptions);
    }
    async readCompanies(filePath, options) {
        if (!await fs.pathExists(filePath)) {
            throw new Error(`CSV file not found: ${filePath}`);
        }
        return new Promise((resolve, reject) => {
            const companies = [];
            const readOptions = {
                encoding: options?.encoding || 'utf8'
            };
            const csvOptions = {
                skipEmptyLines: options?.skipEmptyLines !== false,
                mapHeaders: ({ header }) => {
                    const normalizedHeader = header.toLowerCase().trim();
                    if (['name', 'company', 'company name', 'company_name', 'companyname'].includes(normalizedHeader)) {
                        return 'name';
                    }
                    if (['website', 'url', 'site', 'website url', 'website_url', 'web', 'homepage'].includes(normalizedHeader)) {
                        return 'website';
                    }
                    if (['unternehmen', 'firma', 'firmenname', 'gesellschaft'].includes(normalizedHeader)) {
                        return 'name';
                    }
                    if (['webseite', 'internetseite', 'homepage_url', 'webadresse'].includes(normalizedHeader)) {
                        return 'website';
                    }
                    return header;
                }
            };
            if (options?.headers === false) {
                csvOptions.headers = false;
            }
            this.configureCsvOptions(csvOptions, options);
            if (options?.customHeaders) {
                csvOptions.headers = options.customHeaders;
            }
            const stream = fs.createReadStream(filePath, readOptions)
                .pipe(csv(csvOptions));
            stream.on('data', (row) => {
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
            stream.on('error', (error) => {
                reject(new Error(`Failed to read CSV file: ${error.message}`));
            });
        });
    }
    configureCsvOptions(csvOptions, options) {
        if (options?.separator) {
            csvOptions.separator = options.separator;
        }
        else {
        }
        if (options?.quote) {
            csvOptions.quote = options.quote;
        }
        if (options?.escape) {
            csvOptions.escape = options.escape;
        }
        if (options?.separator === ';') {
            csvOptions.quote = csvOptions.quote || '"';
        }
        if (options?.separator === '\t') {
            csvOptions.quote = csvOptions.quote || '"';
        }
    }
    validateAndNormalizeCompany(company) {
        if (!company.name || company.name.length < 2) {
            console.warn(`Invalid company name: "${company.name}"`);
            return null;
        }
        if (!company.website || company.website.length < 4) {
            console.warn(`Invalid website for ${company.name}: "${company.website}"`);
            return null;
        }
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
    normalizeUrl(url) {
        try {
            url = url.trim();
            if (url.includes('://')) {
                const urlObj = new URL(url);
                return urlObj.href;
            }
            const withProtocol = `https://${url}`;
            const urlObj = new URL(withProtocol);
            return urlObj.href;
        }
        catch (error) {
            return null;
        }
    }
}
//# sourceMappingURL=CSVProcessor.js.map