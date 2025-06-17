// Simple ad hoc script to discover careers URLs for a CSV file
// Usage: npx tsx discover-careers-urls.ts [csv-path]

import { SimpleScraper } from './src/scraper.js';
import { readCompaniesFromCSV } from './src/utils.js';

async function discoverCareersURLs() {
  // Get CSV path from command line args or use default
  const csvPath = process.argv[2] || 'data/input/scrape-batch-1.csv';
  
  console.log('🔍 Careers URL Discovery Script');
  console.log('===============================\n');
  
  try {
    // Basic validation and stats
    console.log(`📄 Reading CSV file: ${csvPath}`);
    const companies = await readCompaniesFromCSV(csvPath);
    const companiesWithoutCareers = companies.filter(c => !c.careers_url);
    
    console.log(`📊 Total companies: ${companies.length}`);
    console.log(`🔍 Companies needing careers URLs: ${companiesWithoutCareers.length}`);
    console.log(`✅ Companies with careers URLs: ${companies.length - companiesWithoutCareers.length}\n`);
    
    if (companiesWithoutCareers.length === 0) {
      console.log('🎉 All companies already have careers URLs!');
      console.log('📄 No updates needed for CSV file.');
      return;
    }
    
    // Progress tracking
    const startTime = Date.now();
    
    console.log(`🚀 Starting careers URL discovery for ${companiesWithoutCareers.length} companies...\n`);
    
    const scraper = new SimpleScraper();
    
    try {
      await scraper.init();
      
      // Run the discovery using existing method
      await scraper.scrapeAllCareersURLs(csvPath);
      
    } finally {
      await scraper.close();
    }
    
    // Show completion stats
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n🎉 Discovery complete!`);
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📄 Updated CSV: ${csvPath}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   • Review the updated CSV file for discovered URLs`);
    console.log(`   • Run job extraction: scraper.scrapeAllJobDetails('${csvPath}')`);
    
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check that the CSV file exists and has the correct format');
    console.log('   • Ensure CSV has columns: Name, Website, CareersPage (optional)');
    console.log('   • Verify network connectivity for website access');
    process.exit(1);
  }
}

// Show usage information if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔍 Careers URL Discovery Script');
  console.log('===============================\n');
  console.log('Usage:');
  console.log('  npx tsx discover-careers-urls.ts [csv-path]\n');
  console.log('Examples:');
  console.log('  npx tsx discover-careers-urls.ts                           # Use default: data/input/....csv');
  console.log('  npx tsx discover-careers-urls.ts data/input/new-batch.csv  # Use specific CSV file\n');
  console.log('CSV Format:');
  console.log('  Required columns: Name, Website');
  console.log('  Optional column: CareersPage (gets populated with discovered URLs)\n');
  process.exit(0);
}

// Run the script
discoverCareersURLs().catch(console.error); 