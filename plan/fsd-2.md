# AI Web Scraping Simplified - FSD v2

**Project**: Lightweight Job Scraper for Static JSON Output  
**Version**: 2.0  
**Status**: Core Implementation Complete - Quality Improvements Phase  
**Approach**: Minimal scraper → single `jobs.json` file → Next.js frontend

## 📊 Current Status (Post WP2 Completion)

**✅ Completed**: Work Packages 1 & 2 - Core scraper functionality  
**📈 Test Results**: 58 jobs extracted from 13 companies (100% success rate)  
**🎯 Next Phase**: Data quality improvements based on analysis in `/plan/quality-issues.md`

**Key Achievements**:
- Cookie banner handling: 100% success rate
- Career page discovery: 77% success rate (10/13 companies)
- Basic job extraction working with schema validation
- CSV updates and JSON output generation functional

**Quality Issues Identified**:
- 31% missing job descriptions or "null" strings
- 66% missing locations
- 69% missing job types
- 10% duplicate entries
- Some invalid URLs (button text instead of links)

## 🎯 Project Goals

- **Scheduled scraping** via GitHub Actions or Vercel Cron
- **Single JSON output** to `/public/jobs.json` for direct frontend access
- **No database needed** - static JSON serves all data
- **Minimal infrastructure** - low cost, low maintenance
- **Auto-deploy** - commit updated JSON to trigger Vercel redeploy
- **Extract working patterns** from `manual-debug.ts` that handle cookie banners
- **Simple & reliable** over full-featured complexity

---

## 📁 Target Architecture

```
src/
├── scraper.ts       # Main orchestration (100-150 lines)
├── types.ts         # Essential interfaces only (50 lines)
└── utils.ts         # Data helpers + JSON output (50 lines)

data/input/
└── companies.csv    # Name, Website, Careers-URL (gets updated)

public/
└── jobs.json        # Single output file for frontend

.github/workflows/
└── scrape-jobs.yml  # Scheduled GitHub Action (commits CSV + JSON)
```

**Total Target**: ~200-250 lines vs current ~1000+ lines  
**Output**: Single `jobs.json` file, no database needed

---

## 📦 Work Package 1: Extract Working Patterns

### 1.1 Document Working Approach
- [x] Analyze what specifically works in `manual-debug.ts`
- [x] Document the successful cookie banner handling pattern
- [x] Document the successful career page navigation pattern
- [x] Identify minimal Stagehand configuration that works

### 1.2 Create New Types File
- [x] Create `src/types.ts` with only essential interfaces:
  - `CompanyInput` (name, website, careers_url?)
  - `JobListing` (matching PRD schema, optimized for frontend)
  - `ScrapingMetadata` (run timestamp, counts)
- [x] Remove all unused enums, complex configurations, and abstractions

### 1.3 Create Utilities File
- [x] Create `src/utils.ts` with focused helpers:
  - `readCompaniesFromCSV()` - read CSV with Name, Website, Careers-URL columns
  - `writeCompaniesCSV()` - write back discovered careers URLs to CSV
  - `writeJobsJSON()` - output single jobs.json file to /public
  - `generateJobId()` - unique ID generation
  - `cleanJobData()` - basic data cleaning
  - `gitCommitAndPush()` - auto-commit updated CSV + JSON (optional)

**Estimated Time**: 1-2 hours  
**Dependencies**: Analysis of current working patterns  
**Deliverable**: Clean foundation files

---

## 📦 Work Package 2: Core Scraper Implementation

### 2.1 Main Scraper Class
- [x] Create `src/scraper.ts` with single `SimpleScraper` class
- [x] Direct Stagehand initialization (copy working patterns from debug)
- [x] Implement `scrapeCompany()` method using proven approach:
  ```typescript
  // Working pattern from manual-debug.ts
  await page.goto(url);
  await page.observe("Click Accept All button");
  await page.act("Click Accept All button");
  await page.observe("Navigate to careers");
  await page.act("Navigate to careers");
  ```

### 2.2 Cookie Banner Handling
- [x] Extract exact working pattern from `manual-debug.ts`
- [x] Implement as simple method: `handleCookies(page)`
- [x] Support both English and German terms
- [x] Use observe->act pattern that actually works

Addendum: Added support for extracting the language of the listing.

