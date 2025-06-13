
## Project Overview

This web scraping system will collect job listings from company websites to populate a dataset for a **web application that displays and lists job descriptions**. The scraper will process company websites, extract job postings, and format the data for consumption by the web app.

## Data Schema

### Input CSV Format
```csv
Name,Website
Company A,https://example.com
Company B,https://example2.com
```
**Scale**: ~500 companies

### Output Data Structure
```typescript
interface JobListing {
  id: string;                    // Unique identifier for MongoDB
  company_name: string;          // ESSENTIAL - for display/filtering
  company_website: string;
  careers_page_url?: string;
  job_title: string;             // ESSENTIAL - primary display field
  job_description: string;       // ESSENTIAL - full job description text
  job_location?: string;         // IMPORTANT - for location filtering
  job_type?: string;             // IMPORTANT - Full-time, Part-time, Contract, etc.
  job_url?: string;              // IMPORTANT - link to apply
  job_department?: string;       // NICE-TO-HAVE - for categorization
  salary_range?: string;         // NICE-TO-HAVE - compensation info
  application_deadline?: string; // NICE-TO-HAVE - urgency indicator
  scraped_at: string;
  status: 'success' | 'no_careers_page' | 'error';
  error_message?: string;
}
```
**Output Format**: JSON files for MongoDB ingestion  
**Update Frequency**: Weekly, manually triggered

## Technical Requirements

### Error Handling Strategy
- Comprehensive logging for easy debugging
- Graceful error handling - continue processing other companies when one fails
- Detailed error reporting without crashing the entire scraper
- Error categorization (network issues, page structure changes, no careers page, etc.)

### Performance Considerations
- Sequential processing initially (can parallelize later if needed)
- Respectful scraping with delays between requests
- Robust handling of different website structures and technologies

## Success Criteria

### MVP Success Metrics:
- Extracts job data with high accuracy suitable for web app display
- Provides comprehensive job descriptions for meaningful user experience
- Generates dataset in format ready for web app consumption
- Completes full run without manual intervention
- Provides clear error reporting for failed cases

### Performance Targets:
- Graceful handling of network timeouts and failures
- Dataset completeness rate >80% for successful company website processing
- Data quality suitable for professional job listing web application

## Next Steps
1. **Gather Requirements**: Answer outstanding questions about data fields, formats, and web app integration needs
2. **Setup Environment**: Initialize project with Stagehand and dependencies  
3. **Develop MVP**: Implement sequential scraper with core functionality focused on web app data requirements
4. **Data Pipeline**: Establish output format and delivery mechanism for web app consumption
5. **Testing**: Test on small sample of diverse company websites and validate data quality for web app display
6. **Integration**: Ensure seamless data flow to web application
7. **Iteration**: Refine based on real-world performance and web app user feedback

---

**Document Status**: Requirements Complete - Ready for MVP Implementation
**Last Updated**: [Current Date]
**Version**: 1.1