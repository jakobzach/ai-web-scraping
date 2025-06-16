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
    await page.goto("https://aconity3d.com/");
    console.log("Waiting for 2 seconds");
    await page.waitForTimeout(2000);
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
    console.log("Observing");
    let actions = await page.observe("Click the 'Accept All' button");
    console.log("Actions found: ", JSON.stringify(actions, null, 2));
    if (actions && actions.length > 0) {
        console.log("Acting with observed action");
        const actresult = await page.act(actions[0]);
        console.log("Acted: ", JSON.stringify(actresult, null, 2));
    }
    else {
        console.log("No actions found, trying direct act");
        const directResult = await page.act("Click the Accept All button");
        console.log("Direct act result: ", JSON.stringify(directResult, null, 2));
    }
    await page.waitForTimeout(1000);
    actions = await page.observe("Navigate to the careers page");
    console.log("Actions found: ", JSON.stringify(actions, null, 2));
    if (actions && actions.length > 0) {
        console.log("Acting with observed action");
        const actresult = await page.act(actions[0]);
        console.log("Acted: ", JSON.stringify(actresult, null, 2));
    }
    else {
        console.log("No actions found, trying direct act");
    }
    await stagehand.close();
}
main();
//# sourceMappingURL=manual-debug.js.map