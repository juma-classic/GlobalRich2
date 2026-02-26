/**
 * Real-Time OVER Signal Generator Service
 * Connects to live Deriv API and generates OVER signals based on actual tick analysis
 */

import { derivAPIService } from './deriv-api.service';
import type { PatelSignal } from '@/types/patel-signals';

interface TickData {
    epoch: number;
    quote: number;
    symbol: string;
}

interface MarketTickHistory {
    symbol: string;
    ticks: number[];
    lastUpdate: number;
}

interface DigitFrequency {
    digit: number;
    count: number;
    frequency: number;
    lastSeen: number;
}

class RealtimeOverSignalGeneratorService {
    private static instance: RealtimeOverSignalGeneratorService;
    private marketData: Map<string, MarketTickHistory> = new Map();
    private subscriptions: Map<string, string> = new Map();
    private listeners: Set<(signals: PatelSignal[]) => void> = new Set();
    private signalGenerationInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    // Configuration
    private readonly TICK_HISTORY_SIZE = 50; // Reduced from 100 for faster analysis
    private readonly SIGNAL_GENERATION_INTERVAL = 1500; // Reduced from 3000ms to 1.5s for faster signals
    private readonly MIN_CONFIDENCE = 55; // Reduced from 60 for more signals
    private readonly MAX_SIGNALS = 8; // Increased from 5 for more options

    private readonly MARKETS = [
        '1HZ10V',  // Volatility 10 (1s) Index
        '1HZ25V',  // Volatility 25 (1s) Index
        '1HZ50V',  // Volatility 50 (1s) Index
        '1HZ75V',  // Volatility 75 (1s) Index
        '1HZ100V', // Volatility 100 (1s) Index
        'R_10',    // Volatility 10 Index
        'R_25',    // Volatility 25 Index
        'R_50',    // Volatility 50 Index
        'R_75',    // Volatility 75 Index
        'R_100',   // Volatility 100 Index
    ];

    private constructor() {}

    static getInstance(): RealtimeOverSignalGeneratorService {
        if (!RealtimeOverSignalGeneratorService.instance) {
            RealtimeOverSignalGeneratorService.instance = new RealtimeOverSignalGeneratorService();
        }
        return RealtimeOverSignalGeneratorService.instance;
    }

    /**
     * Start the real-time signal generator
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Real-time signal generator already running');
            return;
        }

        console.log('🚀 Starting Real-Time OVER Signal Generator...');
        this.isRunning = true;

        // Subscribe to all markets
        for (const market of this.MARKETS) {
            await this.subscribeToMarket(market);
        }

        // Start signal generation loop
        this.signalGenerationInterval = setInterval(() => {
            this.generateSignals();
        }, this.SIGNAL_GENERATION_INTERVAL);

        console.log('✅ Real-Time OVER Signal Generator started');
    }

    /**
     * Stop the signal generator
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log('⏸️ Stopping Real-Time OVER Signal Generator...');
        this.isRunning = false;

        // Clear interval
        if (this.signalGenerationInterval) {
            clearInterval(this.signalGenerationInterval);
            this.signalGenerationInterval = null;
        }

        // Unsubscribe from all markets
        for (const [market, subscriptionId] of this.subscriptions.entries()) {
            await derivAPIService.unsubscribe(subscriptionId);
            console.log(`📴 Unsubscribed from ${market}`);
        }

        this.subscriptions.clear();
        this.marketData.clear();

        console.log('✅ Real-Time OVER Signal Generator stopped');
    }

    /**
     * Subscribe to market ticks
     */
    private async subscribeToMarket(market: string): Promise<void> {
        try {
            console.log(`📡 Subscribing to ${market}...`);

            const subscriptionId = await derivAPIService.subscribeToTicks(market, (response) => {
                if (response.tick) {
                    this.handleTick(market, response.tick);
                }
            });

            if (subscriptionId) {
                this.subscriptions.set(market, subscriptionId);
                console.log(`✅ Subscribed to ${market} (ID: ${subscriptionId})`);
            }
        } catch (error) {
            console.error(`❌ Failed to subscribe to ${market}:`, error);
        }
    }

    /**
     * Handle incoming tick data
     */
    private handleTick(market: string, tick: any): void {
        const lastDigit = parseInt(tick.quote.toString().slice(-1));

        // Get or create market data
        let marketData = this.marketData.get(market);
        if (!marketData) {
            marketData = {
                symbol: market,
                ticks: [],
                lastUpdate: Date.now(),
            };
            this.marketData.set(market, marketData);
        }

        // Add tick to history
        marketData.ticks.push(lastDigit);
        marketData.lastUpdate = Date.now();

        // Keep only last N ticks
        if (marketData.ticks.length > this.TICK_HISTORY_SIZE) {
            marketData.ticks.shift();
        }

        // console.log(`📊 ${market}: Tick ${lastDigit} (${marketData.ticks.length} ticks collected)`);
    }

    /**
     * Generate OVER signals from collected tick data
     */
    private generateSignals(): void {
        const signals: PatelSignal[] = [];

        for (const [market, data] of this.marketData.entries()) {
            // Reduced minimum ticks from 30 to 20 for faster signal generation
            if (data.ticks.length < 20) {
                continue;
            }

            // Analyze digit frequencies
            const digitFrequencies = this.calculateDigitFrequencies(data.ticks);

            // Generate OVER signals for high digits (5-9)
            const overSignals = this.generateOverSignals(market, digitFrequencies, data.ticks);
            signals.push(...overSignals);
        }

        // Sort by confidence and limit
        const topSignals = signals
            .filter(s => s.confidencePercentage >= this.MIN_CONFIDENCE)
            .sort((a, b) => b.confidencePercentage - a.confidencePercentage)
            .slice(0, this.MAX_SIGNALS);

        // Notify listeners
        this.notifyListeners(topSignals);
    }

