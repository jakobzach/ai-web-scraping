// Test script for the simplified scraper
// Tests the working patterns from manual-debug.ts

import { SimpleScraper } from './src/scraper.js';

async function testScraper() {
  const scraper = new SimpleScraper();
  
  try {
    console.log("Initializing scraper...");
    await scraper.init();
    
    // Test with a single company (same as manual-debug.ts)
    const testCompany = {
      name: "Aconity3D",
      website: "https://aconity3d.com/"
    };
    
    console.log("Testing single company scraping...");
    const jobs = await scraper.scrapeCompany(testCompany);
    
    console.log(`Result: Found ${jobs.length} jobs`);
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await scraper.close();
  }
}

testScraper(); 