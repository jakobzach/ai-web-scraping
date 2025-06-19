import { z } from "zod";
export interface CompanyInput {
    name: string;
    website: string;
    careers_url?: string;
}
export declare enum JobType {
    FULL_TIME = "Full-time",
    PART_TIME = "Part-time",
    CONTRACT = "Contract",
    INTERNSHIP = "Internship"
}
export declare enum LanguageOfListing {
    ENGLISH = "en",
    GERMAN = "de",
    FRENCH = "fr"
}
export declare const JobExtractionItemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodNullable<z.ZodString>;
    type: z.ZodNullable<z.ZodNativeEnum<typeof JobType>>;
    url: z.ZodNullable<z.ZodString>;
    languageOfListing: z.ZodNullable<z.ZodNativeEnum<typeof LanguageOfListing>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    location: string | null;
    type: JobType | null;
    url: string | null;
    languageOfListing: LanguageOfListing | null;
}, {
    title: string;
    description: string;
    location: string | null;
    type: JobType | null;
    url: string | null;
    languageOfListing: LanguageOfListing | null;
}>;
export declare const JobExtractionSchema: z.ZodObject<{
    jobs: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        location: z.ZodNullable<z.ZodString>;
        type: z.ZodNullable<z.ZodNativeEnum<typeof JobType>>;
        url: z.ZodNullable<z.ZodString>;
        languageOfListing: z.ZodNullable<z.ZodNativeEnum<typeof LanguageOfListing>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        location: string | null;
        type: JobType | null;
        url: string | null;
        languageOfListing: LanguageOfListing | null;
    }, {
        title: string;
        description: string;
        location: string | null;
        type: JobType | null;
        url: string | null;
        languageOfListing: LanguageOfListing | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    jobs: {
        title: string;
        description: string;
        location: string | null;
        type: JobType | null;
        url: string | null;
        languageOfListing: LanguageOfListing | null;
    }[];
}, {
    jobs: {
        title: string;
        description: string;
        location: string | null;
        type: JobType | null;
        url: string | null;
        languageOfListing: LanguageOfListing | null;
    }[];
}>;
export declare const JobListingSchema: z.ZodObject<{
    id: z.ZodString;
    company: z.ZodString;
    title: z.ZodString;
    scrapeTimestamp: z.ZodString;
    scrapeRunId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof JobType>>;
    url: z.ZodOptional<z.ZodString>;
    languageOfListing: z.ZodOptional<z.ZodNativeEnum<typeof LanguageOfListing>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    id: string;
    company: string;
    scrapeTimestamp: string;
    scrapeRunId: string;
    description?: string | undefined;
    location?: string | undefined;
    type?: JobType | undefined;
    url?: string | undefined;
    languageOfListing?: LanguageOfListing | undefined;
}, {
    title: string;
    id: string;
    company: string;
    scrapeTimestamp: string;
    scrapeRunId: string;
    description?: string | undefined;
    location?: string | undefined;
    type?: JobType | undefined;
    url?: string | undefined;
    languageOfListing?: LanguageOfListing | undefined;
}>;
export type JobListing = z.infer<typeof JobListingSchema>;
export interface ScrapingMetadata {
    runId: string;
    runTimestamp: string;
    totalJobs: number;
    companiesProcessed: number;
    companiesSuccessful: number;
    companiesFailed: number;
}
export interface JobsOutput {
    metadata: ScrapingMetadata;
    jobs: JobListing[];
}
//# sourceMappingURL=types.d.ts.map