### 2.3 Smart Career Page Handling
- [x] **If CSV has careers URL**: Navigate directly to careers page
- [x] **If CSV missing careers URL**: Use discovery with Stagehand commands
  - Use multilingual navigation: "navigate to careers, jobs, karriere, stellenangebote"
  - Basic URL validation to confirm success
  - **Write discovered URL back to CSV** for future runs
- [x] No complex confidence scoring - just success/failure

### 2.4 Job Extraction
- [x] Use Stagehand's `extract()` with simple schema
- [x] Extract all visible jobs in single operation
- [x] Basic pagination handling with `act("load more")` pattern
- [x] Generate job IDs and clean data inline

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 1  
**Deliverable**: Working single-company scraper

---

## 📦 Work Package 2.5: Career Page Detection Accuracy

**Status**: Focused on improving career page discovery and validation  
**Test Validation**: `/data/input/test-target.csv` contains ground truth careers URLs

### 2.5.1 Enhanced Career Page Detection
- [x] **Improve career page detection accuracy**
  - Use href extraction with smart filtering as the primary option to find the job listing URLs. Stagehand approach as fallback. 
  - If the careers page URL is the same as the website URL, we definitely didn't find the careers page
  - Look for career-specific indicators: job titles, application forms, "Apply" buttons
  - Add fallback retry with different navigation terms if first attempt fails

### 2.5.2 Multi-Level Career Page Navigation
- [x] **Handle nested career page structures**
  - Some sites have careers overview page → separate job listings page
  - Detect when current page has links to actual job listings
  - Navigate one level deeper if needed to find actual job postings
  - Validate we've reached the page with individual job listings

### 2.5.3 Career Page Detection Test
- [x] **Create dedicated test for career page detection**
  - For every test, create a new copy of test-websites.csv with the timestamp as a prefix so we can review old tests
  - Validate test results against `test-target.csv` ground truth data
  - Compare discovered URLs with known correct careers URLs
  - Measure accuracy: exact matches, domain matches, functional equivalents

### 2.5.4 Career Page Validation Logic
- [x] **Implement robust validation**
  - Check for career-specific content indicators
  - Validate page contains job listings or job-related content
  - Reject pages that are clearly not careers-related

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 2  
**Deliverable**: Accurate career page detection with validation test

---

## 📦 Work Package 2.6: Individual Job Detail Extraction

### 2.6.1 Separate existing scrapeAll() code into scrapeAllCareersURLs() (as worked on in 2.3 and 2.5) and scrapeAllJobDetails()
- [x] **Create `scrapeAllCareersURLs(csvPath: string)` method**
  - Read companies from CSV file
  - For each company: run **careers page discovery logic** from `navigateToJobListings()`
  - Use all the career page detection work from WP 2.3 and 2.5 (href extraction, validation, confidence scoring)
  - **Write discovered careers URLs back to CSV** in the `careers_url` column
  - **Stop after URL discovery** - no job extraction in this phase
  - Update CSV with newly discovered careers URLs for future runs
  - Focus purely on populating the careers_url column across all companies

- [x] **Create `scrapeAllJobDetails(csvPath: string)` method**
  - Read companies from CSV file (now with careers URLs populated from phase 1)
  - For each company with a careers_url: navigate directly to that careers page
  - Run **job extraction logic** from `extractJobs()` method
  - Extract job listings, handle pagination, process job data
  - Rate limiting between companies during job extraction
  - Output final `jobs.json` with detailed job data
  - This phase can run independently after careers URL discovery is complete

### 2.6.2 Create file to run scrapeAllCareersURLs() for ad hoc use
- [x] **Create `discover-careers-urls.ts` script**
  - Simple command-line script to run careers URL discovery on any CSV file
  - Takes CSV path as command line argument (defaults to `data/input/companies.csv`)
  - Shows basic stats: total companies, companies needing URLs, companies with existing URLs
  - Uses existing `scrapeAllCareersURLs()` method without testing overhead
  - Updates the actual CSV file (no temporary/test files)

- [x] **Add progress information and stats**
  - Display CSV file being processed and company counts
  - Show time taken for discovery process
  - Clear success/failure messaging with next steps
  - Lightweight console output (no complex reporting)

- [x] **Command line interface**
  ```bash
  # Use default CSV
  npx tsx discover-careers-urls.ts
  
  # Use specific CSV  
  npx tsx discover-careers-urls.ts data/input/test-websites.csv
  ```

