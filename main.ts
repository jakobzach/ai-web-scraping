import { SimpleScraper } from "./src/scraper.js";

const testMode = 'career-detection-only';

async function main() {
    
    const csvPath = "./data/companies.csv";
    
    
    console.log("Initializing scraper...");
    const scraper = new SimpleScraper();
    await scraper.init();

    const page = scraper.getPage();


    await scraper.close();

}

main();