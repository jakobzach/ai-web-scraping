import { SimpleScraper } from '../src/scraper.js';
import dotenv from 'dotenv';
dotenv.config();
async function testScraper() {
    console.log('🧪 Testing SimpleScraper with test-websites.csv');
    console.log('================================================');
    const scraper = new SimpleScraper();
    try {
        await scraper.init();
        console.log('✅ Scraper initialized successfully');
        const csvPath = 'data/input/test-websites.csv';
        console.log(`📁 Using CSV file: ${csvPath}`);
        await scraper.scrapeAll(csvPath);
        console.log('\n🎉 Test completed successfully!');
        console.log('📄 Check public/jobs.json for results');
        console.log('📄 Check data/input/test-websites.csv for discovered careers URLs');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
    finally {
        await scraper.close();
        console.log('🧹 Scraper closed');
    }
}
testScraper().catch(console.error);
//# sourceMappingURL=test-scraper.js.map