import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const stagehandConfig = {
  env: (process.env.STAGEHAND_ENV as 'LOCAL' | 'BROWSERBASE') || 'LOCAL',
  
  // API Key configuration
  apiKey: process.env.OPENAI_API_KEY,
  
  // Model configuration - gpt-4o-mini is more cost-effective for web automation
  modelName: 'gpt-4o-mini',
  
  // Browser configuration
  headless: process.env.STAGEHAND_HEADLESS === 'true',
  
  // Debugging and recording
  enableRecording: process.env.STAGEHAND_ENABLE_RECORDING === 'true',
  
  // Timeouts and performance
  domSettleTimeoutMs: 5000,
  defaultTimeout: 30000, // Default timeout for all operations
  
  // Viewport settings for consistency
  viewport: {
    width: 1280,
    height: 720
  },
  
  // Additional browser options for better compatibility and stealth
  browserLaunchOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled', // Stealth mode
      '--disable-features=VizDisplayCompositor'
    ],
    // Custom user agent to appear more like a real user
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  
  // Action and extraction settings
  actionTimeout: 10000, // Timeout for individual actions
  observeTimeout: 5000,  // Timeout for observe operations
  
  // For large-scale job extraction
  extractionOptions: {
    useTextExtract: true, // Better for extracting lots of text content
    maxRetries: 2        // Retry failed extractions
  }
};

export default stagehandConfig; 