### 2.6.3 Job Detail Page Navigation
- [ ] **Implement job detail page navigation**
  - After finding careers page, identify individual job listing links
  - Click into individual job postings to get complete information
  - Extract full job descriptions, location, language of listing from detail pages
  - Handle "Apply" buttons and external application systems

### 2.6.3 Content Validation & Filtering
- [ ] **Add scraped content validation**
  - Detect and filter out "null" strings and empty descriptions
  - Validate job titles are specific (not generic like "Jobs" or "Open Positions")
  - Ensure descriptions contain meaningful content (minimum length, keywords)
  - Filter out navigation elements, headers, footers from job content

### 2.6.4 URL and Data Cleaning
- [ ] **Improve URL extraction and validation**
  - Convert relative URLs to absolute URLs using base domain
  - Detect button text vs actual URLs ("MEHR ERFAHREN" → actual job URL)
  - Validate URLs are actionable and point to job details
  - Implement fallback to careers page URL if individual job URL unavailable

**Estimated Time**: 4-5 hours  
**Dependencies**: Work Package 2.5  
**Deliverable**: Complete job information from individual job detail pages

---

## 📦 Work Package 2.7: Data Quality & Standardization

### 2.7.1 Enhanced AI Extraction Prompts
- [ ] **Improve schema descriptions and AI prompts**
  - More specific Zod schema descriptions for better AI guidance
  - Add examples of good vs bad data in schema descriptions
  - Improve language detection prompts with context clues
  - Better job type classification with employment indicators

### 2.7.2 Deduplication Logic
- [ ] **Implement job deduplication**
  - Detect duplicate jobs by title + company combination
  - Handle pagination duplicates (same job appearing multiple times)
  - Use fuzzy matching for similar job titles
  - Keep most complete version when duplicates found

### 2.7.3 Data Standardization
- [ ] **Standardize extracted data formats**
  - Consistent location formatting (City, Country vs City, State, Country)
  - Standardize language codes (en, de, etc.)
  - Normalize job types to enum values with fallback logic
  - Clean and format job descriptions (remove extra whitespace, HTML artifacts)

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 2.6  
**Deliverable**: Consistent, deduplicated, well-formatted job data

---

## 📦 Work Package 3: Static Output & Scheduling

### 3.1 Single JSON Output
- [ ] Implement `writeJobsJSON()` to output to `/public/jobs.json`
- [ ] Structure as flat array of jobs (frontend-friendly)
- [ ] Include metadata (last updated, total jobs, companies processed)
- [ ] Validate JSON structure for frontend consumption

### 3.2 Batch Processing with CSV Updates
- [ ] Simple sequential processing loop through companies
- [ ] For each company: check if careers URL exists in CSV
- [ ] If careers URL discovered, update CSV record immediately
- [ ] Collect all jobs into single array
- [ ] Continue on failure - don't stop entire batch
- [ ] Basic progress logging with console.log
- [ ] Write updated CSV file with new careers URLs

### 3.3 GitHub Actions Setup
- [ ] Create `.github/workflows/scrape-jobs.yml`
- [ ] Schedule (e.g., daily at 6 AM UTC)
- [ ] Install dependencies, run scraper, commit results
- [ ] **Commit both updated CSV (with careers URLs) and jobs.json**
- [ ] Optional: setup secrets for API keys

### 3.4 Error Handling & Reliability
- [ ] Wrap each company in try/catch
- [ ] Simple retry logic for cookie banner failures
- [ ] Rate limiting: 2-5 second delays between companies
- [ ] Graceful degradation: partial results better than no results

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 2  
**Deliverable**: Scheduled scraper with static JSON output

---

## 📦 Work Package 4: Testing & Quality Validation

### 4.1 Comprehensive Quality Testing
- [x] **Initial test run completed** - 58 jobs from 13 companies (100% success rate)
- [ ] **Re-test with quality improvements** from WP 2.5 and 2.6
- [ ] Validate career page detection accuracy improvements
- [ ] Test individual job detail extraction functionality
- [ ] Verify content validation filters work correctly

### 4.2 Data Quality Metrics Validation
- [ ] **Target quality thresholds**:
  - Jobs with valid descriptions: >90% (current: 69%)
  - Jobs with locations: >80% (current: 34%)
  - Jobs with job types: >85% (current: 31%)
  - Jobs with language detection: >90% (current: 62%)
  - Jobs with actionable URLs: >95% (current: 60%)
  - Duplicate jobs: <5% (current: 10%)

