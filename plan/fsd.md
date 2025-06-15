# AI Web Scraping MVP - Functional Specification Document

**Project**: Job Listing Web Scraper using Stagehand  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Target**: MVP with 5-10 test companies before scaling to ~200 companies

## 📋 Implementation Overview

This document breaks down the MVP implementation into manageable work packages with step-by-step instructions. Stagehand is absolutely **goated** for this type of web automation task, providing the perfect balance between AI intelligence and developer control.

## 🎯 MVP Goals

- **Validate approach** on 5-10 diverse company websites
- **Extract essential job data** (company, title, description, location, type, URL)
- **Generate JSON output** ready for MongoDB ingestion
- **Robust error handling** with comprehensive logging
- **Sequential processing** with respectful delays

---

## 📦 Work Package 1: Project Setup & Environment

### 1.1 Initialize Project Structure
- [x] Create project directory structure
  ```
  ai-web-scraping/
  ├── src/
  │   ├── scraper/
  │   ├── utils/
  │   └── types/
  ├── data/
  │   ├── input/
  │   └── output/
  ├── logs/
  ├── config/
  └── tests/
  ```

### 1.2 Install Dependencies
- [x] Initialize npm/pnpm project
- [x] Install Stagehand: `npm install @browserbasehq/stagehand`
- [x] Install supporting packages:
  ```bash
  npm install zod csv-parser fs-extra winston dotenv uuid
  npm install -D typescript @types/node ts-node
  ```

### 1.3 Environment Configuration
- [x] Create `.env` file with LLM API keys (OpenAI)
- [x] Set up `stagehand.config.ts` configuration file
- [x] Create TypeScript configuration (`tsconfig.json`)
- [x] Set up logging configuration with Winston

### 1.4 Create Base Types
- [x] Define `JobListing` interface matching PRD schema
- [x] Create `CompanyInput` interface for CSV parsing
- [x] Define error types and status enums

**Estimated Time**: 2-3 hours  
**Dependencies**: None  
**Deliverable**: Fully configured project environment

---

## 📦 Work Package 2: Core Scraping Engine

### 2.1 Stagehand Integration
- [x] Create `StagehandManager` class to handle browser initialization
- [x] Implement proper browser lifecycle management
- [x] Set up page configuration with appropriate timeouts
- [x] Add user agent rotation and stealth settings

### 2.2 Career Page Detection ✅ **SIMPLIFIED APPROACH**
- [x] Create `CareerPageFinder` class with intelligent discovery methods:
  ```typescript
  class CareerPageFinder {
    async findCareerPage(companyUrl: string): Promise<CareerPageResult>
    private async validateCurrentPage(): Promise<{ isCareerPage: boolean; confidence: number }>
    private async checkForJobContent(): Promise<boolean>
  }
  ```
- [x] Implement **Pure Stagehand** career page detection (simplified approach):
  - **Single Strategy**: Use Stagehand's `act()` with multilingual navigation
    ```typescript
    await page.act("navigate to the careers, jobs, karriere, stellenangebote, or hiring section");
    ```
  - **Multilingual Support**: English + German career terms built-in
  - **Intelligent Validation**: URL pattern checking + content analysis using `extract()`
  - **Confidence Scoring**: URL match (30%) + content analysis (70%) for accurate detection
- [x] Implement career page validation:
  - Check URL patterns for English/German career indicators
  - Validate page contains hiring-related content using Stagehand `extract()`
  - Structured content analysis with Zod schema validation
  - Confidence-based success determination (>50% threshold)

### 2.3 Job Listing Extraction
- [x] Implement `JobExtractor` using Stagehand's `extract()` method
- [x] Define extraction schema with Zod for structured data:
  ```typescript
  const jobSchema = z.object({
    title: z.string(),
    description: z.string(),
    location: z.string().optional(),
    type: z.string().optional(),
    url: z.string().optional()
  });
  ```
- [x] Handle pagination and "load more" buttons
- [x] Extract individual job details from listing pages

### 2.4 Data Processing Pipeline ✅ **SIMPLE & FOCUSED**
- [x] Create `DataProcessor` to clean and standardize extracted data
- [x] Generate unique IDs for each job posting (already handled in JobExtractor)
- [x] Implement data validation and quality checks
- [x] Handle duplicate detection within company results
- [x] **Simple Implementation**: Static methods for processing job arrays
  - Basic validation (required fields: title, description, company)
  - Text cleaning (normalize whitespace, limit length)
  - Job type normalization (English/German support)
  - Duplicate removal by title+company combination
  - Quality reporting with processing metrics

**Estimated Time**: 6-8 hours  
**Dependencies**: Work Package 1  
**Deliverable**: Working scraper for single company website

