import { SimpleScraper } from '../src/scraper.js';
import { readCompaniesFromCSV, writeCompaniesCSV } from '../src/utils.js';
import fs from 'fs';
async function testCareerPageDetection() {
    console.log('🔍 Testing Career Page Detection Accuracy');
    console.log('==========================================\n');
    const groundTruthCompanies = await readCompaniesFromCSV('data/input/test-target.csv');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testCsvPath = `data/input/${timestamp}-test-websites.csv`;
    const testCompanies = groundTruthCompanies.map(company => ({
        name: company.name,
        website: company.website
    }));
    await writeCompaniesCSV(testCsvPath, testCompanies);
    console.log(`📄 Created test CSV: ${testCsvPath}\n`);
    const scraper = new SimpleScraper('career-detection-only');
    await scraper.init();
    const results = [];
    let exactMatches = 0;
    let domainMatches = 0;
    let functionalMatches = 0;
    let failures = 0;
    const testResults = await scraper.scrapeAll(testCsvPath);
    const updatedCompanies = await readCompaniesFromCSV(testCsvPath);
    for (let i = 0; i < groundTruthCompanies.length; i++) {
        const groundTruthCompany = groundTruthCompanies[i];
        const updatedCompany = updatedCompanies[i];
        console.log(`\n📋 Testing: ${groundTruthCompany.name}`);
        console.log(`   Website: ${groundTruthCompany.website}`);
        console.log(`   Expected: ${groundTruthCompany.careers_url || 'Not provided'}`);
        try {
            const discoveredUrl = updatedCompany.careers_url;
            const result = {
                company: groundTruthCompany.name,
                website: groundTruthCompany.website,
                expectedCareersUrl: groundTruthCompany.careers_url || '',
                discoveredCareersUrl: discoveredUrl || null,
                success: false,
                matchType: 'none',
                notes: ''
            };
            if (!discoveredUrl) {
                result.notes = 'Failed to discover careers page';
                failures++;
                console.log(`   ❌ Failed: No careers page discovered`);
            }
            else if (!groundTruthCompany.careers_url) {
                result.success = true;
                result.matchType = 'functional';
                result.notes = 'Discovered URL (no ground truth to compare)';
                functionalMatches++;
                console.log(`   ✅ Discovered: ${discoveredUrl}`);
            }
            else {
                const discovered = normalizeUrl(discoveredUrl);
                const expected = normalizeUrl(groundTruthCompany.careers_url);
                if (discovered === expected) {
                    result.success = true;
                    result.matchType = 'exact';
                    exactMatches++;
                    console.log(`   ✅ Exact match: ${discoveredUrl}`);
                }
                else if (isSameDomain(discoveredUrl, groundTruthCompany.careers_url)) {
                    result.success = true;
                    result.matchType = 'domain';
                    result.notes = 'Different path but same domain';
                    domainMatches++;
                    console.log(`   ✅ Domain match: ${discoveredUrl}`);
                }
                else if (await isFunctionallyEquivalent(discoveredUrl, groundTruthCompany.careers_url)) {
                    result.success = true;
                    result.matchType = 'functional';
                    result.notes = 'Different URL but functionally equivalent';
                    functionalMatches++;
                    console.log(`   ✅ Functional match: ${discoveredUrl}`);
                }
                else {
                    result.notes = `Expected: ${groundTruthCompany.careers_url}, Got: ${discoveredUrl}`;
                    failures++;
                    console.log(`   ❌ Mismatch: ${discoveredUrl}`);
                }
            }
            results.push(result);
        }
        catch (error) {
            const result = {
                company: groundTruthCompany.name,
                website: groundTruthCompany.website,
                expectedCareersUrl: groundTruthCompany.careers_url || '',
                discoveredCareersUrl: null,
                success: false,
                matchType: 'none',
                notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
            results.push(result);
            failures++;
            console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    await scraper.close();
    const totalCompanies = results.length;
    const successRate = ((exactMatches + domainMatches + functionalMatches) / totalCompanies * 100).toFixed(1);
    console.log('\n📊 Career Page Detection Results');
    console.log('=================================');
    console.log(`Total companies tested: ${totalCompanies}`);
    console.log(`Exact matches: ${exactMatches} (${(exactMatches / totalCompanies * 100).toFixed(1)}%)`);
    console.log(`Domain matches: ${domainMatches} (${(domainMatches / totalCompanies * 100).toFixed(1)}%)`);
    console.log(`Functional matches: ${functionalMatches} (${(functionalMatches / totalCompanies * 100).toFixed(1)}%)`);
    console.log(`Failures: ${failures} (${(failures / totalCompanies * 100).toFixed(1)}%)`);
    console.log(`Overall success rate: ${successRate}%`);
    const reportTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `tests/career-detection-report-${reportTimestamp}.json`;
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalCompanies,
            exactMatches,
            domainMatches,
            functionalMatches,
            failures,
            successRate: parseFloat(successRate)
        },
        results
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        console.log('\n❌ Failed Detections:');
        failedResults.forEach(result => {
            console.log(`   ${result.company}: ${result.notes}`);
        });
    }
}
function normalizeUrl(url) {
    return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
}
function isSameDomain(url1, url2) {
    try {
        const domain1 = new URL(url1.startsWith('http') ? url1 : `https://${url1}`).hostname.replace(/^www\./, '');
        const domain2 = new URL(url2.startsWith('http') ? url2 : `https://${url2}`).hostname.replace(/^www\./, '');
        return domain1 === domain2;
    }
    catch {
        return false;
    }
}
async function isFunctionallyEquivalent(url1, url2) {
    const careerKeywords = ['career', 'job', 'stelle', 'karriere', 'work', 'employment'];
    const url1Lower = url1.toLowerCase();
    const url2Lower = url2.toLowerCase();
    const url1HasCareerKeywords = careerKeywords.some(keyword => url1Lower.includes(keyword));
    const url2HasCareerKeywords = careerKeywords.some(keyword => url2Lower.includes(keyword));
    return url1HasCareerKeywords && url2HasCareerKeywords && isSameDomain(url1, url2);
}
testCareerPageDetection().catch(console.error);
//# sourceMappingURL=test-career-detection.js.map