### 4.3 Edge Case Handling
- [ ] Sites with no careers page
- [ ] Sites with unusual cookie banners
- [ ] Sites with no jobs posted
- [ ] Sites that timeout or fail to load
- [ ] Sites with complex job application systems

### 4.4 Production Readiness Validation
- [ ] Verify JSON output structure for frontend consumption
- [ ] Test `/public/jobs.json` accessibility from browser
- [ ] Validate all job URLs are clickable and functional
- [ ] Ensure no "null" strings or empty required fields
- [ ] Confirm deduplication logic works across companies

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 2.6, Work Package 3  
**Deliverable**: Production-ready scraper with validated high-quality data

---

## 📦 Work Package 5: Migration & Cleanup

### 5.1 Archive Old Code
- [ ] Move complex classes to `src/archive/` directory
- [ ] Keep for reference but remove from main codebase
- [ ] Update imports and scripts to use new simplified version

### 5.2 Update Documentation
- [ ] Update README with new simplified usage
- [ ] Document the 3-file architecture
- [ ] Create simple usage examples
- [ ] Update package.json scripts

**Estimated Time**: 1-2 hours  
**Dependencies**: Work Package 4  
**Deliverable**: Clean codebase with working simplified scraper

---

## 🚀 Implementation Timeline

| Work Package | Estimated Time | Priority | Focus |
|--------------|----------------|----------|--------|
| WP1: Extract Patterns | 1-2 hours | High | Foundation |
| WP2: Core Scraper | 3-4 hours | High | Working implementation |
| **WP2.5: Career Page Detection** | **3-4 hours** | **High** | **Accurate career page discovery** |
| **WP2.6: Job Detail Extraction** | **4-5 hours** | **High** | **Individual job page navigation** |
| **WP2.7: Data Quality & Standardization** | **3-4 hours** | **High** | **Deduplication & validation** |
| WP3: Static Output & Scheduling | 3-4 hours | High | Production capability |
| WP4: Testing & Quality Validation | 3-4 hours | High | Quality metrics validation |
| WP5: Migration | 1-2 hours | Medium | Cleanup |

**Total Estimated Time**: 21-29 hours (includes comprehensive quality improvements)  
**Key Advantage**: High-quality data extraction with accurate career page detection

---

## ✅ Success Criteria

### Working Implementation
- [x] Handles cookie banners reliably (proven pattern from manual-debug.ts)
- [x] Finds career pages on diverse sites (77% success rate)
- [x] Extracts job data in correct format
- [x] Outputs single `/public/jobs.json` file for frontend
- [ ] **High-quality data extraction** (>90% valid descriptions, <5% duplicates)
- [ ] **Individual job detail extraction** for complete information
- [ ] **Content validation** to filter out generic/invalid data
- [ ] Runs on schedule via GitHub Actions
- [ ] Auto-commits updated JSON to trigger Vercel redeploy

### Code Quality
- [ ] Total codebase under 300 lines
- [ ] Easy to understand and modify
- [ ] Fast to debug when issues arise
- [ ] No unused abstractions or over-engineering
- [ ] No database dependencies or complex infrastructure

### Performance & Reliability
- [ ] Processes companies reliably without manual intervention
- [ ] Graceful error handling - continues batch on individual failures
- [ ] Reasonable performance (under 2 minutes per company)
- [ ] Frontend gets fresh data automatically via scheduled runs

---

## 🔑 Key Principles

### Keep What Works
- **Copy exact patterns** from `manual-debug.ts` that handle cookies
- **Use proven Stagehand commands** rather than complex abstractions
- **Direct API usage** instead of wrapper classes

### Eliminate Complexity
- **No complex timeout management** - use Stagehand defaults
- **No elaborate retry logic** - simple try/catch with basic retry
- **No progress tracking UI** - simple console.log statements
- **No complex configuration** - hardcode sensible defaults

### Focus on Data & Simplicity
- **Quality job extraction** optimized for frontend consumption
- **Single JSON file output** - no database complexity
- **Scheduled automation** - set it and forget it
- **Handle edge cases gracefully** but don't over-engineer for them

---

**Ready to implement this simplified, working approach!** 🎯 