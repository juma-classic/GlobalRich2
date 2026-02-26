import React, { useState, useEffect } from 'react';
import { copyTradingAPIService } from '@/services/copy-trading-api.service';
import './copy-trading-page.scss';

// Modern SVG Icons
const CopyTradingHeaderIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
        </defs>
        <path d="M8 7v10M12 7v10M16 7v10" stroke="url(#headerGrad)" strokeWidth="2" strokeLinecap="round"/>
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="url(#headerGrad)" strokeWidth="2" fill="none"/>
        <circle cx="8" cy="12" r="1.5" fill="url(#headerGrad)"/>
        <circle cx="12" cy="12" r="1.5" fill="url(#headerGrad)"/>
        <circle cx="16" cy="12" r="1.5" fill="url(#headerGrad)"/>
    </svg>
);

const SuccessIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#10b981"/>
        <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ErrorIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#ef4444"/>
        <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5v14l11-7z" fill="white"/>
    </svg>
);

const StopIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const CopyTradingPage: React.FC = () => {
    const [traderTokens, setTraderTokens] = useState<string[]>([]);
    const [newToken, setNewToken] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [copiedTrades, setCopiedTrades] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [connectedTraders, setConnectedTraders] = useState<Array<{ loginid: string; balance: number; token: string; accountType: string }>>([]);

    // Advanced settings
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [assets, setAssets] = useState<string[]>([]);
    const [minStake, setMinStake] = useState<number>(0.35);
    const [maxStake, setMaxStake] = useState<number>(100);
    const [tradeTypes, setTradeTypes] = useState<string[]>([]);
    const [copyRatio, setCopyRatio] = useState<number>(1.0);
    const [copyToReal, setCopyToReal] = useState<boolean>(false);
    const [realAccountToken, setRealAccountToken] = useState<string>('');

    useEffect(() => {
        // Load saved tokens from localStorage
        const saved = localStorage.getItem('copyTradingTokens');
        if (saved) {
            try {
                setTraderTokens(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load saved tokens');
            }
        }

        // Check current status
        const status = copyTradingAPIService.getStatus();
        setIsActive(status.isActive);
        setCopiedTrades(status.copiedTrades);
        setTotalProfit(status.totalProfit);

        // Update status every 5 seconds when active
        const interval = setInterval(() => {
            if (copyTradingAPIService.isRunning()) {
                const stats = copyTradingAPIService.getDetailedStatistics();
                setCopiedTrades(stats.copiedTrades);
                setTotalProfit(stats.totalProfit);
                setConnectedTraders(copyTradingAPIService.getConnectedTraders());
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const showMessage = (msg: string, type: 'success' | 'error') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    const handleAddToken = () => {
        const token = newToken.trim();
        if (!token) {
            showMessage('Please enter a valid API token', 'error');
            return;
        }

        if (traderTokens.includes(token)) {
            showMessage('This token is already added', 'error');
            return;
        }

        const updated = [...traderTokens, token];
        setTraderTokens(updated);
        localStorage.setItem('copyTradingTokens', JSON.stringify(updated));
        setNewToken('');
        showMessage('Trader token added successfully', 'success');
    };

    const handleRemoveToken = (token: string) => {
        const updated = traderTokens.filter(t => t !== token);
        setTraderTokens(updated);
        localStorage.setItem('copyTradingTokens', JSON.stringify(updated));
        showMessage('Trader token removed', 'success');
    };

    const handleStartCopyTrading = async () => {
        if (traderTokens.length === 0) {
            showMessage('Please add at least one trader token', 'error');
            return;
        }

        const config = {
            traderTokens,
            assets: assets.length > 0 ? assets : undefined,
            minTradeStake: minStake,
            maxTradeStake: maxStake,
            tradeTypes: tradeTypes.length > 0 ? tradeTypes : undefined,
            copyRatio: copyRatio,
            copyToRealAccount: copyToReal,
            realAccountToken: copyToReal ? realAccountToken : undefined,
        };

        showMessage('Connecting to traders...', 'success');
        const result = await copyTradingAPIService.startCopyTrading(config);
        
        if (result.success) {
            setIsActive(true);
            setConnectedTraders(copyTradingAPIService.getConnectedTraders());
            showMessage(result.message || 'Copy trading started', 'success');
        } else {
            showMessage(result.message || 'Failed to start copy trading', 'error');
        }
    };

    const handleStopCopyTrading = async () => {
        const result = await copyTradingAPIService.stopCopyTrading();
        
        if (result.success) {
            setIsActive(false);
            setConnectedTraders([]);
            showMessage(result.message || 'Copy trading stopped', 'success');
        } else {
            showMessage(result.message || 'Failed to stop copy trading', 'error');
        }
    };

    return (
        <div className='copy-trading-page'>
            <div className='copy-trading-container'>
                <header className='page-header'>
                    <div className="header-icon-wrapper">
                        <CopyTradingHeaderIcon />
                    </div>
                    <h1>Copy Trading</h1>
                    <p>Automatically copy trades from professional traders</p>
                </header>

                {message && (
                    <div className={`message ${messageType}`} style={{ gridColumn: '1 / -1' }}>
                        <div className="message-icon">
                            {messageType === 'success' ? <SuccessIcon /> : <ErrorIcon />}
                        </div>
                        <span>{message}</span>
                    </div>
                )}

                <div className='left-column'>
                    <div className='status-card'>
                        <div className='status-indicator'>
                            <span className={`status-dot ${isActive ? 'active' : 'inactive'}`}></span>
                            <span className='status-text'>
                                {isActive ? 'Copy Trading Active' : 'Copy Trading Inactive'}
                            </span>
                        </div>
                        <div className='stats-grid'>
                            <div className='stat-item'>
                                <span className='stat-label'>Connected Traders</span>
                                <span className='stat-value'>{connectedTraders.length}</span>
                            </div>
                            <div className='stat-item'>
                                <span className='stat-label'>Copied Trades</span>
                                <span className='stat-value'>{copiedTrades}</span>
                            </div>
                            <div className='stat-item'>
                                <span className='stat-label'>Total Profit</span>
                                <span className={`stat-value ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
                                    ${totalProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {connectedTraders.length > 0 && (
                            <div className='connected-traders-list'>
                                <h3>Connected Traders:</h3>
                                {connectedTraders.map((trader, idx) => (
                                    <div key={idx} className='trader-info'>
                                        <span>🟢 {trader.loginid} ({trader.accountType})</span>
                                        <span>${trader.balance.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='advanced-section'>
                        <button
                            className='btn-toggle-advanced'
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <span className="toggle-icon">
                                {showAdvanced ? <ChevronDownIcon /> : <ChevronRightIcon />}
                            </span>
                            <span>Advanced Settings</span>
                        </button>

                        {showAdvanced && (
                            <div className='advanced-settings'>
                                <div className='setting-group'>
                                    <label>Assets to Copy (optional)</label>
                                    <input
                                        type='text'
                                        placeholder='e.g., frxUSDJPY, R_50 (comma separated)'
                                        onChange={e => setAssets(e.target.value.split(',').map(s => s.trim()))}
                                        disabled={isActive}
                                    />
                                </div>

                                <div className='setting-row'>
                                    <div className='setting-group'>
                                        <label>Min Trade Stake</label>
                                        <input
                                            type='number'
                                            value={minStake}
                                            onChange={e => setMinStake(Number(e.target.value))}
                                            min='0.35'
                                            step='0.01'
                                            disabled={isActive}
                                        />
                                    </div>

                                    <div className='setting-group'>
                                        <label>Max Trade Stake</label>
                                        <input
                                            type='number'
                                            value={maxStake}
                                            onChange={e => setMaxStake(Number(e.target.value))}
                                            min='0.35'
                                            step='0.01'
                                            disabled={isActive}
                                        />
                                    </div>
                                </div>

                                <div className='setting-group'>
                                    <label>Copy Ratio (Stake Multiplier)</label>
                                    <input
                                        type='number'
                                        value={copyRatio}
                                        onChange={e => setCopyRatio(Number(e.target.value))}
                                        min='0.1'
                                        max='10'
                                        step='0.1'
                                        disabled={isActive}
                                        placeholder='1.0 = same stake, 0.5 = half stake'
                                    />
                                    <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                        Multiply trader's stake by this ratio (e.g., 0.5 = copy with half the stake)
                                    </small>
                                </div>

                                <div className='setting-group'>
                                    <label>Trade Types (optional)</label>
                                    <input
                                        type='text'
                                        placeholder='e.g., CALL, PUT (comma separated)'
                                        onChange={e => setTradeTypes(e.target.value.split(',').map(s => s.trim()))}
                                        disabled={isActive}
                                    />
                                </div>

                                <div className='setting-group' style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #3b82f6' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <input
                                            type='checkbox'
                                            id='copyToReal'
                                            checked={copyToReal}
                                            onChange={e => setCopyToReal(e.target.checked)}
                                            disabled={isActive}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor='copyToReal' style={{ margin: 0, fontWeight: 'bold', color: '#1e40af', cursor: 'pointer' }}>
                                            🚀 Copy from DEMO to REAL Account
                                        </label>
                                    </div>
                                    <small style={{ color: '#1e40af', display: 'block', marginBottom: '10px' }}>
                                        Monitor demo traders and automatically copy their trades to your real account
                                    </small>
                                    
                                    {copyToReal && (
                                        <div style={{ marginTop: '10px' }}>
                                            <label style={{ fontWeight: 'normal', color: '#1e40af' }}>Real Account API Token</label>
                                            <input
                                                type='text'
                                                value={realAccountToken}
                                                onChange={e => setRealAccountToken(e.target.value)}
                                                placeholder='Enter your REAL account API token'
                                                disabled={isActive}
                                                style={{ marginTop: '5px' }}
                                            />
                                            <small style={{ color: '#dc2626', display: 'block', marginTop: '5px', fontWeight: 'bold' }}>
                                                ⚠️ WARNING: This will use REAL money! Make sure you understand the risks.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className='right-column'>
                    <div className='token-section'>
                        <h2>Trader API Tokens</h2>
                        <p className='section-description'>
                            Add API tokens of traders you want to copy. You need their read-only API tokens.
                        </p>

                        <div className='token-input-group'>
                            <input
                                type='text'
                                value={newToken}
                                onChange={e => setNewToken(e.target.value)}
                                placeholder='Enter trader API token (e.g., 1wIs-1f15.32)$'
                                className='token-input'
                                onKeyPress={e => e.key === 'Enter' && handleAddToken()}
                            />
                            <button onClick={handleAddToken} className='btn-add'>
                                Add Token
                            </button>
                        </div>

                        <div className='token-list'>
                            {traderTokens.length === 0 ? (
                                <div className='empty-state'>
                                    <p>No trader tokens added yet</p>
                                </div>
                            ) : (
                                traderTokens.map((token, index) => (
                                    <div key={index} className='token-item'>
                                        <span className='token-text'>{token}</span>
                                        <button
                                            onClick={() => handleRemoveToken(token)}
                                            className='btn-remove'
                                            disabled={isActive}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className='action-section'>
                    {!isActive ? (
                        <button
                            onClick={handleStartCopyTrading}
                            className='btn-primary btn-start'
                            disabled={traderTokens.length === 0}
                        >
                            <PlayIcon />
                            <span>Start Copy Trading</span>
                        </button>
                    ) : (
                        <button onClick={handleStopCopyTrading} className='btn-danger btn-stop'>
                            <StopIcon />
                            <span>Stop Copy Trading</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CopyTradingPage;
