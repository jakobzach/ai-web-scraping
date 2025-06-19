import { Page } from "@browserbasehq/stagehand";
import { CareerPageResult } from "../types/index.js";
export declare class CareerPageFinder {
    private page;
    private baseUrl;
    constructor(page: Page, baseUrl: string);
    findCareerPage(companyUrl: string): Promise<CareerPageResult>;
    private isCareerUrl;
    private validateCurrentPage;
    private checkForJobContent;
}
//# sourceMappingURL=CareerPageFinder.d.ts.map