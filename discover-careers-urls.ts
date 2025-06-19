// Simple ad hoc script to discover careers URLs for a CSV file
// Usage: npx tsx discover-careers-urls.ts [csv-path]

import { SimpleScraper } from './src/scraper.js';
import { readCompaniesFromCSV } from './src/utils.js';

async function discoverCareersURLs() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const csvPath = args.find(arg => !arg.startsWith('--')) || 'data/input/scrape-batch-1.csv';
  
  // Parse options
  const options = {
    forceReprocess: args.includes('--force') || args.includes('--force-reprocess'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1'),
    startFromIndex: parseInt(args.find(arg => arg.startsWith('--start-from='))?.split('=')[1] || '0')
  };
  
  console.log('🔍 Careers URL Discovery');
  console.log('================================================\n');
  
  try {
    // Basic validation and stats
    console.log(`📄 Reading CSV file: ${csvPath}`);
    const companies = await readCompaniesFromCSV(csvPath);
    const companiesWithoutCareers = companies.filter(c => !c.careers_url);
    
    console.log(`📊 Total companies: ${companies.length}`);
    console.log(`🔍 Companies needing careers URLs: ${companiesWithoutCareers.length}`);
    console.log(`✅ Companies with careers URLs: ${companies.length - companiesWithoutCareers.length}`);
    console.log(`⚙️  Options: forceReprocess=${options.forceReprocess}, batchSize=${options.batchSize}, startFrom=${options.startFromIndex}\n`);
    
    if (companiesWithoutCareers.length === 0 && !options.forceReprocess) {
      console.log('🎉 All companies already have careers URLs!');
      console.log('📄 No updates needed for CSV file.');
      console.log('💡 Use --force to reprocess existing URLs');
      return;
    }
    
    // Progress tracking
    const startTime = Date.now();
    
    const targetCount = options.forceReprocess ? companies.length : companiesWithoutCareers.length;
    console.log(`🚀 Starting careers URL discovery for ${targetCount} companies...\n`);
    console.log(`🔄 Progressive saving enabled: CSV will be updated after each discovery`);
    console.log(`🛡️  Resume capability: Can safely restart from interruption\n`);
    
    const scraper = new SimpleScraper();
    
    try {
      await scraper.init();
      
      // Run the discovery using new method with options
      await scraper.scrapeAllCareersURLs(csvPath, options);
      
    } finally {
      await scraper.close();
    }
    
    // Show completion stats
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log(`\n🎉 Discovery complete!`);
    console.log(`⏱️  Total time: ${minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}`);
    console.log(`📄 Updated CSV: ${csvPath}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   • Review the updated CSV file for discovered URLs`);
    console.log(`   • Run job extraction: scraper.scrapeAllJobDetails('${csvPath}')`);
    console.log(`   • Or continue discovery: npm run careers-discovery -- ${csvPath}`);
    
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check that the CSV file exists and has the correct format');
    console.log('   • Ensure CSV has columns: Name, Website, CareersPage (optional)');
    console.log('   • Verify network connectivity for website access');
    console.log('   • CSV progress is saved automatically - can resume from interruption');
    process.exit(1);
  }
}

// Show usage information if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔍 Careers URL Discovery Script');
  console.log('===============================\n');
  console.log('Usage:');
  console.log('  npx tsx discover-careers-urls.ts [csv-path] [options]\n');
  console.log('Options:');
  console.log('  --force              Force reprocess companies with existing careers URLs');
  console.log('  --batch-size=N       Process N companies per batch (default: 1)');
  console.log('  --start-from=N       Start processing from index N (default: 0)');
  console.log('  --help, -h           Show this help message\n');
  console.log('Examples:');
  console.log('  # Basic usage (process companies without careers URLs)');
  console.log('  npx tsx discover-careers-urls.ts data/input/my-companies.csv\n');
  console.log('  # Force reprocess all companies (even those with existing URLs)');
  console.log('  npx tsx discover-careers-urls.ts data/input/my-companies.csv --force\n');
  console.log('  # Process in batches of 10 companies');
  console.log('  npx tsx discover-careers-urls.ts data/input/my-companies.csv --batch-size=10\n');
  console.log('  # Resume from company 500 after interruption');
  console.log('  npx tsx discover-careers-urls.ts data/input/my-companies.csv --start-from=500\n');
  console.log('  # Combine options');
  console.log('  npx tsx discover-careers-urls.ts data/input/my-companies.csv --batch-size=5 --start-from=100\n');
  console.log('Features:');
  console.log('  ✅ Progressive saving: CSV updated after each discovery');
  console.log('  ✅ Resume capability: Safe to restart after interruption');
  console.log('  ✅ Skip existing URLs: Only processes companies that need discovery');
  console.log('  ✅ Memory efficient: Browser reset between companies');
  console.log('  ✅ Progress tracking: Shows completion percentage and stats\n');
  console.log('CSV Format:');
  console.log('  Required columns: Name, Website');
  console.log('  Optional column: CareersPage (gets populated with discovered URLs)\n');
  process.exit(0);
}

// Run the script
discoverCareersURLs().catch(console.error); 