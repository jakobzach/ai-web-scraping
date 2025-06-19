import { SimpleScraper } from '../src/scraper.js';
async function testGermanConfig() {
    console.log('🇩🇪 Testing German Language Configuration');
    console.log('=========================================\n');
    const scraper = new SimpleScraper('career-detection-only');
    await scraper.init();
    const testCompany = {
        name: 'AERZEN Deutschland GmbH & Co. KG',
        website: 'aerzen.com'
    };
    console.log(`Testing German navigation on: ${testCompany.name}`);
    console.log(`Website: ${testCompany.website}\n`);
    try {
        const jobs = await scraper.scrapeCompany(testCompany);
        console.log(`\n✅ Test completed successfully`);
    }
    catch (error) {
        console.error(`❌ Test failed:`, error);
    }
    finally {
        await scraper.close();
    }
}
testGermanConfig().catch(console.error);
//# sourceMappingURL=test-german-config.js.map