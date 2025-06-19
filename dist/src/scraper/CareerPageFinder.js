import { z } from "zod";
import { CareerPageDetectionStrategy } from "../types/index.js";
export class CareerPageFinder {
    page;
    baseUrl;
    constructor(page, baseUrl) {
        this.page = page;
        this.baseUrl = new URL(baseUrl).origin;
    }
    async findCareerPage(companyUrl) {
        const startTime = Date.now();
        const strategiesAttempted = ['stagehand_multilingual'];
        try {
            await this.page.goto(companyUrl, { waitUntil: 'domcontentloaded' });
            const careerInstructions = [
                'Navigate to jobs section',
                'Go to careers page',
                'Click on jobs',
                'Click on careers',
                'Navigate to karriere',
                'Go to stellenangebote',
                'Find job openings'
            ];
            let navigationSuccessful = false;
            for (const instruction of careerInstructions) {
                try {
                    console.log(`   🔍 Trying: ${instruction}`);
                    const result = await this.page.act(instruction);
                    if (result) {
                        console.log(`   🔍 Career navigation executed`);
                        navigationSuccessful = true;
                        break;
                    }
                }
                catch (error) {
                    console.log(`   ⚠️ ${instruction} failed`);
                    continue;
                }
            }
            if (!navigationSuccessful) {
                console.log(`   ⚠️ Could not navigate to careers section`);
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            const validation = await this.validateCurrentPage();
            const result = {
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
            }
            else {
                result.error = 'No career page found';
            }
            return result;
        }
        catch (error) {
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
    isCareerUrl(url) {
        const careerPatterns = [
            '/career', '/job', '/hiring', '/work-with-us', '/opportunities', '/join-us', '/employment', '/positions',
            '/karriere', '/stellenangebote', '/jobs', '/arbeitsplätze', '/bewerbung', '/offene-stellen'
        ];
        return careerPatterns.some(pattern => url.toLowerCase().includes(pattern));
    }
    async validateCurrentPage() {
        try {
            const currentUrl = this.page.url();
            const urlIndicatesCareer = currentUrl && this.isCareerUrl(currentUrl);
            const hasJobContent = await this.checkForJobContent();
            let confidence = 0;
            if (urlIndicatesCareer)
                confidence += 0.3;
            if (hasJobContent)
                confidence += 0.7;
            return {
                isCareerPage: confidence > 0.5,
                confidence: Math.min(confidence, 1.0)
            };
        }
        catch (error) {
            console.error('Error validating current page:', error);
            return { isCareerPage: false, confidence: 0 };
        }
    }
    async checkForJobContent() {
        try {
            const result = await this.page.extract({
                instruction: "check if this page contains job listings, career opportunities, stellenangebote, or hiring information",
                schema: z.object({
                    hasJobContent: z.boolean(),
                    indicators: z.array(z.string()).nullable().optional()
                })
            });
            return result?.hasJobContent || false;
        }
        catch (error) {
            console.error('Error checking job content:', error);
            return false;
        }
    }
}
//# sourceMappingURL=CareerPageFinder.js.map