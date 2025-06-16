import { SimpleScraper } from '../src/scraper.js';
async function testConfigVerification() {
    console.log('🔧 Testing Stagehand Configuration Verification');
    console.log('===============================================\n');
    const scraper = new SimpleScraper('career-detection-only');
    try {
        await scraper.init();
        const page = scraper.getPage();
        await page.goto('https://httpbin.org/headers');
        const content = await page.content();
        console.log('📋 Headers sent to server:');
        console.log(content);
        if (content.includes('de-DE') || content.includes('de;q=0.9')) {
            console.log('✅ German language headers detected!');
        }
        else {
            console.log('❌ German language headers not found');
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
    finally {
        await scraper.close();
    }
}
testConfigVerification();
//# sourceMappingURL=test-config-verification.js.map