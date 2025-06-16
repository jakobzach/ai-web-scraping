#!/usr/bin/env tsx
import { CSVProcessor } from '../src/utils/CSVProcessor.js';
import { BatchScraper } from '../src/scraper/BatchScraper.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
async function runEndToEndTest() {
    console.log('🚀 Starting End-to-End Test for AI Web Scraping MVP');
    console.log('='.repeat(60));
    const startTime = new Date();
    const results = {
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
        console.log('\n📋 Step 1: Reading CSV Input');
        const csvPath = join(__dirname, '..', 'data', 'input', 'test-websites.csv');
        const csvProcessor = new CSVProcessor();
        const companies = await csvProcessor.readCompaniesWithFormat(csvPath, 'STANDARD');
        console.log(`✅ Successfully loaded ${companies.length} companies from CSV`);
        results.totalCompanies = companies.length;
        console.log('\n🏢 Companies to test:');
        companies.forEach((company, index) => {
            console.log(`  ${index + 1}. ${company.name} - ${company.website}`);
        });
        console.log('\n🤖 Step 2: Initializing Batch Scraper');
        const batchScraper = new BatchScraper(2000, true);
        console.log('✅ Batch scraper initialized with 2-3 second random delays');
        console.log('\n🔄 Step 3: Running Batch Processing');
        console.log('Press Ctrl+C to test graceful interruption\n');
        const batchResult = await batchScraper.processCompanies(companies);
        console.log('\n📊 Step 4: Processing Results');
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            if (!company)
                continue;
            const result = batchResult.results[i];
            if (!result)
                continue;
            const companyResult = {
                name: company.name,
                website: company.website,
                status: result.status === 'success' ? 'success' : 'failed',
                jobsFound: result.jobListings?.length || 0,
                timeMs: result.metadata?.processingTimeMs || 0,
                ...(result.error && { error: result.error })
            };
            results.companies.push(companyResult);
            if (result.status === 'success') {
                results.successfulScrapes++;
                results.totalJobsFound += result.jobListings?.length || 0;
            }
            else {
                results.failedScrapes++;
            }
        }
        results.endTime = new Date();
        results.averageTimePerCompany = results.companies.reduce((sum, c) => sum + c.timeMs, 0) / results.totalCompanies;
        console.log('\n💾 Step 5: Generating JSON Output');
        await generateTestOutput(batchResult.results, results);
        console.log('\n📈 Step 6: Test Summary');
        displayTestSummary(results);
    }
    catch (error) {
        console.error('\n❌ Test failed with error:', error);
        process.exit(1);
    }
}
async function generateTestOutput(scrapingResults, testResults) {
    try {
        const outputDir = join(__dirname, '..', 'data', 'output');
        await mkdir(outputDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
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
        const metricsFile = join(outputDir, `test-metrics-${timestamp}.json`);
        await writeFile(metricsFile, JSON.stringify(testResults, null, 2));
        console.log(`✅ Test metrics saved to: ${metricsFile}`);
    }
    catch (error) {
        console.error('❌ Failed to generate output files:', error);
    }
}
function displayTestSummary(results) {
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
    console.log('\n📋 Detailed Results:');
    results.companies.forEach((company, index) => {
        const status = company.status === 'success' ? '✅' : '❌';
        const timeStr = (company.timeMs / 1000).toFixed(1) + 's';
        console.log(`  ${index + 1}. ${status} ${company.name} (${company.jobsFound} jobs, ${timeStr})`);
        if (company.error) {
            console.log(`     Error: ${company.error}`);
        }
    });
    console.log('\n🎯 Performance Assessment:');
    if (successRate >= 80) {
        console.log('✅ SUCCESS RATE: Excellent (≥80%)');
    }
    else if (successRate >= 60) {
        console.log('⚠️  SUCCESS RATE: Good (60-79%) - Some optimization needed');
    }
    else {
        console.log('❌ SUCCESS RATE: Poor (<60%) - Significant improvements needed');
    }
    const avgTimePerCompany = results.averageTimePerCompany / 1000;
    if (avgTimePerCompany <= 300) {
        console.log('✅ PERFORMANCE: Within target (<5 min/company)');
    }
    else {
        console.log('⚠️  PERFORMANCE: Slower than target (>5 min/company)');
    }
    console.log('\n🎉 End-to-End Test Complete!');
    console.log('Check data/output/ for detailed JSON results');
}
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test interrupted by user');
    console.log('Partial results may be available in data/output/');
    process.exit(0);
});
if (import.meta.url === `file://${process.argv[1]}`) {
    runEndToEndTest().catch(console.error);
}
export { runEndToEndTest };
//# sourceMappingURL=test-e2e.js.map