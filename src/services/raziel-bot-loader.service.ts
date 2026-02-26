/**
 * Raziel Bot Loader Service
 * Handles loading and configuring Raziel Over Under bot with signal parameters
 */

import { DigitDistributionSignal } from './digit-distribution-scanner.service';
import { HotColdZoneSignal } from './hot-cold-zone-scanner.service';
import { botLoadingDebugger } from '../utils/bot-loading-debugger';

// Legacy signal interface for backward compatibility
interface LegacyRangingMarketSignal {
    market: string;
    marketName: string;
    currentPrice: number;
    recommendation: {
        action: 'OVER' | 'UNDER';
        barrier: number;
        confidence: number;
        reasoning: string;
    };
    confidence: number;
    fibonacciLevels?: Array<{
        level: number;
        price: number;
    }>;
    analysis?: {
        volatility?: number;
        trendStrength?: number;
        rangingScore?: number;
        fibonacciAlignment?: number;
    };
}

// Interface for bot object used in loading
interface BotObject {
    id: string;
    filePath: string;
    title: string;
    xmlContent: string;
    save_type: string;
}

// Interface for window global objects
interface WindowGlobals {
    load_modal?: {
        loadStrategyToBuilder?: (bot: BotObject) => Promise<void>;
    };
    load_modal_store?: {
        loadStrategyToBuilder?: (bot: BotObject) => Promise<void>;
    };
    dashboard_store?: {
        setActiveTab?: (tab: number) => void;
    };
    Blockly?: {
        getMainWorkspace?: () => BlocklyWorkspace;
        Xml?: {
            textToDom?: (content: string) => Document;
            domToWorkspace?: (dom: Document, workspace: BlocklyWorkspace) => void;
        };
    };
}

interface BlocklyWorkspace {
    clear?: () => void;
}

export interface CustomBotSettings {
    stake: number;
    martingale: number;
}

// Patel Signal interface for Signal Panel
export interface PatelSignalForBot {
    market: string;
    type: 'OVER' | 'UNDER';
    digit: number;
    barrier?: number;
    confidencePercentage: number;
    recommendedStake: number;
    recommendedRuns: number;
}

export interface RazielBotConfiguration {
    botFile: string;
    market: string;
    contractType: string;
    barrier?: number;
    stake: number;
    prediction: string;
    parameters: {
        [key: string]: unknown;
    };
}

class RazielBotLoaderService {
    private readonly RAZIEL_BOT_FILE = 'Raziel Over Under.xml'; // Changed back from CFX-EvenOdd.xml
    private readonly NOVAGRID_BOT_FILE = 'NOVAGRID 2026.xml'; // NOVAGRID bot for Signal Panel

    /**
     * Load NOVAGRID 2026 bot with Patel Signal (for Signal Panel)
     */
    public async loadNovagridBotWithPatelSignal(
        signal: PatelSignalForBot,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading NOVAGRID 2026 bot with Patel Signal...');

        // Start debugging session
        botLoadingDebugger.startDebugging();
        botLoadingDebugger.addStep('signal_analysis', 'success', 'Patel Signal received', {
            market: signal.market,
            type: signal.type,
            digit: signal.digit,
            confidence: signal.confidencePercentage,
        });

        try {
            // Create bot configuration from signal
            botLoadingDebugger.addStep('config_creation', 'pending', 'Creating bot configuration');
            const botConfig = this.createNovagridBotConfiguration(signal, customSettings);
            botLoadingDebugger.addStep('config_creation', 'success', 'Bot configuration created', botConfig);

            // Load the bot XML
            botLoadingDebugger.addStep('xml_loading', 'pending', 'Loading bot XML file');
            const fileLoaded = await botLoadingDebugger.debugFileLoading(botConfig.botFile);
            if (!fileLoaded) {
                throw new Error(`Failed to load bot file: ${botConfig.botFile}`);
            }

            const botXML = await this.loadBotXML(botConfig.botFile);
            botLoadingDebugger.addStep('xml_loading', 'success', 'Bot XML loaded successfully');

            // Configure bot parameters
            botLoadingDebugger.addStep('xml_config', 'pending', 'Configuring bot parameters');
            botLoadingDebugger.debugXMLConfiguration(botXML, botConfig);
            const configuredXML = this.configureNovagridBotXML(botXML, botConfig);
            botLoadingDebugger.addStep('xml_config', 'success', 'Bot parameters configured');

            // Debug available loading methods
            botLoadingDebugger.debugBotLoadingMethods();

            // Load bot into Deriv Bot Builder
            botLoadingDebugger.addStep('bot_injection', 'pending', 'Injecting bot into Deriv Bot Builder');
            await this.loadBotIntoBuilder(configuredXML, botConfig);
            botLoadingDebugger.addStep('bot_injection', 'success', 'Bot injected successfully');

            // Complete debugging
            const debugInfo = botLoadingDebugger.completeDebugging(true);
            console.log('✅ NOVAGRID 2026 bot loaded successfully with Patel Signal parameters');

            // Show debug summary in a notification
            this.showDebugSummary(debugInfo);
        } catch (error) {
            console.error('❌ Failed to load NOVAGRID 2026 bot:', error);
            botLoadingDebugger.completeDebugging(false, (error as Error).message);
            throw error;
        }
    }

