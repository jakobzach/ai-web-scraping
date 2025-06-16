import fs from 'fs-extra';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { JobType, LanguageOfListing } from './types.js';
export async function readCompaniesFromCSV(filePath) {
    if (!await fs.pathExists(filePath)) {
        throw new Error(`CSV file not found: ${filePath}`);
    }
    return new Promise((resolve, reject) => {
        const companies = [];
        fs.createReadStream(filePath)
            .pipe(csv({
            mapHeaders: ({ header }) => {
                const h = header.toLowerCase().trim();
                if (h.includes('name') || h.includes('company'))
                    return 'name';
                if (h.includes('website') || h.includes('url'))
                    return 'website';
                if (h.includes('careers') || h.includes('career'))
                    return 'careers_url';
                return header;
            }
        }))
            .on('data', (row) => {
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
export async function writeCompaniesCSV(filePath, companies) {
    const csvContent = [
        'Name,Website,CareersPage',
        ...companies.map(c => `"${c.name}","${c.website}","${c.careers_url || ''}"`)
    ].join('\n');
    await fs.writeFile(filePath, csvContent, 'utf8');
}
export async function writeJobsJSON(filePath, jobs, metadata) {
    const output = { metadata, jobs };
    await fs.ensureDir('public');
    await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf8');
}
export function generateJobId() {
    return uuidv4();
}
export function ensureUrlProtocol(url) {
    if (!url)
        return url;
    return url.startsWith('http') ? url : `https://${url}`;
}
export function isValidUrl(url) {
    if (!url)
        return false;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return true;
    }
    if (url.startsWith('/') || url.includes('.')) {
        return true;
    }
    return false;
}
function stringToJobType(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    return Object.values(JobType).find(jobType => jobType === trimmed) || undefined;
}
function stringToLanguageOfListing(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    return Object.values(LanguageOfListing).find(lang => lang === trimmed) || undefined;
}
export function cleanJobData(job) {
    if (!job.title || !job.company)
        return null;
    const cleaned = {
        id: job.id || generateJobId(),
        company: job.company.trim(),
        title: job.title.trim(),
        scrapeTimestamp: job.scrapeTimestamp || new Date().toISOString(),
        scrapeRunId: job.scrapeRunId || '',
        description: job.description?.trim() || undefined,
        location: job.location?.trim() || undefined,
        type: stringToJobType(job.type),
        url: job.url?.trim() || undefined,
        languageOfListing: stringToLanguageOfListing(job.languageOfListing)
    };
    return cleaned;
}
//# sourceMappingURL=utils.js.map