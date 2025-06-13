
## Data Schema

### Input CSV Format (TBD)
```csv
company_name,website_url
Company A,https://example.com
Company B,https://example2.com
```

### Output Data Structure (TBD)
```typescript
interface JobListing {
  company_name: string;
  company_website: string;
  careers_page_url?: string;
  job_title?: string;
  job_location?: string;
  job_department?: string;
  job_type?: string;
  job_url?: string;
  scraped_at: string;
  status: 'success' | 'no_careers_page' | 'error';
  error_message?: string;
}
```

## Outstanding Questions & Requirements

### Critical Information Needed:
1. **Job Information**: What specific data fields to extract from each job posting?
   - Job title, location, department, salary, job type, application deadline?

2. **Input CSV Format**: Structure of the input CSV file
   - Just website URLs or include company names?

3. **Scale**: Number of companies to process
   - Affects performance considerations

4. **Error Handling Strategy**: How to handle failures
   - Skip and continue, retry logic, manual review process?

## Success Criteria

### MVP Success Metrics:
- Extracts job data with high accuracy
- Completes full run without manual intervention
- Provides clear error reporting for failed cases

### Performance Targets:
- Graceful handling of network timeouts and failures

## Next Steps

1. **Gather Requirements**: Answer outstanding questions about data fields and formats
2. **Setup Environment**: Initialize project with Stagehand and dependencies  
3. **Develop MVP**: Implement sequential scraper with core functionality
4. **Testing**: Test on small sample of diverse company websites
5. **Iteration**: Refine based on real-world performance

---

**Document Status**: Draft - Awaiting user input on requirements
**Last Updated**: [Current Date]
**Version**: 1.0