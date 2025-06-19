import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from '../stagehand.config.js';
import { JobExtractionSchema, JobType, LanguageOfListing } from './types.js';
import { z } from 'zod';
import { readCompaniesFromCSV, writeCompaniesCSV, writeJobsJSON, generateJobId, cleanJobData, isValidUrl, ensureUrlProtocol } from './utils.js';
export class SimpleScraper {
    stagehand;
    runId;
    testMode;
    constructor(testMode = 'full') {
        this.runId = generateJobId();
        this.testMode = testMode;
        this.stagehand = new Stagehand(StagehandConfig);
    }
    async init() {
        await this.stagehand.init();
        const page = this.stagehand.page;
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
        });
        console.log("🇩🇪 Stagehand initialized with German language support");
    }
    async close() {
        await this.stagehand.close();
    }
    getPage() {
        return this.stagehand.page;
    }
    async handleCookies() {
        const page = this.stagehand.page;
        console.log("Waiting for page load...");
        await page.waitForTimeout(1000);
        console.log("Handling cookies...");
        let actions = await page.observe("Click the Accept All button, Alle akzeptieren, Akzeptieren, or Cookies annehmen button");
        if (actions && actions.length > 0) {
            console.log("Found cookie actions via observe, acting...");
            await page.act(actions[0]);
        }
        else {
            console.log("No actions found via observe, trying direct act...");
            try {
                await page.act("Click the Accept All button or Alle akzeptieren button");
            }
            catch (error) {
                console.log("Direct act failed, continuing anyway:", error);
            }
        }
        await page.waitForTimeout(1000);
    }
    async navigateToCareers(company) {
        const page = this.stagehand.page;
        if (company.careers_url) {
            console.log(`Using known careers URL: ${company.careers_url}`);
            try {
                await page.goto(company.careers_url);
                await page.waitForTimeout(2000);
                const validation = await this.validateCareersPage(company.careers_url, company.website);
                return {
                    url: company.careers_url,
                    discovered: false,
                    confidence: validation.confidence,
                    validationNotes: validation.notes
                };
            }
            catch (error) {
                console.log(`Failed to navigate to known careers URL: ${error}`);
            }
        }
        console.log("Discovering careers page...");
        const actions = await page.observe("Navigate to karriere, stellenangebote, bewerbung, arbeitsplätze, careers, or jobs page");
        if (actions && actions.length > 0) {
            console.log("Found careers navigation via observe, acting...");
            await page.act(actions[0]);
            await page.waitForTimeout(2000);
            const discoveredUrl = page.url();
            const validation = await this.validateCareersPage(discoveredUrl, company.website);
            if (validation.confidence !== 'low') {
                console.log(`Successfully discovered careers URL: ${discoveredUrl} (confidence: ${validation.confidence})`);
                return {
                    url: discoveredUrl,
                    discovered: true,
                    confidence: validation.confidence,
                    validationNotes: validation.notes
                };
            }
            else {
                console.log(`Navigation failed validation: ${validation.notes.join(', ')}`);
                const fallbackResult = await this.tryFallbackNavigation(company);
                if (fallbackResult) {
                    return fallbackResult;
                }
                return {
                    url: null,
                    discovered: false,
                    confidence: 'low',
                    validationNotes: ['No careers navigation found', ...validation.notes]
                };
            }
        }
        else {
            console.log("No careers navigation found");
            return {
                url: null,
                discovered: false,
                confidence: 'low',
                validationNotes: ['No careers navigation elements detected']
            };
        }
    }
    async validateCareersPage(url, websiteUrl) {
        const page = this.stagehand.page;
        const notes = [];
        let confidence = 'medium';
        const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        const normalizedWebsite = websiteUrl.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        if (normalizedUrl === normalizedWebsite) {
            notes.push('URL is same as website homepage - definitely not careers page');
            return { confidence: 'low', notes };
        }
        try {
            const PageValidationSchema = z.object({
                title: z.string().describe("Page title"),
                headings: z.array(z.string()).describe("Main headings on the page"),
                hasJobListings: z.boolean().describe("Whether there are visible job listings"),
                hasApplicationForms: z.boolean().describe("Whether there are job application forms"),
                content: z.string().describe("General page content")
            });
            const pageContent = await page.extract({
                instruction: "Extract the page title, main headings, and any job-related content visible on this page.",
                schema: PageValidationSchema
            });
            const content = pageContent;
            const allText = `${content.title || ''} ${content.headings?.join(' ') || ''} ${content.content || ''}`.toLowerCase();
            const careerKeywords = ['jobs', 'stellenangebote', 'positionen', 'bewerbung'];
            const foundCareerKeywords = careerKeywords.filter(keyword => allText.includes(keyword));
            if (foundCareerKeywords.length >= 2) {
                notes.push(`Found career keywords: ${foundCareerKeywords.join(', ')}`);
                confidence = 'high';
            }
            else if (foundCareerKeywords.length === 1) {
                notes.push(`Found career keyword: ${foundCareerKeywords[0]}`);
                confidence = 'medium';
            }
            if (content.hasJobListings) {
                notes.push('Page contains visible job listings');
                confidence = 'high';
            }
            if (content.hasApplicationForms) {
                notes.push('Page contains job application forms');
                confidence = 'high';
            }
            const negativeKeywords = ['news', 'about', 'contact', 'product', 'service', 'über uns'];
            const foundNegativeKeywords = negativeKeywords.filter(keyword => allText.includes(keyword));
            if (foundNegativeKeywords.length > 0) {
                notes.push(`Found non-career indicators: ${foundNegativeKeywords.join(', ')}`);
                if (confidence === 'high')
                    confidence = 'medium';
                else if (confidence === 'medium')
                    confidence = 'low';
            }
            const genericTitles = ['jobs', 'willkommen im team', 'company news', 'about us'];
            if (genericTitles.some(title => allText.includes(title))) {
                notes.push('Page has generic title - likely wrong page');
                confidence = 'low';
            }
        }
        catch (error) {
            notes.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            confidence = 'low';
        }
        return { confidence, notes };
    }
    async tryFallbackNavigation(company) {
        const page = this.stagehand.page;
        console.log("Trying fallback navigation terms...");
        const fallbackTerms = [
            "Navigate to stellenangebote or jobs",
            "Navigate to offene stellen or open positions",
            "Navigate to arbeiten bei uns or work with us",
        ];
        for (const term of fallbackTerms) {
            try {
                const actions = await page.observe(term);
                if (actions && actions.length > 0) {
                    console.log(`Found fallback navigation with: ${term}`);
                    await page.act(actions[0]);
                    await page.waitForTimeout(1000);
                    const discoveredUrl = page.url();
                    const validation = await this.validateCareersPage(discoveredUrl, company.website);
                    if (validation.confidence !== 'low') {
                        console.log(`Fallback navigation successful: ${discoveredUrl}`);
                        return {
                            url: discoveredUrl,
                            discovered: true,
                            confidence: validation.confidence,
                            validationNotes: [`Fallback navigation with: ${term}`, ...validation.notes]
                        };
                    }
                }
            }
            catch (error) {
                console.log(`Fallback term failed: ${term}`);
            }
        }
        return null;
    }
    processJobData(jobData, company, careersUrl) {
        const jobInput = {
            title: jobData.title,
            description: jobData.description || undefined,
            company: company.name,
            scrapeTimestamp: new Date().toISOString(),
            scrapeRunId: this.runId
        };
        if (jobData.location && jobData.location.trim())
            jobInput.location = jobData.location.trim();
        if (jobData.type && jobData.type.trim()) {
            const jobType = Object.values(JobType).find(t => t === jobData.type.trim());
            if (jobType)
                jobInput.type = jobType;
        }
        if (jobData.languageOfListing && jobData.languageOfListing.trim()) {
            const language = Object.values(LanguageOfListing).find(l => l === jobData.languageOfListing.trim());
            if (language)
                jobInput.languageOfListing = language;
        }
        const extractedUrl = jobData.url?.trim();
        if (extractedUrl && isValidUrl(extractedUrl)) {
            jobInput.url = extractedUrl;
        }
        else {
            jobInput.url = careersUrl;
        }
        return cleanJobData(jobInput);
    }
    async extractJobs(company, careersUrl) {
        const page = this.stagehand.page;
        const jobs = [];
        try {
            console.log("Extracting jobs from careers page...");
            const extractedData = await page.extract({
                instruction: "Extract all job listings visible on this careers page.",
                schema: JobExtractionSchema
            });
            console.log(`Raw extraction result:`, JSON.stringify(extractedData, null, 2));
            if (extractedData?.jobs && Array.isArray(extractedData.jobs)) {
                for (const jobData of extractedData.jobs) {
                    const cleanedJob = this.processJobData(jobData, company, careersUrl);
                    if (cleanedJob) {
                        jobs.push(cleanedJob);
                    }
                }
            }
            console.log(`Successfully extracted ${jobs.length} jobs`);
            try {
                const loadMoreActions = await page.observe("Click load more jobs or show more positions");
                if (loadMoreActions && loadMoreActions.length > 0) {
                    console.log("Found load more button, clicking...");
                    await page.act(loadMoreActions[0]);
                    await page.waitForTimeout(2000);
                    const moreData = await page.extract({
                        instruction: "Extract all job listings visible on this careers page.",
                        schema: JobExtractionSchema
                    });
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
            }
            catch (paginationError) {
                console.log("No pagination found or pagination failed:", paginationError);
            }
        }
        catch (error) {
            console.error(`Job extraction failed for ${company.name}:`, error);
        }
        return jobs;
    }
    async scrapeCompany(company) {
        const page = this.stagehand.page;
        const jobs = [];
        try {
            console.log(`\n=== Scraping ${company.name} ===`);
            console.log(`Website: ${company.website}`);
            await page.goto(ensureUrlProtocol(company.website));
            await this.handleCookies();
            const careersResult = await this.navigateToCareers(company);
            if (careersResult.url) {
                console.log(`Found careers page: ${careersResult.url} (confidence: ${careersResult.confidence})`);
                console.log(`Validation notes: ${careersResult.validationNotes.join(', ')}`);
                if (careersResult.discovered) {
                    company.careers_url = careersResult.url;
                    console.log(`✅ Discovered and saved new careers URL for ${company.name}`);
                }
                if (this.testMode === 'career-detection-only') {
                    console.log(`Test mode: Stopping after career page detection`);
                    return jobs;
                }
                const extractedJobs = await this.extractJobs(company, careersResult.url);
                jobs.push(...extractedJobs);
            }
            else {
                console.log(`Could not find careers page. Validation notes: ${careersResult.validationNotes.join(', ')}`);
            }
        }
        catch (error) {
            console.error(`Error scraping ${company.name}:`, error);
        }
        return jobs;
    }
    async scrapeAll(csvPath) {
        const startTime = new Date().toISOString();
        console.log(`Starting scrape run ${this.runId} at ${startTime}`);
        const companies = await readCompaniesFromCSV(csvPath);
        console.log(`Loaded ${companies.length} companies from CSV`);
        const allJobs = [];
        let successful = 0;
        let failed = 0;
        let newCareersUrlsDiscovered = 0;
        for (const company of companies) {
            try {
                const originalCareersUrl = company.careers_url;
                const jobs = await this.scrapeCompany(company);
                allJobs.push(...jobs);
                successful++;
                if (!originalCareersUrl && company.careers_url) {
                    newCareersUrlsDiscovered++;
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            catch (error) {
                console.error(`Failed to scrape ${company.name}:`, error);
                failed++;
            }
        }
        if (newCareersUrlsDiscovered > 0) {
            console.log(`\n💾 Writing updated CSV with ${newCareersUrlsDiscovered} new careers URLs...`);
            await writeCompaniesCSV(csvPath, companies);
        }
        const metadata = {
            runId: this.runId,
            runTimestamp: startTime,
            totalJobs: allJobs.length,
            companiesProcessed: companies.length,
            companiesSuccessful: successful,
            companiesFailed: failed
        };
        await writeJobsJSON('public/jobs.json', allJobs, metadata);
        console.log(`\n=== Scrape Complete ===`);
        console.log(`Total jobs found: ${allJobs.length}`);
        console.log(`Companies successful: ${successful}`);
        console.log(`Companies failed: ${failed}`);
    }
}
//# sourceMappingURL=scraper.js.map