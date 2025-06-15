import { Stagehand } from '@browserbasehq/stagehand';
import stagehandConfig from '../../config/stagehand.config.js';
import { ScrapingConfig, PageTimeoutConfig } from '../types/index.js';
import { z } from 'zod';

export class StagehandManager {
  private stagehand: Stagehand | null = null;
  private page: any = null; // Stagehand page instance
  private config: ScrapingConfig;
  private pageTimeouts: PageTimeoutConfig;
  private userAgents: string[] = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = {
      delayMs: 2000,
      maxRetries: 3,
      timeoutMs: 30000,
      headless: stagehandConfig.headless,
      enableRecording: stagehandConfig.enableRecording,
      ...config
    };

    // Initialize page timeout configurations for different operations
    this.pageTimeouts = {
      navigation: 3000,      // Page navigation timeout
      action: 1000,          // Individual action timeout (clicks, typing)
      extraction: 1500,      // Data extraction timeout
      networkIdle: 5000,      // Wait for network to be idle
      domContentLoaded: 2000 // Wait for DOM content to load
    };
  }

  /**
   * Initialize Stagehand browser instance
   */
  async initialize(): Promise<void> {
    try {
      if (!stagehandConfig.apiKey) {
        throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.');
      }

      this.stagehand = new Stagehand({
        env: stagehandConfig.env,
        apiKey: stagehandConfig.apiKey,
        modelName: stagehandConfig.modelName,
        domSettleTimeoutMs: stagehandConfig.domSettleTimeoutMs
      });

      await this.stagehand.init();
      this.page = this.stagehand.page;
      
      // Configure page with appropriate timeouts
      await this.configurePageTimeouts();
      
      // Apply minimal stealth settings
      await this.applyStealthSettings();

      console.log('StagehandManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize StagehandManager:', error);
      throw new Error(`StagehandManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current page instance
   */
  getPage(): any {
    return this.page;
  }

  /**
   * Get the Stagehand instance
   */
  getStagehand(): Stagehand | null {
    return this.stagehand;
  }

  /**
   * Check if StagehandManager is initialized
   */
  isInitialized(): boolean {
    return this.stagehand !== null && this.page !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): ScrapingConfig {
    return { ...this.config };
  }

  /**
   * Configure page with appropriate timeouts for different operations
   */
  private async configurePageTimeouts(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not available for timeout configuration');
    }

    try {
      // Set default timeout for general operations
      await this.page.setDefaultTimeout(this.config.timeoutMs);
      
      // Set navigation timeout specifically
      await this.page.setDefaultNavigationTimeout(this.pageTimeouts.navigation);
      
      console.log('Page timeouts configured successfully', {
        default: this.config.timeoutMs,
        navigation: this.pageTimeouts.navigation,
        action: this.pageTimeouts.action,
        extraction: this.pageTimeouts.extraction
      });
    } catch (error) {
      console.error('Error configuring page timeouts:', error);
      throw new Error(`Failed to configure page timeouts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update timeout configuration for specific operations
   */
  updateTimeouts(newTimeouts: Partial<PageTimeoutConfig>): void {
    this.pageTimeouts = { ...this.pageTimeouts, ...newTimeouts };
    console.log('Timeout configuration updated:', this.pageTimeouts);
  }

  /**
   * Get current timeout configuration
   */
  getTimeouts(): PageTimeoutConfig {
    return { ...this.pageTimeouts };
  }

  /**
   * Navigate to URL with configured timeout and wait strategies
   */
  async navigateWithTimeout(url: string, waitStrategy: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' = 'load'): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    try {
      console.log(`Navigating to: ${url} with wait strategy: ${waitStrategy}`);
      
      await this.page.goto(url, {
        waitUntil: waitStrategy,
        timeout: this.pageTimeouts.navigation
      });

      console.log(`Successfully navigated to: ${url}`);
    } catch (error) {
      console.error(`Navigation failed for ${url}:`, error);
      throw new Error(`Navigation timeout or error for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for page to be ready for interaction
   */
  async waitForPageReady(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // Wait for DOM content to be loaded
      await this.page.waitForLoadState('domcontentloaded', { 
        timeout: this.pageTimeouts.domContentLoaded 
      });
      
      // Wait for network to be mostly idle (useful for SPAs)
      await this.page.waitForLoadState('networkidle', { 
        timeout: this.pageTimeouts.networkIdle 
      });

      console.log('Page is ready for interaction');
    } catch (error) {
      console.warn('Page readiness check timed out, proceeding anyway:', error);
      // Don't throw error as some pages might not reach ideal state
    }
  }

  /**
   * Handle cookie consent banners using Stagehand best practices
   * Uses observe -> act pattern for better reliability and performance
   */
  async handleCookieBanner(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      console.log('   🍪 Checking for cookie consent banners...');
      
      // Wait for page to fully load including any cookie banners
      await this.page.waitForTimeout(3000);
      
      // Debug: See what elements are actually available on the page
      console.log('   🔍 Checking what elements are available on the page...');
      try {
        const availableElements = await this.page.observe();
        console.log(`   🔍 Found ${availableElements?.length || 0} total actionable elements on page`);
        if (availableElements && availableElements.length > 0) {
          console.log('   🔍 Sample of available elements:');
          availableElements.slice(0, 5).forEach((element: any, index: number) => {
            console.log(`     ${index + 1}. ${element.description || 'No description'} (${element.method || element.action})`);
          });
        }
      } catch (debugError) {
        console.log('   ⚠️ Could not observe available elements:', debugError);
      }
      
      // Use observe-then-act pattern for better reliability
      const cookieInstructions = [
        'Accept all cookies',
        'Accept cookies', 
        'Click accept all',
        'Dismiss cookie banner',
        'Close privacy notice',
        // Add German variations for German websites
        'Alle Cookies akzeptieren',
        'Cookies akzeptieren',
        'Akzeptieren',
        'Cookie-Banner schließen',
        'Datenschutzhinweis schließen'
      ];

      for (const instruction of cookieInstructions) {
        try {
          console.log(`   🍪 Observing: ${instruction}`);
          
          // First observe to get the action without executing it
          const actions = await this.page.observe(instruction);
          
          // Debug: Always log what observe() returns
          console.log(`   🔍 Raw observe result for "${instruction}":`, JSON.stringify(actions, null, 2));
          
          if (actions && actions.length > 0) {
            console.log(`   🍪 Found ${actions.length} possible action(s) for: ${instruction}`);
            
            // Log observed actions for debugging
            console.log('   🔍 Observed actions:');
            actions.forEach((action: any, index: number) => {
              console.log(`     ${index + 1}. ${JSON.stringify({
                description: action.description,
                method: action.method || action.action,
                selector: action.selector,
                arguments: action.arguments
              }, null, 2)}`);
            });
            
            // Act on the first (best) observed action - no LLM inference needed
            const topAction = actions[0];
            console.log(`   🎯 Executing top action: ${topAction.description || 'No description'}`);
            await this.page.act(topAction);
            
            console.log('   🍪 Cookie action executed, waiting...');
            
            // Wait for banner to disappear
            await this.page.waitForTimeout(3000);
            
            console.log('   ✅ Cookie banner handling completed');
            return true;
          } else {
            console.log(`   ⚠️ No actions found for: ${instruction}`);
            console.log(`   🔍 Actions array is: ${actions === null ? 'null' : actions === undefined ? 'undefined' : `array with length ${actions.length}`}`);
          }
        } catch (error) {
          // Continue to next instruction if this one fails
          console.log(`   ⚠️ ${instruction} failed:`, error instanceof Error ? error.message : 'Unknown error');
          continue;
        }
      }
      
      console.log('   ℹ️ No cookie banner buttons found');
      return false;
      
    } catch (error) {
      console.log('   ⚠️ Cookie banner handling failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Apply minimal stealth settings for SME websites
   */
  private async applyStealthSettings(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not available for stealth configuration');
    }

    try {
      // Set random user agent
      const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await this.page.setUserAgent(randomUserAgent);
      
      // Remove webdriver property that screams "bot"
      await this.page.evaluateOnNewDocument('() => { delete navigator.webdriver; }');
      
      console.log('Minimal stealth settings applied');
    } catch (error) {
      console.warn('Failed to apply stealth settings, continuing anyway:', error);
      // Don't throw error as stealth is nice-to-have for SMEs
    }
  }

  /**
   * Close the current page while keeping the browser instance active
   */
  async closePage(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
        console.log('Page closed successfully');
      }
    } catch (error) {
      console.error('Error closing page:', error);
      throw new Error(`Failed to close page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close the entire browser and clean up resources
   */
  async close(): Promise<void> {
    try {
      if (this.stagehand) {
        await this.stagehand.close();
        this.stagehand = null;
        this.page = null;
        console.log('StagehandManager closed successfully');
      }
    } catch (error) {
      console.error('Error closing StagehandManager:', error);
      throw new Error(`Failed to close StagehandManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restart the browser instance (close and reinitialize)
   */
  async restart(): Promise<void> {
    try {
      console.log('Restarting StagehandManager...');
      await this.close();
      await this.initialize();
      console.log('StagehandManager restarted successfully');
    } catch (error) {
      console.error('Error restarting StagehandManager:', error);
      throw new Error(`Failed to restart StagehandManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new page instance (for multi-page scenarios)
   */
  async createNewPage(): Promise<any> {
    try {
      if (!this.stagehand) {
        throw new Error('StagehandManager not initialized. Call initialize() first.');
      }
      
      const newPage = await this.stagehand.context.newPage();
      
      // Apply timeout configuration to new page
      await newPage.setDefaultTimeout(this.config.timeoutMs);
      await newPage.setDefaultNavigationTimeout(this.pageTimeouts.navigation);
      
      // Apply stealth settings to new page
      try {
        const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        await (newPage as any).setUserAgent(randomUserAgent);
        await (newPage as any).evaluateOnNewDocument('() => { delete navigator.webdriver; }');
      } catch (stealthError) {
        console.warn('Could not apply stealth to new page, continuing anyway');
      }
      
      console.log('New page created with timeouts and stealth settings');
      return newPage;
    } catch (error) {
      console.error('Error creating new page:', error);
      throw new Error(`Failed to create new page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up graceful shutdown handler
   */
  setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down StagehandManager...`);
      try {
        await this.close();
        console.log('StagehandManager shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle common termination signals
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // For nodemon
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      try {
        await this.close();
      } catch (shutdownError) {
        console.error('Error during emergency shutdown:', shutdownError);
      }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      try {
        await this.close();
      } catch (shutdownError) {
        console.error('Error during emergency shutdown:', shutdownError);
      }
      process.exit(1);
    });
  }

  /**
   * Get browser health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; details: string }> {
    try {
      if (!this.isInitialized()) {
        return { healthy: false, details: 'StagehandManager not initialized' };
      }

      // Test if page is responsive
      await this.page?.evaluate('() => document.readyState');
      
      return { healthy: true, details: 'Browser instance is healthy and responsive' };
    } catch (error) {
      return { 
        healthy: false, 
        details: `Browser health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
} 