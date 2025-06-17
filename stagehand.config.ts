import dotenv from "dotenv";

dotenv.config();

const StagehandConfig = {
  env: "LOCAL" as const,
  modelName: "gpt-4o-mini" as const,
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  localBrowserLaunchOptions: {
    headless: false, // Launches the browser in headless mode.
    args: [
        '--lang=de-DE',
        '--accept-lang=de-DE,de;q=0.9,en;q=0.8',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
     ], // Additional launch arguments.
    extraHTTPHeaders: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    geolocation: { latitude: 52.5691, longitude: 13.4075 },
    permissions: ["geolocation", "notifications"],
    locale: "de-DE",
    viewport: { width: 1280, height: 720 },
    }
};

export default StagehandConfig; 