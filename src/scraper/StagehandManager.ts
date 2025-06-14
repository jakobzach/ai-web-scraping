import { Stagehand } from '@browserbasehq/stagehand';
import stagehandConfig from '../../config/stagehand.config.js';
import { ScrapingConfig } from '../types/index.js';

export class StagehandManager {
  private stagehand: Stagehand | null = null;
  private page: any = null; // Stagehand page instance
  private config: ScrapingConfig;

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = {
      delayMs: 2000,
      maxRetries: 3,
      timeoutMs: 30000,
      headless: stagehandConfig.headless,
      enableRecording: stagehandConfig.enableRecording,
      ...config
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
      
      // Set default timeouts based on configuration
      if (this.page) {
        await this.page.setDefaultTimeout(this.config.timeoutMs);
      }

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
      await newPage.setDefaultTimeout(this.config.timeoutMs);
      
      console.log('New page created successfully');
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