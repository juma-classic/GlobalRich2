import React, { useState, useEffect, useCallback } from 'react';
import { signalAnalysisService } from '@/services/signal-analysis.service';
import { derivAPIService } from '@/services/deriv-api.service';
import { signalTradingService } from '@/services/signal-trading.service';
import './FloatingSignalButton.scss';

interface Signal {
    id: string;
    timestamp: number;
    market: string;
    type: string;
    confidence: string;
    strategy: string;
    entry?: number;
    validityDuration?: number;
    expiresAt?: number;
    remainingTime?: number;
}

export const FloatingSignalButton: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [signals, setSignals] = useState<Signal[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [isAutoTrading, setIsAutoTrading] = useState(false);
    const [tickCount, setTickCount] = useState(0);

    // Handle double click detection
    useEffect(() => {
        if (clickCount === 1) {
            const timer = setTimeout(() => setClickCount(0), 300);
            return () => clearTimeout(timer);
        } else if (clickCount === 2) {
            handleDoubleClick();
            setClickCount(0);
        }
    }, [clickCount]);

    // Subscribe to real-time signals
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let tickCount = 0;

        const subscribeToSignals = async () => {
            try {
                console.log('🔌 Subscribing to R_50 ticks for signal generation...');
                const unsub = await derivAPIService.subscribeToTicks('R_50', (tickData) => {
                    if (tickData?.tick?.quote && tickData?.tick?.epoch) {
                        tickCount++;
                        setTickCount(tickCount);
                        console.log(`📊 Tick ${tickCount}: ${tickData.tick.quote}`);
                        
                        signalAnalysisService.addTick({
                            quote: tickData.tick.quote,
                            epoch: tickData.tick.epoch,
                        });

                        setIsConnected(true);

                        // Generate signal every 5 ticks after minimum 10 (reduced for faster signals)
                        if (tickCount >= 10 && tickCount % 5 === 0) {
                            console.log('🎯 Generating signal...');
                            const signalResult = signalAnalysisService.generateSignal();
                            
                            if (signalResult) {
                                const validityDuration = 40;
                                const newSignal: Signal = {
                                    id: `signal-${Date.now()}`,
                                    timestamp: Date.now(),
                                    market: 'R_50',
                                    type: signalResult.type,
                                    confidence: signalResult.confidence,
                                    strategy: signalResult.strategy,
                                    entry: tickData.tick.quote,
                                    validityDuration,
                                    expiresAt: Date.now() + validityDuration * 1000,
                                    remainingTime: validityDuration,
                                };

                                console.log('✅ Signal generated:', newSignal);
                                setSignals(prev => [newSignal, ...prev.slice(0, 9)]);
                            } else {
                                console.log('⚠️ No signal generated from analysis');
                            }
                        }
                    }
                });
                
                unsubscribe = unsub;
                console.log('✅ Successfully subscribed to ticks');
            } catch (error) {
                console.error('❌ Failed to subscribe to signals:', error);
                setIsConnected(false);
            }
        };

        subscribeToSignals();

        return () => {
            if (unsubscribe) {
                console.log('🔌 Unsubscribing from ticks');
                unsubscribe();
            }
        };
    }, []);

    // Update countdown timers
    useEffect(() => {
        const interval = setInterval(() => {
            setSignals(prev => prev.map(signal => {
                if (!signal.expiresAt) return signal;
                
                const remainingMs = signal.expiresAt - Date.now();
                const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
                
                return {
                    ...signal,
                    remainingTime: remainingSeconds,
                };
            }).filter(s => (s.remainingTime || 0) > 0));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleClick = () => {
        setClickCount(prev => prev + 1);
        if (clickCount === 0) {
            // First click - open modal
            setIsModalOpen(true);
        }
    };

    const handleDoubleClick = useCallback(async () => {
        console.log('🚀 Double click detected - Auto-loading and running bot...');
        setIsAutoTrading(true);
        
        // Get the latest signal
        const latestSignal = signals[0];
        
        if (!latestSignal) {
            console.warn('No signals available to trade');
            setIsAutoTrading(false);
            return;
        }

        try {
            // Get stake from StakeManager
            const { stakeManager } = await import('@/services/stake-manager.service');
            const stake = stakeManager.getStake();
            const duration = 5; // 5 ticks
            
            console.log('💰 Trading signal:', {
                type: latestSignal.type,
                market: latestSignal.market,
                stake,
                duration,
            });

            // Execute the trade
            const result = await signalTradingService.executeSignalTrade(
                {
                    signalId: latestSignal.id,
                    market: latestSignal.market,
                    type: latestSignal.type as any,
                    stake,
                    duration,
                    durationUnit: 't',
                },
                (tradeResult) => {
                    console.log('✅ Trade completed:', tradeResult);
                    setIsAutoTrading(false);
                }
            );

            if (!result.success) {
                console.error('❌ Trade failed:', result.error);
                setIsAutoTrading(false);
            }
        } catch (error) {
            console.error('❌ Auto-trade error:', error);
            setIsAutoTrading(false);
        }
    }, [signals]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSignalColor = (type: string): string => {
        if (type === 'RISE' || type.startsWith('OVER')) return '#10b981';
        if (type === 'FALL' || type.startsWith('UNDER')) return '#ef4444';
        if (type === 'EVEN') return '#3b82f6';
        if (type === 'ODD') return '#f59e0b';
        return '#6b7280';
    };

    return (
        <>
            {/* Floating Button */}
            <button
                className={`floating-signal-btn ${isConnected ? 'connected' : ''} ${isAutoTrading ? 'trading' : ''}`}
                onClick={handleClick}
                title="Single click: View signals | Double click: Auto-trade"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
                </svg>
                {signals.length > 0 && (
                    <span className="signal-badge">{signals.length}</span>
                )}
                {isAutoTrading && (
                    <div className="trading-spinner"></div>
                )}
            </button>

            {/* Signals Modal */}
            {isModalOpen && (
                <div className="floating-signal-modal" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-left">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
                                </svg>
                                <h3>Live Signals</h3>
                                <span className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
                            </div>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            {signals.length === 0 ? (
                                <div className="empty-state">
                                    <p>Waiting for signals...</p>
                                    <p className="sub-text">
                                        {isConnected 
                                            ? `Connected • ${tickCount} ticks received • Generating signals...` 
                                            : 'Connecting to market...'}
                                    </p>
                                    {isConnected && tickCount < 10 && (
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${(tickCount / 10) * 100}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="signals-list">
                                    {signals.map((signal) => (
                                        <div key={signal.id} className="signal-card">
                                            <div className="signal-header">
                                                <span 
                                                    className="signal-type"
                                                    style={{ backgroundColor: getSignalColor(signal.type) }}
                                                >
                                                    {signal.type}
                                                </span>
                                                <span className="signal-time">
                                                    {formatTime(signal.remainingTime || 0)}
                                                </span>
                                            </div>
                                            <div className="signal-details">
                                                <div className="detail-row">
                                                    <span className="label">Market:</span>
                                                    <span className="value">{signal.market}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Confidence:</span>
                                                    <span className="value">{signal.confidence}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Strategy:</span>
                                                    <span className="value">{signal.strategy}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <p className="hint">💡 Double-click the floating button to auto-trade the latest signal</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
