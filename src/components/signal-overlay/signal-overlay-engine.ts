import { api_base } from '@/external/bot-skeleton';
import { derivAPIService } from '@/services/deriv-api.service';
import { SignalData, SignalType, NumericSignalConfig, TradeOutcome, DistributionAnalysis, TickData } from './types';

class SignalOverlayEngine {
    private config: NumericSignalConfig | null = null;
    private onSignalUpdate: ((signal: SignalData | null) => void) | null = null;
    private onOutcomeChange: ((outcome: TradeOutcome) => void) | null = null;
    private currentSignal: SignalData | null = null;
    private tickBuffer: TickData[] = [];
    private unsubscribe: (() => void) | null = null;
    private countdownInterval: NodeJS.Timeout | null = null;
    private signalGenerationInterval: NodeJS.Timeout | null = null;
    private isInitialized = false;
    private activeSignalIds = new Set<string>();
    private currentOutcome: TradeOutcome = 'none';
    private readonly SIGNAL_DURATION = 120; // 120 seconds
    private readonly MIN_TICKS_FOR_ANALYSIS = 50;
    private readonly CONFIDENCE_THRESHOLD = 65; // Minimum 65% confidence
    private readonly TICK_BUFFER_SIZE = 100;
    private readonly SIGNAL_CHECK_INTERVAL = 5000; // Check every 5 seconds
    private readonly MARKET = 'R_50'; // Volatility 50 Index

    /**
     * Initialize the signal engine
     */
    async initialize(
        config: NumericSignalConfig,
        onSignalUpdate: (signal: SignalData | null) => void,
        onOutcomeChange: (outcome: TradeOutcome) => void
    ): Promise<void> {
        if (this.isInitialized) {
            console.warn('⚠️ Engine already initialized. Use reload() to update config.');
            return;
        }

        this.config = config;
        this.onSignalUpdate = onSignalUpdate;
        this.onOutcomeChange = onOutcomeChange;

        try {
            console.log('🚀 Initializing Signal Overlay Engine...');
            await this.connectToDerivAPI();
            this.startSignalGeneration();
            this.isInitialized = true;
            console.log('✅ Signal Overlay Engine initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize engine:', error);
            throw error;
        }
    }

    /**
     * Reload engine with new configuration
     */
    async reload(config: NumericSignalConfig): Promise<void> {
        console.log('🔄 Reloading engine with new config...');
        this.config = config;
        this.clearCurrentSignal();
        console.log('✅ Engine reloaded successfully');
    }

    /**
     * Connect to Deriv API and subscribe to tick data
     */
    private async connectToDerivAPI(): Promise<void> {
        try {
            console.log(`📡 Connecting to Deriv API for market: ${this.MARKET}`);

            // Wait for API to be available
            if (!api_base.api) {
                console.log('⏳ Waiting for Deriv API to initialize...');
                await this.waitForAPI();
            }

            // Check if API is connected
            if (!api_base.api || !api_base.api.connection || api_base.api.connection.readyState !== 1) {
                throw new Error('Deriv API not connected. Please ensure you are logged in.');
            }

            console.log('🔌 API connection state:', api_base.api.connection.readyState);

            const subscriptionId = await derivAPIService.subscribeToTicks(this.MARKET, tickData => {
                console.log('📊 Raw tick data received:', tickData);
                
                if (tickData?.tick) {
                    console.log('✅ Tick structure valid:', {
                        quote: tickData.tick.quote,
                        epoch: tickData.tick.epoch,
                        symbol: tickData.tick.symbol
                    });
                    
                    if (tickData.tick.quote && tickData.tick.epoch) {
                        this.handleTickData({
                            quote: tickData.tick.quote,
                            epoch: tickData.tick.epoch,
                        });
                    } else {
                        console.warn('⚠️ Tick missing quote or epoch:', tickData.tick);
                    }
                } else {
                    console.warn('⚠️ Invalid tick data structure:', tickData);
                }
            });

            console.log('📡 Subscription ID:', subscriptionId);

            if (!subscriptionId) {
                throw new Error('Failed to create subscription - no subscription ID returned');
            }

            // Store unsubscribe function
            this.unsubscribe = () => {
                if (subscriptionId) {
                    console.log('🔌 Unsubscribing from tick stream:', subscriptionId);
                    derivAPIService.unsubscribe(subscriptionId).catch(console.error);
                }
            };

            console.log('✅ Connected to Deriv API successfully');
        } catch (error) {
            console.error('❌ Failed to connect to Deriv API:', error);
            // Retry after delay
            setTimeout(() => {
                if (this.isInitialized) {
                    console.log('🔄 Retrying connection...');
                    this.connectToDerivAPI().catch(console.error);
                }
            }, 5000);
            throw error;
        }
    }

