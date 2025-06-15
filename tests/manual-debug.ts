//* This file is used to manually debug the scraper.
//* It is not used in the automated test suite.

import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const stagehand = new Stagehand({
		env: "LOCAL",
		modelName: "gpt-4o-mini",
		modelClientOptions: {
			apiKey: process.env.OPENAI_API_KEY,
		},
	});
	await stagehand.init();

	const page = stagehand.page;

	//await page.goto("https://amba.de/");
    //await page.goto("https://abelpumps.com/");
    await page.goto("https://aconity3d.com/");

    console.log("Waiting for 2 seconds");
    await page.waitForTimeout(2000);

    // Check for iframes
    console.log("Checking for iframes...");
    const iframes = await page.$$('iframe');
    console.log(`Found ${iframes.length} iframes`);
    
    for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        if (iframe) {
            const src = await iframe.getAttribute('src');
            const name = await iframe.getAttribute('name');
            const id = await iframe.getAttribute('id');
            console.log(`Iframe ${i}: src="${src}", name="${name}", id="${id}"`);
        }
    }

    // console.log("Looking for cookie buttons with CSS selectors...");
    // const cookieButtons = await page.$$eval('button', buttons => 
    //     buttons.map(btn => ({
    //         text: btn.textContent?.trim(),
    //         className: btn.className,
    //         id: btn.id,
    //         tagName: btn.tagName
    //     })).filter(btn => 
    //         btn.text?.toLowerCase().includes('accept') ||
    //         btn.text?.toLowerCase().includes('akzeptieren') ||
    //         btn.className?.toLowerCase().includes('accept') ||
    //         btn.className?.toLowerCase().includes('cookie')
    //     )
    // );
    // console.log("Found cookie-related buttons:", JSON.stringify(cookieButtons, null, 2));

    console.log("Observing");
	let actions = await page.observe("Click the 'Accept All' button");

    console.log("Actions found: ", JSON.stringify(actions, null, 2));

    if (actions && actions.length > 0) {
        console.log("Acting with observed action");
        const actresult = await page.act(actions[0]!);
        console.log("Acted: ", JSON.stringify(actresult, null, 2));
    } else {
        console.log("No actions found, trying direct act");
        const directResult = await page.act("Click the Accept All button");
        console.log("Direct act result: ", JSON.stringify(directResult, null, 2));
    }

    await page.waitForTimeout(1000);

    actions = await page.observe("Navigate to the careers page");
    console.log("Actions found: ", JSON.stringify(actions, null, 2));
    if (actions && actions.length > 0) {
        console.log("Acting with observed action");
        const actresult = await page.act(actions[0]!);
        console.log("Acted: ", JSON.stringify(actresult, null, 2));
    } else {
        console.log("No actions found, trying direct act");
    }

    await stagehand.close();

}

main();