    /**
     * Load Raziel Over Under bot with Distribution Deviation signal
     */
    public async loadRazielBotWithDistributionSignal(
        signal: DigitDistributionSignal,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading Raziel Over Under bot with Distribution Deviation signal...');

        // Start debugging session
        botLoadingDebugger.startDebugging();
        botLoadingDebugger.addStep('signal_analysis', 'success', 'Distribution Deviation signal received', {
            market: signal.market,
            confidence: signal.confidence,
            targetDigit: signal.targetDigit,
            action: signal.recommendation.action,
            barrier: signal.recommendation.barrier,
        });

        try {
            // Create bot configuration from signal
            botLoadingDebugger.addStep('config_creation', 'pending', 'Creating bot configuration');
            const botConfig = this.createBotConfigurationFromDistribution(signal, customSettings);
            botLoadingDebugger.addStep('config_creation', 'success', 'Bot configuration created', botConfig);

            // Load the bot XML
            botLoadingDebugger.addStep('xml_loading', 'pending', 'Loading bot XML file');
            const fileLoaded = await botLoadingDebugger.debugFileLoading(botConfig.botFile);
            if (!fileLoaded) {
                throw new Error(`Failed to load bot file: ${botConfig.botFile}`);
            }

            const botXML = await this.loadBotXML(botConfig.botFile);
            botLoadingDebugger.addStep('xml_loading', 'success', 'Bot XML loaded successfully');

            // Configure bot parameters
            botLoadingDebugger.addStep('xml_config', 'pending', 'Configuring bot parameters');
            botLoadingDebugger.debugXMLConfiguration(botXML, botConfig);
            const configuredXML = this.configureBotXML(botXML, botConfig);
            botLoadingDebugger.addStep('xml_config', 'success', 'Bot parameters configured');

            // Debug available loading methods
            botLoadingDebugger.debugBotLoadingMethods();

            // Load bot into Deriv Bot Builder
            botLoadingDebugger.addStep('bot_injection', 'pending', 'Injecting bot into Deriv Bot Builder');
            await this.loadBotIntoBuilder(configuredXML, botConfig);
            botLoadingDebugger.addStep('bot_injection', 'success', 'Bot injected successfully');

            // Complete debugging
            const debugInfo = botLoadingDebugger.completeDebugging(true);
            console.log('✅ Raziel Over Under bot loaded successfully with Distribution Deviation parameters');

            // Show debug summary in a notification
            this.showDebugSummary(debugInfo);
        } catch (error) {
            console.error('❌ Failed to load Raziel Over Under bot:', error);
            botLoadingDebugger.completeDebugging(false, (error as Error).message);
            throw error;
        }
    }

    /**
     * Load Raziel Over Under bot with Hot/Cold Zone signal
     */
    public async loadRazielBotWithHotColdSignal(
        signal: HotColdZoneSignal,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading Raziel Over Under bot with Hot/Cold Zone signal...');

        // Start debugging session
        botLoadingDebugger.startDebugging();
        botLoadingDebugger.addStep('signal_analysis', 'success', 'Hot/Cold Zone signal received', {
            market: signal.market,
            confidence: signal.confidence,
            targetDigit: signal.targetDigit,
            signalType: signal.signalType,
            action: signal.recommendation.action,
            barrier: signal.recommendation.barrier,
        });

        try {
            // Create bot configuration from signal
            botLoadingDebugger.addStep('config_creation', 'pending', 'Creating bot configuration');
            const botConfig = this.createBotConfigurationFromHotCold(signal, customSettings);
            botLoadingDebugger.addStep('config_creation', 'success', 'Bot configuration created', botConfig);

            // Load the bot XML
            botLoadingDebugger.addStep('xml_loading', 'pending', 'Loading bot XML file');
            const fileLoaded = await botLoadingDebugger.debugFileLoading(botConfig.botFile);
            if (!fileLoaded) {
                throw new Error(`Failed to load bot file: ${botConfig.botFile}`);
            }

            const botXML = await this.loadBotXML(botConfig.botFile);
            botLoadingDebugger.addStep('xml_loading', 'success', 'Bot XML loaded successfully');

            // Configure bot parameters
            botLoadingDebugger.addStep('xml_config', 'pending', 'Configuring bot parameters');
            botLoadingDebugger.debugXMLConfiguration(botXML, botConfig);
            const configuredXML = this.configureBotXML(botXML, botConfig);
            botLoadingDebugger.addStep('xml_config', 'success', 'Bot parameters configured');

            // Debug available loading methods
            botLoadingDebugger.debugBotLoadingMethods();

            // Load bot into Deriv Bot Builder
            botLoadingDebugger.addStep('bot_injection', 'pending', 'Injecting bot into Deriv Bot Builder');
            await this.loadBotIntoBuilder(configuredXML, botConfig);
            botLoadingDebugger.addStep('bot_injection', 'success', 'Bot injected successfully');

            // Complete debugging
            const debugInfo = botLoadingDebugger.completeDebugging(true);
            console.log('✅ Raziel Over Under bot loaded successfully with Hot/Cold Zone parameters');

            // Show debug summary in a notification
            this.showDebugSummary(debugInfo);
        } catch (error) {
            console.error('❌ Failed to load Raziel Over Under bot:', error);
            botLoadingDebugger.completeDebugging(false, (error as Error).message);
            throw error;
        }
    }

    /**
     * Load and configure Raziel Over Under bot with signal parameters
     */
    public async loadRazielBotWithSignal(
        signal: LegacyRangingMarketSignal,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading Raziel Over Under bot with Fibonacci signal...');

        try {
            // Create bot configuration from signal
            const botConfig = this.createBotConfiguration(signal, customSettings);

            // Load the bot XML
            const botXML = await this.loadBotXML(botConfig.botFile);

            // Configure bot parameters
            const configuredXML = this.configureBotXML(botXML, botConfig);

            // Load bot into Deriv Bot Builder
            await this.loadBotIntoBuilder(configuredXML, botConfig);

            console.log('✅ Raziel Over Under bot loaded successfully with Fibonacci parameters');
        } catch (error) {
            console.error('❌ Failed to load Raziel Over Under bot:', error);
            throw error;
        }
    }

