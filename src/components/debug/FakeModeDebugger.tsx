import React, { useState, useEffect } from 'react';

export const FakeModeDebugger: React.FC = () => {
    const [isFakeRealModeActive, setIsFakeRealModeActive] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    const checkFakeRealMode = () => {
        const isActive = localStorage.getItem('demo_icon_us_flag') === 'true';
        setIsFakeRealModeActive(isActive);
        addLog(`Status check: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
        return isActive;
    };

    const toggleFakeMode = () => {
        if (isFakeRealModeActive) {
            localStorage.removeItem('demo_icon_us_flag');
            addLog('🔓 Deactivated fake real mode');
        } else {
            localStorage.setItem('demo_icon_us_flag', 'true');
            addLog('🎭 Activated fake real mode');
        }
        checkFakeRealMode();
    };

    useEffect(() => {
        checkFakeRealMode();
        
        const handleStorageChange = () => {
            checkFakeRealMode();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            zIndex: 9999,
            maxWidth: '300px',
            fontSize: '12px',
            fontFamily: 'monospace'
        }}>
            <h4 style={{ margin: '0 0 10px 0' }}>🔍 Fake Mode Debug</h4>
            
            <div style={{
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '10px',
                background: isFakeRealModeActive ? '#d4edda' : '#f8d7da',
                color: isFakeRealModeActive ? '#155724' : '#721c24'
            }}>
                Status: {isFakeRealModeActive ? '🎭 ACTIVE' : '🔓 INACTIVE'}
            </div>

            <div style={{ marginBottom: '10px' }}>
                <button 
                    onClick={toggleFakeMode}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        marginRight: '5px'
                    }}
                >
                    Toggle Mode
                </button>
                <button 
                    onClick={checkFakeRealMode}
                    style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    Check Status
                </button>
            </div>

            <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '8px',
                maxHeight: '150px',
                overflowY: 'auto'
            }}>
                <strong>Debug Log:</strong>
                {logs.slice(-10).map((log, index) => (
                    <div key={index} style={{ fontSize: '10px', marginTop: '2px' }}>
                        {log}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
                <strong>localStorage Key:</strong> demo_icon_us_flag<br/>
                <strong>Current Value:</strong> {localStorage.getItem('demo_icon_us_flag') || 'null'}
            </div>
        </div>
    );
};