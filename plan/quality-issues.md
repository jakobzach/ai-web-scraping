# Data Quality Issues Analysis - jobs.json

**Analysis Date**: 2025-06-16  
**Source**: Test scraper run with test-websites.csv  
**Total Jobs**: 58 jobs from 13 companies  
**Run ID**: b1984b08-c45c-4f36-91c7-bf3eb6ec50de

## 🔍 Executive Summary

The scraper successfully extracted 58 jobs from 13 companies with 0 failures. However, several data quality issues were identified that need attention before production deployment.

---

## ⚠️ Suspected Root causes for issues

### 1. **Careers pages not found reliably**
- Sometimes confused with Company News pages. 
- It should be easy to detect titles like "Jobs" or "WILLKOMMEN IM TEAM!" as bad data -> these were pulled from pages that were incorrectly identified as careers pages.

### 2. **If Careers page was found, the scraper does not click on single job listings to see all information about it**

### 3. **Lack of scraped content validation**
- Especially problematic if careers page was misidentified

---

## 🚨 Critical Issues

### 1. **Null/Invalid Descriptions**
**Severity**: High  
**Count**: 18 jobs affected

**Examples**:
- Adelbert Haas LLC jobs: All 10 jobs have `"description": "null"` (literal string)
- AFOTEK jobs: 8 jobs have `"description": "null"` (literal string)

**Impact**: Frontend will display "null" as job description text

### 2. **Missing Required Fields**
**Severity**: High  
**Count**: Multiple jobs affected

**Missing Descriptions**:
- Aachener Maschinenbau: `"description": ""` (empty string)
- Multiple AFOTEK jobs: Missing descriptions entirely
- AERO-LIFT jobs: Missing descriptions

**Missing Locations**:
- Aconity3D jobs: All 4 jobs missing location
- ACSYS jobs: Most jobs missing location
- Multiple other companies

### 3. **Invalid/Unusable URLs**
**Severity**: Medium-High  
**Count**: Multiple jobs affected

**Examples**:
- Aachener Maschinenbau: `"url": "/jobs"` (relative path, not actionable)
- Active Fiber Systems: `"url": "/offene-stellen"` (relative path)
- AEL Apparatebau: `"url": "Hier zu unseren offenen Stellen"` (button text, not URL)
- AGTOS: `"url": "MEHR ERFAHREN"` (button text, not URL)

---

## ⚠️ Medium Priority Issues

### 4. **Inconsistent Language Detection**
**Severity**: Medium  
**Count**: 22 jobs affected

**Issues**:
- Many jobs missing `languageOfListing` field (shows as `null`)
- Inconsistent detection even within same company
- German content not always detected as "de"

**Examples**:
- Aconity3D: All jobs missing language detection despite English content
- ACSYS: Mixed detection (some "de", some `null`)

### 5. **Generic/Non-Specific Job Titles**
**Severity**: Medium  
**Count**: 8+ jobs affected

**Examples**:
- "Jobs" (Aachener Maschinenbau) - too generic
- "Offene Stellen" (Active Fiber Systems) - means "Open Positions"
- "Stellenangebote" (AEL, AGTOS) - means "Job Offers"
- "Arbeiten bei AFOTEK" - means "Working at AFOTEK"

### 6. **Duplicate Job Entries**
**Severity**: Medium  
**Count**: 6+ duplicates identified

**Examples**:
- Active Fiber Systems: Same "Offene Stellen" job appears twice (IDs: f38ef604, f82d4011)
- ADVANTEC: Same jobs appear twice with different IDs
- AGTOS: Same 3 jobs appear twice (pagination issue)

### 7. **Job Type Classification Issues**
**Severity**: Medium  
**Count**: 40+ jobs affected

**Issues**:
- Most jobs missing `type` field (shows as `undefined`)
- ACSYS jobs incorrectly classified as "Internship" when they should be "Full-time"
- Only Adelbert Haas and some ACSYS jobs have proper type classification

---

## 🔧 Minor Issues

### 8. **Inconsistent URL Protocols**
**Severity**: Low  
**Count**: Multiple jobs

**Issues**:
- Some URLs use careers page fallback correctly
- Others use relative paths that won't work
- Mixed absolute vs relative URL handling

### 9. **Description Truncation**
**Severity**: Low  
**Count**: 2 jobs

**Examples**:
- ADVANTEC jobs: Descriptions end with "..." or "[mehr]" indicating truncation

### 10. **Inconsistent Location Formats**
**Severity**: Low  
**Count**: Multiple jobs

**Examples**:
- "Aachen, Germany" vs "Trossingen, Deutschland" vs "Charlotte, NC, USA"
- Mixed language formats for country names

---

## 📊 Data Quality Metrics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Jobs with valid descriptions** | 40/58 | 69% |
| **Jobs with locations** | 20/58 | 34% |
| **Jobs with job types** | 18/58 | 31% |
| **Jobs with language detection** | 36/58 | 62% |
| **Jobs with actionable URLs** | 35/58 | 60% |
| **Duplicate jobs** | 6/58 | 10% |

---

## 🎯 Recommended Fixes

### Immediate (Critical)
1. **Fix null descriptions**: Handle "null" strings and empty descriptions
2. **Improve URL extraction**: Better detection of actual job URLs vs button text
3. **Deduplicate jobs**: Implement job deduplication logic

### Short-term (Medium Priority)
4. **Enhance language detection**: Improve AI prompt for language identification
5. **Better job type classification**: Improve AI prompt for employment type detection
6. **Filter generic titles**: Skip or improve extraction of generic job listings

### Long-term (Minor)
7. **Standardize location formats**: Consistent country name formatting
8. **URL validation**: Better relative vs absolute URL handling
9. **Description completeness**: Handle truncated descriptions

---

## 🔍 Company-Specific Issues

### Aconity3D GmbH (4 jobs)
- ✅ Good: Proper job titles, descriptions
- ❌ Issues: Missing locations, missing language detection, URL fallback used

### ACSYS Lasertechnik GmbH (13 jobs)
- ✅ Good: Pagination working, good variety
- ❌ Issues: Incorrect "Internship" classification, mixed language detection

### Adelbert Haas LLC (10 jobs)
- ✅ Good: Proper locations, job types, language detection
- ❌ Issues: All descriptions are "null" strings

### AFOTEK (11 jobs)
- ✅ Good: Pagination working
- ❌ Issues: Many "null" descriptions, missing details

### Others
- Most companies have 1-6 jobs with mixed quality levels
- Career page discovery working well (10/13 companies)

---

## 💡 Root Cause Analysis

1. **AI Extraction Limitations**: The AI sometimes extracts button text instead of actual content
2. **Schema Guidance**: Current Zod descriptions may not be specific enough
3. **Website Variations**: Different career page structures require different extraction strategies
4. **Pagination Handling**: Some duplicates from pagination logic
5. **Fallback Logic**: URL fallback working but masking missing individual job URLs

---

## ✅ What's Working Well

1. **Cookie handling**: 100% success rate
2. **Career page discovery**: 77% success rate (10/13 companies)
3. **Basic extraction**: Getting job titles and some content
4. **Error handling**: No crashes, graceful degradation
5. **CSV updates**: Careers URLs properly saved
6. **Metadata**: Complete run information
7. **JSON structure**: Valid, frontend-consumable format 