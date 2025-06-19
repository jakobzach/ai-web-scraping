import { z } from "zod";
export var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "Full-time";
    JobType["PART_TIME"] = "Part-time";
    JobType["CONTRACT"] = "Contract";
    JobType["INTERNSHIP"] = "Internship";
})(JobType || (JobType = {}));
export var LanguageOfListing;
(function (LanguageOfListing) {
    LanguageOfListing["ENGLISH"] = "en";
    LanguageOfListing["GERMAN"] = "de";
    LanguageOfListing["FRENCH"] = "fr";
})(LanguageOfListing || (LanguageOfListing = {}));
const jobFieldDefinitions = {
    title: z.string().describe("The exact job title as displayed on the page"),
    description: z.string().describe("The complete job description, summary, or requirements text"),
    location: z.string().describe("The job location (city, country, 'Remote', etc.) or null if not specified"),
    type: z.nativeEnum(JobType).describe("Employment type from predefined options"),
    url: z.string().describe("The actual href URL from the apply/view job button or link"),
    languageOfListing: z.nativeEnum(LanguageOfListing).describe("The language of the job listing using ISO language codes")
};
export const JobExtractionItemSchema = z.object({
    title: jobFieldDefinitions.title,
    description: jobFieldDefinitions.description,
    location: jobFieldDefinitions.location.nullable(),
    type: jobFieldDefinitions.type.nullable(),
    url: jobFieldDefinitions.url.nullable(),
    languageOfListing: jobFieldDefinitions.languageOfListing.nullable()
});
export const JobExtractionSchema = z.object({
    jobs: z.array(JobExtractionItemSchema)
});
export const JobListingSchema = z.object({
    id: z.string(),
    company: z.string(),
    title: jobFieldDefinitions.title,
    scrapeTimestamp: z.string(),
    scrapeRunId: z.string(),
    description: jobFieldDefinitions.description.optional(),
    location: jobFieldDefinitions.location.optional(),
    type: jobFieldDefinitions.type.optional(),
    url: jobFieldDefinitions.url.optional(),
    languageOfListing: jobFieldDefinitions.languageOfListing.optional()
});
//# sourceMappingURL=types.js.map