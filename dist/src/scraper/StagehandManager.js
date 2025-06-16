import { Stagehand } from '@browserbasehq/stagehand';
import stagehandConfig from '../../config/stagehand.config.js';
export class StagehandManager {
    stagehand = null;
    page = null;
    config;
    pageTimeouts;
    userAgents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    constructor(config) {
        this.config = {
            delayMs: 2000,
            maxRetries: 3,
            timeoutMs: 30000,
            headless: stagehandConfig.headless,
            enableRecording: stagehandConfig.enableRecording,
            ...config
        };
        this.pageTimeouts = {
            navigation: 3000,
            action: 1000,
            extraction: 1500,
            networkIdle: 5000,
            domContentLoaded: 2000
        };
    }
    async initialize() {
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
            await this.configurePageTimeouts();
            await this.applyStealthSettings();
            console.log('StagehandManager initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize StagehandManager:', error);
            throw new Error(`StagehandManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getPage() {
        return this.page;
    }
    getStagehand() {
        return this.stagehand;
    }
    isInitialized() {
        return this.stagehand !== null && this.page !== null;
    }
    getConfig() {
        return { ...this.config };
    }
    async configurePageTimeouts() {
        if (!this.page) {
            throw new Error('Page not available for timeout configuration');
        }
        try {
            await this.page.setDefaultTimeout(this.config.timeoutMs);
            await this.page.setDefaultNavigationTimeout(this.pageTimeouts.navigation);
            console.log('Page timeouts configured successfully', {
                default: this.config.timeoutMs,
                navigation: this.pageTimeouts.navigation,
                action: this.pageTimeouts.action,
                extraction: this.pageTimeouts.extraction
            });
        }
        catch (error) {
            console.error('Error configuring page timeouts:', error);
            throw new Error(`Failed to configure page timeouts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    updateTimeouts(newTimeouts) {
        this.pageTimeouts = { ...this.pageTimeouts, ...newTimeouts };
        console.log('Timeout configuration updated:', this.pageTimeouts);
    }
    getTimeouts() {
        return { ...this.pageTimeouts };
    }
    async navigateWithTimeout(url, waitStrategy = 'load') {
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
        }
        catch (error) {
            console.error(`Navigation failed for ${url}:`, error);
            throw new Error(`Navigation timeout or error for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async waitForPageReady() {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        try {
            await this.page.waitForLoadState('domcontentloaded', {
                timeout: this.pageTimeouts.domContentLoaded
            });
            await this.page.waitForLoadState('networkidle', {
                timeout: this.pageTimeouts.networkIdle
            });
            console.log('Page is ready for interaction');
        }
        catch (error) {
            console.warn('Page readiness check timed out, proceeding anyway:', error);
        }
    }
    async handleCookieBanner() {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        try {
            console.log('   🍪 Checking for cookie consent banners...');
            await this.page.waitForTimeout(3000);
            console.log('   🔍 Checking what elements are available on the page...');
            try {
                const availableElements = await this.page.observe();
                console.log(`   🔍 Found ${availableElements?.length || 0} total actionable elements on page`);
                if (availableElements && availableElements.length > 0) {
                    console.log('   🔍 Sample of available elements:');
                    availableElements.slice(0, 5).forEach((element, index) => {
                        console.log(`     ${index + 1}. ${element.description || 'No description'} (${element.method || element.action})`);
                    });
                }
            }
            catch (debugError) {
                console.log('   ⚠️ Could not observe available elements:', debugError);
            }
            const cookieInstructions = [
                'Accept all cookies',
                'Accept cookies',
                'Click accept all',
                'Dismiss cookie banner',
                'Close privacy notice',
                'Alle Cookies akzeptieren',
                'Cookies akzeptieren',
                'Akzeptieren',
                'Cookie-Banner schließen',
                'Datenschutzhinweis schließen'
            ];
            for (const instruction of cookieInstructions) {
                try {
                    console.log(`   🍪 Observing: ${instruction}`);
                    const actions = await this.page.observe(instruction);
                    console.log(`   🔍 Raw observe result for "${instruction}":`, JSON.stringify(actions, null, 2));
                    if (actions && actions.length > 0) {
                        console.log(`   🍪 Found ${actions.length} possible action(s) for: ${instruction}`);
                        console.log('   🔍 Observed actions:');
                        actions.forEach((action, index) => {
                            console.log(`     ${index + 1}. ${JSON.stringify({
                                description: action.description,
                                method: action.method || action.action,
                                selector: action.selector,
                                arguments: action.arguments
                            }, null, 2)}`);
                        });
                        const topAction = actions[0];
                        console.log(`   🎯 Executing top action: ${topAction.description || 'No description'}`);
                        await this.page.act(topAction);
                        console.log('   🍪 Cookie action executed, waiting...');
                        await this.page.waitForTimeout(3000);
                        console.log('   ✅ Cookie banner handling completed');
                        return true;
                    }
                    else {
                        console.log(`   ⚠️ No actions found for: ${instruction}`);
                        console.log(`   🔍 Actions array is: ${actions === null ? 'null' : actions === undefined ? 'undefined' : `array with length ${actions.length}`}`);
                    }
                }
                catch (error) {
                    console.log(`   ⚠️ ${instruction} failed:`, error instanceof Error ? error.message : 'Unknown error');
                    continue;
                }
            }
            console.log('   ℹ️ No cookie banner buttons found');
            return false;
        }
        catch (error) {
            console.log('   ⚠️ Cookie banner handling failed:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    async applyStealthSettings() {
        if (!this.page) {
            throw new Error('Page not available for stealth configuration');
        }
        try {
            const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
            await this.page.setUserAgent(randomUserAgent);
            await this.page.evaluateOnNewDocument('() => { delete navigator.webdriver; }');
            console.log('Minimal stealth settings applied');
        }
        catch (error) {
            console.warn('Failed to apply stealth settings, continuing anyway:', error);
        }
    }
    async closePage() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
                console.log('Page closed successfully');
            }
        }
        catch (error) {
            console.error('Error closing page:', error);
            throw new Error(`Failed to close page: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async close() {
        try {
            if (this.stagehand) {
                await this.stagehand.close();
                this.stagehand = null;
                this.page = null;
                console.log('StagehandManager closed successfully');
            }
        }
        catch (error) {
            console.error('Error closing StagehandManager:', error);
            throw new Error(`Failed to close StagehandManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async restart() {
        try {
            console.log('Restarting StagehandManager...');
            await this.close();
            await this.initialize();
            console.log('StagehandManager restarted successfully');
        }
        catch (error) {
            console.error('Error restarting StagehandManager:', error);
            throw new Error(`Failed to restart StagehandManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createNewPage() {
        try {
            if (!this.stagehand) {
                throw new Error('StagehandManager not initialized. Call initialize() first.');
            }
            const newPage = await this.stagehand.context.newPage();
            await newPage.setDefaultTimeout(this.config.timeoutMs);
            await newPage.setDefaultNavigationTimeout(this.pageTimeouts.navigation);
            try {
                const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
                await newPage.setUserAgent(randomUserAgent);
                await newPage.evaluateOnNewDocument('() => { delete navigator.webdriver; }');
            }
            catch (stealthError) {
                console.warn('Could not apply stealth to new page, continuing anyway');
            }
            console.log('New page created with timeouts and stealth settings');
            return newPage;
        }
        catch (error) {
            console.error('Error creating new page:', error);
            throw new Error(`Failed to create new page: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    setupGracefulShutdown() {
        const shutdownHandler = async (signal) => {
            console.log(`\nReceived ${signal}. Gracefully shutting down StagehandManager...`);
            try {
                await this.close();
                console.log('StagehandManager shutdown complete');
                process.exit(0);
            }
            catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGINT', () => shutdownHandler('SIGINT'));
        process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
        process.on('SIGUSR2', () => shutdownHandler('SIGUSR2'));
        process.on('uncaughtException', async (error) => {
            console.error('Uncaught exception:', error);
            try {
                await this.close();
            }
            catch (shutdownError) {
                console.error('Error during emergency shutdown:', shutdownError);
            }
            process.exit(1);
        });
        process.on('unhandledRejection', async (reason, promise) => {
            console.error('Unhandled rejection at:', promise, 'reason:', reason);
            try {
                await this.close();
            }
            catch (shutdownError) {
                console.error('Error during emergency shutdown:', shutdownError);
            }
            process.exit(1);
        });
    }
    async getHealthStatus() {
        try {
            if (!this.isInitialized()) {
                return { healthy: false, details: 'StagehandManager not initialized' };
            }
            await this.page?.evaluate('() => document.readyState');
            return { healthy: true, details: 'Browser instance is healthy and responsive' };
        }
        catch (error) {
            return {
                healthy: false,
                details: `Browser health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
//# sourceMappingURL=StagehandManager.js.map