    /**
     * Calculate digit frequencies
     */
    private calculateDigitFrequencies(ticks: number[]): DigitFrequency[] {
        const frequencies: DigitFrequency[] = [];

        for (let digit = 0; digit <= 9; digit++) {
            const count = ticks.filter(t => t === digit).length;
            const frequency = (count / ticks.length) * 100;

            // Calculate last seen
            let lastSeen = 0;
            for (let i = ticks.length - 1; i >= 0; i--) {
                if (ticks[i] === digit) break;
                lastSeen++;
            }

            frequencies.push({
                digit,
                count,
                frequency,
                lastSeen,
            });
        }

        return frequencies;
    }

    /**
     * Generate OVER signals based on digit analysis
     */
    private generateOverSignals(
        market: string,
        frequencies: DigitFrequency[],
        ticks: number[]
    ): PatelSignal[] {
        const signals: PatelSignal[] = [];

        // Strategy 1: Hot High Digits (5-9 with high frequency) - RELAXED THRESHOLD
        const highDigits = frequencies.filter(f => f.digit >= 5);
        const hotHighDigits = highDigits.filter(f => f.frequency > 11); // Reduced from 12 for more signals

        for (const freq of hotHighDigits) {
            const confidence = this.calculateConfidence(freq, 'hot_high');
            if (confidence >= this.MIN_CONFIDENCE) {
                signals.push(this.createSignal(market, freq.digit, confidence, 'Hot High Digit', ticks));
            }
        }

        // Strategy 2: Cold High Digits (5-9 overdue for reversal) - RELAXED THRESHOLD
        const coldHighDigits = highDigits.filter(f => f.lastSeen > 12 && f.frequency < 9); // Reduced from 15 and 8

        for (const freq of coldHighDigits) {
            const confidence = this.calculateConfidence(freq, 'cold_reversal');
            if (confidence >= this.MIN_CONFIDENCE) {
                signals.push(this.createSignal(market, freq.digit, confidence, 'Cold Digit Reversal', ticks));
            }
        }

        // Strategy 3: Zone Clustering (High zone dominance) - RELAXED THRESHOLD
        const highZoneFreq = highDigits.reduce((sum, f) => sum + f.frequency, 0);
        if (highZoneFreq > 52) { // Reduced from 55 for more signals
            // High zone is dominant
            const bestHighDigit = highDigits.sort((a, b) => b.frequency - a.frequency)[0];
            const confidence = Math.min(95, 58 + (highZoneFreq - 52) * 1.5); // Adjusted base
            signals.push(this.createSignal(market, bestHighDigit.digit, confidence, 'High Zone Clustering', ticks));
        }

        return signals;
    }

    /**
     * Calculate confidence for a signal
     */
    private calculateConfidence(freq: DigitFrequency, strategy: string): number {
        let confidence = 50;

        if (strategy === 'hot_high') {
            // Hot digit: higher frequency = higher confidence
            confidence += (freq.frequency - 10) * 2;
            confidence += Math.min(20, freq.count * 0.5);
        } else if (strategy === 'cold_reversal') {
            // Cold digit: longer absence = higher confidence
            confidence += freq.lastSeen * 1.5;
            confidence += (10 - freq.frequency) * 1.5;
        }

        return Math.min(95, Math.max(30, confidence));
    }

    /**
     * Create a Patel signal
     */
    private createSignal(
        market: string,
        digit: number,
        confidence: number,
        strategy: string,
        ticks: number[]
    ): PatelSignal {
        // Determine barrier (for OVER signals, barrier is typically digit-1 or digit)
        const barrier = Math.max(0, digit - 1);

        // Determine stake and runs based on confidence
        const stake = confidence >= 75 ? 10 : confidence >= 60 ? 5 : 2;
        const runs = confidence >= 75 ? 3 : confidence >= 60 ? 4 : 5;

        const validity = confidence >= 75 ? 120 : confidence >= 60 ? 90 : 60;

        return {
            id: `realtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            market,
            type: 'OVER',
            digit,
            barrier,
            confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
            confidencePercentage: Math.round(confidence),
            reasoning: `${strategy}: Digit ${digit} shows strong OVER potential (${Math.round(confidence)}% confidence)`,
            recommendedStake: stake,
            recommendedRuns: runs,
            duration: '5 ticks',
            validityDuration: validity,
            expiresAt: Date.now() + validity * 1000,
            strategy,
            source: 'REALTIME_DERIV_API',
        };
    }

    /**
     * Subscribe to signal updates
     */
    subscribe(listener: (signals: PatelSignal[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(signals: PatelSignal[]): void {
        this.listeners.forEach(listener => listener(signals));
    }

    /**
     * Get current status
     */
    getStatus(): { isRunning: boolean; markets: number; totalTicks: number } {
        let totalTicks = 0;
        for (const data of this.marketData.values()) {
            totalTicks += data.ticks.length;
        }

        return {
            isRunning: this.isRunning,
            markets: this.marketData.size,
            totalTicks,
        };
    }
}

export default RealtimeOverSignalGeneratorService.getInstance();