    /**
     * Wait for API to be available
     */
    private async waitForAPI(timeout: number = 30000): Promise<void> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkAPI = () => {
                const elapsed = Date.now() - startTime;

                // Check multiple API availability patterns
                const hasApiBase = api_base && api_base.api;
                const hasConnection = hasApiBase && api_base.api.connection;
                const isConnected = hasConnection && api_base.api.connection.readyState === 1;

                // Also check if we can access the send method
                const canSend = hasApiBase && typeof api_base.api.send === 'function';

                if (isConnected || (hasApiBase && canSend)) {
                    console.log('✅ Deriv API is ready');
                    resolve();
                    return;
                }

                if (elapsed >= timeout) {
                    reject(new Error('Timeout waiting for Deriv API. Please ensure you are logged in.'));
                    return;
                }

                setTimeout(checkAPI, 500);
            };

            checkAPI();
        });
    }

    /**
     * Handle incoming tick data
     */
    private handleTickData(tick: TickData): void {
        // Add to buffer
        this.tickBuffer.push(tick);

        // Maintain buffer size
        if (this.tickBuffer.length > this.TICK_BUFFER_SIZE) {
            this.tickBuffer.shift();
        }

        // Log tick count periodically
        if (this.tickBuffer.length % 10 === 0) {
            console.log(`📊 Tick buffer size: ${this.tickBuffer.length}`);
        }
    }

    /**
     * Start signal generation loop
     */
    private startSignalGeneration(): void {
        // Clear any existing interval
        if (this.signalGenerationInterval) {
            clearInterval(this.signalGenerationInterval);
        }

        // Check for signal generation periodically
        this.signalGenerationInterval = setInterval(() => {
            this.checkAndGenerateSignal();
        }, this.SIGNAL_CHECK_INTERVAL);

        console.log('🔄 Signal generation loop started');
    }

    /**
     * Check conditions and generate signal if appropriate
     */
    private checkAndGenerateSignal(): void {
        // Don't generate if we already have an active signal
        if (this.currentSignal) {
            return;
        }

        // Need minimum ticks for analysis
        if (this.tickBuffer.length < this.MIN_TICKS_FOR_ANALYSIS) {
            console.log(`⏳ Waiting for more ticks (${this.tickBuffer.length}/${this.MIN_TICKS_FOR_ANALYSIS})`);
            return;
        }

        // Perform distribution analysis
        const analysis = this.analyzeDistribution();

        // Check if confidence threshold is met
        if (analysis.confidenceScore < this.CONFIDENCE_THRESHOLD) {
            console.log(`📉 Confidence too low: ${analysis.confidenceScore}% (threshold: ${this.CONFIDENCE_THRESHOLD}%)`);
            return;
        }

        // Generate signal based on bias
        if (analysis.bias !== 'NEUTRAL') {
            this.generateSignal(analysis);
        }
    }

    /**
     * Analyze tick distribution using Novagrid 2026 + Patel-style logic
     */
    private analyzeDistribution(): DistributionAnalysis {
        const recentTicks = this.tickBuffer.slice(-this.MIN_TICKS_FOR_ANALYSIS);
        const lastDigits = recentTicks.map(tick => {
            const price = tick.quote;
            const lastDigit = Math.abs(Math.floor(price * 100)) % 10;
            return lastDigit;
        });

        // Count OVER (5-9) and UNDER (0-4) occurrences
        let overCount = 0;
        let underCount = 0;

        lastDigits.forEach(digit => {
            if (digit >= 5) {
                overCount++;
            } else {
                underCount++;
            }
        });

        const total = lastDigits.length;
        const overPercentage = (overCount / total) * 100;
        const underPercentage = (underCount / total) * 100;

        // Determine bias (Novagrid 2026 logic: look for statistical deviation)
        let bias: 'OVER' | 'UNDER' | 'NEUTRAL' = 'NEUTRAL';
        let confidenceScore = 50;

        // If OVER is dominant (>60%), predict UNDER (mean reversion)
        if (overPercentage > 60) {
            bias = 'UNDER';
            confidenceScore = Math.min(95, overPercentage + 5);
        }
        // If UNDER is dominant (>60%), predict OVER (mean reversion)
        else if (underPercentage > 60) {
            bias = 'OVER';
            confidenceScore = Math.min(95, underPercentage + 5);
        }

        console.log('📊 Distribution Analysis:', {
            overCount,
            underCount,
            overPercentage: overPercentage.toFixed(2),
            underPercentage: underPercentage.toFixed(2),
            bias,
            confidenceScore,
        });

        return {
            recentTicks: lastDigits,
            overCount,
            underCount,
            overPercentage,
            underPercentage,
            bias,
            confidenceScore,
        };
    }

    /**
     * Generate a new signal
     */
    private generateSignal(analysis: DistributionAnalysis): void {
        const signalId = `signal-${Date.now()}`;

        // Prevent duplicate signals
        if (this.activeSignalIds.has(signalId)) {
            console.warn('⚠️ Duplicate signal prevented');
            return;
        }

        const now = Date.now();
        const expiresAt = now + this.SIGNAL_DURATION * 1000;

        const signal: SignalData = {
            id: signalId,
            type: analysis.bias as SignalType,
            market: this.MARKET,
            confidence: Math.round(analysis.confidenceScore),
            createdAt: now,
            expiresAt,
            remainingSeconds: this.SIGNAL_DURATION,
            distributionAnalysis: analysis,
        };

        this.currentSignal = signal;
        this.activeSignalIds.add(signalId);

        console.log('🎯 New signal generated:', {
            type: signal.type,
            confidence: signal.confidence,
            duration: this.SIGNAL_DURATION,
        });

        // Notify UI
        if (this.onSignalUpdate) {
            this.onSignalUpdate(signal);
        }

        // Start countdown
        this.startCountdown();
    }

    /**
     * Start countdown timer for active signal
     */
    private startCountdown(): void {
        // Clear any existing countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        this.countdownInterval = setInterval(() => {
            if (!this.currentSignal) {
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                }
                return;
            }

            const now = Date.now();
            const remainingMs = this.currentSignal.expiresAt - now;
            const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

            // Update signal
            this.currentSignal = {
                ...this.currentSignal,
                remainingSeconds,
            };

            // Notify UI
            if (this.onSignalUpdate) {
                this.onSignalUpdate(this.currentSignal);
            }

            // Signal expired
            if (remainingSeconds <= 0) {
                console.log('⏰ Signal expired:', this.currentSignal.id);
                this.clearCurrentSignal();
            }
        }, 1000);
    }

    /**
     * Clear current signal
     */
    private clearCurrentSignal(): void {
        if (this.currentSignal) {
            this.activeSignalIds.delete(this.currentSignal.id);
            this.currentSignal = null;

            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }

            // Notify UI
            if (this.onSignalUpdate) {
                this.onSignalUpdate(null);
            }

            console.log('🧹 Signal cleared');
        }
    }

    /**
     * Update trade outcome (triggers prediction logic switch)
     */
    updateOutcome(outcome: TradeOutcome): void {
        if (this.currentOutcome !== outcome) {
            this.currentOutcome = outcome;
            console.log('📊 Trade outcome updated:', outcome);

            if (this.onOutcomeChange) {
                this.onOutcomeChange(outcome);
            }
        }
    }

    /**
     * Destroy engine and cleanup resources
     */
    destroy(): void {
        console.log('🛑 Destroying Signal Overlay Engine...');

        // Unsubscribe from API
        if (this.unsubscribe && typeof this.unsubscribe === 'function') {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // Clear intervals
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        if (this.signalGenerationInterval) {
            clearInterval(this.signalGenerationInterval);
            this.signalGenerationInterval = null;
        }

        // Clear state
        this.currentSignal = null;
        this.tickBuffer = [];
        this.activeSignalIds.clear();
        this.isInitialized = false;

        console.log('✅ Engine destroyed successfully');
    }
}

export const signalOverlayEngine = new SignalOverlayEngine();
