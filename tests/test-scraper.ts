// Test script for the simplified scraper using test-websites.csv
// This validates Work Package 2 implementation

import { SimpleScraper } from '../src/scraper.js';
import dotenv from 'dotenv';

dotenv.config();

async function testScraper() {
  console.log('🧪 Testing SimpleScraper with test-websites.csv');
  console.log('================================================');
  
  const scraper = new SimpleScraper();
  
  try {
    // Initialize the scraper
    await scraper.init();
    console.log('✅ Scraper initialized successfully');
    
    // Test with the test CSV file
    const csvPath = 'data/input/test-websites.csv';
    console.log(`📁 Using CSV file: ${csvPath}`);
    
    // Run the full pipeline on all test companies
    await scraper.runFullPipeline(csvPath);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('📄 Check public/jobs.json for results');
    console.log('📄 Check data/input/test-websites.csv for discovered careers URLs');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await scraper.close();
    console.log('🧹 Scraper closed');
  }
}

// Run the test
testScraper().catch(console.error); 