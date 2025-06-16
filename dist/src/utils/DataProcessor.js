export class DataProcessor {
    static processJobs(jobListings) {
        const startTime = Date.now();
        const originalCount = jobListings.length;
        const validJobs = jobListings.filter(job => job.title?.trim() &&
            job.description?.trim() &&
            job.company?.trim());
        const cleanedJobs = validJobs.map(job => {
            const cleaned = {
                ...job,
                title: this.cleanText(job.title),
                description: this.cleanText(job.description)
            };
            if (job.location)
                cleaned.location = this.cleanText(job.location);
            if (job.type)
                cleaned.type = this.normalizeJobType(job.type);
            if (job.url)
                cleaned.url = this.cleanUrl(job.url);
            return cleaned;
        });
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
    static cleanText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .substring(0, 5000);
    }
    static normalizeJobType(type) {
        const normalizedType = type.toLowerCase().trim();
        if (normalizedType.includes('full') ||
            normalizedType.includes('vollzeit') ||
            normalizedType.includes('festanstellung') ||
            normalizedType.includes('unbefristet') ||
            normalizedType.includes('permanent')) {
            return 'full-time';
        }
        if (normalizedType.includes('part') ||
            normalizedType.includes('teilzeit') ||
            normalizedType.includes('minijob') ||
            normalizedType.includes('geringfügig')) {
            return 'part-time';
        }
        if (normalizedType.includes('contract') ||
            normalizedType.includes('freelance') ||
            normalizedType.includes('befristet') ||
            normalizedType.includes('zeitarbeit') ||
            normalizedType.includes('projektarbeit') ||
            normalizedType.includes('freiberuflich') ||
            normalizedType.includes('selbstständig')) {
            return 'contract';
        }
        if (normalizedType.includes('intern') ||
            normalizedType.includes('praktikum') ||
            normalizedType.includes('praktikant') ||
            normalizedType.includes('trainee') ||
            normalizedType.includes('volontariat') ||
            normalizedType.includes('ausbildung')) {
            return 'internship';
        }
        if (normalizedType.includes('remote') ||
            normalizedType.includes('home') ||
            normalizedType.includes('homeoffice') ||
            normalizedType.includes('fernarbeit') ||
            normalizedType.includes('mobil')) {
            return 'remote';
        }
        if (normalizedType.includes('hybrid') ||
            normalizedType.includes('flexibel') ||
            normalizedType.includes('mixed')) {
            return 'hybrid';
        }
        return type;
    }
    static cleanUrl(url) {
        try {
            const cleanUrl = url.trim();
            new URL(cleanUrl);
            return cleanUrl;
        }
        catch {
            return url;
        }
    }
    static removeDuplicates(jobs) {
        const seen = new Map();
        for (const job of jobs) {
            const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
            const existing = seen.get(key);
            if (!existing || job.description.length > existing.description.length) {
                seen.set(key, job);
            }
        }
        return Array.from(seen.values());
    }
    static validateJob(job) {
        const issues = [];
        if (!job.title?.trim())
            issues.push('Missing job title');
        if (!job.description?.trim())
            issues.push('Missing job description');
        if (!job.company?.trim())
            issues.push('Missing company name');
        if (job.title && job.title.length < 3)
            issues.push('Job title too short');
        if (job.description && job.description.length < 20)
            issues.push('Job description too short');
        if (job.url) {
            try {
                new URL(job.url);
            }
            catch {
                issues.push('Invalid job URL');
            }
        }
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    static generateQualityReport(result) {
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
//# sourceMappingURL=DataProcessor.js.map