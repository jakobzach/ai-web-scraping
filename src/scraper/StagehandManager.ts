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
} 