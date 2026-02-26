import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './XDTraderNavButton.scss';

export const XDTraderNavButton: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === '/xdtrader';

    const handleClick = () => {
        navigate('/xdtrader');
    };

    return (
        <button
            className={`xdtrader-nav-button ${isActive ? 'active' : ''}`}
            onClick={handleClick}
            title='xDTrader - Professional Trading Platform'
        >
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <defs>
                    <linearGradient id='xdtraderGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#ffffff' />
                        <stop offset='100%' stopColor='#fbbf24' />
                    </linearGradient>
                </defs>
                {/* Trading chart with X */}
                <path
                    d='M3 18L9 12L13 16L21 8'
                    stroke='url(#xdtraderGrad)'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <path d='M16 8H21V13' stroke='url(#xdtraderGrad)' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                {/* X overlay */}
                <path d='M7 3L11 7M11 3L7 7' stroke='url(#xdtraderGrad)' strokeWidth='2' strokeLinecap='round' />
            </svg>
            <span className='nav-label'>xDTrader</span>
        </button>
    );
};
