/**
 * Fast OVER Signal Generator Service
 * Uses Hot/Cold Zone Scanner and Digit Distribution Scanner for rapid signal generation
 */

import { hotColdZoneScannerService, HotColdZoneSignal } from './hot-cold-zone-scanner.service';
import { digitDistributionScannerService, DigitDistributionSignal } from './digit-distribution-scanner.service';
import type { PatelSignal } from '@/types/patel-signals';

class FastOverSignalGeneratorService {
    private static instance: FastOverSignalGeneratorService;
    private listeners: Set<(signals: PatelSignal[]) => void> = new Set();
    private signalGenerationInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private currentSignals: PatelSignal[] = [];

    // Configuration
    private readonly SIGNAL_GENERATION_INTERVAL = 500; // Generate every 0.5 seconds (faster)
    private readonly MAX_SIGNALS = 8;

    private constructor() {}

    static getInstance(): FastOverSignalGeneratorService {
        if (!FastOverSignalGeneratorService.instance) {
            FastOverSignalGeneratorService.instance = new FastOverSignalGeneratorService();
        }
        return FastOverSignalGeneratorService.instance;
    }

    /**
     * Start the fast signal generator
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Fast signal generator already running');
            return;
        }

        console.log('🚀 Starting Fast OVER Signal Generator (Hot/Cold + Distribution)...');
        this.isRunning = true;

        // Generate initial signals immediately
        await this.generateSignals();

        // Start continuous signal generation
        this.signalGenerationInterval = setInterval(async () => {
            await this.generateSignals();
        }, this.SIGNAL_GENERATION_INTERVAL);

        console.log('✅ Fast OVER Signal Generator started');
    }

    /**
     * Stop the signal generator
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log('⏸️ Stopping Fast OVER Signal Generator...');
        this.isRunning = false;

        if (this.signalGenerationInterval) {
            clearInterval(this.signalGenerationInterval);
            this.signalGenerationInterval = null;
        }

        this.currentSignals = [];
        console.log('✅ Fast OVER Signal Generator stopped');
    }

    /**
     * Generate signals using both scanners
     */
    private async generateSignals(): Promise<void> {
        try {
            const signals: PatelSignal[] = [];

            // Method 1: Hot/Cold Zone Scanner (Fast and Reliable)
            const hotColdSignal = await hotColdZoneScannerService.scanForHotColdZones();
            if (hotColdSignal && hotColdSignal.recommendation.action === 'OVER') {
                signals.push(this.convertHotColdToPatel(hotColdSignal));
            }

            // Method 2: Digit Distribution Scanner (Fast and Reliable)
            const distributionSignal = await digitDistributionScannerService.scanForDistributionDeviation();
            if (distributionSignal && distributionSignal.recommendation.action === 'OVER') {
                signals.push(this.convertDistributionToPatel(distributionSignal));
            }

            // Method 3: Generate additional OVER signals from hot digits
            if (hotColdSignal) {
                const additionalSignals = this.generateAdditionalOverSignals(hotColdSignal);
                signals.push(...additionalSignals);
            }

            // Filter, sort, and limit signals
            const validSignals = signals
                .filter(s => s.type === 'OVER')
                .sort((a, b) => b.confidencePercentage - a.confidencePercentage)
                .slice(0, this.MAX_SIGNALS);

            this.currentSignals = validSignals;
            this.notifyListeners(validSignals);

            console.log(`📊 Generated ${validSignals.length} OVER signals`);
        } catch (error) {
            console.error('❌ Error generating signals:', error);
        }
    }