    /**
     * Create bot configuration from Fibonacci signal
     */
    private createBotConfiguration(
        signal: LegacyRangingMarketSignal,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        // Use custom settings if provided, otherwise use defaults based on signal type
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let stake: number;
        let martingale: number;

        if (customSettings) {
            // Use custom settings for stake and martingale, but always use signal-based predictions
            stake = customSettings.stake;
            martingale = customSettings.martingale;

            // Enhanced prediction logic with unified recovery strategy
            if (signal.recommendation.action === 'OVER') {
                const barrier = signal.recommendation.barrier || 2;
                predictionBeforeLoss = barrier;
                
                // Check for aggressive mode
                const { stakeManager } = require('@/services/stake-manager.service');
                const isAggressiveMode = stakeManager.getAggressiveMode();
                
                if (isAggressiveMode) {
                    predictionAfterLoss = barrier; // Same as start prediction
                    console.log(`🔥 Fibonacci Aggressive Mode: OVER${barrier} → OVER${barrier} recovery strategy applied`);
                } else {
                    // Unified recovery: OVER 2,3,4 all recover with OVER 4
                    if (barrier >= 2 && barrier <= 4) {
                        predictionAfterLoss = 4;
                    } else {
                        predictionAfterLoss = Math.min(barrier + 1, 9);
                    }
                }
            } else {
                // UNDER
                const barrier = signal.recommendation.barrier || 7;
                predictionBeforeLoss = barrier;
                
                // Check for aggressive mode
                const { stakeManager } = require('@/services/stake-manager.service');
                const isAggressiveMode = stakeManager.getAggressiveMode();
                
                if (isAggressiveMode) {
                    predictionAfterLoss = barrier; // Same as start prediction
                    console.log(`🔥 Fibonacci Aggressive Mode: UNDER${barrier} → UNDER${barrier} recovery strategy applied`);
                } else {
                    // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
                    if (barrier >= 5 && barrier <= 7) {
                        predictionAfterLoss = 5;
                    } else {
                        predictionAfterLoss = Math.max(barrier - 1, 0);
                    }
                }
            }
        } else {
            // Use enhanced default settings with unified recovery strategy
            if (signal.recommendation.action === 'OVER') {
                const barrier = signal.recommendation.barrier || 2;
                predictionBeforeLoss = barrier;
                // Unified recovery: OVER 2,3,4 all recover with OVER 4
                if (barrier >= 2 && barrier <= 4) {
                    predictionAfterLoss = 4;
                } else {
                    predictionAfterLoss = Math.min(barrier + 1, 9);
                }
            } else {
                // UNDER
                const barrier = signal.recommendation.barrier || 7;
                predictionBeforeLoss = barrier;
                // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
                if (barrier >= 5 && barrier <= 7) {
                    predictionAfterLoss = 5;
                } else {
                    predictionAfterLoss = Math.max(barrier - 1, 0);
                }
            }
            stake = 1; // Default stake
            martingale = 2.2; // Default martingale
        }

        return {
            botFile: this.RAZIEL_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: signal.recommendation.barrier,
            stake: stake,
            prediction: signal.recommendation.action,
            parameters: {
                // Raziel Over Under specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Fibonacci-specific parameters
                fibonacciLevel:
                    signal.fibonacciLevels?.find(
                        l =>
                            Math.abs(l.price - signal.currentPrice) ===
                            Math.min(
                                ...(signal.fibonacciLevels || []).map(fl => Math.abs(fl.price - signal.currentPrice))
                            )
                    )?.level || 0.5,

                confidence: signal.confidence,
                reasoning: signal.recommendation.reasoning,

                // Market analysis parameters
                volatility: signal.analysis?.volatility,
                trendStrength: signal.analysis?.trendStrength,
                rangingScore: signal.analysis?.rangingScore,
                fibonacciAlignment: signal.analysis?.fibonacciAlignment,
            },
        };
    }

