export var ScrapingStatus;
(function (ScrapingStatus) {
    ScrapingStatus["SUCCESS"] = "success";
    ScrapingStatus["FAILED"] = "failed";
    ScrapingStatus["PARTIAL"] = "partial";
    ScrapingStatus["SKIPPED"] = "skipped";
})(ScrapingStatus || (ScrapingStatus = {}));
export var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "full-time";
    JobType["PART_TIME"] = "part-time";
    JobType["CONTRACT"] = "contract";
    JobType["INTERNSHIP"] = "internship";
    JobType["REMOTE"] = "remote";
    JobType["HYBRID"] = "hybrid";
    JobType["UNKNOWN"] = "unknown";
})(JobType || (JobType = {}));
export var ErrorType;
(function (ErrorType) {
    ErrorType["NETWORK_ERROR"] = "network_error";
    ErrorType["PAGE_STRUCTURE_ERROR"] = "page_structure_error";
    ErrorType["EXTRACTION_ERROR"] = "extraction_error";
    ErrorType["RATE_LIMIT_ERROR"] = "rate_limit_error";
    ErrorType["TIMEOUT_ERROR"] = "timeout_error";
    ErrorType["UNKNOWN_ERROR"] = "unknown_error";
})(ErrorType || (ErrorType = {}));
export var CareerPageDetectionStrategy;
(function (CareerPageDetectionStrategy) {
    CareerPageDetectionStrategy["STAGEHAND_NAVIGATION"] = "stagehand_navigation";
    CareerPageDetectionStrategy["URL_PATTERN"] = "url_pattern";
    CareerPageDetectionStrategy["TEXT_SEARCH"] = "text_search";
    CareerPageDetectionStrategy["FOOTER_SCAN"] = "footer_scan";
    CareerPageDetectionStrategy["NAVIGATION_MENU"] = "navigation_menu";
    CareerPageDetectionStrategy["SITE_SEARCH"] = "site_search";
    CareerPageDetectionStrategy["CONTACT_PAGE"] = "contact_page";
})(CareerPageDetectionStrategy || (CareerPageDetectionStrategy = {}));
//# sourceMappingURL=index.js.map