---

## 📦 Work Package 3: Batch Processing & CSV Integration

### 3.1 CSV Input Handler
- [x] Create `CSVProcessor` to read company list (Name, Website columns)
- [x] Implement input validation and URL normalization
- [x] Add support for different CSV formats and encoding

### 3.2 Batch Processing Engine
- [x] Implement `BatchScraper` for sequential processing
- [x] Add configurable delays between requests (2-5 seconds)
- [x] Create progress tracking and status updates
- [x] Implement graceful interruption handling (Ctrl+C)

### 3.3 First Test Run
- [x] Create end-to-end test script using real test-websites.csv data
- [ ] Validate complete pipeline: CSV → Career Page → Job Extraction → Data Processing
  - [x] Add handler for cookie banners
- [ ] Test progress tracking and visual feedback during real scraping
- [ ] Validate graceful interruption with Ctrl+C during live test
- [ ] Measure and document performance metrics (time per company, success rate)
- [ ] Generate and validate JSON output format
- [ ] Document issues found and limitations discovered
- [ ] Create baseline performance benchmarks for future optimization

### 3.4 Rate Limiting & Respect
- [ ] Add domain-based rate limiting
- [ ] Implement random delays to appear more human-like
- [ ] Add `robots.txt` checking (optional but good practice)
- [ ] Monitor and adjust scraping speed based on website response


**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 2  
**Deliverable**: Batch processing capability for multiple companies

---

## 📦 Work Package 4: Error Handling & Logging

### 4.1 Comprehensive Error Handling
- [ ] Create error classification system:
  - Network errors (timeouts, connection issues)
  - Page structure errors (no careers page, changed layout)
  - Extraction errors (missing data, parsing failures)
  - Rate limiting errors (403, 429 responses)
- [ ] Implement retry logic with exponential backoff
- [ ] Add circuit breaker pattern for problematic websites

### 4.2 Detailed Logging System
- [ ] Set up structured logging with Winston
- [ ] Log levels: ERROR, WARN, INFO, DEBUG
- [ ] Create separate log files for:
  - Application events (`app.log`)
  - Error details (`errors.log`)
  - Scraping progress (`scraping.log`)
- [ ] Add request/response logging for debugging

### 4.3 Progress Tracking & Monitoring
- [ ] Implement progress indicators for long-running scrapes
- [ ] Create summary reports after each batch
- [ ] Add metrics collection (success rate, average time per site)
- [ ] Generate error summary for failed scrapes

**Estimated Time**: 4-5 hours  
**Dependencies**: Work Package 3  
**Deliverable**: Robust error handling and comprehensive logging

---

## 📦 Work Package 4.5: Code Cleanup & Type Organization

### 4.5.1 Remove Unused Types & Interfaces
- [ ] Audit all exported types in `src/types/index.ts` for actual usage
- [ ] Remove unused types

### 4.5.2 Clean Up Unused Schemas
- [ ] Audit all schemas in `src/types/schemas.ts` for actual usage
- [ ] Remove unused schemas

### 4.5.3 Organize Remaining Code Structure
- [ ] Consolidate remaining types into logical groups
- [ ] Add documentation comments for all remaining types
- [ ] Ensure consistent naming conventions
- [ ] Verify all imports are working correctly after cleanup

**Estimated Time**: 1-2 hours  
**Dependencies**: Work Package 4  
**Deliverable**: Clean, minimal type system with only used code

---

## 📦 Work Package 5: Data Output & MongoDB Preparation

### 5.1 JSON Output Generation
- [ ] Create `OutputManager` for structured data export
- [ ] Generate timestamped JSON files for each scraping run
- [ ] Implement data compression for large datasets
- [ ] Add output validation against expected schema

### 5.2 MongoDB-Ready Format
- [ ] Ensure JSON structure matches MongoDB collection schema
- [ ] Add metadata fields (scrape_run_id, batch_timestamp)
- [ ] Create separate files for successful vs. failed scrapes
- [ ] Generate import scripts for MongoDB ingestion

### 5.3 Data Quality Assurance
- [ ] Implement data quality checks:
  - Required fields validation
  - Data type validation
  - Content length checks
  - URL validation
- [ ] Create data quality report generation
- [ ] Add statistical analysis of scraped data

**Estimated Time**: 2-3 hours  
**Dependencies**: Work Package 4  
**Deliverable**: Production-ready JSON output for MongoDB

---

## 📦 Work Package 6: Testing & Validation

