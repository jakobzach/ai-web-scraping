// Test script for the simplified scraper
// Tests the working patterns from manual-debug.ts

import { SimpleScraper } from './src/scraper.js';
import { z } from 'zod';

const JobListingsURLSchema = z.object({
  url: z.string().url().describe("The URL of the job listings page")
});

async function testExtract() {
  const scraper = new SimpleScraper('career-detection-only');
  await scraper.init();

  const page = scraper.getPage();
  const url = "https://www.aero-lift.de/";
  await page.goto(url);
  await page.waitForTimeout(1000);
  await scraper.handleCookies();
  await page.waitForTimeout(1000);

  console.log("Extracting via hrefs:");

  const hrefs = await page.$$eval('a', links => 
    links.map(link => link.href).filter(href => href)
  );

  const uniqueHrefs = hrefs.filter((href, index, self) => 
    self.indexOf(href) === index
  );

  console.log(uniqueHrefs.filter(href => href.includes("stellenangebote")));

  await scraper.close();
}

testExtract();