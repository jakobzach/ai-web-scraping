#!/usr/bin/env tsx

/**
 * End-to-End Test Script for AI Web Scraping MVP
 * 
 * Tests the complete pipeline:
 * CSV Input → Career Page Detection → Job Extraction → Data Processing → JSON Output
 * 
 * Usage: npm run test:e2e
 */

import { CSVProcessor } from '../src/utils/CSVProcessor.js';
import { BatchScraper } from '../src/scraper/BatchScraper.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResults {
  totalCompanies: number;
  successfulScrapes: number;
  failedScrapes: number;
  totalJobsFound: number;
  averageTimePerCompany: number;
  startTime: Date;
  endTime: Date;
  companies: Array<{
    name: string;
    website: string;
    status: 'success' | 'failed';
    jobsFound: number;
    timeMs: number;
    error?: string;
  }>;
}

async function runEndToEndTest(): Promise<void> {
  console.log('🚀 Starting End-to-End Test for AI Web Scraping MVP');
  console.log('=' .repeat(60));
  
  const startTime = new Date();
  const results: TestResults = {
    totalCompanies: 0,
    successfulScrapes: 0,
    failedScrapes: 0,
    totalJobsFound: 0,
    averageTimePerCompany: 0,
    startTime,
    endTime: new Date(),
    companies: []
  };

  try {
    // Step 1: Read CSV Input
    console.log('\n📋 Step 1: Reading CSV Input');
    const csvPath = join(__dirname, '..', 'data', 'input', 'test-websites.csv');
    const csvProcessor = new CSVProcessor();
    
    const companies = await csvProcessor.readCompaniesWithFormat(csvPath, 'STANDARD');
    console.log(`✅ Successfully loaded ${companies.length} companies from CSV`);
    
    results.totalCompanies = companies.length;
    
    // Display companies to be tested
    console.log('\n🏢 Companies to test:');
    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} - ${company.website}`);
    });

    // Step 2: Initialize Batch Scraper
    console.log('\n🤖 Step 2: Initializing Batch Scraper');
    // Use shorter delays for testing (2-3 seconds with randomization)
    const batchScraper = new BatchScraper(2000, true);
    console.log('✅ Batch scraper initialized with 2-3 second random delays');

    // Step 3: Run Batch Processing
    console.log('\n🔄 Step 3: Running Batch Processing');
    console.log('Press Ctrl+C to test graceful interruption\n');
    
    const batchResult = await batchScraper.processCompanies(companies);
    
    // Step 4: Process Results
    console.log('\n📊 Step 4: Processing Results');
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      if (!company) continue; // Skip undefined entries
      const result = batchResult.results[i];
      if (!result) continue; // Skip undefined results
      
      const companyResult = {
        name: company.name,
        website: company.website,
        status: result.status === 'success' ? 'success' as const : 'failed' as const,
        jobsFound: result.jobListings?.length || 0,
        timeMs: result.metadata?.processingTimeMs || 0,
        ...(result.error && { error: result.error })
      };
      
      results.companies.push(companyResult);
      
      if (result.status === 'success') {
        results.successfulScrapes++;
        results.totalJobsFound += result.jobListings?.length || 0;
      } else {
        results.failedScrapes++;
      }
    }
    
    results.endTime = new Date();
    results.averageTimePerCompany = results.companies.reduce((sum, c) => sum + c.timeMs, 0) / results.totalCompanies;

    // Step 5: Generate JSON Output
    console.log('\n💾 Step 5: Generating JSON Output');
    await generateTestOutput(batchResult.results, results);
    
    // Step 6: Display Summary
    console.log('\n📈 Step 6: Test Summary');
    displayTestSummary(results);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

async function generateTestOutput(scrapingResults: Array<{ jobListings: any[]; [key: string]: any }>, testResults: TestResults): Promise<void> {
  try {
    // Ensure output directory exists
    const outputDir = join(__dirname, '..', 'data', 'output');
    await mkdir(outputDir, { recursive: true });
    
    // Generate timestamp for files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save complete scraping results (MongoDB-ready format)
    const jobsOutput = {
      scrape_run_id: `test-e2e-${timestamp}`,
      batch_timestamp: new Date().toISOString(),
      total_companies: testResults.totalCompanies,
      successful_scrapes: testResults.successfulScrapes,
      total_jobs_found: testResults.totalJobsFound,
      jobs: scrapingResults.flatMap(result => result.jobListings || [])
    };
    
    const jobsFile = join(outputDir, `test-jobs-${timestamp}.json`);
    await writeFile(jobsFile, JSON.stringify(jobsOutput, null, 2));
    console.log(`✅ Jobs data saved to: ${jobsFile}`);
    
    // Save test metrics and summary
    const metricsFile = join(outputDir, `test-metrics-${timestamp}.json`);
    await writeFile(metricsFile, JSON.stringify(testResults, null, 2));
    console.log(`✅ Test metrics saved to: ${metricsFile}`);
    
  } catch (error) {
    console.error('❌ Failed to generate output files:', error);
  }
}

function displayTestSummary(results: TestResults): void {
  const duration = (results.endTime.getTime() - results.startTime.getTime()) / 1000;
  const successRate = (results.successfulScrapes / results.totalCompanies) * 100;
  
  console.log('┌' + '─'.repeat(58) + '┐');
  console.log('│' + ' '.repeat(20) + 'TEST SUMMARY' + ' '.repeat(25) + '│');
  console.log('├' + '─'.repeat(58) + '┤');
  console.log(`│ Total Companies:        ${results.totalCompanies.toString().padStart(3)} ${' '.repeat(25)}│`);
  console.log(`│ Successful Scrapes:     ${results.successfulScrapes.toString().padStart(3)} ${' '.repeat(25)}│`);
  console.log(`│ Failed Scrapes:         ${results.failedScrapes.toString().padStart(3)} ${' '.repeat(25)}│`);
  console.log(`│ Success Rate:           ${successRate.toFixed(1).padStart(5)}% ${' '.repeat(20)}│`);
  console.log(`│ Total Jobs Found:       ${results.totalJobsFound.toString().padStart(3)} ${' '.repeat(25)}│`);
  console.log(`│ Total Duration:         ${duration.toFixed(1).padStart(5)}s ${' '.repeat(20)}│`);
  console.log(`│ Avg Time/Company:       ${(results.averageTimePerCompany / 1000).toFixed(1).padStart(5)}s ${' '.repeat(20)}│`);
  console.log('└' + '─'.repeat(58) + '┘');
  
  // Detailed company results
  console.log('\n📋 Detailed Results:');
  results.companies.forEach((company, index) => {
    const status = company.status === 'success' ? '✅' : '❌';
    const timeStr = (company.timeMs / 1000).toFixed(1) + 's';
    console.log(`  ${index + 1}. ${status} ${company.name} (${company.jobsFound} jobs, ${timeStr})`);
    if (company.error) {
      console.log(`     Error: ${company.error}`);
    }
  });
  
  // Performance assessment
  console.log('\n🎯 Performance Assessment:');
  if (successRate >= 80) {
    console.log('✅ SUCCESS RATE: Excellent (≥80%)');
  } else if (successRate >= 60) {
    console.log('⚠️  SUCCESS RATE: Good (60-79%) - Some optimization needed');
  } else {
    console.log('❌ SUCCESS RATE: Poor (<60%) - Significant improvements needed');
  }
  
  const avgTimePerCompany = results.averageTimePerCompany / 1000;
  if (avgTimePerCompany <= 300) { // 5 minutes
    console.log('✅ PERFORMANCE: Within target (<5 min/company)');
  } else {
    console.log('⚠️  PERFORMANCE: Slower than target (>5 min/company)');
  }
  
  console.log('\n🎉 End-to-End Test Complete!');
  console.log('Check data/output/ for detailed JSON results');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  console.log('Partial results may be available in data/output/');
  process.exit(0);
});

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runEndToEndTest().catch(console.error);
}

export { runEndToEndTest }; 