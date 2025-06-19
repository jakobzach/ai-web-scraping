import { jobExtractionSchema } from "../types/schemas.js";
import { v4 as uuidv4 } from "uuid";
export class JobExtractor {
    page;
    companyName;
    scrapeRunId;
    constructor(page, companyName, scrapeRunId) {
        this.page = page;
        this.companyName = companyName;
        this.scrapeRunId = scrapeRunId;
    }
    async extractJobs() {
        const startTime = Date.now();
        const currentUrl = this.page.url() || '';
        try {
            const result = await this.page.extract({
                instruction: "extract all job listings from this page including title, description, location, job type, and URL. Include jobs in English and German (stellenangebote, arbeitsplätze)",
                schema: jobExtractionSchema
            });
            const jobListings = [];
            if (result?.jobs && Array.isArray(result.jobs)) {
                for (const job of result.jobs) {
                    const jobListing = {
                        id: uuidv4(),
                        company: this.companyName,
                        title: job.title,
                        description: job.description,
                        scrapeTimestamp: new Date().toISOString(),
                        scrapeRunId: this.scrapeRunId,
                        url: job.url || currentUrl
                    };
                    if (job.location) {
                        jobListing.location = job.location;
                    }
                    if (job.type) {
                        jobListing.type = job.type;
                    }
                    jobListings.push(jobListing);
                }
            }
            return {
                success: jobListings.length > 0,
                jobListings,
                totalFound: jobListings.length,
                metadata: {
                    extractionTimeMs: Date.now() - startTime,
                    pageUrl: currentUrl
                }
            };
        }
        catch (error) {
            return {
                success: false,
                jobListings: [],
                totalFound: 0,
                error: error instanceof Error ? error.message : 'Unknown error during job extraction',
                metadata: {
                    extractionTimeMs: Date.now() - startTime,
                    pageUrl: currentUrl
                }
            };
        }
    }
    async handlePagination() {
        try {
            await this.page.act("click on load more jobs, show more, or next page if available");
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async extractAllJobs() {
        const allJobs = [];
        let totalExtractionTime = 0;
        let hasMorePages = true;
        let pageCount = 0;
        const maxPages = 5;
        try {
            while (hasMorePages && pageCount < maxPages) {
                pageCount++;
                const pageResult = await this.extractJobs();
                totalExtractionTime += pageResult.metadata.extractionTimeMs;
                if (pageResult.success && pageResult.jobListings.length > 0) {
                    allJobs.push(...pageResult.jobListings);
                    hasMorePages = await this.handlePagination();
                }
                else {
                    hasMorePages = false;
                }
            }
            return {
                success: allJobs.length > 0,
                jobListings: allJobs,
                totalFound: allJobs.length,
                metadata: {
                    extractionTimeMs: totalExtractionTime,
                    pageUrl: this.page.url() || ''
                }
            };
        }
        catch (error) {
            return {
                success: allJobs.length > 0,
                jobListings: allJobs,
                totalFound: allJobs.length,
                error: error instanceof Error ? error.message : 'Error during paginated extraction',
                metadata: {
                    extractionTimeMs: totalExtractionTime,
                    pageUrl: this.page.url() || ''
                }
            };
        }
    }
}
//# sourceMappingURL=JobExtractor.js.map