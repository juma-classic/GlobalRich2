import { standalone_routes } from '@/components/shared';
import { useDevice } from '@deriv-com/ui';
import { secretAccessSystem } from '@/utils/secret-access';
import { useState, useRef } from 'react';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const longPressTriggered = useRef(false);

    const handleLogoClick = (e: React.MouseEvent) => {
        // Only handle secret access if not a long press
        if (!longPressTriggered.current) {
            secretAccessSystem.handleLogoClick();
        }
        longPressTriggered.current = false;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        longPressTriggered.current = false;
        const timer = setTimeout(() => {
            longPressTriggered.current = true;
            // Trigger API Token login
            const apiTokenBtn = document.getElementById('api-token-login-btn');
            if (apiTokenBtn) {
                apiTokenBtn.click();
            }
        }, 1000); // 1 second long press
        setLongPressTimer(timer);
    };

    const handleMouseUp = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleMouseLeave = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleLogoTap = (e: React.TouchEvent) => {
        // Handle mobile tap for secret access
        e.preventDefault();
        secretAccessSystem.handleLogoTap();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        longPressTriggered.current = false;
        const timer = setTimeout(() => {
            longPressTriggered.current = true;
            // Trigger API Token login
            const apiTokenBtn = document.getElementById('api-token-login-btn');
            if (apiTokenBtn) {
                apiTokenBtn.click();
            }
        }, 1000); // 1 second long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        if (!longPressTriggered.current) {
            handleLogoTap(e);
        }
        longPressTriggered.current = false;
    };

    if (!isDesktop) {
        // Mobile version with tap and long-press handler
        return (
            <div
                className='app-header__logo novaprime-logo'
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: 'pointer' }}
            >
                <span className='novaprime-text'>NOVAPRIME</span>
            </div>
        );
    }

    // Desktop version with click and long-press handler
    return (
        <div
            className='app-header__logo novaprime-logo'
            onClick={handleLogoClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'pointer' }}
        >
            <span className='novaprime-text'>NOVAPRIME</span>
        </div>
    );
};
