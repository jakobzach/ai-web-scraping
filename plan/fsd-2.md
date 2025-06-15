# AI Web Scraping Simplified - FSD v2

**Project**: Lightweight Job Scraper for Static JSON Output  
**Version**: 2.0  
**Status**: Architecture Planning  
**Approach**: Minimal scraper → single `jobs.json` file → Next.js frontend

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
- [ ] Analyze what specifically works in `manual-debug.ts`
- [ ] Document the successful cookie banner handling pattern
- [ ] Document the successful career page navigation pattern
- [ ] Identify minimal Stagehand configuration that works

### 1.2 Create New Types File
- [ ] Create `src/types.ts` with only essential interfaces:
  - `CompanyInput` (name, website, careers_url?)
  - `JobListing` (matching PRD schema, optimized for frontend)
  - `ScrapingMetadata` (run timestamp, counts)
- [ ] Remove all unused enums, complex configurations, and abstractions

### 1.3 Create Utilities File
- [ ] Create `src/utils.ts` with focused helpers:
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
- [ ] Create `src/scraper.ts` with single `SimpleScraper` class
- [ ] Direct Stagehand initialization (copy working patterns from debug)
- [ ] Implement `scrapeCompany()` method using proven approach:
  ```typescript
  // Working pattern from manual-debug.ts
  await page.goto(url);
  await page.observe("Click Accept All button");
  await page.act("Click Accept All button");
  await page.observe("Navigate to careers");
  await page.act("Navigate to careers");
  ```

### 2.2 Cookie Banner Handling
- [ ] Extract exact working pattern from `manual-debug.ts`
- [ ] Implement as simple method: `handleCookies(page)`
- [ ] Support both English and German terms
- [ ] Use observe->act pattern that actually works

### 2.3 Smart Career Page Handling
- [ ] **If CSV has careers URL**: Navigate directly to careers page
- [ ] **If CSV missing careers URL**: Use discovery with Stagehand commands
  - Use multilingual navigation: "navigate to careers, jobs, karriere, stellenangebote"
  - Basic URL validation to confirm success
  - **Write discovered URL back to CSV** for future runs
- [ ] No complex confidence scoring - just success/failure

### 2.4 Job Extraction
- [ ] Use Stagehand's `extract()` with simple schema
- [ ] Extract all visible jobs in single operation
- [ ] Basic pagination handling with `act("load more")` pattern
- [ ] Generate job IDs and clean data inline

**Estimated Time**: 3-4 hours  
**Dependencies**: Work Package 1  
**Deliverable**: Working single-company scraper

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

## 📦 Work Package 4: Testing & Validation

### 4.1 Test with Known Working Sites
- [ ] Test on sites that worked in `manual-debug.ts`
- [ ] Validate cookie banner handling works consistently
- [ ] Validate career page discovery works
- [ ] Validate job extraction produces good data

### 4.2 Handle Edge Cases
- [ ] Sites with no careers page
- [ ] Sites with unusual cookie banners
- [ ] Sites with no jobs posted
- [ ] Sites that timeout or fail to load

### 4.3 Data Quality Validation
- [ ] Ensure all required fields are populated
- [ ] Validate job descriptions are meaningful
- [ ] Check for duplicate jobs across all companies
- [ ] Verify JSON output is valid and frontend-consumable
- [ ] Test `/public/jobs.json` accessibility from browser

**Estimated Time**: 2-3 hours  
**Dependencies**: Work Package 3  
**Deliverable**: Validated scraper ready for production use

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
| WP3: Static Output & Scheduling | 3-4 hours | High | Production capability |
| WP4: Testing | 2-3 hours | High | Validation |
| WP5: Migration | 1-2 hours | Medium | Cleanup |

**Total Estimated Time**: 10-15 hours (vs 23-32 hours in original FSD)  
**Key Advantage**: Static JSON output, no database, scheduled via GitHub Actions

---

## ✅ Success Criteria

### Working Implementation
- [ ] Handles cookie banners reliably (proven pattern from manual-debug.ts)
- [ ] Finds career pages on diverse sites
- [ ] Extracts job data in correct format
- [ ] Outputs single `/public/jobs.json` file for frontend
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