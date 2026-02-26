import React, { useEffect, useState } from 'react';
import './NovaprimeLoader.scss';

interface NovaprimeLoaderProps {
    onLoadComplete?: () => void;
    duration?: number;
}

export const NovaprimeLoader: React.FC<NovaprimeLoaderProps> = ({ onLoadComplete, duration = 6000 }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [chartBars, setChartBars] = useState<number[]>([]);

    // Generate random chart bars
    useEffect(() => {
        const bars = Array.from({ length: 20 }, () => Math.random() * 60 + 20);
        setChartBars(bars);
    }, []);

    // Progress Updates
    useEffect(() => {
        const progressInterval = 30;
        const progressIncrement = 100 / (duration / progressInterval);

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const next = prev + progressIncrement;
                return next >= 100 ? 100 : next;
            });
        }, progressInterval);

        const completeTimer = setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => {
                if (onLoadComplete) {
                    onLoadComplete();
                }
            }, 800);
        }, duration);

        return () => {
            clearInterval(progressTimer);
            clearTimeout(completeTimer);
        };
    }, [duration, onLoadComplete]);

    return (
        <div className={`novaprime-loader ${isComplete ? 'fade-out' : ''}`}>
            {/* Background circles */}
            <div className="bg-circle circle-1"></div>
            <div className="bg-circle circle-2"></div>
            <div className="bg-circle circle-3"></div>

            <div className="loader-content">
                {/* Logo */}
                <div className="logo-section">
                    <div className="logo-icon">
                        <div className="icon-p">P</div>
                    </div>
                    <h1 className="logo-text">NOVAPRIME</h1>
                </div>

                {/* Trading Interface Mockup */}
                <div className="trading-interface">
                    {/* Chart Area */}
                    <div className="chart-container">
                        <div className="chart-header">
                            <div className="chart-title">Market Analysis</div>
                            <div className="chart-indicators">
                                <span className="indicator active"></span>
                                <span className="indicator"></span>
                                <span className="indicator"></span>
                            </div>
                        </div>
                        
                        <div className="chart-area">
                            {chartBars.map((height, index) => (
                                <div
                                    key={index}
                                    className="chart-bar"
                                    style={{
                                        height: `${height}%`,
                                        animationDelay: `${index * 0.05}s`
                                    }}
                                ></div>
                            ))}
                            <div className="chart-line"></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <div className="action-btn buy-btn">
                            <div className="btn-icon">↑</div>
                            <div className="btn-label">BUY</div>
                        </div>
                        <div className="action-btn sell-btn">
                            <div className="btn-icon">↓</div>
                            <div className="btn-label">SELL</div>
                        </div>
                        <div className="action-btn analyze-btn">
                            <div className="btn-icon">📊</div>
                            <div className="btn-label">ANALYZE</div>
                        </div>
                        <div className="action-btn bot-btn">
                            <div className="btn-icon">🤖</div>
                            <div className="btn-label">BOT</div>
                        </div>
                    </div>
                </div>

                {/* Loading Progress */}
                <div className="loading-section">
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="loading-text">Loading Trading Platform... {Math.round(progress)}%</div>
                </div>
            </div>
        </div>
    );
};

export default NovaprimeLoader;