### 6.1 Test Data Preparation
- [ ] Create curated list of 5-10 test companies with diverse website structures:
  - Large corporation (e.g., Microsoft, Google)
  - Startup with simple careers page
  - Company with ATS integration (Greenhouse, Lever)
  - Non-English website
  - Company with no careers page
- [ ] Document expected results for each test case

### 6.2 End-to-End Testing
- [ ] Run full scraping pipeline on test dataset
- [ ] Validate data extraction accuracy
- [ ] Test error handling for problematic websites
- [ ] Measure performance metrics (time per site, success rate)

### 6.3 Output Validation
- [ ] Verify JSON structure and completeness
- [ ] Test MongoDB import process
- [ ] Validate data quality metrics
- [ ] Generate test results report

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 5  
**Deliverable**: Validated MVP ready for production scaling

---

## 📦 Work Package 7: Documentation & Deployment Prep

### 7.1 Configuration Documentation
- [ ] Document all environment variables and configuration options
- [ ] Create setup instructions for different environments
- [ ] Document LLM provider setup and API key requirements
- [ ] Add troubleshooting guide for common issues

### 7.2 Usage Documentation
- [ ] Create user guide for running the scraper
- [ ] Document CSV input format requirements
- [ ] Explain output format and MongoDB integration
- [ ] Add examples and sample data

### 7.3 Operational Readiness
- [ ] Create deployment checklist
- [ ] Document monitoring and alerting setup
- [ ] Add performance tuning guidelines
- [ ] Create backup and recovery procedures

**Estimated Time**: 2-3 hours  
**Dependencies**: Work Package 6  
**Deliverable**: Complete documentation for operations

---

## 🚀 Implementation Timeline

| Work Package | Estimated Time | Priority | Prerequisites |
|--------------|----------------|----------|---------------|
| WP1: Setup | 2-3 hours | High | None |
| WP2: Core Engine | 6-8 hours | High | WP1 |
| WP3: Batch Processing | 3-4 hours | High | WP2 |
| WP4: Error Handling | 4-5 hours | High | WP3 |
| WP4.5: Code Cleanup | 1-2 hours | Medium | WP4 |
| WP5: Data Output | 2-3 hours | Medium | WP4.5 |
| WP6: Testing | 3-4 hours | High | WP5 |
| WP7: Documentation | 2-3 hours | Low | WP6 |

**Total Estimated Time**: 23-32 hours  
**MVP Target**: Complete WP1-WP6 (21-29 hours)

---

## ✅ Success Criteria

### MVP Completion Checklist
- [ ] Successfully extracts job data from 8/10 test companies
- [ ] Generates valid JSON output for MongoDB ingestion
- [ ] Comprehensive error logging and graceful failure handling
- [ ] Processing time <5 minutes per company website
- [ ] Data quality >80% for required fields (title, description, company)

### Ready for Scale-Up Indicators
- [ ] All test cases pass with acceptable accuracy
- [ ] Error handling robust enough for unsupervised runs
- [ ] Performance metrics within acceptable ranges
- [ ] Documentation complete for operational use
- [ ] Monitoring and alerting systems ready

---

## 🔧 Technical Decisions

### Key Technology Choices
- **Stagehand**: Primary web automation framework (AI + Playwright)
- **TypeScript**: Type safety and better developer experience with ES2022 target
- **ES Modules**: Modern module system with `"type": "module"` for better tree-shaking
- **Zod**: Schema validation for extracted data
- **Winston**: Structured logging and error tracking
- **CSV-Parser**: Input data processing
- **UUID**: Unique identifier generation
- **TSX**: Fast TypeScript execution for development (`tsx` over `ts-node`)

### TypeScript Configuration
- **ES2022**: Modern JavaScript features with top-level await and improved modules
- **Bundler Module Resolution**: Optimal for modern build tools and tree-shaking
- **Strict Mode**: Maximum type safety with `noImplicitAny`, `exactOptionalPropertyTypes`
- **Path Mapping**: Clean imports with `@/` aliases for better code organization
- **Source Maps**: Full debugging support with declaration maps

### ES Modules Support
- **Native ESM**: Full ES modules implementation without CommonJS compatibility layer
- **Import Meta Utilities**: Custom `path.ts` utilities for `__filename`/`__dirname` replacement
- **Modern Node.js**: Leveraging Node.js 18+ native ESM features

### Architecture Principles
- **Sequential Processing**: Start simple, parallelize later if needed
- **Fail-Safe**: Continue processing other companies when one fails
- **Observable**: Comprehensive logging for debugging and monitoring
- **Extensible**: Easy to add new data fields or processing steps
- **Modern Standards**: ES2022, strict TypeScript, and native ESM throughout

Ready to start building this stagehand-powered scraping solution! 🎭
