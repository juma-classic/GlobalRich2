import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CopyTradingNavButton.scss';

export const CopyTradingNavButton: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/copy-trading');
    };

    return (
        <button className='copy-trading-nav-button' onClick={handleClick} title='Copy Trading'>
            <div className='icon-container'>
                <svg className='copy-trading-icon' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    {/* Main clipboard/copy icon */}
                    <path
                        d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                    <rect
                        x='8'
                        y='2'
                        width='8'
                        height='4'
                        rx='1'
                        ry='1'
                        stroke='currentColor'
                        strokeWidth='2'
                        fill='none'
                    />
                    {/* Trading chart line */}
                    <path
                        d='M8 12l2 2 2-3 2 3 2-2'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='chart-line'
                    />
                    {/* Sync arrows */}
                    <path
                        d='M10 16l-1 1 1 1'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='sync-arrow-1'
                    />
                    <path
                        d='M14 16l1 1-1 1'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='sync-arrow-2'
                    />
                </svg>
            </div>
            <span className='button-text'>Copy Trading</span>
        </button>
    );
};

export default CopyTradingNavButton;