    /**
     * Create bot configuration from Distribution Deviation signal
     */
    private createBotConfigurationFromDistribution(
        signal: DigitDistributionSignal,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        // Use custom settings if provided, otherwise use defaults based on signal type
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let stake: number;
        let martingale: number;

        if (customSettings) {
            // Use custom settings for stake and martingale
            stake = customSettings.stake;
            martingale = customSettings.martingale;

            // Check if this is a long press enhanced signal
            if ((signal as any).longPressMode && (signal as any).enhancedPredictions) {
                predictionBeforeLoss = (signal as any).enhancedPredictions.beforeLoss;
                predictionAfterLoss = (signal as any).enhancedPredictions.afterLoss;
                console.log('🔥 Distribution: Using long press enhanced predictions:', {
                    predictionBeforeLoss,
                    predictionAfterLoss,
                });
            } else {
                // Enhanced prediction logic with unified recovery strategy
                if (signal.recommendation.action === 'OVER') {
                    const barrier = signal.recommendation.barrier || 2;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Distribution Aggressive Mode: OVER${barrier} → OVER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: OVER 2,3,4 all recover with OVER 4
                        if (barrier >= 2 && barrier <= 4) {
                            predictionAfterLoss = 4;
                        } else {
                            predictionAfterLoss = Math.min(barrier + 1, 9);
                        }
                    }
                } else {
                    // UNDER
                    const barrier = signal.recommendation.barrier || 7;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Distribution Aggressive Mode: UNDER${barrier} → UNDER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
                        if (barrier >= 5 && barrier <= 7) {
                            predictionAfterLoss = 5;
                        } else {
                            predictionAfterLoss = Math.max(barrier - 1, 0);
                        }
                    }
                }
            }
        } else {
            // Check if this is a long press enhanced signal
            if ((signal as any).longPressMode && (signal as any).enhancedPredictions) {
                predictionBeforeLoss = (signal as any).enhancedPredictions.beforeLoss;
                predictionAfterLoss = (signal as any).enhancedPredictions.afterLoss;
                console.log('🔥 Distribution: Using long press enhanced predictions (no custom settings):', {
                    predictionBeforeLoss,
                    predictionAfterLoss,
                });
            } else {
                // Enhanced default settings with unified recovery strategy
                if (signal.recommendation.action === 'OVER') {
                    const barrier = signal.recommendation.barrier || 2;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Distribution Default Aggressive Mode: OVER${barrier} → OVER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: OVER 2,3,4 all recover with OVER 4
                        if (barrier >= 2 && barrier <= 4) {
                            predictionAfterLoss = 4;
                        } else {
                            predictionAfterLoss = Math.min(barrier + 1, 9);
                        }
                    }
                } else {
                    // UNDER
                    const barrier = signal.recommendation.barrier || 7;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Distribution Default Aggressive Mode: UNDER${barrier} → UNDER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
                        if (barrier >= 5 && barrier <= 7) {
                            predictionAfterLoss = 5;
                        } else {
                            predictionAfterLoss = Math.max(barrier - 1, 0);
                        }
                    }
                }
            }
            stake = 1; // Default stake
            martingale = 2.2; // Default martingale
        }

        return {
            botFile: this.RAZIEL_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: signal.recommendation.barrier,
            stake: stake,
            prediction: signal.recommendation.action,
            parameters: {
                // Raziel Over Under specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Distribution Deviation specific parameters
                targetDigit: signal.targetDigit,
                signalType: signal.signalType,
                confidence: signal.confidence,
                reasoning: signal.recommendation.reasoning,

                // Distribution analysis parameters
                totalDeviation: signal.analysis.totalDeviation,
                maxDeviation: signal.analysis.maxDeviation,
                distributionBalance: signal.analysis.distributionBalance,
                correctionPotential: signal.analysis.correctionPotential,
                probabilityEdge: signal.analysis.probabilityEdge,
                deviatedDigits: signal.analysis.deviatedDigits.map(d => d.digit),
                underrepresentedDigits: signal.analysis.underrepresentedDigits.map(d => d.digit),
                overrepresentedDigits: signal.analysis.overrepresentedDigits.map(d => d.digit),
            },
        };
    }

    /**
     * Create bot configuration from Hot/Cold Zone signal
     */
    private createBotConfigurationFromHotCold(
        signal: HotColdZoneSignal,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        // Use custom settings if provided, otherwise use defaults based on signal type
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let stake: number;
        let martingale: number;

        if (customSettings) {
            // Use custom settings for stake and martingale
            stake = customSettings.stake;
            martingale = customSettings.martingale;

            // Check if this is a long press enhanced signal
            if ((signal as any).longPressMode && (signal as any).enhancedPredictions) {
                predictionBeforeLoss = (signal as any).enhancedPredictions.beforeLoss;
                predictionAfterLoss = (signal as any).enhancedPredictions.afterLoss;
                console.log('🔥 Hot/Cold: Using long press enhanced predictions:', {
                    predictionBeforeLoss,
                    predictionAfterLoss,
                });
            } else {
                // Enhanced prediction logic with unified recovery strategy
                if (signal.recommendation.action === 'OVER') {
                    const barrier = signal.recommendation.barrier || 2;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Hot/Cold Aggressive Mode: OVER${barrier} → OVER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: OVER 2,3,4 all recover with OVER 4
                        if (barrier >= 2 && barrier <= 4) {
                            predictionAfterLoss = 4;
                        } else {
                            predictionAfterLoss = Math.min(barrier + 1, 9);
                        }
                    }
                } else {
                    // UNDER
                    const barrier = signal.recommendation.barrier || 7;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Hot/Cold Aggressive Mode: UNDER${barrier} → UNDER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
                        if (barrier >= 5 && barrier <= 7) {
                            predictionAfterLoss = 5;
                        } else {
                            predictionAfterLoss = Math.max(barrier - 1, 0);
                        }
                    }
                }
            }
        } else {
            // Check if this is a long press enhanced signal
            if ((signal as any).longPressMode && (signal as any).enhancedPredictions) {
                predictionBeforeLoss = (signal as any).enhancedPredictions.beforeLoss;
                predictionAfterLoss = (signal as any).enhancedPredictions.afterLoss;
                console.log('🔥 Hot/Cold: Using long press enhanced predictions (no custom settings):', {
                    predictionBeforeLoss,
                    predictionAfterLoss,
                });
            } else {
                // Enhanced default settings with unified recovery strategy
                if (signal.recommendation.action === 'OVER') {
                    const barrier = signal.recommendation.barrier || 2;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Hot/Cold Default Aggressive Mode: OVER${barrier} → OVER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: OVER 2,3,4 all recover with OVER 4
                        if (barrier >= 2 && barrier <= 4) {
                            predictionAfterLoss = 4;
                        } else {
                            predictionAfterLoss = Math.min(barrier + 1, 9);
                        }
                    }
                } else {
                    // UNDER
                    const barrier = signal.recommendation.barrier || 7;
                    predictionBeforeLoss = barrier;
                    
                    // Check for aggressive mode
                    const { stakeManager } = require('@/services/stake-manager.service');
                    const isAggressiveMode = stakeManager.getAggressiveMode();
                    
                    if (isAggressiveMode) {
                        predictionAfterLoss = barrier; // Same as start prediction
                        console.log(`🔥 Hot/Cold Default Aggressive Mode: UNDER${barrier} → UNDER${barrier} recovery strategy applied`);
                    } else {
                        // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
                        if (barrier >= 5 && barrier <= 7) {
                            predictionAfterLoss = 5;
                        } else {
                            predictionAfterLoss = Math.max(barrier - 1, 0);
                        }
                    }
                }
            }
            stake = 1; // Default stake
            martingale = 2.2; // Default martingale
        }

        return {
            botFile: this.RAZIEL_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: signal.recommendation.barrier,
            stake: stake,
            prediction: signal.recommendation.action,
            parameters: {
                // Raziel Over Under specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Hot/Cold Zone specific parameters
                targetDigit: signal.targetDigit,
                signalType: signal.signalType,
                confidence: signal.confidence,
                reasoning: signal.recommendation.reasoning,

                // Zone analysis parameters
                hotDigits: signal.analysis.hotDigits.map(d => d.digit),
                coldDigits: signal.analysis.coldDigits.map(d => d.digit),
                distributionDeviation: signal.analysis.distributionDeviation,
                meanReversionPotential: signal.analysis.meanReversionPotential,
                momentumStrength: signal.analysis.momentumStrength,
            },
        };
    }

    /**
     * Create NOVAGRID bot configuration from Patel Signal
     */
    private createNovagridBotConfiguration(
        signal: PatelSignalForBot,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.type === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';
        
        // Determine barrier from signal type and digit
        let barrier: number;
        if (signal.type === 'OVER') {
            // For OVER signals, barrier is typically the digit or digit-1
            barrier = signal.barrier || Math.max(0, signal.digit - 1);
        } else {
            // For UNDER signals, barrier is typically the digit or digit+1
            barrier = signal.barrier || Math.min(9, signal.digit + 1);
        }

        // Use custom settings if provided, otherwise use signal recommendations
        const stake = customSettings?.stake || signal.recommendedStake || 1;
        const martingale = customSettings?.martingale || 2.2;

        // Enhanced prediction logic for NOVAGRID
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;

        if (signal.type === 'OVER') {
            predictionBeforeLoss = barrier;
            // Unified recovery: OVER 2,3,4 all recover with OVER 4
            if (barrier >= 2 && barrier <= 4) {
                predictionAfterLoss = 4;
            } else {
                predictionAfterLoss = Math.min(barrier + 1, 9);
            }
        } else {
            // UNDER
            predictionBeforeLoss = barrier;
            // Unified recovery: UNDER 7,6,5 all recover with UNDER 5
            if (barrier >= 5 && barrier <= 7) {
                predictionAfterLoss = 5;
            } else {
                predictionAfterLoss = Math.max(barrier - 1, 0);
            }
        }

        return {
            botFile: this.NOVAGRID_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: barrier,
            stake: stake,
            prediction: signal.type,
            parameters: {
                // NOVAGRID specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Patel Signal specific parameters
                targetDigit: signal.digit,
                confidence: signal.confidencePercentage,
                recommendedRuns: signal.recommendedRuns,
            },
        };
    }

    /**
     * Load bot XML file
     */
    private async loadBotXML(botFile: string): Promise<string> {
        try {
            const response = await fetch(`/${botFile}`);
            if (!response.ok) {
                throw new Error(`Failed to load bot file: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Failed to load ${botFile}:`, error);
            throw error;
        }
    }

    /**
     * Configure bot XML with signal parameters
     */
    private configureBotXML(xmlContent: string, config: RazielBotConfiguration): string {
        let configuredXML = xmlContent;

        try {
            console.log('🔧 Configuring Raziel Over Under bot XML with parameters:', {
                stake: config.stake,
                martingale: config.parameters.martingaleSplit,
                contractType: config.contractType,
                market: config.market,
                predictionBeforeLoss: config.parameters.predictionBeforeLoss,
                predictionAfterLoss: config.parameters.predictionAfterLoss,
            });

            // Parse XML to modify parameters
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing failed: ${parseError.textContent}`);
            }

            // Track configuration success
            const configResults = {
                market: false,
                contractType: false,
                initialStake: false,
                martingaleSplit: false,
                predictionBeforeLoss: false,
                predictionAfterLoss: false,
                purchaseType: false,
            };

            // Update market symbol (SYMBOL_LIST field)
            const symbolField = xmlDoc.querySelector('field[name="SYMBOL_LIST"]');
            if (symbolField) {
                symbolField.textContent = config.market;
                configResults.market = true;
                console.log(`✅ Updated market symbol to: ${config.market}`);
            } else {
                console.warn('❌ Could not find SYMBOL_LIST field');
            }

            // Update contract type (TYPE_LIST field)
            const contractField = xmlDoc.querySelector('field[name="TYPE_LIST"]');
            if (contractField) {
                contractField.textContent = config.contractType;
                configResults.contractType = true;
                console.log(`✅ Updated contract type to: ${config.contractType}`);
            } else {
                console.warn('❌ Could not find TYPE_LIST field');
            }

            // Update initial stake - Raziel Over Under uses specific block IDs
            const initialStakeBlock = xmlDoc.querySelector('block[id="TDv/W;dNI84TFbp}8X8="] field[name="NUM"]');
            if (initialStakeBlock) {
                initialStakeBlock.textContent = config.stake.toString();
                configResults.initialStake = true;
                console.log(`✅ Updated initial stake (Stake variable) to: ${config.stake}`);
            } else {
                console.warn('❌ Could not find initial stake block');
                // Try alternative method
                this.updateStakeWithFallback(xmlDoc, config.stake);
            }

            // Update initial stake variable (initalStake) - CRITICAL: Both stakes must match!
            const initalStakeBlock = xmlDoc.querySelector('block[id="9Z%4%dmqCp;/sSt8wGv#"] field[name="NUM"]');
            if (initalStakeBlock) {
                initalStakeBlock.textContent = config.stake.toString();
                console.log(`✅ Updated initalStake variable to: ${config.stake}`);
            } else {
                console.warn('❌ Could not find initalStake variable block');
            }

            // Update martingale split - Raziel Over Under uses specific block ID
            const martingaleBlock = xmlDoc.querySelector('block[id="Ib,Krc`nUJzn1KMo9)`A"] field[name="NUM"]');
            if (martingaleBlock) {
                const martingaleValue =
                    typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2.2;
                martingaleBlock.textContent = martingaleValue.toString();
                configResults.martingaleSplit = true;
                console.log(`✅ Updated martingale split to: ${martingaleValue}`);
            } else {
                console.warn('❌ Could not find martingale split block');
                // Try fallback method
                const martingaleValue =
                    typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2.2;
                this.updateMartingaleWithFallback(xmlDoc, martingaleValue);
            }

            // Update prediction before loss
            const predictionBeforeLossBlock = xmlDoc.querySelector(
                'block[id="~]Q~lGg)3FCGB95VKA`b"] field[name="NUM"]'
            );
            if (predictionBeforeLossBlock) {
                const predictionValue =
                    typeof config.parameters.predictionBeforeLoss === 'number'
                        ? config.parameters.predictionBeforeLoss
                        : 2;
                predictionBeforeLossBlock.textContent = predictionValue.toString();
                configResults.predictionBeforeLoss = true;
                console.log(`✅ Updated prediction before loss to: ${predictionValue}`);
            } else {
                console.warn('❌ Could not find prediction before loss block');
            }

            // Update prediction after loss
            const predictionAfterLossBlock = xmlDoc.querySelector('block[id="(6)D~Nlfu/PCG*s5!9Qy"] field[name="NUM"]');
            if (predictionAfterLossBlock) {
                const predictionValue =
                    typeof config.parameters.predictionAfterLoss === 'number'
                        ? config.parameters.predictionAfterLoss
                        : 3;
                predictionAfterLossBlock.textContent = predictionValue.toString();
                configResults.predictionAfterLoss = true;
                console.log(`✅ Updated prediction after loss to: ${predictionValue}`);
            } else {
                console.warn('❌ Could not find prediction after loss block');
            }

            // Update purchase type in before_purchase block
            const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
            purchaseFields.forEach(field => {
                field.textContent = config.contractType;
                configResults.purchaseType = true;
                console.log(`✅ Updated purchase type to: ${config.contractType}`);
            });

            // Serialize back to string
            const serializer = new XMLSerializer();
            configuredXML = serializer.serializeToString(xmlDoc);

            // Log configuration results
            const successCount = Object.values(configResults).filter(Boolean).length;
            const totalCount = Object.keys(configResults).length;

            console.log(
                `🔧 Raziel Over Under Configuration Results: ${successCount}/${totalCount} successful`,
                configResults
            );

            if (successCount < totalCount) {
                console.warn('⚠️ Some XML configurations failed - using string replacement fallback');
                configuredXML = this.configureXMLWithStringReplacement(configuredXML, config);
            } else {
                console.log('✅ Raziel Over Under XML configuration completed successfully');
            }

            // Validate the configuration
            this.validateXMLConfiguration(configuredXML, config);
        } catch (error) {
            console.warn('Failed to parse/modify Raziel Over Under XML, using string replacement fallback:', error);
            // Fall back to string replacement if XML parsing fails
            configuredXML = this.configureXMLWithStringReplacement(xmlContent, config);
        }

        return configuredXML;
    }

    /**
     * Configure NOVAGRID 2026 bot XML with signal parameters
     */
    private configureNovagridBotXML(xmlContent: string, config: RazielBotConfiguration): string {
        let configuredXML = xmlContent;

        try {
            console.log('🔧 Configuring NOVAGRID 2026 bot XML with parameters:', {
                stake: config.stake,
                martingale: config.parameters.martingaleSplit,
                contractType: config.contractType,
                market: config.market,
                predictionBeforeLoss: config.parameters.predictionBeforeLoss,
                predictionAfterLoss: config.parameters.predictionAfterLoss,
            });

            // Parse XML to modify parameters
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing failed: ${parseError.textContent}`);
            }

            // Track configuration success
            const configResults = {
                market: false,
                contractType: false,
                initialStake: false,
                martingaleSplit: false,
                predictionBeforeLoss: false,
                predictionAfterLoss: false,
                purchaseType: false,
            };

            // Update market symbol (SYMBOL_LIST field)
            const symbolField = xmlDoc.querySelector('field[name="SYMBOL_LIST"]');
            if (symbolField) {
                symbolField.textContent = config.market;
                configResults.market = true;
                console.log(`✅ Updated market symbol to: ${config.market}`);
            } else {
                console.warn('❌ Could not find SYMBOL_LIST field');
            }

            // Update contract type (TYPE_LIST field) - NOVAGRID uses "both" but we need to set purchase type
            const contractField = xmlDoc.querySelector('field[name="TYPE_LIST"]');
            if (contractField) {
                contractField.textContent = 'both'; // NOVAGRID uses both
                configResults.contractType = true;
                console.log(`✅ Updated contract type to: both`);
            } else {
                console.warn('❌ Could not find TYPE_LIST field');
            }

            // Update Amount variable (initial stake) - NOVAGRID uses "Amount" variable
            const amountBlocks = xmlDoc.querySelectorAll('variable[id="iR9MIP@+P-(|!EWdy:H4"]');
            if (amountBlocks.length > 0) {
                // Find the block that sets the Amount variable
                const amountSetBlock = xmlDoc.querySelector('block[id="su?Hn*_+v4I%{vk7;+i="] field[name="NUM"]');
                if (amountSetBlock) {
                    amountSetBlock.textContent = config.stake.toString();
                    configResults.initialStake = true;
                    console.log(`✅ Updated Amount (initial stake) to: ${config.stake}`);
                }
            } else {
                console.warn('❌ Could not find Amount variable');
            }

            // Update Mart Splits variable (martingale) - NOVAGRID uses "Mart Splits" variable
            const martSplitsBlock = xmlDoc.querySelector('block[id="I}GOH4k1J7J}d]Z-B+9$"] field[name="NUM"]');
            if (martSplitsBlock) {
                const martingaleValue =
                    typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2;
                martSplitsBlock.textContent = martingaleValue.toString();
                configResults.martingaleSplit = true;
                console.log(`✅ Updated Mart Splits (martingale) to: ${martingaleValue}`);
            } else {
                console.warn('❌ Could not find Mart Splits block');
            }

            // Update 1st Digit (prediction before loss) - NOVAGRID uses "1st Digit" variable
            const firstDigitBlock = xmlDoc.querySelector('block[id=":%]KJOpvj`cH,.2P^?,F"] field[name="NUM"]');
            if (firstDigitBlock) {
                const predictionValue =
                    typeof config.parameters.predictionBeforeLoss === 'number'
                        ? config.parameters.predictionBeforeLoss
                        : 2;
                firstDigitBlock.textContent = predictionValue.toString();
                configResults.predictionBeforeLoss = true;
                console.log(`✅ Updated 1st Digit (prediction before loss) to: ${predictionValue}`);
            } else {
                console.warn('❌ Could not find 1st Digit block');
            }

            // Update 2nd Digit (prediction after loss) - NOVAGRID uses "2nd Digit" variable
            const secondDigitBlock = xmlDoc.querySelector('block[id="q[Kk~w1yxxze1*{e9Y6a"] field[name="NUM"]');
            if (secondDigitBlock) {
                const predictionValue =
                    typeof config.parameters.predictionAfterLoss === 'number'
                        ? config.parameters.predictionAfterLoss
                        : 4;
                secondDigitBlock.textContent = predictionValue.toString();
                configResults.predictionAfterLoss = true;
                console.log(`✅ Updated 2nd Digit (prediction after loss) to: ${predictionValue}`);
            } else {
                console.warn('❌ Could not find 2nd Digit block');
            }

            // Update purchase type in purchase blocks - NOVAGRID uses PREDICTION field
            const predictionFields = xmlDoc.querySelectorAll('field[name="PREDICTION"]');
            if (predictionFields.length > 0) {
                // NOVAGRID uses variables for prediction, so we don't need to update PREDICTION fields directly
                configResults.purchaseType = true;
                console.log(`✅ Purchase type will use variable-based predictions`);
            }

            // Serialize back to string
            const serializer = new XMLSerializer();
            configuredXML = serializer.serializeToString(xmlDoc);

            // Log configuration results
            const successCount = Object.values(configResults).filter(Boolean).length;
            const totalCount = Object.keys(configResults).length;

            console.log(
                `🔧 NOVAGRID 2026 Configuration Results: ${successCount}/${totalCount} successful`,
                configResults
            );

            if (successCount < totalCount) {
                console.warn('⚠️ Some XML configurations failed - using string replacement fallback');
                configuredXML = this.configureXMLWithStringReplacement(configuredXML, config);
            } else {
                console.log('✅ NOVAGRID 2026 XML configuration completed successfully');
            }

            // Validate the configuration
            this.validateXMLConfiguration(configuredXML, config);
        } catch (error) {
            console.warn('Failed to parse/modify NOVAGRID 2026 XML, using string replacement fallback:', error);
            // Fall back to string replacement if XML parsing fails
            configuredXML = this.configureXMLWithStringReplacement(xmlContent, config);
        }

        return configuredXML;
    }

    /**
     * Validate that XML configuration was applied correctly
     */
    private validateXMLConfiguration(xmlContent: string, config: RazielBotConfiguration): void {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Check stake values
            const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
            let stakeFound = false;
            let martingaleFound = false;

            stakeFields.forEach((field, index) => {
                const value = field.textContent;
                if (value === config.stake.toString()) {
                    stakeFound = true;
                    console.log(`✅ Stake validation: Found ${value} at position ${index}`);
                }
                if (value === config.parameters.martingaleSplit?.toString()) {
                    martingaleFound = true;
                    console.log(`✅ Martingale validation: Found ${value} at position ${index}`);
                }
            });

            if (!stakeFound) {
                console.warn(`❌ Stake validation failed: ${config.stake} not found in XML`);
            }
            if (!martingaleFound) {
                console.warn(`❌ Martingale validation failed: ${config.parameters.martingaleSplit} not found in XML`);
            }

            console.log('🔍 XML Validation Summary:', {
                stakeConfigured: stakeFound,
                martingaleConfigured: martingaleFound,
                expectedStake: config.stake,
                expectedMartingale: config.parameters.martingaleSplit,
            });
        } catch (error) {
            console.warn('XML validation failed:', error);
        }
    }

    /**
     * Fallback method to configure XML using string replacement
     */
    private configureXMLWithStringReplacement(xmlContent: string, config: RazielBotConfiguration): string {
        let configuredXML = xmlContent;

        try {
            console.log('🔄 Using string replacement fallback for XML configuration');

            // Replace market symbol
            configuredXML = configuredXML.replace(
                /<field name="SYMBOL_LIST">[^<]*<\/field>/,
                `<field name="SYMBOL_LIST">${config.market}</field>`
            );

            // Replace stake values - target the specific blocks
            // Update initial stake (first occurrence with value 2)
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="TDv\/W;dNI84TFbp}8X8=">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${config.stake}$2`
            );

            // Update initial stake variable (second occurrence with value 2) - CRITICAL: Both stakes must match!
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="9Z%4%dmqCp;\/sSt8wGv#">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${config.stake}$2`
            );

            // Update martingale split value
            const martingaleValue =
                typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2.2;
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="Ib,Krc`nUJzn1KMo9\)`A">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${martingaleValue}$2`
            );

            // Update prediction before loss
            const predictionBeforeLoss =
                typeof config.parameters.predictionBeforeLoss === 'number' ? config.parameters.predictionBeforeLoss : 2;
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="~\]Q~lGg\)3FCGB95VKA`b">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${predictionBeforeLoss}$2`
            );

            // Update prediction after loss
            const predictionAfterLoss =
                typeof config.parameters.predictionAfterLoss === 'number' ? config.parameters.predictionAfterLoss : 3;
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="\(6\)D~Nlfu\/PCG\*s5!9Qy">[\s]*<field name="NUM">)3(<\/field>)/,
                `$1${predictionAfterLoss}$2`
            );

            console.log('✅ String replacement configuration completed with values:', {
                stake: config.stake,
                initalStake: config.stake, // Both stakes now match
                martingale: martingaleValue,
                predictionBeforeLoss,
                predictionAfterLoss,
            });
        } catch (error) {
            console.warn('String replacement also failed:', error);
        }

        return configuredXML;
    }

    /**
     * Load configured bot into Deriv Bot Builder
     */
    private async loadBotIntoBuilder(xmlContent: string, config: RazielBotConfiguration): Promise<void> {
        try {
            console.log('🤖 Loading Raziel Over Under bot into Free Bots section...');

            // Method 1: Navigate to Free Bots tab and load the bot
            await this.loadBotFromFreeBots(xmlContent, config);

            // Method 2: Try to integrate with existing bot loading system
            if (typeof window !== 'undefined' && (window as WindowGlobals).Blockly) {
                this.loadIntoBlockly(xmlContent);
            }

            // Method 3: Dispatch custom event for any listening components
            const loadEvent = new CustomEvent('load.fibonacci.bot', {
                detail: {
                    xmlContent: xmlContent,
                    botName: 'Raziel Over Under Hot/Cold Zone',
                    market: config.market,
                    contractType: config.contractType,
                    barrier: config.barrier,
                    stake: config.stake,
                    prediction: config.prediction,
                    parameters: config.parameters,
                    source: 'hot-cold-zone-scanner',
                },
            });
            window.dispatchEvent(loadEvent);

            // Method 4: AUTO-RUN - Start the bot automatically after loading
            await this.autoStartBot();

            // Show notification with instructions
            this.showBotLoadedNotification();
        } catch (error) {
            console.error('Failed to load bot into builder:', error);
            throw error;
        }
    }

    /**
     * Load bot from Free Bots section
     */
    private async loadBotFromFreeBots(xmlContent: string, config: RazielBotConfiguration): Promise<void> {
        try {
            console.log('🎯 Navigating to Free Bots section...');

            // Navigate to Free Bots tab (index 7)
            const switchTabEvent = new CustomEvent('switch.tab', {
                detail: { tab: 7 }, // FREE_BOTS is at index 7
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(switchTabEvent);

            // Also try direct dashboard store access if available
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.dashboard_store?.setActiveTab) {
                    windowGlobals.dashboard_store.setActiveTab(7); // FREE_BOTS tab
                    console.log('✅ Switched to Free Bots tab via dashboard store');
                }
            }

            // Wait a moment for tab to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Try to find and load the Raziel Over Under bot
            await this.loadSpecificBotFromFreeBots(xmlContent, config);
        } catch (error) {
            console.warn('Failed to load from Free Bots section:', error);
            // Fall back to direct bot builder loading
            await this.loadDirectlyToBotBuilder(xmlContent);
        }
    }

    /**
     * Load specific bot from Free Bots section
     */
    private async loadSpecificBotFromFreeBots(xmlContent: string, config: RazielBotConfiguration): Promise<void> {
        try {
            // Create a bot object that matches the expected format
            const botObject: BotObject = {
                id: 'raziel-over-under-fibonacci',
                filePath: config.botFile,
                title: 'Raziel Over Under (Fibonacci Configured)',
                xmlContent: xmlContent,
                save_type: 'LOCAL',
            };

            // Use the same method as signals section - direct load modal access
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.load_modal?.loadStrategyToBuilder) {
                    console.log('📤 Loading Raziel Over Under Bot to builder...');
                    await windowGlobals.load_modal.loadStrategyToBuilder(botObject);
                    console.log('✅ Raziel Over Under bot loaded successfully via load modal');
                    return;
                }
            }

            // Fallback: Try load_modal_store
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.load_modal_store?.loadStrategyToBuilder) {
                    await windowGlobals.load_modal_store.loadStrategyToBuilder(botObject);
                    console.log('✅ Bot loaded via load modal store');
                    return;
                }
            }

            // Dispatch event to load the bot as final fallback
            const loadBotEvent = new CustomEvent('load.bot.from.freebots', {
                detail: {
                    bot: botObject,
                    source: 'hot-cold-zone-scanner',
                },
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(loadBotEvent);

            console.log('✅ Raziel Over Under bot loading initiated from Free Bots');
        } catch (error) {
            console.warn('Failed to load specific bot from Free Bots:', error);
            throw error;
        }
    }

    /**
     * Fallback: Load directly to Bot Builder
     */
    private async loadDirectlyToBotBuilder(xmlContent: string): Promise<void> {
        try {
            console.log('🔄 Falling back to direct Bot Builder loading...');

            // Navigate to Bot Builder tab (index 1)
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.dashboard_store?.setActiveTab) {
                    windowGlobals.dashboard_store.setActiveTab(1); // BOT_BUILDER tab
                    console.log('✅ Switched to Bot Builder tab');
                }
            }

            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 300));

            // Try to load into Blockly workspace
            this.loadIntoBlockly(xmlContent);

            console.log('✅ Bot loaded directly to Bot Builder');
        } catch (error) {
            console.warn('Failed to load directly to Bot Builder:', error);
        }
    }

    /**
     * Load bot directly into Blockly workspace
     */
    private loadIntoBlockly(xmlContent: string): void {
        try {
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                const blockly = windowGlobals.Blockly;

                if (blockly?.getMainWorkspace) {
                    const workspace = blockly.getMainWorkspace();
                    if (workspace?.clear && blockly.Xml?.textToDom && blockly.Xml?.domToWorkspace) {
                        workspace.clear();
                        const domXml = blockly.Xml.textToDom(xmlContent);
                        blockly.Xml.domToWorkspace(domXml, workspace);
                        console.log('✅ Bot loaded into Blockly workspace');
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load into Blockly:', error);
        }
    }

    /**
     * Show notification that bot was loaded - DISABLED TO PREVENT DELAYS
     */
    private showBotLoadedNotification(): void {
        // Notification disabled to prevent trading delays
        return;
    }

    /**
     * Show debug summary notification
     */
    private showDebugSummary(debugInfo: any): void {
        const { success, totalDuration, steps } = debugInfo;
        const successCount = steps.filter((s: any) => s.status === 'success').length;
        const errorCount = steps.filter((s: any) => s.status === 'error').length;
        const warningCount = steps.filter((s: any) => s.status === 'warning').length;

        // Create debug notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${success ? '#10b981' : '#ef4444'};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10002;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 400px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <span>${success ? '✅' : '❌'}</span>
                <span>Bot Loading ${success ? 'Complete' : 'Failed'}</span>
            </div>
            <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                <div>Duration: ${totalDuration}ms</div>
                <div>Steps: ${successCount} success, ${warningCount} warnings, ${errorCount} errors</div>
                ${!success ? `<div style="margin-top: 4px; color: #fecaca;">Check console for details</div>` : ''}
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Automatically start the bot after loading
     */
    private async autoStartBot(): Promise<void> {
        try {
            console.log('🚀 Auto-starting Raziel Over Under bot...');

            // Wait a moment for bot to fully load
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Method 1: Try to find and click the Run button
            const runButton = document.querySelector('button[data-testid="run-button"]') as HTMLButtonElement;
            if (runButton && !runButton.disabled) {
                runButton.click();
                console.log('✅ Bot auto-started via Run button');
                return;
            }

            // Method 2: Try alternative Run button selectors
            const alternativeRunButtons = [
                'button[class*="run"]',
                'button[class*="start"]',
                'button:contains("Run")',
                'button:contains("Start")',
                '.run-panel button',
                '.bot-controls button[class*="run"]',
            ];

            for (const selector of alternativeRunButtons) {
                const button = document.querySelector(selector) as HTMLButtonElement;
                if (button && !button.disabled && button.textContent?.toLowerCase().includes('run')) {
                    button.click();
                    console.log(`✅ Bot auto-started via selector: ${selector}`);
                    return;
                }
            }

            // Method 3: Dispatch run event
            const runEvent = new CustomEvent('bot.run', {
                detail: { source: 'raziel-auto-start' },
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(runEvent);

            // Method 4: Try keyboard shortcut (F2 is common for Run)
            const keyEvent = new KeyboardEvent('keydown', {
                key: 'F2',
                code: 'F2',
                keyCode: 113,
                which: 113,
                bubbles: true,
            });
            document.dispatchEvent(keyEvent);

            console.log('🔄 Auto-start attempted via multiple methods');
        } catch (error) {
            console.warn('Auto-start failed, manual start required:', error);
        }
    }

    /**
     * Get available Raziel bot variants
     */
    public getAvailableRazielBots(): string[] {
        return [
            'Raziel Over Under.xml', // Primary bot for Raziel button
            'CFX-EvenOdd.xml',
            'CFX-RiseFall.xml',
            'Raziel-Over-Under-Enhanced.xml',
            'Raziel-Over-Under-Base.xml',
            'Raziel-Over-Under-Step1.xml',
            'Raziel-Over-Under-Step2.xml',
            'Raziel-Over-Under-Step3.xml',
            'Raziel-Over-Under-Step4.xml',
        ];
    }

    /**
     * Fallback method to update stake using alternative selectors
     */
    private updateStakeWithFallback(xmlDoc: Document, stake: number): void {
        // Try to find stake blocks by variable name
        const stakeVariableBlocks = xmlDoc.querySelectorAll('field[name="VAR"]');

        stakeVariableBlocks.forEach(varField => {
            if (varField.textContent === 'Stake' || varField.getAttribute('id') === 'y)BE|l7At6oT)ur0Dsw?') {
                const block = varField.closest('block');
                const numField = block?.querySelector(
                    'value[name="VALUE"] block[type="math_number"] field[name="NUM"]'
                );
                if (numField) {
                    numField.textContent = stake.toString();
                    console.log(`✅ Updated stake via fallback method: ${stake}`);
                }
            }
        });
    }

    /**
     * Fallback method to update martingale using alternative selectors
     */
    private updateMartingaleWithFallback(xmlDoc: Document, martingale: number): void {
        // Try to find martingale blocks by variable name
        const martingaleVariableBlocks = xmlDoc.querySelectorAll('field[name="VAR"]');

        martingaleVariableBlocks.forEach(varField => {
            if (varField.textContent === 'Martingale split' || varField.getAttribute('id') === '.5ELQ4[J.e4czk,qPqKM') {
                const block = varField.closest('block');
                const numField = block?.querySelector(
                    'value[name="VALUE"] block[type="math_number"] field[name="NUM"]'
                );
                if (numField) {
                    const martingaleValue = typeof martingale === 'number' ? martingale : 2.2;
                    numField.textContent = martingaleValue.toString();
                    console.log(`✅ Updated martingale via fallback method: ${martingaleValue}`);
                }
            }
        });
    }
}

export const razielBotLoaderService = new RazielBotLoaderService();
