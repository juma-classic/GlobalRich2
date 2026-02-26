import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NovaAnalysisNavButton.scss';

interface NovaAnalysisNavButtonProps {
    variant?: 'desktop' | 'mobile';
}

export const NovaAnalysisNavButton: React.FC<NovaAnalysisNavButtonProps> = ({ variant = 'desktop' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === '/nova-analysis';

    const handleClick = () => {
        navigate('/nova-analysis');
    };

    return (
        <button
            className={`nova-analysis-nav-button ${isActive ? 'active' : ''} ${variant}`}
            onClick={handleClick}
            title='Nova Analysis - Simple Trading Analytics'
        >
            <div className='nav-icon'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M12 2L2 7L12 12L22 7L12 2Z' fill='currentColor' opacity='0.6' />
                    <path
                        d='M2 17L12 22L22 17'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                    <path
                        d='M2 12L12 17L22 12'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </div>
            <div className='nav-content'>
                <div className='nav-title'>✨ Nova Analysis</div>
                <div className='nav-subtitle'>Simple Trading Analytics</div>
            </div>
            <div className='nav-badge'>NEW</div>
        </button>
    );
};