    /**
     * Convert Hot/Cold signal to Patel format
     */
    private convertHotColdToPatel(signal: HotColdZoneSignal): PatelSignal {
        const barrier = signal.recommendation.barrier;
        const confidence = Math.round(signal.confidence);
        const stake = confidence >= 75 ? 10 : confidence >= 60 ? 5 : 2;
        const runs = confidence >= 75 ? 3 : confidence >= 60 ? 4 : 5;
        const validity = 120; // 2 minutes

        return {
            id: `hotcold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            market: signal.market,
            type: 'OVER',
            digit: signal.targetDigit,
            barrier,
            confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
            confidencePercentage: confidence,
            reasoning: signal.recommendation.reasoning,
            recommendedStake: stake,
            recommendedRuns: runs,
            duration: '5 ticks',
            validityDuration: validity,
            expiresAt: Date.now() + validity * 1000,
            strategy: signal.signalType,
            source: 'HOT_COLD_SCANNER',
        };
    }

    /**
     * Convert Distribution signal to Patel format
     */
    private convertDistributionToPatel(signal: DigitDistributionSignal): PatelSignal {
        const barrier = signal.recommendation.barrier;
        const confidence = Math.round(signal.confidence);
        const stake = confidence >= 75 ? 10 : confidence >= 60 ? 5 : 2;
        const runs = confidence >= 75 ? 3 : confidence >= 60 ? 4 : 5;
        const validity = 120; // 2 minutes

        return {
            id: `distribution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            market: signal.market,
            type: 'OVER',
            digit: signal.targetDigit,
            barrier,
            confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
            confidencePercentage: confidence,
            reasoning: signal.recommendation.reasoning,
            recommendedStake: stake,
            recommendedRuns: runs,
            duration: '5 ticks',
            validityDuration: validity,
            expiresAt: Date.now() + validity * 1000,
            strategy: 'DISTRIBUTION_DEVIATION',
            source: 'DISTRIBUTION_SCANNER',
        };
    }

    /**
     * Generate additional OVER signals from hot high digits
     */
    private generateAdditionalOverSignals(hotColdSignal: HotColdZoneSignal): PatelSignal[] {
        const signals: PatelSignal[] = [];

        // Find hot digits in the high zone (5-9)
        const hotHighDigits = hotColdSignal.analysis.hotDigits.filter(d => d.digit >= 5);

        for (const digitAnalysis of hotHighDigits.slice(0, 3)) { // Top 3 hot high digits
            const confidence = Math.round(digitAnalysis.confidence * 100);
            
            if (confidence >= 55) { // Minimum 55% confidence
                const barrier = Math.max(0, digitAnalysis.digit - 1);
                const stake = confidence >= 75 ? 10 : confidence >= 60 ? 5 : 2;
                const runs = confidence >= 75 ? 3 : confidence >= 60 ? 4 : 5;
                const validity = 120;

                signals.push({
                    id: `hot-digit-${Date.now()}-${digitAnalysis.digit}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: Date.now(),
                    market: hotColdSignal.market,
                    type: 'OVER',
                    digit: digitAnalysis.digit,
                    barrier,
                    confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                    confidencePercentage: confidence,
                    reasoning: `Hot digit ${digitAnalysis.digit} with ${digitAnalysis.percentage.toFixed(1)}% frequency (${digitAnalysis.zone} zone)`,
                    recommendedStake: stake,
                    recommendedRuns: runs,
                    duration: '5 ticks',
                    validityDuration: validity,
                    expiresAt: Date.now() + validity * 1000,
                    strategy: 'HOT_HIGH_DIGIT',
                    source: 'HOT_DIGIT_ANALYSIS',
                });
            }
        }

        return signals;
    }

    /**
     * Subscribe to signal updates
     */
    subscribe(listener: (signals: PatelSignal[]) => void): () => void {
        this.listeners.add(listener);
        // Send current signals immediately
        if (this.currentSignals.length > 0) {
            listener(this.currentSignals);
        }
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
    getStatus(): { isRunning: boolean; signalCount: number } {
        return {
            isRunning: this.isRunning,
            signalCount: this.currentSignals.length,
        };
    }
}

export default FastOverSignalGeneratorService.getInstance();
