import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import AnalysisTool from '@/components/analysis-tool/AnalysisTool';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import { ProtectedSignalsCenter } from '@/components/signals/ProtectedSignalsCenter';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { BotLoadingErrorHandler, withBotLoadingErrorHandling } from '@/utils/bot-loading-error-handler';
import { adminPanelAccess } from '@/utils/admin-panel-access';
import { AdminPanel } from '@/components/admin-panel/AdminPanel';
import { hasPremiumAccess } from '@/utils/premium-access-check';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));
const CopyTradingPage = lazy(() => import('../copy-trading-page'));

const DashboardIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='dashGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <filter id='dashGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        {/* Connection lines */}
        <path d='M7 7h4M15 7h4M7 11v6M19 11v6' stroke='url(#dashGrad)' strokeWidth='1.5' opacity='0.6' />
        
        {/* Top left node - green/yellow square */}
        <rect x='3' y='3' width='8' height='8' rx='2' fill='url(#dashGrad)' filter='url(#dashGlow)' opacity='0.9' />
        <circle cx='7' cy='7' r='1.5' fill='#ffffff' />
        
        {/* Top right node - gray square with green dot */}
        <rect x='15' y='3' width='8' height='8' rx='2' fill='#9ca3af' opacity='0.7' />
        <circle cx='19' cy='7' r='1.2' fill='url(#dashGrad)' filter='url(#dashGlow)' />
        <text x='20' y='9' fontSize='6' fontWeight='bold' fill='#ffffff'>F</text>
        
        {/* Bottom left node - gray square with green dot */}
        <rect x='3' y='13' width='8' height='8' rx='2' fill='#9ca3af' opacity='0.7' />
        <circle cx='7' cy='17' r='1.2' fill='url(#dashGrad)' filter='url(#dashGlow)' />
        
        {/* Bottom right node - large green/yellow square */}
        <rect x='15' y='13' width='8' height='8' rx='2' fill='url(#dashGrad)' filter='url(#dashGlow)' opacity='0.9' />
        <circle cx='19' cy='17' r='1.5' fill='#ffffff' />
        
        <style>
            {`
                @keyframes dashPulse {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 0.6; }
                }
                @keyframes linePulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}
        </style>
    </svg>
);

const BotBuilderIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='bot-builder-nav-icon'>
        <defs>
            <linearGradient id='botGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='50%' stopColor='#fbbf24' />
                <stop offset='100%' stopColor='#f59e0b' />
            </linearGradient>
            <radialGradient id='botRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#fbbf24' stopOpacity='1' />
                <stop offset='100%' stopColor='#f59e0b' stopOpacity='0.3' />
            </radialGradient>
            <filter id='botGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Central processor core */}
        <circle cx='12' cy='12' r='4' fill='url(#botRadial)' stroke='url(#botGrad)' strokeWidth='1.5' filter='url(#botGlow)' />
        
        {/* Inner rotating gear */}
        <path d='M12 9L13 10.5L12 12L11 10.5Z' fill='#fbbf24' />
        <path d='M15 12L13.5 13L12 12L13.5 11Z' fill='#fbbf24' />
        <path d='M12 15L11 13.5L12 12L13 13.5Z' fill='#fbbf24' />
        <path d='M9 12L10.5 11L12 12L10.5 13Z' fill='#fbbf24' />
        
        {/* Central AI core */}
        <circle cx='12' cy='12' r='1.5' fill='#fbbf24' filter='url(#botGlow)' />
        
        {/* Outer rotating ring with nodes */}
        <circle cx='12' cy='12' r='7' stroke='url(#botGrad)' strokeWidth='1.5' fill='none' opacity='0.6' strokeDasharray='2 3' />
        
        {/* Circuit nodes at cardinal points */}
        <circle cx='12' cy='5' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        <circle cx='19' cy='12' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        <circle cx='12' cy='19' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        <circle cx='5' cy='12' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        
        {/* Connecting circuit lines */}
        <line x1='12' y1='5' x2='12' y2='8' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        <line x1='19' y1='12' x2='16' y2='12' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        <line x1='12' y1='19' x2='12' y2='16' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        <line x1='5' y1='12' x2='8' y2='12' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        
        {/* Corner processors */}
        <rect x='2' y='2' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        <rect x='19' y='2' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        <rect x='2' y='19' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        <rect x='19' y='19' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        
        {/* Corner processor indicators */}
        <circle cx='3.5' cy='3.5' r='0.6' fill='#fbbf24' />
        <circle cx='20.5' cy='3.5' r='0.6' fill='#fbbf24' />
        <circle cx='3.5' cy='20.5' r='0.6' fill='#fbbf24' />
        <circle cx='20.5' cy='20.5' r='0.6' fill='#fbbf24' />
        
        {/* Diagonal connection lines */}
        <line x1='5' y1='5' x2='8' y2='8' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        <line x1='19' y1='5' x2='16' y2='8' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        <line x1='5' y1='19' x2='8' y2='16' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        <line x1='19' y1='19' x2='16' y2='16' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        
        {/* Orbiting data particles */}
        <circle cx='12' cy='7' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='15' cy='9' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='15' cy='15' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='9' cy='15' r='0.8' fill='#ffffff' opacity='0.9' />
        
        <style>
            {`
                @keyframes botCoreRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes botRingRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                @keyframes botNodePulse {
                    0%, 100% { r: 1.2; opacity: 1; }
                    50% { r: 1.5; opacity: 0.6; }
                }
                @keyframes botCorePulse {
                    0%, 100% { r: 1.5; opacity: 1; }
                    50% { r: 1.8; opacity: 0.7; }
                }
                @keyframes botLinePulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes botProcessorBlink {
                    0%, 90%, 100% { opacity: 0.7; }
                    95% { opacity: 1; }
                }
                @keyframes botIndicatorPulse {
                    0%, 100% { r: 0.6; opacity: 1; }
                    50% { r: 0.8; opacity: 0.5; }
                }
                @keyframes botOrbitRotate {
                    0% { transform: rotate(0deg) translateX(0); }
                    100% { transform: rotate(360deg) translateX(0); }
                }
                @keyframes botDashFlow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 10; }
                }
                
                /* Always animate - scoped to bot builder icon */
                .bot-builder-nav-icon path:nth-of-type(1),
                .bot-builder-nav-icon path:nth-of-type(2),
                .bot-builder-nav-icon path:nth-of-type(3),
                .bot-builder-nav-icon path:nth-of-type(4) { 
                    animation: botCoreRotate 4s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .bot-builder-nav-icon circle:nth-of-type(2) { 
                    animation: botRingRotate 8s linear infinite, botDashFlow 2s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .bot-builder-nav-icon circle:nth-of-type(3),
                .bot-builder-nav-icon circle:nth-of-type(4),
                .bot-builder-nav-icon circle:nth-of-type(5),
                .bot-builder-nav-icon circle:nth-of-type(6) { 
                    animation: botNodePulse 2s ease-in-out infinite; 
                }
                .bot-builder-nav-icon circle:nth-of-type(1) { 
                    animation: botCorePulse 1.5s ease-in-out infinite; 
                }
                .bot-builder-nav-icon line { 
                    animation: botLinePulse 2s ease-in-out infinite; 
                }
                .bot-builder-nav-icon rect { 
                    animation: botProcessorBlink 3s ease-in-out infinite; 
                }
                .bot-builder-nav-icon circle:nth-of-type(7),
                .bot-builder-nav-icon circle:nth-of-type(8),
                .bot-builder-nav-icon circle:nth-of-type(9),
                .bot-builder-nav-icon circle:nth-of-type(10) { 
                    animation: botIndicatorPulse 1.5s ease-in-out infinite; 
                }
                .bot-builder-nav-icon circle:nth-of-type(11),
                .bot-builder-nav-icon circle:nth-of-type(12),
                .bot-builder-nav-icon circle:nth-of-type(13),
                .bot-builder-nav-icon circle:nth-of-type(14) { 
                    animation: botOrbitRotate 6s linear infinite; 
                    transform-origin: 12px 12px;
                }
            `}
        </style>
    </svg>
);

const ChartsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='chartGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
        </defs>
        {/* Charts - Trending up line chart */}
        <path d='M3 17l6-6 4 4 8-8' stroke='url(#chartGrad)' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M17 7h4v4' stroke='url(#chartGrad)' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        <style>
            {`
                @keyframes chartPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}
        </style>
    </svg>
);

const TutorialsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='tutGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
        </defs>
        {/* Tutorials - Play button in circle */}
        <circle cx='12' cy='12' r='10' stroke='url(#tutGrad)' strokeWidth='2' fill='none' />
        <path d='M10 8l6 4-6 4V8z' fill='url(#tutGrad)' />
        <style>
            {`
                @keyframes tutScale {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}
        </style>
    </svg>
);

const AnalysisToolIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='analysis-tool-nav-icon'>
        <defs>
            <linearGradient id='analysisGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='50%' stopColor='#ef4444' />
                <stop offset='100%' stopColor='#dc2626' />
            </linearGradient>
            <radialGradient id='analysisRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#ef4444' stopOpacity='1' />
                <stop offset='100%' stopColor='#dc2626' stopOpacity='0.3' />
            </radialGradient>
            <filter id='analysisGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Avengers A - main structure - WIDER AND MORE DEFINED */}
        {/* Left leg of A */}
        <path d='M6 21L12 3' stroke='url(#analysisGrad)' strokeWidth='3.5' strokeLinecap='round' filter='url(#analysisGlow)' />
        {/* Right leg of A */}
        <path d='M18 21L12 3' stroke='url(#analysisGrad)' strokeWidth='3.5' strokeLinecap='round' filter='url(#analysisGlow)' />
        {/* Crossbar of A - lower and wider */}
        <line x1='8' y1='15' x2='16' y2='15' stroke='url(#analysisGrad)' strokeWidth='3' strokeLinecap='round' filter='url(#analysisGlow)' />
        
        {/* Top triangle/peak */}
        <circle cx='12' cy='3' r='1.8' fill='#ef4444' filter='url(#analysisGlow)' />
        
        {/* Mechanical gears on the A crossbar */}
        <circle cx='8' cy='15' r='2' fill='url(#analysisRadial)' stroke='url(#analysisGrad)' strokeWidth='0.5' />
        <circle cx='16' cy='15' r='2' fill='url(#analysisRadial)' stroke='url(#analysisGrad)' strokeWidth='0.5' />
        
        {/* Gear teeth */}
        <path d='M8 13L8.6 14.5L8 16L7.4 14.5Z' fill='#ef4444' />
        <path d='M10 15L8.5 15.6L7 15L8.5 14.4Z' fill='#ef4444' />
        <path d='M16 13L16.6 14.5L16 16L15.4 14.5Z' fill='#ef4444' />
        <path d='M18 15L16.5 15.6L15 15L16.5 14.4Z' fill='#ef4444' />
        
        {/* Energy nodes along the legs */}
        <circle cx='9' cy='9' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        <circle cx='15' cy='9' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        <circle cx='7' cy='18' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        <circle cx='17' cy='18' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        
        {/* Arc reactor style core at crossbar center */}
        <circle cx='12' cy='15' r='2.2' fill='url(#analysisRadial)' filter='url(#analysisGlow)' />
        <circle cx='12' cy='15' r='1.4' stroke='#ef4444' strokeWidth='0.5' fill='none' />
        <circle cx='12' cy='15' r='0.7' fill='#ffffff' opacity='0.9' />
        
        {/* Energy lines connecting nodes */}
        <line x1='9' y1='9' x2='12' y2='15' stroke='#ef4444' strokeWidth='0.5' opacity='0.5' strokeDasharray='1 1' />
        <line x1='15' y1='9' x2='12' y2='15' stroke='#ef4444' strokeWidth='0.5' opacity='0.5' strokeDasharray='1 1' />
        
        {/* Outer shield/frame */}
        <circle cx='12' cy='12' r='10.5' stroke='url(#analysisGrad)' strokeWidth='1.5' fill='none' opacity='0.4' strokeDasharray='3 3' />
        
        {/* Corner brackets - Avengers style */}
        <path d='M2 2L2 5M2 2L5 2' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        <path d='M22 2L22 5M22 2L19 2' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        <path d='M2 22L2 19M2 22L5 22' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        <path d='M22 22L22 19M22 22L19 22' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        
        {/* Orbiting power particles */}
        <circle cx='12' cy='5' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='18' cy='12' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='12' cy='19' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='6' cy='12' r='0.8' fill='#ffffff' opacity='0.9' />
        
        <style>
            {`
                @keyframes analysisGearRotate1 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes analysisGearRotate2 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                @keyframes analysisNodePulse {
                    0%, 100% { r: 1.2; opacity: 1; }
                    50% { r: 1.5; opacity: 0.6; }
                }
                @keyframes analysisCorePulse {
                    0%, 100% { r: 2.2; opacity: 1; }
                    50% { r: 2.5; opacity: 0.7; }
                }
                @keyframes analysisRingPulse {
                    0%, 100% { r: 1.4; opacity: 1; }
                    50% { r: 1.6; opacity: 0.6; }
                }
                @keyframes analysisShieldRotate {
                    0% { transform: rotate(0deg); stroke-dashoffset: 0; }
                    100% { transform: rotate(360deg); stroke-dashoffset: 30; }
                }
                @keyframes analysisBracketPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                @keyframes analysisOrbitRotate {
                    0% { transform: rotate(0deg) translateX(0); }
                    100% { transform: rotate(360deg) translateX(0); }
                }
                @keyframes analysisLineFlow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 10; }
                }
                @keyframes analysisPeakPulse {
                    0%, 100% { r: 1.8; opacity: 1; }
                    50% { r: 2.1; opacity: 0.7; }
                }
                
                /* Always animate - scoped to analysis tool icon */
                .analysis-tool-nav-icon circle:nth-of-type(2),
                .analysis-tool-nav-icon path:nth-of-type(3),
                .analysis-tool-nav-icon path:nth-of-type(4) { 
                    animation: analysisGearRotate1 4s linear infinite; 
                    transform-origin: 8px 15px;
                }
                .analysis-tool-nav-icon circle:nth-of-type(3),
                .analysis-tool-nav-icon path:nth-of-type(5),
                .analysis-tool-nav-icon path:nth-of-type(6) { 
                    animation: analysisGearRotate2 4s linear infinite; 
                    transform-origin: 16px 15px;
                }
                .analysis-tool-nav-icon circle:nth-of-type(4),
                .analysis-tool-nav-icon circle:nth-of-type(5),
                .analysis-tool-nav-icon circle:nth-of-type(6),
                .analysis-tool-nav-icon circle:nth-of-type(7) { 
                    animation: analysisNodePulse 2s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(8) { 
                    animation: analysisCorePulse 1.5s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(9) { 
                    animation: analysisRingPulse 1.5s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(11) { 
                    animation: analysisShieldRotate 8s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .analysis-tool-nav-icon path:nth-of-type(7),
                .analysis-tool-nav-icon path:nth-of-type(8),
                .analysis-tool-nav-icon path:nth-of-type(9),
                .analysis-tool-nav-icon path:nth-of-type(10) { 
                    animation: analysisBracketPulse 2s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(12),
                .analysis-tool-nav-icon circle:nth-of-type(13),
                .analysis-tool-nav-icon circle:nth-of-type(14),
                .analysis-tool-nav-icon circle:nth-of-type(15) { 
                    animation: analysisOrbitRotate 6s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .analysis-tool-nav-icon line:nth-of-type(2),
                .analysis-tool-nav-icon line:nth-of-type(3) { 
                    animation: analysisLineFlow 2s linear infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(1) { 
                    animation: analysisPeakPulse 1.5s ease-in-out infinite; 
                }
            `}
        </style>
    </svg>
);

const SignalsIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='signals-nav-icon'>
        <defs>
            <linearGradient id='signalGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <radialGradient id='signalRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#fbbf24' stopOpacity='0.8' />
                <stop offset='100%' stopColor='#ffffff' stopOpacity='0.2' />
            </radialGradient>
            <filter id='signalGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Central antenna base - vertical tower */}
        <rect x='11' y='14' width='2' height='8' fill='url(#signalGrad)' rx='1' />
        <circle cx='12' cy='14' r='1.5' fill='#fbbf24' filter='url(#signalGlow)' />
        
        {/* Antenna rings - expanding outward like alien tech */}
        <ellipse 
            cx='12' 
            cy='14' 
            rx='3' 
            ry='1.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.9'
        />
        <ellipse 
            cx='12' 
            cy='14' 
            rx='5.5' 
            ry='2.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.7'
        />
        <ellipse 
            cx='12' 
            cy='14' 
            rx='8' 
            ry='3.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.5'
        />
        <ellipse 
            cx='12' 
            cy='14' 
            rx='10.5' 
            ry='4.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.3'
        />
        
        {/* Signal wave particles - floating upward */}
        <circle cx='12' cy='10' r='1' fill='#fbbf24' opacity='0.8' />
        <circle cx='9' cy='8' r='0.8' fill='#fbbf24' opacity='0.6' />
        <circle cx='15' cy='8' r='0.8' fill='#fbbf24' opacity='0.6' />
        <circle cx='12' cy='5' r='1' fill='#fbbf24' opacity='0.4' />
        <circle cx='8' cy='4' r='0.7' fill='#fbbf24' opacity='0.3' />
        <circle cx='16' cy='4' r='0.7' fill='#fbbf24' opacity='0.3' />
        
        {/* Energy beams shooting upward */}
        <line x1='12' y1='14' x2='12' y2='3' stroke='url(#signalRadial)' strokeWidth='0.5' opacity='0.4' />
        <line x1='12' y1='14' x2='9' y2='5' stroke='url(#signalRadial)' strokeWidth='0.5' opacity='0.3' />
        <line x1='12' y1='14' x2='15' y2='5' stroke='url(#signalRadial)' strokeWidth='0.5' opacity='0.3' />
        
        <style>
            {`
                @keyframes ringExpand1Sig {
                    0%, 100% { rx: 3; ry: 1.5; opacity: 0.9; }
                    50% { rx: 3.5; ry: 1.8; opacity: 1; }
                }
                @keyframes ringExpand2Sig {
                    0%, 100% { rx: 5.5; ry: 2.5; opacity: 0.7; }
                    50% { rx: 6; ry: 2.8; opacity: 0.9; }
                }
                @keyframes ringExpand3Sig {
                    0%, 100% { rx: 8; ry: 3.5; opacity: 0.5; }
                    50% { rx: 8.5; ry: 3.8; opacity: 0.7; }
                }
                @keyframes ringExpand4Sig {
                    0%, 100% { rx: 10.5; ry: 4.5; opacity: 0.3; }
                    50% { rx: 11; ry: 4.8; opacity: 0.5; }
                }
                @keyframes particleFloat1Sig {
                    0% { cy: 10; opacity: 0.8; }
                    100% { cy: 2; opacity: 0; }
                }
                @keyframes particleFloat2Sig {
                    0% { cy: 8; opacity: 0.6; }
                    100% { cy: 1; opacity: 0; }
                }
                @keyframes particleFloat3Sig {
                    0% { cy: 5; opacity: 0.4; }
                    100% { cy: -1; opacity: 0; }
                }
                @keyframes particleFloat4Sig {
                    0% { cy: 4; opacity: 0.3; }
                    100% { cy: -2; opacity: 0; }
                }
                @keyframes corePulseSig {
                    0%, 100% { r: 1.5; opacity: 1; }
                    50% { r: 2; opacity: 0.6; }
                }
                @keyframes beamPulseSig {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                
                /* Always animate - scoped to signals icon */
                .signals-nav-icon ellipse:nth-of-type(1) { 
                    animation: ringExpand1Sig 2s ease-in-out infinite; 
                }
                .signals-nav-icon ellipse:nth-of-type(2) { 
                    animation: ringExpand2Sig 2s ease-in-out infinite 0.2s; 
                }
                .signals-nav-icon ellipse:nth-of-type(3) { 
                    animation: ringExpand3Sig 2s ease-in-out infinite 0.4s; 
                }
                .signals-nav-icon ellipse:nth-of-type(4) { 
                    animation: ringExpand4Sig 2s ease-in-out infinite 0.6s; 
                }
                .signals-nav-icon circle:nth-of-type(2) { 
                    animation: corePulseSig 1.5s ease-in-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(3) { 
                    animation: particleFloat1Sig 2s ease-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(4),
                .signals-nav-icon circle:nth-of-type(5) { 
                    animation: particleFloat2Sig 2.5s ease-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(6) { 
                    animation: particleFloat3Sig 3s ease-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(7),
                .signals-nav-icon circle:nth-of-type(8) { 
                    animation: particleFloat4Sig 3.5s ease-out infinite; 
                }
                .signals-nav-icon line { 
                    animation: beamPulseSig 1.5s ease-in-out infinite; 
                }
            `}
        </style>
    </svg>
);


const XDTraderIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='dtrader-nav-icon'>
        <defs>
            <linearGradient id='dtraderGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='50%' stopColor='#fbbf24' />
                <stop offset='100%' stopColor='#f59e0b' />
            </linearGradient>
            <radialGradient id='dtraderRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#fbbf24' stopOpacity='1' />
                <stop offset='100%' stopColor='#f59e0b' stopOpacity='0.3' />
            </radialGradient>
            <filter id='dtraderGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Letter D - left vertical bar */}
        <rect x='5' y='4' width='3' height='16' rx='1' fill='url(#dtraderGrad)' filter='url(#dtraderGlow)' />
        
        {/* Letter D - curved right side with segments */}
        <path 
            d='M8 4 Q19 4 19 12 Q19 20 8 20' 
            stroke='url(#dtraderGrad)' 
            strokeWidth='3' 
            fill='none' 
            strokeLinecap='round'
            filter='url(#dtraderGlow)'
        />
        
        {/* Mechanical gears on the D */}
        <circle cx='8' cy='7' r='1.5' fill='url(#dtraderRadial)' stroke='url(#dtraderGrad)' strokeWidth='0.5' />
        <circle cx='8' cy='12' r='2' fill='url(#dtraderRadial)' stroke='url(#dtraderGrad)' strokeWidth='0.5' />
        <circle cx='8' cy='17' r='1.5' fill='url(#dtraderRadial)' stroke='url(#dtraderGrad)' strokeWidth='0.5' />
        
        {/* Gear teeth */}
        <path d='M8 5.5L8.5 6.5L8 7.5L7.5 6.5Z' fill='#fbbf24' />
        <path d='M8 10L8.7 11L8 12L7.3 11Z' fill='#fbbf24' />
        <path d='M8 15.5L8.5 16.5L8 17.5L7.5 16.5Z' fill='#fbbf24' />
        
        <style>
            {`
                .dtrader-nav-icon {
                    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
                    animation: dtraderPulse 3s ease-in-out infinite;
                }
                @keyframes dtraderPulse {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); }
                    50% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.9)); }
                }
            `}
        </style>
    </svg>
);

const CopyTradingIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='copy-trading-nav-icon'>
        <defs>
            <linearGradient id='copyTradingGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#fbbf24' />
                <stop offset='50%' stopColor='#f59e0b' />
                <stop offset='100%' stopColor='#d97706' />
            </linearGradient>
            <filter id='copyTradingGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Main clipboard */}
        <path
            d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'
            stroke='url(#copyTradingGrad)'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            filter='url(#copyTradingGlow)'
        />
        <rect
            x='8'
            y='2'
            width='8'
            height='4'
            rx='1'
            stroke='url(#copyTradingGrad)'
            strokeWidth='2'
            fill='none'
            filter='url(#copyTradingGlow)'
        />
        
        {/* Trading chart line */}
        <path
            d='M8 12l2 2 2-3 2 3 2-2'
            stroke='url(#copyTradingGrad)'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            filter='url(#copyTradingGlow)'
        />
        
        {/* Sync arrows */}
        <path
            d='M10 16l-1 1 1 1'
            stroke='url(#copyTradingGrad)'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            filter='url(#copyTradingGlow)'
        />
        <path
            d='M14 16l1 1-1 1'
            stroke='url(#copyTradingGrad)'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            filter='url(#copyTradingGlow)'
        />
        
        <style>
            {`
                .copy-trading-nav-icon {
                    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
                    animation: copyTradingPulse 3s ease-in-out infinite;
                }
                @keyframes copyTradingPulse {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); }
                    50% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.9)); }
                }
            `}
        </style>
    </svg>
);

const FreeBotsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='freeGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <filter id='glow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        {/* Robot head - rounded rectangle */}
        <rect x='6' y='3' width='12' height='11' rx='5' fill='#6b7280' opacity='0.8' />
        
        {/* Left eye - small yellow circle */}
        <circle cx='9' cy='7' r='1.5' fill='#fbbf24' filter='url(#glow)' />
        
        {/* Right eye - larger yellow circle with white center */}
        <circle cx='14' cy='8' r='2.5' fill='#fbbf24' filter='url(#glow)' />
        <circle cx='14' cy='8' r='1.2' fill='#ffffff' opacity='0.9' />
        
        {/* Neck/body connector */}
        <rect x='10.5' y='13' width='3' height='3' fill='#9ca3af' />
        
        {/* Base bars - 5 yellow vertical bars */}
        <rect x='4' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        <rect x='7.5' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        <rect x='11' y='17' width='2.5' height='5' rx='1' fill='#ffffff' opacity='0.9' />
        <rect x='14.5' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        <rect x='18' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        
        <style>
            {`
                @keyframes eyeBlink {
                    0%, 90%, 100% { opacity: 1; }
                    95% { opacity: 0.3; }
                }
                @keyframes barPulse {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.9); }
                }
            `}
        </style>
    </svg>
);

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;
    const { isDesktop } = useDevice();

    type BotType = {
        title: string;
        image: string;
        filePath: string;
        xmlContent: string;
    };
    const [bots, setBots] = useState<BotType[]>([]);
    const [analysisToolUrl, setAnalysisToolUrl] = useState('ai');
    const [premiumBotModal, setPremiumBotModal] = useState({ isOpen: false, botName: '', xmlFile: '' });
    const [premiumPassword, setPremiumPassword] = useState('');
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    // Setup admin panel access
    useEffect(() => {
        adminPanelAccess.setAccessCallback(() => {
            setIsAdminPanelOpen(true);
        });
    }, []);

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
            }
        }
    }, [clear, connectionStatus, stopBot]);

    useEffect(() => {
        const fetchBots = async () => {
            const botFiles = [
                // All Available Bots
                'D strike 2.xml',
                'Magic Recovery.xml',
                'Over 2 Rec Over 4.xml',
                'UNDER 7,UNDER 5.xml',
                'UNDER 8,UNDER 6.xml',
                'PATEL (with Entry).xml',
                'Raziel Over Under.xml',
            ];
            const botPromises = botFiles.map(async file => {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                    }
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    return {
                        title: file.split('/').pop(),
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                        filePath: file,
                        xmlContent: text,
                    };
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });
            const bots = (await Promise.all(botPromises)).filter(Boolean);
            setBots(bots);
        };
        fetchBots();
    }, []);

    const handleBotClick = useCallback(
        withBotLoadingErrorHandling(async bot => {
            // Validate bot object first
            const validation = BotLoadingErrorHandler.validateBotObject(bot);
            if (!validation.isValid) {
                const errorMessage = `Bot validation failed: ${validation.errors.join(', ')}`;
                console.error('❌', errorMessage);
                throw new Error(errorMessage);
            }

            console.log('🤖 Loading bot:', bot.title);

            setActiveTab(DBOT_TABS.DASHBOARD);

            // Validate load_modal exists and has the required method
            if (!load_modal) {
                throw new Error('load_modal is not available');
            }

            if (typeof load_modal.loadStrategyToBuilder !== 'function') {
                throw new Error('loadStrategyToBuilder is not defined on load_modal');
            }

            // Prepare strategy object with all required properties
            const strategyToLoad = {
                id: bot.filePath || `bot_${Date.now()}`, // Fallback ID if filePath is missing
                name: bot.title,
                xml: bot.xmlContent,
                save_type: 'LOCAL',
            };

            console.log('📋 Strategy to load:', {
                id: strategyToLoad.id,
                name: strategyToLoad.name,
                xmlLength: strategyToLoad.xml.length,
                save_type: strategyToLoad.save_type,
            });

            // Load the strategy with error handling
            await load_modal.loadStrategyToBuilder(strategyToLoad);

            console.log('✅ Bot loaded successfully');

            // Update workspace name if function exists
            if (typeof updateWorkspaceName === 'function') {
                updateWorkspaceName();
            } else {
                console.warn('⚠️ updateWorkspaceName function not available');
            }
        }, 'handleBotClick'),
        [setActiveTab, load_modal]
    );

    const handleOpen = useCallback(async () => {
        await load_modal.loadFileFromRecent();
        setActiveTab(DBOT_TABS.DASHBOARD);
    }, [load_modal, setActiveTab]);

    const toggleAnalysisTool = (url: string) => setAnalysisToolUrl(url);

    // Listen for CFX bot load events from signals
    useEffect(() => {
        const handleCFXBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signalType, market, prediction } = customEvent.detail;
            console.log('📥 Received CFX bot load request:', { botFile, signalType, market, prediction });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found bot, configuring with signal parameters...');

                // Parse and configure the XML with signal parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type based on signal type
                let contractType = '';
                if (signalType === 'EVEN') {
                    contractType = 'DIGITEVEN';
                } else if (signalType === 'ODD') {
                    contractType = 'DIGITODD';
                } else if (signalType === 'RISE') {
                    contractType = 'CALL';
                } else if (signalType === 'FALL') {
                    contractType = 'PUT';
                }

                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction digit for OVER/UNDER signals
                if (prediction !== undefined) {
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    // Find the prediction field (it's in a math_number_positive block)
                    predictionFields.forEach(field => {
                        const parent = field.parentElement;
                        if (parent && parent.getAttribute('type') === 'math_number_positive') {
                            field.textContent = prediction.toString();
                            console.log(`🎯 Prediction digit set to: ${prediction}`);
                        }
                    });
                }

                // Update stake using StakeManager (overrides XML defaults)
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    // Look for stake-related NUM fields in CFX bots
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Check if this is the initial stake field by looking at the block ID
                        const blockId = parentBlock.getAttribute('id');
                        if (blockId === 'initial_stake_value') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated initial stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total CFX stake fields updated: ${stakeUpdatesCount}`);

                // Auto-set entry point based on current market data
                // await setAutoEntryPoint(xmlDoc, market, signalType); // TODO: Implement this function

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                };

                console.log('✅ Bot configured, loading into workspace...');
                await handleBotClick(configuredBot);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 Auto-running bot after configuration...');
                    try {
                        // Trigger the run button click programmatically
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                            console.log('✅ Bot auto-started successfully');
                        } else {
                            console.warn('⚠️ Run button not found, trying alternative method...');
                            // Alternative method: dispatch run button event
                            const runEvent = new CustomEvent('bot.auto.run');
                            window.dispatchEvent(runEvent);
                        }
                    } catch (error) {
                        console.error('❌ Failed to auto-run bot:', error);
                    }
                }, 2000); // 2 second delay to ensure bot is fully loaded
            } else {
                console.error('❌ Bot not found:', botFile);
            }
        };

        window.addEventListener('load.cfx.bot', handleCFXBotLoad);
        return () => {
            window.removeEventListener('load.cfx.bot', handleCFXBotLoad);
        };
    }, [bots, handleBotClick]);

    // Listen for MatchesMaster bot auto-open events from Zeus Analysis
    useEffect(() => {
        const handleMatchesMasterOpen = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { predictedDigit, market } = customEvent.detail;
            console.log('📥 Received MatchesMaster auto-open request:', { predictedDigit, market });

            // Find the MatchesMaster bot in the bots array
            const matchesMasterBot = bots.find(b => b.filePath === 'MatchesMaster.xml');
            if (matchesMasterBot) {
                console.log('✅ Found MatchesMaster bot, configuring with Zeus prediction...');

                // Parse and configure the XML with Zeus parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(matchesMasterBot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update target digit in the Target Digit variable initialization
                const targetDigitFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                targetDigitFields.forEach(field => {
                    if (field.textContent === 'Target Digit') {
                        // Find the NUM field in the same block
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictedDigit.toString();
                                console.log(`🎯 Target digit set to: ${predictedDigit}`);
                            }
                        }
                    }
                });

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...matchesMasterBot,
                    xmlContent: configuredXml,
                    title: `MatchesMaster - Digit ${predictedDigit}`,
                };

                console.log('✅ MatchesMaster configured, loading into workspace...');
                await handleBotClick(configuredBot);
            } else {
                console.error('❌ MatchesMaster bot not found');
            }
        };

        window.addEventListener('open.matchesmaster.bot', handleMatchesMasterOpen);
        return () => {
            window.removeEventListener('open.matchesmaster.bot', handleMatchesMasterOpen);
        };
    }, [bots, handleBotClick]);

    // Listen for generic signal bot load events from Advanced Algo
    useEffect(() => {
        const handleSignalBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, botName, market, contractType, stake, prediction, signalType, confidence } =
                customEvent.detail;
            console.log('📥 Received generic signal bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                stake,
                prediction,
                signalType,
                confidence,
            });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found bot, configuring with signal parameters...');

                // Parse and configure the XML with signal parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type based on signal type
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction digit for OVER/UNDER signals
                if (prediction !== undefined) {
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    // Find the prediction field (it's in a math_number_positive block)
                    predictionFields.forEach(field => {
                        const parent = field.parentElement;
                        if (parent && parent.getAttribute('type') === 'math_number_positive') {
                            field.textContent = prediction.toString();
                            console.log(`🎯 Prediction digit set to: ${prediction}`);
                        }
                    });
                }

                // Update stake using StakeManager (overrides XML defaults)
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    // Look for stake-related NUM fields
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Check if this is the initial stake field by looking at the block ID
                        const blockId = parentBlock.getAttribute('id');
                        if (blockId === 'initial_stake_value' || blockId?.includes('stake')) {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total stake fields updated: ${stakeUpdatesCount}`);

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${botName} - ${signalType} (${confidence}%)`,
                };

                console.log('✅ Generic bot configured, loading into workspace...');
                await handleBotClick(configuredBot);
            } else {
                console.error('❌ Bot not found:', botFile);
            }
        };

        window.addEventListener('load.signal.bot', handleSignalBotLoad);
        return () => {
            window.removeEventListener('load.signal.bot', handleSignalBotLoad);
        };
    }, [bots, handleBotClick]);

    // Listen for enhanced CFX bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedCFXBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced CFX bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found CFX bot, loading directly into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced CFX bot loaded successfully');

                // Auto-run the bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced CFX bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced CFX bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced CFX bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced CFX bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ CFX Bot not found:', botFile);
            }
        };

        window.addEventListener('load.cfx.bot.enhanced', handleEnhancedCFXBotLoad);
        return () => {
            window.removeEventListener('load.cfx.bot.enhanced', handleEnhancedCFXBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced Elvis bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedElvisBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced Elvis bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found Elvis bot, loading directly into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced Elvis bot loaded successfully');

                // Auto-run the Elvis bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced Elvis bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced Elvis bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced Elvis bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced Elvis bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ Elvis Bot not found:', botFile);
            }
        };

        window.addEventListener('load.elvis.bot.enhanced', handleEnhancedElvisBotLoad);
        return () => {
            window.removeEventListener('load.elvis.bot.enhanced', handleEnhancedElvisBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced signal bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedSignalBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced signal bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found signal bot, loading directly into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced signal bot loaded successfully');

                // Auto-run the signal bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced signal bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced signal bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced signal bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced signal bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ Signal Bot not found:', botFile);
            }
        };

        window.addEventListener('load.signal.bot.enhanced', handleEnhancedSignalBotLoad);
        return () => {
            window.removeEventListener('load.signal.bot.enhanced', handleEnhancedSignalBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced PATEL bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedPatelBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded, barrier, recoveryStrategy } = customEvent.detail;

            console.log('🎯 Received enhanced PATEL bot load request:', {
                botFile,
                signal: signal.prediction,
                barrier,
                recoveryStrategy: recoveryStrategy
                    ? {
                          predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                          predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                          strategy: recoveryStrategy.strategy,
                      }
                    : null,
                market: signal.market,
                confidence: signal.confidence,
                autoLoaded,
            });

            // Find the PATEL bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found PATEL bot, configuring with adaptive recovery logic...');

                // Parse and configure the XML with proper OVER/UNDER handling
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = signal.market;
                    console.log(`📊 Market set to: ${signal.market}`);
                });

                // Update contract type based on signal type
                const contractType = signal.prediction.includes('OVER') ? 'DIGITOVER' : 'DIGITUNDER';
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Set the barrier value
                if (barrier) {
                    const barrierFields = xmlDoc.querySelectorAll('field[name="BARRIER"]');
                    barrierFields.forEach(field => {
                        field.textContent = barrier.toString();
                        console.log(`🎯 Barrier set to: ${barrier}`);
                    });
                }

                // Configure Adaptive Recovery Strategy - Prediction Before/After Loss
                if (recoveryStrategy) {
                    console.log('🧠 Configuring Adaptive Recovery Strategy...');

                    // Find and update prediction before loss
                    const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                    variableFields.forEach(field => {
                        const varName = field.textContent;
                        const block = field.closest('block[type="variables_set"]');

                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');

                            if (varName === 'Prediction Before Loss' || varName === 'Initial Prediction') {
                                if (numField) {
                                    numField.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                    console.log(
                                        `🎯 Prediction Before Loss set to: ${recoveryStrategy.predictionBeforeLoss}`
                                    );
                                }
                            } else if (varName === 'Prediction After Loss' || varName === 'Recovery Prediction') {
                                if (numField) {
                                    numField.textContent = recoveryStrategy.predictionAfterLoss.toString();
                                    console.log(
                                        `🔄 Prediction After Loss set to: ${recoveryStrategy.predictionAfterLoss}`
                                    );
                                }
                            }
                        }
                    });

                    // Also look for direct prediction fields in the bot logic
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    predictionFields.forEach(field => {
                        const parentBlock = field.closest('block');
                        if (parentBlock) {
                            const blockType = parentBlock.getAttribute('type');
                            const blockId = parentBlock.getAttribute('id');

                            // Look for prediction-related blocks
                            if (blockId && (blockId.includes('prediction') || blockId.includes('digit'))) {
                                // This might be a prediction field - we'll set it to the before loss value
                                field.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                console.log(
                                    `🎯 Prediction field set to: ${recoveryStrategy.predictionBeforeLoss} (before loss)`
                                );
                            }
                        }
                    });

                    console.log(`✅ Adaptive Recovery configured:`, {
                        predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                        predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                        winProbBeforeLoss: `${recoveryStrategy.winProbabilities.beforeLoss}%`,
                        winProbAfterLoss: `${recoveryStrategy.winProbabilities.afterLoss}%`,
                        strategy: recoveryStrategy.strategy,
                    });
                }

                // For PATEL bot, we should NOT set hardcoded prediction digits
                // Instead, let the bot use its entry point detection logic
                console.log('ℹ️ PATEL bot will use entry point detection with adaptive recovery');

                // Update Search Number (entry point digit) if provided
                if (signal.entryDigit) {
                    const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                    variableFields.forEach(field => {
                        if (field.textContent === 'Search Number') {
                            const block = field.closest('block[type="variables_set"]');
                            if (block) {
                                const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                                if (numField) {
                                    numField.textContent = signal.entryDigit.toString();
                                    console.log(`🔍 Search Number set to: ${signal.entryDigit}`);
                                }
                            }
                        }
                    });
                }

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${bot.title} - ${signal.prediction} (${signal.confidence}%)`,
                };

                console.log('✅ PATEL bot configured with proper OVER/UNDER logic, loading into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        // Validate bot configuration before loading
                        if (!configuredBot) {
                            console.error('❌ Configured bot is undefined');
                            return;
                        }

                        if (!configuredBot.xmlContent) {
                            console.error('❌ Configured bot XML content is missing');
                            return;
                        }

                        console.log('🚀 Loading configured PATEL bot...');
                        await handleBotClick(configuredBot);
                        console.log('✅ Enhanced PATEL bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading enhanced PATEL bot:', error);

                        // Provide specific guidance for PATEL bot loading issues
                        console.error('💡 PATEL bot loading failed. Troubleshooting steps:');
                        console.error('   1. Check if Bot Builder tab is accessible');
                        console.error('   2. Verify PATEL bot XML file exists in public folder');
                        console.error('   3. Try loading a different bot first to test the system');
                        console.error('   4. Refresh the page and try again');

                        // Attempt recovery by switching to workspace tab
                        try {
                            console.log('🔄 Attempting recovery by switching to Dashboard...');
                            setActiveTab(DBOT_TABS.DASHBOARD);
                        } catch (recoveryError) {
                            console.error('❌ Recovery attempt failed:', recoveryError);
                        }
                    }
                }, 300);
            } else {
                console.error('❌ PATEL bot not found:', botFile);
            }
        };

        window.addEventListener('load.patel.bot.enhanced', handleEnhancedPatelBotLoad);
        return () => {
            window.removeEventListener('load.patel.bot.enhanced', handleEnhancedPatelBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for Raziel Over Under bot loading events from Zeus AI
    useEffect(() => {
        const handleRazielBotLoad = async (event: Event) => {
            let eventData;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_RAZIEL_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            } = eventData;

            console.log('🎯 Received Raziel Over Under bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            });

            // Find the Raziel Over Under bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found Raziel Over Under bot, configuring with Zeus parameters...');

                // Parse and configure the XML with Zeus parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type (TYPE_LIST and PURCHASE_LIST)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction before loss
                const predictionBeforeLossFields = xmlDoc.querySelectorAll(
                    'block[type="variables_set"] field[name="VAR"]'
                );
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'Prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionBeforeLoss.toString();
                                console.log(`🎯 Prediction before loss set to: ${predictionBeforeLoss}`);
                            }
                        }
                    }
                });

                // Update prediction after loss
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'prediction after l oss') {
                        // Note: there's a space in the XML
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionAfterLoss.toString();
                                console.log(`🎯 Prediction after loss set to: ${predictionAfterLoss}`);
                            }
                        }
                    }
                });

                // Update entry point digit
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'Entry Point Digit') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = entryPointDigit.toString();
                                console.log(`🎯 Entry Point Digit set to: ${entryPointDigit}`);
                            }
                        }
                    }
                });

                // Update stake using StakeManager
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Look for stake-related fields
                        const prevSibling = field.parentElement?.previousElementSibling;
                        if (prevSibling && prevSibling.textContent === 'Stake') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated stake to ${currentStake} (from StakeManager)`);
                        }
                        if (prevSibling && prevSibling.textContent === 'initalStake') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated initial stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total Raziel stake fields updated: ${stakeUpdatesCount}`);

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${botName} (${strategy} ${selectedDigit} | Entry: ${entryPointDigit})`,
                };

                console.log('✅ Raziel Over Under bot configured, loading into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot
                await handleBotClick(configuredBot);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 Auto-running Raziel Over Under bot after configuration...');
                    try {
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                            console.log('✅ Raziel Over Under bot auto-started successfully');
                        } else {
                            console.warn('⚠️ Run button not found, trying alternative method...');
                        }
                    } catch (error) {
                        console.error('❌ Failed to auto-run Raziel Over Under bot:', error);
                    }
                }, 2000); // 2 second delay to ensure bot is fully loaded
            } else {
                console.error('❌ Raziel Over Under bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_RAZIEL_BOT', handleRazielBotLoad);
        window.addEventListener('message', handleRazielBotLoad);
        return () => {
            window.removeEventListener('LOAD_RAZIEL_BOT', handleRazielBotLoad);
            window.removeEventListener('message', handleRazielBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for PATEL bot loading events from Zeus AI
    useEffect(() => {
        const handlePatelBotLoad = async (event: Event) => {
            let eventData;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_PATEL_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            } = eventData;

            console.log('🎯 Received PATEL bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            });

            // Find the PATEL bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found PATEL bot, configuring with digit parameters...');

                // Parse and configure the XML with digit parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type (TYPE_LIST and PURCHASE_LIST)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction before loss (exact variable name from PATEL bot)
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionBeforeLoss.toString();
                                console.log(`🎯 Prediction before loss set to: ${predictionBeforeLoss}`);
                            }
                        }
                    }
                });

                // Update prediction after loss (exact variable name from PATEL bot)
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction after loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionAfterLoss.toString();
                                console.log(`🎯 Prediction after loss set to: ${predictionAfterLoss}`);
                            }
                        }
                    }
                });

                // Update Search Number (entry point digit - exact variable name from PATEL bot)
                variableFields.forEach(field => {
                    if (field.textContent === 'Search Number') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = entryPointDigit.toString();
                                console.log(`🎯 Search Number (Entry Point) set to: ${entryPointDigit}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Update the bot object with new XML content
                const updatedBot = {
                    ...bot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                };

                console.log('✅ PATEL bot configured, loading into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(updatedBot);
                        console.log('✅ PATEL bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading PATEL bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ PATEL bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_PATEL_BOT', handlePatelBotLoad);
        window.addEventListener('message', handlePatelBotLoad);
        return () => {
            window.removeEventListener('LOAD_PATEL_BOT', handlePatelBotLoad);
            window.removeEventListener('message', handlePatelBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for MATCHES bot load events from AI Analysis Tool
    useEffect(() => {
        const handleMatchesBotLoad = async (event: Event) => {
            let eventData: any;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_MATCHES_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
                targetDigit,
            } = eventData;

            console.log('🎲 Received MATCHES bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
                targetDigit,
            });

            // Find the MATCHES bot XML file (we'll use PATEL as template and modify it)
            const templateBot = bots.find(b => b.filePath === 'PATEL (with Entry).xml');
            if (templateBot) {
                console.log('✅ Found PATEL template, configuring for MATCHES mode...');

                // Parse and configure the XML for MATCHES mode
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(templateBot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update trade type to "matches"
                const tradeTypeFields = xmlDoc.querySelectorAll('field[name="TRADETYPE_LIST"]');
                tradeTypeFields.forEach(field => {
                    field.textContent = 'matches';
                    console.log(`🎲 Trade type set to: matches`);
                });

                // Update contract type to DIGITMATCHES
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = 'DIGITMATCHES';
                    console.log(`📝 Contract type set to: DIGITMATCHES`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = 'DIGITMATCHES';
                    console.log(`💰 Purchase type set to: DIGITMATCHES`);
                });

                // Update prediction before loss (should equal target digit)
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Prediction before loss set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Update prediction after loss (should equal target digit)
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction after loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Prediction after loss set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Update search number (entry point digit - same as target for matches)
                variableFields.forEach(field => {
                    if (field.textContent === 'Search Number') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Entry Point Digit set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Create a new bot object for MATCHES mode
                const matchesBot = {
                    ...templateBot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                    filePath: 'MATCHES (with Entry).xml', // Use MATCHES file path
                };

                console.log('✅ MATCHES bot configured, loading into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(matchesBot);
                        console.log('✅ MATCHES bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading MATCHES bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ PATEL template bot not found for MATCHES configuration');
            }
        };

        window.addEventListener('LOAD_MATCHES_BOT', handleMatchesBotLoad);
        window.addEventListener('message', handleMatchesBotLoad);
        return () => {
            window.removeEventListener('LOAD_MATCHES_BOT', handleMatchesBotLoad);
            window.removeEventListener('message', handleMatchesBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for EVEN/ODD bot loading events from Zeus AI
    useEffect(() => {
        const handleEvenOddBotLoad = async (event: Event) => {
            let eventData: any;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_EVEN_ODD_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                selectedDigit,
                entryPointDigit,
                evenOddType,
                strategy,
                stake,
                martingale,
                maxMartingaleSteps,
            } = eventData;

            console.log('⚪⚫ Received EVEN/ODD bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                selectedDigit,
                entryPointDigit,
                evenOddType,
                strategy,
            });

            // Find the CFX-EvenOdd bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found CFX-EvenOdd bot, configuring with parameters...');

                // Parse and configure the XML with even/odd parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update trade type to "digits"
                const tradeTypeFields = xmlDoc.querySelectorAll('field[name="TRADETYPE_LIST"]');
                tradeTypeFields.forEach(field => {
                    field.textContent = 'digits';
                    console.log(`⚪⚫ Trade type set to: digits`);
                });

                // Update contract type (DIGITEVEN or DIGITODD)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update stake amount if available
                const stakeFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                stakeFields.forEach(field => {
                    if (field.textContent === 'stake' || field.textContent === 'initial_stake') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField && stake) {
                                numField.textContent = stake.toString();
                                console.log(`💰 Stake set to: ${stake}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Update the bot object with new XML content
                const updatedBot = {
                    ...bot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                };

                console.log('✅ EVEN/ODD bot configured, loading into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(updatedBot);
                        console.log('✅ EVEN/ODD bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading EVEN/ODD bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ CFX-EvenOdd bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_EVEN_ODD_BOT', handleEvenOddBotLoad);
        window.addEventListener('message', handleEvenOddBotLoad);
        return () => {
            window.removeEventListener('LOAD_EVEN_ODD_BOT', handleEvenOddBotLoad);
            window.removeEventListener('message', handleEvenOddBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for auto load bot events from Advanced Algorithm
    useEffect(() => {
        const handleAutoLoadBot = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🤖 Received auto load bot request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found auto-load bot, loading directly into workspace...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    await handleBotClick(bot);
                    console.log('✅ Auto-load bot loaded successfully');
                }, 100);
            } else {
                console.error('❌ Auto-load Bot not found:', botFile);
            }
        };

        window.addEventListener('auto.load.bot', handleAutoLoadBot);
        return () => {
            window.removeEventListener('auto.load.bot', handleAutoLoadBot);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for Fibonacci bot loading events from Raziel Bot Loader
    useEffect(() => {
        const handleFibonacciBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { xmlContent, botName, market, parameters } = customEvent.detail;
            console.log('🎯 Received Fibonacci bot load request:', { botName, market, parameters });

            try {
                // Create a bot object with the configured XML
                const fibonacciBot = {
                    id: 'raziel-over-under-fibonacci',
                    filePath: 'Raziel Over Under.xml',
                    title: botName || 'Raziel Over Under (Fibonacci Configured)',
                    xmlContent: xmlContent,
                    save_type: 'LOCAL',
                };

                console.log('✅ Loading Fibonacci-configured Raziel Over Under bot...');

                // Switch to Dashboard tab (workspace) first
                setActiveTab(DBOT_TABS.DASHBOARD);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    await handleBotClick(fibonacciBot);
                    console.log('✅ Fibonacci Raziel Over Under bot loaded successfully');
                }, 300);
            } catch (error) {
                console.error('❌ Failed to load Fibonacci bot:', error);
            }
        };

        // Listen for both events
        window.addEventListener('load.fibonacci.bot', handleFibonacciBotLoad);
        window.addEventListener('load.bot.from.freebots', handleFibonacciBotLoad);

        return () => {
            window.removeEventListener('load.fibonacci.bot', handleFibonacciBotLoad);
            window.removeEventListener('load.bot.from.freebots', handleFibonacciBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for tab switching events from components
    useEffect(() => {
        const handleTabSwitch = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { tab } = customEvent.detail;
            console.log('📋 Received tab switch request to tab:', tab);

            if (typeof tab === 'number') {
                setActiveTab(tab);
            }
        };

        // Test the CFX bot loading functionality
        const testCFXBotLoading = () => {
            console.log('🧪 Testing CFX bot loading functionality...');

            const mockSignal = {
                market: '1HZ100V',
                marketName: 'Volatility 100 (1s) Index',
                currentPrice: 1234.56789,
                confidence: 85.2,
                recommendation: {
                    action: 'OVER',
                    barrier: 3,
                    reasoning: 'Strong Fibonacci support at 61.8% level with ranging market conditions.',
                },
                analysis: {
                    volatility: 0.65,
                    trendStrength: 0.25,
                    rangingScore: 0.82,
                    fibonacciAlignment: 0.91,
                },
                fibonacciLevels: [
                    { level: 0.236, price: 1230.12345, type: 'support' },
                    { level: 0.618, price: 1234.56789, type: 'resistance' },
                ],
            };

            // Simulate the CFX bot loading
            const loadEvent = new CustomEvent('load.fibonacci.bot', {
                detail: {
                    xmlContent: '<xml>test</xml>',
                    botName: 'CFX-025 Fibonacci Test',
                    market: mockSignal.market,
                    parameters: mockSignal,
                },
            });

            window.dispatchEvent(loadEvent);
            console.log('✅ CFX bot loading test event dispatched');
        };

        // Add test function to window for debugging
        if (typeof window !== 'undefined') {
            (window as any).testCFXBotLoading = testCFXBotLoading;
        }

        window.addEventListener('switch.tab', handleTabSwitch);
        return () => {
            window.removeEventListener('switch.tab', handleTabSwitch);
        };
    }, [setActiveTab]);

    // Always show run panel on all tabs
    const showRunPanel = true;

    return (
        <>
            <div className='main'>
                <div className='main__container'>
                    <Tabs
                        active_index={active_tab}
                        className='main__tabs dc-tabs--enhanced'
                        onTabItemChange={onEntered}
                        onTabItemClick={setActiveTab}
                        top
                    >
                        {/* Note: Tab order matches DBOT_TABS indices in bot-contents.ts */}
                        {/* 0. FREE BOTS TAB - Will be moved here from line 2557 */}
                        {/* 0. BOT BUILDER TAB */}
                        <div
                            label={
                                <>
                                    <BotBuilderIcon />
                                    <Localize i18n_default_text='Bot Builder' />
                                </>
                            }
                            id='id-bot-builder'
                        >
                            <Dashboard handleTabChange={setActiveTab} />
                            <button onClick={handleOpen}>Load Bot</button>
                        </div>
                        {/* 1. DASHBOARD TAB */}
                        <div
                            label={
                                <>
                                    <DashboardIcon />
                                    <Localize i18n_default_text='Dashboard' />
                                </>
                            }
                            id='id-dbot-dashboard'
                        />
                        {/* 3. CHARTS TAB */}
                        <div
                            label={
                                <>
                                    <ChartsIcon />
                                    <Localize i18n_default_text='Charts' />
                                </>
                            }
                            id='id-charts'
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        {/* 4. TUTORIALS TAB */}
                        <div
                            label={
                                <>
                                    <TutorialsIcon />
                                    <Localize i18n_default_text='Tutorials' />
                                </>
                            }
                            id='id-tutorials'
                        >
                            <Suspense
                                fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}
                            >
                                <Tutorial handleTabChange={setActiveTab} />
                            </Suspense>
                        </div>
                        {/* ANALYSIS TOOL TAB */}
                        <div
                            label={
                                <>
                                    <AnalysisToolIcon />
                                    <Localize i18n_default_text='Analysis Tool' />
                                </>
                            }
                            id='id-analysis-tool'
                        >
                            <div
                                className={classNames('dashboard__chart-wrapper', {
                                    'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                                    'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                                })}
                                style={{
                                    height: 'calc(100vh - 120px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    position: 'fixed',
                                    top: '120px',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '4px',
                                        padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                                        backdropFilter: 'blur(20px)',
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
                                        boxShadow:
                                            '0 4px 32px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* Animated background grid */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundImage: `
                                                linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
                                                linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
                                            `,
                                            backgroundSize: '20px 20px',
                                            animation: 'gridMove 20s linear infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    {/* Holographic scan line */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background:
                                                'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)',
                                            animation: 'scanLine 3s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    <button
                                        onClick={() => toggleAnalysisTool('internal')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'internal'
                                                    ? 'linear-gradient(135deg, #00ffff 0%, #0080ff 50%, #8000ff 100%)'
                                                    : 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)',
                                            color: analysisToolUrl === 'internal' ? '#000000' : '#00ffff',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'internal'
                                                    ? '1px solid #00ffff'
                                                    : '1px solid rgba(0, 255, 255, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'internal'
                                                    ? '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(0, 255, 255, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'internal') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 128, 255, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'internal') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                                                e.currentTarget.style.color = '#00ffff';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'internal' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>◉ ADVANCED</span>
                                    </button>

                                    <button
                                        onClick={() => toggleAnalysisTool('ai')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'ai'
                                                    ? 'linear-gradient(135deg, #ff0080 0%, #ff8000 50%, #ffff00 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 128, 0, 0.05) 100%)',
                                            color: analysisToolUrl === 'ai' ? '#000000' : '#ff0080',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'ai'
                                                    ? '1px solid #ff0080'
                                                    : '1px solid rgba(255, 0, 128, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'ai'
                                                    ? '0 0 20px rgba(255, 0, 128, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(255, 0, 128, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'ai') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(255, 0, 128, 0.2) 0%, rgba(255, 128, 0, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'ai') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 128, 0, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 128, 0.2)';
                                                e.currentTarget.style.color = '#ff0080';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'ai' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>⚡ ZEUS AI</span>
                                    </button>

                                    <button
                                        onClick={() => toggleAnalysisTool('ldpanalyzer')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? 'linear-gradient(135deg, #00ff00 0%, #80ff00 50%, #ffff00 100%)'
                                                    : 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(128, 255, 0, 0.05) 100%)',
                                            color: analysisToolUrl === 'ldpanalyzer' ? '#000000' : '#00ff00',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? '1px solid #00ff00'
                                                    : '1px solid rgba(0, 255, 0, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? '0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(0, 255, 0, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'ldpanalyzer') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(128, 255, 0, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'ldpanalyzer') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(128, 255, 0, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.2)';
                                                e.currentTarget.style.color = '#00ff00';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'ldpanalyzer' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>▲ LDP SCAN</span>
                                    </button>

                                    {/* Add CSS animations */}
                                    <style>
                                        {`
                                            @keyframes gridMove {
                                                0% { transform: translate(0, 0); }
                                                100% { transform: translate(20px, 20px); }
                                            }
                                            
                                            @keyframes scanLine {
                                                0% { left: -100%; }
                                                50% { left: 100%; }
                                                100% { left: -100%; }
                                            }
                                            
                                            @keyframes shimmer {
                                                0% { transform: translateX(-100%); }
                                                100% { transform: translateX(100%); }
                                            }
                                            
                                            @keyframes pulse {
                                                0%, 100% { opacity: 1; }
                                                50% { opacity: 0.7; }
                                            }
                                        `}
                                    </style>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                                    {analysisToolUrl === 'internal' ? (
                                        <div style={{ height: '100%', overflowY: 'auto', padding: '0' }}>
                                            <AnalysisTool />
                                        </div>
                                    ) : analysisToolUrl === 'ai' ? (
                                        <iframe
                                            src={analysisToolUrl}
                                            width='100%'
                                            style={{
                                                border: 'none',
                                                display: 'block',
                                                height: '100%',
                                                background: '#f8fafc',
                                            }}
                                            scrolling='yes'
                                        />
                                    ) : analysisToolUrl === 'ldpanalyzer' ? (
                                        <div
                                            style={{
                                                height: '100%',
                                                background:
                                                    'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#00ff00',
                                                fontFamily: 'monospace',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Animated background grid */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundImage: `
                                                        linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
                                                        linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)
                                                    `,
                                                    backgroundSize: '30px 30px',
                                                    animation: 'gridMove 25s linear infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />

                                            {/* Scanning lines */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20%',
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background:
                                                        'linear-gradient(90deg, transparent, #00ff00, transparent)',
                                                    animation: 'scanVertical 4s ease-in-out infinite',
                                                    boxShadow: '0 0 10px #00ff00',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '60%',
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background:
                                                        'linear-gradient(90deg, transparent, #00ff00, transparent)',
                                                    animation: 'scanVertical 4s ease-in-out infinite 2s',
                                                    boxShadow: '0 0 10px #00ff00',
                                                }}
                                            />

                                            {/* Central content */}
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    zIndex: 10,
                                                    background: 'rgba(0, 0, 0, 0.8)',
                                                    padding: '40px',
                                                    borderRadius: '0',
                                                    border: '2px solid #00ff00',
                                                    clipPath:
                                                        'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
                                                    boxShadow:
                                                        '0 0 30px rgba(0, 255, 0, 0.3), inset 0 0 30px rgba(0, 255, 0, 0.1)',
                                                    animation: 'pulse 3s ease-in-out infinite',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '48px',
                                                        marginBottom: '20px',
                                                        animation: 'rotate 10s linear infinite',
                                                    }}
                                                >
                                                    ▲
                                                </div>
                                                <h2
                                                    style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        marginBottom: '16px',
                                                        letterSpacing: '3px',
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 0 10px #00ff00',
                                                    }}
                                                >
                                                    LDP SCANNER
                                                </h2>
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        opacity: 0.8,
                                                        marginBottom: '24px',
                                                        letterSpacing: '1px',
                                                    }}
                                                >
                                                    LAST DIGIT PREDICTION ANALYSIS SYSTEM
                                                </p>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        gap: '20px',
                                                        marginBottom: '20px',
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            STATUS
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>ONLINE</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            ACCURACY
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>87.3%</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            SCANS
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>1,247</div>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '12px',
                                                        opacity: 0.6,
                                                        animation: 'blink 2s infinite',
                                                    }}
                                                >
                                                    [ INITIALIZING QUANTUM ANALYSIS ENGINE... ]
                                                </div>
                                            </div>

                                            {/* Corner decorations */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    left: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderRight: 'none',
                                                    borderBottom: 'none',
                                                    animation: 'pulse 2s infinite',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    right: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderLeft: 'none',
                                                    borderBottom: 'none',
                                                    animation: 'pulse 2s infinite 0.5s',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    left: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderRight: 'none',
                                                    borderTop: 'none',
                                                    animation: 'pulse 2s infinite 1s',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    right: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderLeft: 'none',
                                                    borderTop: 'none',
                                                    animation: 'pulse 2s infinite 1.5s',
                                                }}
                                            />

                                            {/* Additional CSS for LDP Scanner */}
                                            <style>
                                                {`
                                                    @keyframes scanVertical {
                                                        0% { top: 0%; opacity: 0; }
                                                        50% { opacity: 1; }
                                                        100% { top: 100%; opacity: 0; }
                                                    }
                                                    
                                                    @keyframes rotate {
                                                        0% { transform: rotate(0deg); }
                                                        100% { transform: rotate(360deg); }
                                                    }
                                                    
                                                    @keyframes blink {
                                                        0%, 50% { opacity: 0.6; }
                                                        51%, 100% { opacity: 0.2; }
                                                    }
                                                `}
                                            </style>
                                        </div>
                                    ) : (
                                        <iframe
                                            src={analysisToolUrl}
                                            width='100%'
                                            style={{
                                                border: 'none',
                                                display: 'block',
                                                height: '100%',
                                                background: '#f8fafc',
                                            }}
                                            scrolling='yes'
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* ZEUS ANALYSIS TAB - MOVED TO ANALYSIS TOOL */}
                        {/* SIGNALS TAB */}
                        <div
                            label={
                                <>
                                    <SignalsIcon />
                                    <Localize i18n_default_text='Signals' />
                                    <span className='tab-badge'>10</span>
                                </>
                            }
                            id='id-signals'
                        >
                            <ProtectedSignalsCenter />
                        </div>
                        {/* DTRADER TAB */}
                        <div
                            label={
                                <>
                                    <XDTraderIcon />
                                    <Localize i18n_default_text='DTrader' />
                                </>
                            }
                            id='id-xdtrader'
                        >
                            <div
                                className='xdtrader-container'
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden',
                                }}
                            >
                                <iframe
                                    src='https://deriv-dtrader.vercel.app'
                                    title='DTrader - Professional Trading Platform'
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                    }}
                                    allow='clipboard-read; clipboard-write'
                                    sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-modals'
                                />
                            </div>
                        </div>
                        {/* COPY TRADING TAB */}
                        <div
                            label={
                                <>
                                    <CopyTradingIcon />
                                    <Localize i18n_default_text='Copy Trading' />
                                </>
                            }
                            id='id-copy-trading'
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Loading Copy Trading...')} />}>
                                <CopyTradingPage />
                            </Suspense>
                        </div>
                        {/* FREE BOTS TAB */}
                        <div
                            label={
                                <>
                                    <FreeBotsIcon />
                                    <Localize i18n_default_text='Free Bots' />
                                </>
                            }
                            id='id-free-bots'
                        >
                            <div
                                className='free-bots-container'
                                style={{
                                    background: '#ffffff',
                                    position: 'fixed',
                                    top: '120px',
                                    left: 0,
                                    right: 0,
                                    bottom: '100px',
                                    width: '100%',
                                    padding: '1.5rem 2rem',
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                }}
                            >
                                {/* Social Media Icons */}
                                <div
                                    className='social-media-icons-section'
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '0.6rem',
                                        marginBottom: '1.2rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* YouTube */}
                                    <a
                                        href='https://www.youtube.com/@bonniemurigi'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#FF0000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                        </svg>
                                    </a>
                                    
                                    {/* Instagram */}
                                    <a
                                        href='https://www.instagram.com/bonnie_binary?igsh=cHAwNGJiNXoxNGo='
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                        </svg>
                                    </a>
                                    
                                    {/* WhatsApp */}
                                    <a
                                        href='https://wa.me/254799094649'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#25D366',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                    </a>
                                    
                                    {/* TikTok */}
                                    <a
                                        href='https://tiktok.com/@bonniemurigi'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#000000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                        </svg>
                                    </a>
                                    
                                    {/* Telegram */}
                                    <a
                                        href='https://t.me/Binovate'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#0088cc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                        </svg>
                                    </a>
                                </div>

                                {/* FREE BOTS SECTION */}
                                <h2
                                    style={{
                                        color: '#1f2937',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        marginBottom: '0.5rem',
                                        textAlign: 'left',
                                        flexShrink: 0,
                                    }}
                                >
                                    Bot Collection
                                </h2>
                                <p
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        marginBottom: '1.5rem',
                                        textAlign: 'left',
                                    }}
                                >
                                    Premium bots and advanced trading strategies
                                </p>
                                <div
                                    className='free-bots-grid'
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '2rem',
                                    }}
                                >
                                    {bots
                                        .filter(bot => !bot.title.includes('PREMIUM'))
                                        .map((bot, index) => {
                                            // Function to get animated SVG icon based on bot name
                                            const getBotIcon = name => {
                                                const lowerName = name.toLowerCase();
                                                
                                                // Return animated SVG based on bot name
                                                if (lowerName.includes('d strike') || lowerName.includes('strike')) {
                                                    // Black Panther kinetic energy / Vibranium inspired
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`strikeGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#a855f7" />
                                                                    <stop offset="50%" stopColor="#7c3aed" />
                                                                    <stop offset="100%" stopColor="#6366f1" />
                                                                </linearGradient>
                                                                <radialGradient id={`strikeRadial${index}`}>
                                                                    <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.8" />
                                                                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                                                                </radialGradient>
                                                            </defs>
                                                            
                                                            {/* Kinetic energy field */}
                                                            <circle cx="24" cy="24" r="20" fill={`url(#strikeRadial${index})`}>
                                                                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Outer vibranium ring */}
                                                            <circle cx="24" cy="24" r="19" stroke={`url(#strikeGrad${index})`} strokeWidth="2" fill="none" opacity="0.6">
                                                                <animate attributeName="r" values="19;20;19" dur="3s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Energy pulse rings */}
                                                            <circle cx="24" cy="24" r="16" stroke={`url(#strikeGrad${index})`} strokeWidth="1.5" fill="none" strokeDasharray="6 3">
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="24" r="13" stroke={`url(#strikeGrad${index})`} strokeWidth="1.5" fill="none" strokeDasharray="4 2">
                                                                <animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="3s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Panther claw marks / Strike pattern */}
                                                            <g opacity="0.8">
                                                                <path d="M18 12 L20 16 L18 20" stroke={`url(#strikeGrad${index})`} strokeWidth="2" strokeLinecap="round">
                                                                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
                                                                </path>
                                                                <path d="M24 10 L24 18" stroke={`url(#strikeGrad${index})`} strokeWidth="2" strokeLinecap="round">
                                                                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
                                                                </path>
                                                                <path d="M30 12 L28 16 L30 20" stroke={`url(#strikeGrad${index})`} strokeWidth="2" strokeLinecap="round">
                                                                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
                                                                </path>
                                                            </g>
                                                            
                                                            {/* Central vibranium core with D shape */}
                                                            <g>
                                                                <path d="M18 18 L18 30 L24 30 C27 30 29 28 29 24 C29 20 27 18 24 18 Z" 
                                                                    fill={`url(#strikeGrad${index})`}
                                                                >
                                                                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                                                                </path>
                                                                <path d="M20 20 L20 28 L24 28 C26 28 27 26.5 27 24 C27 21.5 26 20 24 20 Z" 
                                                                    fill="none" 
                                                                    stroke="#fff" 
                                                                    strokeWidth="1"
                                                                >
                                                                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                                                                </path>
                                                            </g>
                                                            
                                                            {/* Energy particles */}
                                                            <circle cx="12" cy="24" r="1.5" fill={`url(#strikeGrad${index})`}>
                                                                <animate attributeName="cx" values="12;36;12" dur="3s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="12" r="1.5" fill={`url(#strikeGrad${index})`}>
                                                                <animate attributeName="cy" values="12;36;12" dur="3s" begin="0.5s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.5s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="36" cy="24" r="1.5" fill={`url(#strikeGrad${index})`}>
                                                                <animate attributeName="cx" values="36;12;36" dur="3s" begin="1s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="36" r="1.5" fill={`url(#strikeGrad${index})`}>
                                                                <animate attributeName="cy" values="36;12;36" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Power surge lines */}
                                                            <line x1="24" y1="24" x2="24" y2="6" stroke={`url(#strikeGrad${index})`} strokeWidth="2" opacity="0.4">
                                                                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
                                                            </line>
                                                            <line x1="24" y1="24" x2="42" y2="24" stroke={`url(#strikeGrad${index})`} strokeWidth="2" opacity="0.4">
                                                                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                            </line>
                                                            <line x1="24" y1="24" x2="24" y2="42" stroke={`url(#strikeGrad${index})`} strokeWidth="2" opacity="0.4">
                                                                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="1s" repeatCount="indefinite" />
                                                            </line>
                                                            <line x1="24" y1="24" x2="6" y2="24" stroke={`url(#strikeGrad${index})`} strokeWidth="2" opacity="0.4">
                                                                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="1.5s" repeatCount="indefinite" />
                                                            </line>
                                                        </svg>
                                                    );
                                                } else if (lowerName.includes('magic') || lowerName.includes('recovery')) {
                                                    // Doctor Strange inspired - Mystic Arts symbol with rotating runes
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`magicGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#f59e0b" />
                                                                    <stop offset="50%" stopColor="#d97706" />
                                                                    <stop offset="100%" stopColor="#b45309" />
                                                                </linearGradient>
                                                                <radialGradient id={`magicRadial${index}`}>
                                                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                                                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                                                </radialGradient>
                                                            </defs>
                                                            
                                                            {/* Outer mystical circle */}
                                                            <circle cx="24" cy="24" r="20" stroke={`url(#magicGrad${index})`} strokeWidth="2" fill="none" opacity="0.6">
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Inner rotating runes circle */}
                                                            <circle cx="24" cy="24" r="15" stroke={`url(#magicGrad${index})`} strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="3 3">
                                                                <animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="6s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Mystical symbol - Eye of Agamotto inspired */}
                                                            <g>
                                                                <ellipse cx="24" cy="24" rx="10" ry="14" stroke={`url(#magicGrad${index})`} strokeWidth="2" fill="none">
                                                                    <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
                                                                </ellipse>
                                                                <circle cx="24" cy="24" r="6" fill={`url(#magicGrad${index})`}>
                                                                    <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
                                                                </circle>
                                                                <circle cx="24" cy="24" r="3" fill="#fff">
                                                                    <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
                                                                </circle>
                                                            </g>
                                                            
                                                            {/* Mystical particles */}
                                                            <circle cx="24" cy="8" r="1.5" fill={`url(#magicGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="40" cy="24" r="1.5" fill={`url(#magicGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="40" r="1.5" fill={`url(#magicGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="8" cy="24" r="1.5" fill={`url(#magicGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite" />
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Energy glow */}
                                                            <circle cx="24" cy="24" r="18" fill={`url(#magicRadial${index})`}>
                                                                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                                                            </circle>
                                                        </svg>
                                                    );
                                                } else if (lowerName.includes('over') && lowerName.includes('rec')) {
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`overGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#10b981" />
                                                                    <stop offset="100%" stopColor="#059669" />
                                                                </linearGradient>
                                                            </defs>
                                                            <path d="M8 32 L16 24 L24 28 L32 16 L40 20" stroke={`url(#overGrad${index})`} strokeWidth="3" fill="none" strokeLinecap="round">
                                                                <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="3s" repeatCount="indefinite" />
                                                            </path>
                                                            <circle cx="16" cy="24" r="3" fill={`url(#overGrad${index})`}>
                                                                <animate attributeName="cy" values="24;20;24" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="28" r="3" fill={`url(#overGrad${index})`}>
                                                                <animate attributeName="cy" values="28;24;28" dur="2s" begin="0.3s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="32" cy="16" r="3" fill={`url(#overGrad${index})`}>
                                                                <animate attributeName="cy" values="16;12;16" dur="2s" begin="0.6s" repeatCount="indefinite" />
                                                            </circle>
                                                        </svg>
                                                    );
                                                } else if (lowerName.includes('under 7') || lowerName.includes('under 5')) {
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`under75Grad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                                    <stop offset="100%" stopColor="#1d4ed8" />
                                                                </linearGradient>
                                                            </defs>
                                                            <text x="24" y="30" fontSize="20" fontWeight="bold" fill={`url(#under75Grad${index})`} textAnchor="middle">7</text>
                                                            <text x="24" y="30" fontSize="14" fontWeight="bold" fill={`url(#under75Grad${index})`} textAnchor="middle" opacity="0.6">
                                                                <animate attributeName="y" values="30;26;30" dur="2s" repeatCount="indefinite" />
                                                                5
                                                            </text>
                                                            <path d="M12 36 L24 12 L36 36" stroke={`url(#under75Grad${index})`} strokeWidth="2" fill="none">
                                                                <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="3s" repeatCount="indefinite" />
                                                            </path>
                                                            <circle cx="24" cy="24" r="18" stroke={`url(#under75Grad${index})`} strokeWidth="2" fill="none" opacity="0.3">
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="10s" repeatCount="indefinite" />
                                                            </circle>
                                                        </svg>
                                                    );
                                                } else if (lowerName.includes('under 8') || lowerName.includes('under 6')) {
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`under86Grad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                                    <stop offset="100%" stopColor="#6366f1" />
                                                                </linearGradient>
                                                            </defs>
                                                            <text x="24" y="30" fontSize="20" fontWeight="bold" fill={`url(#under86Grad${index})`} textAnchor="middle">8</text>
                                                            <text x="24" y="30" fontSize="14" fontWeight="bold" fill={`url(#under86Grad${index})`} textAnchor="middle" opacity="0.6">
                                                                <animate attributeName="y" values="30;26;30" dur="2s" repeatCount="indefinite" />
                                                                6
                                                            </text>
                                                            <path d="M12 36 L24 12 L36 36" stroke={`url(#under86Grad${index})`} strokeWidth="2" fill="none">
                                                                <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="3s" repeatCount="indefinite" />
                                                            </path>
                                                            <rect x="8" y="8" width="32" height="32" rx="4" stroke={`url(#under86Grad${index})`} strokeWidth="2" fill="none" opacity="0.3">
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="12s" repeatCount="indefinite" />
                                                            </rect>
                                                        </svg>
                                                    );
                                                } else if (lowerName.includes('patel')) {
                                                    // Iron Man Arc Reactor inspired
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`patelGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#60a5fa" />
                                                                    <stop offset="50%" stopColor="#3b82f6" />
                                                                    <stop offset="100%" stopColor="#2563eb" />
                                                                </linearGradient>
                                                                <radialGradient id={`patelGlow${index}`}>
                                                                    <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.8" />
                                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                                </radialGradient>
                                                            </defs>
                                                            
                                                            {/* Outer reactor ring */}
                                                            <circle cx="24" cy="24" r="20" stroke={`url(#patelGrad${index})`} strokeWidth="2" fill="none">
                                                                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Rotating energy rings */}
                                                            <circle cx="24" cy="24" r="16" stroke={`url(#patelGrad${index})`} strokeWidth="1.5" fill="none" strokeDasharray="8 4">
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="24" r="13" stroke={`url(#patelGrad${index})`} strokeWidth="1.5" fill="none" strokeDasharray="6 3">
                                                                <animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="3s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Arc reactor core triangular pattern */}
                                                            <g>
                                                                <path d="M24 14 L30 24 L24 34 L18 24 Z" fill={`url(#patelGrad${index})`} opacity="0.7">
                                                                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
                                                                </path>
                                                                <path d="M24 16 L28 24 L24 32 L20 24 Z" fill="none" stroke="#fff" strokeWidth="1">
                                                                    <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
                                                                </path>
                                                            </g>
                                                            
                                                            {/* Central core */}
                                                            <circle cx="24" cy="24" r="6" fill={`url(#patelGrad${index})`}>
                                                                <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="24" r="3" fill="#fff">
                                                                <animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Energy beams */}
                                                            <line x1="24" y1="24" x2="24" y2="8" stroke={`url(#patelGrad${index})`} strokeWidth="2" opacity="0.5">
                                                                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
                                                            </line>
                                                            <line x1="24" y1="24" x2="38" y2="24" stroke={`url(#patelGrad${index})`} strokeWidth="2" opacity="0.5">
                                                                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                            </line>
                                                            <line x1="24" y1="24" x2="24" y2="40" stroke={`url(#patelGrad${index})`} strokeWidth="2" opacity="0.5">
                                                                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
                                                            </line>
                                                            <line x1="24" y1="24" x2="10" y2="24" stroke={`url(#patelGrad${index})`} strokeWidth="2" opacity="0.5">
                                                                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="1.5s" repeatCount="indefinite" />
                                                            </line>
                                                            
                                                            {/* Glow effect */}
                                                            <circle cx="24" cy="24" r="18" fill={`url(#patelGlow${index})`}>
                                                                <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                        </svg>
                                                    );
                                                } else if (lowerName.includes('raziel')) {
                                                    // Thor's Mjolnir/Lightning inspired
                                                    return (
                                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id={`razielGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#a78bfa" />
                                                                    <stop offset="50%" stopColor="#8b5cf6" />
                                                                    <stop offset="100%" stopColor="#7c3aed" />
                                                                </linearGradient>
                                                                <radialGradient id={`razielRadial${index}`}>
                                                                    <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.8" />
                                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                                                </radialGradient>
                                                            </defs>
                                                            
                                                            {/* Energy field */}
                                                            <circle cx="24" cy="24" r="20" fill={`url(#razielRadial${index})`}>
                                                                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Outer power ring */}
                                                            <circle cx="24" cy="24" r="18" stroke={`url(#razielGrad${index})`} strokeWidth="2" fill="none" strokeDasharray="4 4">
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="6s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Lightning bolt - Mjolnir power */}
                                                            <g>
                                                                <path d="M24 8 L20 20 L26 20 L22 36 L30 22 L24 22 Z" fill={`url(#razielGrad${index})`}>
                                                                    <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
                                                                </path>
                                                                <path d="M24 8 L20 20 L26 20 L22 36 L30 22 L24 22 Z" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.6">
                                                                    <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
                                                                </path>
                                                            </g>
                                                            
                                                            {/* Energy sparks */}
                                                            <circle cx="24" cy="12" r="2" fill={`url(#razielGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
                                                                <animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="32" cy="18" r="1.5" fill={`url(#razielGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="16" cy="18" r="1.5" fill={`url(#razielGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="28" cy="32" r="1.5" fill={`url(#razielGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.9s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="20" cy="32" r="1.5" fill={`url(#razielGrad${index})`}>
                                                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="1.2s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Power core */}
                                                            <circle cx="24" cy="24" r="5" fill={`url(#razielGrad${index})`}>
                                                                <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx="24" cy="24" r="3" fill="#fff">
                                                                <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
                                                            </circle>
                                                            
                                                            {/* Rotating runes */}
                                                            <g opacity="0.6">
                                                                <text x="24" y="6" fontSize="8" fill={`url(#razielGrad${index})`} textAnchor="middle" fontWeight="bold">⚡</text>
                                                                <text x="42" y="26" fontSize="8" fill={`url(#razielGrad${index})`} textAnchor="middle" fontWeight="bold">⚡</text>
                                                                <text x="24" y="46" fontSize="8" fill={`url(#razielGrad${index})`} textAnchor="middle" fontWeight="bold">⚡</text>
                                                                <text x="6" y="26" fontSize="8" fill={`url(#razielGrad${index})`} textAnchor="middle" fontWeight="bold">⚡</text>
                                                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="10s" repeatCount="indefinite" />
                                                            </g>
                                                        </svg>
                                                    );
                                                }
                                                
                                                // Default icon
                                                return (
                                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <defs>
                                                            <linearGradient id={`defaultGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#6366f1" />
                                                                <stop offset="100%" stopColor="#4f46e5" />
                                                            </linearGradient>
                                                        </defs>
                                                        <circle cx="24" cy="24" r="18" fill={`url(#defaultGrad${index})`} opacity="0.2">
                                                            <animate attributeName="r" values="18;20;18" dur="2s" repeatCount="indefinite" />
                                                        </circle>
                                                        <rect x="16" y="16" width="16" height="16" rx="2" fill={`url(#defaultGrad${index})`}>
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="6s" repeatCount="indefinite" />
                                                        </rect>
                                                    </svg>
                                                );
                                            };

                                            // Function to get description based on bot name
                                            const getBotDescription = name => {
                                                const lowerName = name.toLowerCase();

                                                if (lowerName.includes('patel')) {
                                                    return 'Professional trading strategy with precise entry points and risk management';
                                                } else if (lowerName.includes('game changer')) {
                                                    return 'Revolutionary AI-powered strategy that adapts to market conditions';
                                                } else if (lowerName.includes('cfx')) {
                                                    return 'High-speed CFX trading with advanced pattern recognition';
                                                } else if (lowerName.includes('over') || lowerName.includes('under')) {
                                                    return 'Over/Under prediction strategy with statistical analysis';
                                                } else if (lowerName.includes('raziel')) {
                                                    return 'Divine trading strategy with heavenly accuracy';
                                                } else if (lowerName.includes('strike')) {
                                                    return 'Precision strike strategy with advanced targeting';
                                                } else if (lowerName.includes('magic') || lowerName.includes('recovery')) {
                                                    return 'Magic recovery system with loss prevention';
                                                }
                                                
                                                return 'Advanced automated trading strategy with optimized entry and exit points';
                                            };

                                            const botIcon = getBotIcon(bot.title);
                                            const description = getBotDescription(bot.title);
                                            // Generate a random success rate for demo
                                            const successRate = Math.floor(Math.random() * 20) + 80;
                                            // Determine if featured (random for demo)
                                            const isFeatured = Math.random() > 0.7;

                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => handleBotClick(bot)}
                                                    style={{
                                                        background: '#ffffff',
                                                        borderRadius: '10px',
                                                        padding: '0.9rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '0.6rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                                                        border: '1px solid #e5e7eb',
                                                        position: 'relative',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow =
                                                            '0 6px 12px rgba(0, 0, 0, 0.12)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow =
                                                            '0 2px 6px rgba(0, 0, 0, 0.08)';
                                                    }}
                                                >
                                                    {/* Bot Icon */}
                                                    <div
                                                        style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {botIcon}
                                                    </div>

                                                    {/* Bot Name */}
                                                    <h3
                                                        style={{
                                                            margin: 0,
                                                            color: '#1f2937',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            lineHeight: '1.3',
                                                            minHeight: '2.6rem',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {bot.title.replace('.xml', '')}
                                                    </h3>

                                                    {/* Combined Load Bot Bar with Success Rate */}
                                                    <div
                                                        style={{
                                                            position: 'relative',
                                                            width: '100%',
                                                            height: '32px',
                                                            borderRadius: '6px',
                                                            overflow: 'hidden',
                                                            background: '#e5e7eb',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {/* Success Rate Fill */}
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                left: 0,
                                                                top: 0,
                                                                bottom: 0,
                                                                width: `${successRate}%`,
                                                                background:
                                                                    'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                                                transition: 'width 0.3s ease',
                                                            }}
                                                        />
                                                        {/* Load Bot Text */}
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '0 0.8rem',
                                                                color: '#ffffff',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                zIndex: 1,
                                                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                                                            }}
                                                        >
                                                            <span>Load Bot</span>
                                                            <span>{successRate}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>

                                {/* PREMIUM BOTS SECTION */}
                                <h2
                                    style={{
                                        color: '#1f2937',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        marginBottom: '0.5rem',
                                        textAlign: 'left',
                                        flexShrink: 0,
                                        marginTop: '1rem',
                                    }}
                                >
                                    Premium Bots
                                </h2>
                                <p
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        marginBottom: '1.5rem',
                                        textAlign: 'left',
                                    }}
                                >
                                    Exclusive premium strategies with advanced features
                                </p>
                                <div
                                    className='premium-bots-grid'
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                        gap: '1.2rem',
                                        paddingBottom: '1.5rem',
                                    }}
                                >
                                    {[
                                        { 
                                            name: 'Novagrid 2026',
                                            xmlFile: 'NOVAGRID 2026.xml',
                                            icon: (
                                                // Supernova / Cosmic Explosion
                                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <defs>
                                                        <radialGradient id="supernovaCore">
                                                            <stop offset="0%" stopColor="#fef08a" />
                                                            <stop offset="30%" stopColor="#fbbf24" />
                                                            <stop offset="60%" stopColor="#f97316" />
                                                            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                                                        </radialGradient>
                                                        <radialGradient id="supernovaGlow">
                                                            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                                                            <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
                                                            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                                                        </radialGradient>
                                                        <linearGradient id="supernovaRay" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#fef08a" stopOpacity="0" />
                                                            <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                                                            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    
                                                    {/* Outer explosion glow */}
                                                    <circle cx="24" cy="24" r="22" fill="url(#supernovaGlow)">
                                                        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                    
                                                    {/* Expanding energy rings */}
                                                    <circle cx="24" cy="24" r="16" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.6">
                                                        <animate attributeName="r" values="16;20;16" dur="3s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
                                                    </circle>
                                                    <circle cx="24" cy="24" r="12" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.6">
                                                        <animate attributeName="r" values="12;18;12" dur="3s" begin="0.5s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" begin="0.5s" repeatCount="indefinite" />
                                                    </circle>
                                                    
                                                    {/* Explosion rays */}
                                                    <g opacity="0.8">
                                                        <line x1="24" y1="24" x2="24" y2="4" stroke="url(#supernovaRay)" strokeWidth="3" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="41" y2="10" stroke="url(#supernovaRay)" strokeWidth="2.5" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="44" y2="24" stroke="url(#supernovaRay)" strokeWidth="3" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="41" y2="38" stroke="url(#supernovaRay)" strokeWidth="2.5" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="24" y2="44" stroke="url(#supernovaRay)" strokeWidth="3" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.8s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="7" y2="38" stroke="url(#supernovaRay)" strokeWidth="2.5" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="1s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="4" y2="24" stroke="url(#supernovaRay)" strokeWidth="3" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="1.2s" repeatCount="indefinite" />
                                                        </line>
                                                        <line x1="24" y1="24" x2="7" y2="10" stroke="url(#supernovaRay)" strokeWidth="2.5" strokeLinecap="round">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="1.4s" repeatCount="indefinite" />
                                                        </line>
                                                    </g>
                                                    
                                                    {/* Core star */}
                                                    <circle cx="24" cy="24" r="10" fill="url(#supernovaCore)">
                                                        <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                    
                                                    {/* Bright center */}
                                                    <circle cx="24" cy="24" r="6" fill="#fef08a">
                                                        <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
                                                    </circle>
                                                    
                                                    {/* Energy particles */}
                                                    <circle cx="30" cy="18" r="1.5" fill="#fbbf24">
                                                        <animate attributeName="cx" values="30;36;30" dur="2s" repeatCount="indefinite" />
                                                        <animate attributeName="cy" values="18;12;18" dur="2s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                    <circle cx="18" cy="30" r="1.5" fill="#f97316">
                                                        <animate attributeName="cx" values="18;12;18" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                        <animate attributeName="cy" values="30;36;30" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="1;0;1" dur="2s" begin="0.5s" repeatCount="indefinite" />
                                                    </circle>
                                                    <circle cx="30" cy="30" r="1.5" fill="#fbbf24">
                                                        <animate attributeName="cx" values="30;38;30" dur="2s" begin="1s" repeatCount="indefinite" />
                                                        <animate attributeName="cy" values="30;38;30" dur="2s" begin="1s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="1;0;1" dur="2s" begin="1s" repeatCount="indefinite" />
                                                    </circle>
                                                </svg>
                                            ), 
                                            rate: 97,
                                            price: '$1,099',
                                            description: 'Ultimate AI-powered trading system with neural network analysis, real-time market adaptation, and premium 24/7 support'
                                        },
                                        { 
                                            name: 'Novagrid Elite',
                                            xmlFile: '🖤⚜️ 𝓣𝓱𝓮 𝓓𝓪𝓻𝓴 𝓓𝔂𝓷𝓪𝓼𝓽𝔂 ⚜️🖤2.xml',
                                            rate: 94,
                                            price: '$499',
                                            description: 'Elite trading strategy with advanced pattern recognition, precision execution, and professional-grade analytics',
                                            icon: (
                                                // Spiral Galaxy
                                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <defs>
                                                        <radialGradient id="galaxyCore">
                                                            <stop offset="0%" stopColor="#fef08a" />
                                                            <stop offset="40%" stopColor="#a78bfa" />
                                                            <stop offset="70%" stopColor="#6366f1" />
                                                            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
                                                        </radialGradient>
                                                        <linearGradient id="galaxyArm" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0" />
                                                            <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.8" />
                                                            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    
                                                    {/* Galaxy glow */}
                                                    <ellipse cx="24" cy="24" rx="20" ry="16" fill="url(#galaxyCore)" opacity="0.6">
                                                        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="20s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="4s" repeatCount="indefinite" />
                                                    </ellipse>
                                                    
                                                    {/* Spiral arms */}
                                                    <g>
                                                        <path d="M24 24 Q 32 20, 40 18 Q 42 20, 42 24" stroke="url(#galaxyArm)" strokeWidth="3" fill="none" strokeLinecap="round">
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </path>
                                                        <path d="M24 24 Q 28 28, 36 34 Q 38 36, 40 38" stroke="url(#galaxyArm)" strokeWidth="3" fill="none" strokeLinecap="round">
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </path>
                                                        <path d="M24 24 Q 20 28, 12 30 Q 8 30, 6 28" stroke="url(#galaxyArm)" strokeWidth="3" fill="none" strokeLinecap="round">
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </path>
                                                        <path d="M24 24 Q 20 16, 14 10 Q 12 8, 10 8" stroke="url(#galaxyArm)" strokeWidth="3" fill="none" strokeLinecap="round">
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </path>
                                                    </g>
                                                    
                                                    {/* Stars in spiral arms */}
                                                    <g>
                                                        <circle cx="36" cy="18" r="1" fill="#fef08a">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </circle>
                                                        <circle cx="38" cy="36" r="1.5" fill="#c4b5fd">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </circle>
                                                        <circle cx="10" cy="28" r="1" fill="#a78bfa">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </circle>
                                                        <circle cx="12" cy="10" r="1.5" fill="#fef08a">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" />
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </circle>
                                                        <circle cx="32" cy="14" r="1" fill="#c4b5fd">
                                                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.8s" repeatCount="indefinite" />
                                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="15s" repeatCount="indefinite" />
                                                        </circle>
                                                    </g>
                                                    
                                                    {/* Galactic core */}
                                                    <circle cx="24" cy="24" r="8" fill="url(#galaxyCore)">
                                                        <animate attributeName="r" values="8;9;8" dur="3s" repeatCount="indefinite" />
                                                    </circle>
                                                    
                                                    {/* Bright center */}
                                                    <circle cx="24" cy="24" r="4" fill="#fef08a">
                                                        <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                    
                                                    {/* Accretion disk */}
                                                    <ellipse cx="24" cy="24" rx="12" ry="3" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6">
                                                        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                                                    </ellipse>
                                                </svg>
                                            )
                                        },
                                    ].map((bot, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                background: '#ffffff',
                                                borderRadius: '12px',
                                                padding: '1.2rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.8rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                border: '1px solid #e5e7eb',
                                                position: 'relative',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                            }}
                                        >
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '0.8rem',
                                                    right: '0.8rem',
                                                    background: '#f97316',
                                                    color: '#ffffff',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                Premium
                                            </span>

                                            <div
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {bot.icon}
                                            </div>

                                            <h3
                                                style={{
                                                    margin: 0,
                                                    color: '#1f2937',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    lineHeight: '1.4',
                                                    minHeight: '2.8rem',
                                                }}
                                            >
                                                {bot.name}
                                            </h3>

                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    lineHeight: '1.5',
                                                    minHeight: '3rem',
                                                }}
                                            >
                                                {bot.description}
                                            </p>

                                            <div style={{ marginTop: '0.5rem' }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '0.4rem',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#6b7280',
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Success Rate
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#1f2937',
                                                            fontWeight: '600',
                                                        }}
                                                    >
                                                        {bot.rate}%
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: '6px',
                                                        background: '#e5e7eb',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${bot.rate}%`,
                                                            height: '100%',
                                                            background:
                                                                'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                                                            borderRadius: '3px',
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <p
                                                style={{
                                                    margin: '0.5rem 0 0 0',
                                                    color: '#1f2937',
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                }}
                                            >
                                                {bot.price}
                                            </p>

                                            <button
                                                onClick={() => {
                                                    setPremiumBotModal({ isOpen: true, botName: bot.name, xmlFile: bot.xmlFile });
                                                    setPremiumPassword('');
                                                }}
                                                style={{
                                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                    color: '#1f2937',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '0.7rem 1rem',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    textDecoration: 'none',
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                Access →
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Premium Bot Access Modal */}
                                {premiumBotModal.isOpen && (
                                    <div
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(0, 0, 0, 0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 10000,
                                        }}
                                        onClick={() => setPremiumBotModal({ isOpen: false, botName: '', xmlFile: '' })}
                                    >
                                        <div
                                            style={{
                                                background: '#ffffff',
                                                borderRadius: '12px',
                                                padding: '2rem',
                                                maxWidth: '400px',
                                                width: '90%',
                                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.5rem', fontWeight: '700' }}>
                                                Access {premiumBotModal.botName}
                                            </h3>
                                            
                                            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '14px' }}>
                                                Enter your access code to unlock this premium bot
                                            </p>

                                            <input
                                                type="password"
                                                placeholder="Enter access code"
                                                value={premiumPassword}
                                                onChange={(e) => setPremiumPassword(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '2px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    marginBottom: '1rem',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s',
                                                }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#fbbf24'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                                onKeyPress={async (e) => {
                                                    if (e.key === 'Enter' && premiumPassword === '6776') {
                                                        // Check if user is whitelisted for this specific bot
                                                        const hasAccess = await hasPremiumAccess(premiumBotModal.botName);
                                                        if (!hasAccess) {
                                                            alert(`Access denied. Your account is not whitelisted for ${premiumBotModal.botName}. Please contact admin for access.`);
                                                            return;
                                                        }

                                                        try {
                                                            // Fetch the XML file from public folder
                                                            const response = await fetch(`/${premiumBotModal.xmlFile}`);
                                                            if (!response.ok) {
                                                                throw new Error('Failed to load bot file');
                                                            }
                                                            const xmlContent = await response.text();
                                                            
                                                            // Create strategy object to load
                                                            const strategyToLoad = {
                                                                id: `premium_${Date.now()}`,
                                                                name: premiumBotModal.botName,
                                                                xml: xmlContent,
                                                                save_type: 'LOCAL',
                                                                timestamp: Date.now(),
                                                            };

                                                            // Load the bot into workspace
                                                            await load_modal.loadStrategyToBuilder(strategyToLoad);
                                                            
                                                            // Switch to dashboard tab
                                                            setActiveTab(DBOT_TABS.DASHBOARD);
                                                            
                                                            // Close modal and reset
                                                            setPremiumBotModal({ isOpen: false, botName: '', xmlFile: '' });
                                                            setPremiumPassword('');
                                                        } catch (error) {
                                                            console.error('Error loading premium bot:', error);
                                                            alert('Failed to load bot. Please try again or contact admin.');
                                                        }
                                                    }
                                                }}
                                            />

                                            <button
                                                onClick={async () => {
                                                    if (premiumPassword === '6776') {
                                                        // Check if user is whitelisted for this specific bot
                                                        const hasAccess = await hasPremiumAccess(premiumBotModal.botName);
                                                        if (!hasAccess) {
                                                            alert(`Access denied. Your account is not whitelisted for ${premiumBotModal.botName}. Please contact admin for access.`);
                                                            return;
                                                        }

                                                        try {
                                                            // Fetch the XML file from public folder
                                                            const response = await fetch(`/${premiumBotModal.xmlFile}`);
                                                            if (!response.ok) {
                                                                throw new Error('Failed to load bot file');
                                                            }
                                                            const xmlContent = await response.text();
                                                            
                                                            // Create strategy object to load
                                                            const strategyToLoad = {
                                                                id: `premium_${Date.now()}`,
                                                                name: premiumBotModal.botName,
                                                                xml: xmlContent,
                                                                save_type: 'LOCAL',
                                                                timestamp: Date.now(),
                                                            };

                                                            // Load the bot into workspace
                                                            await load_modal.loadStrategyToBuilder(strategyToLoad);
                                                            
                                                            // Switch to dashboard tab
                                                            setActiveTab(DBOT_TABS.DASHBOARD);
                                                            
                                                            // Close modal and reset
                                                            setPremiumBotModal({ isOpen: false, botName: '', xmlFile: '' });
                                                            setPremiumPassword('');
                                                        } catch (error) {
                                                            console.error('Error loading premium bot:', error);
                                                            alert('Failed to load bot. Please try again or contact admin.');
                                                        }
                                                    } else {
                                                        alert('Invalid access code. Please contact admin for access.');
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                    color: '#1f2937',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    marginBottom: '1rem',
                                                    transition: 'transform 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                Unlock Bot
                                            </button>

                                            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#9ca3af', fontSize: '12px' }}>
                                                OR
                                            </div>

                                            <a
                                                href="https://wa.me/254799094649"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: '#25D366',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    transition: 'transform 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                </svg>
                                                Contact Admin for Access
                                            </a>

                                            <button
                                                onClick={() => setPremiumBotModal({ isOpen: false, botName: '', xmlFile: '' })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: 'transparent',
                                                    color: '#6b7280',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    marginTop: '1rem',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <style>
                                    {`
                                        /* Responsive adjustments */
                                        @media (max-width: 768px) {
                                            .free-bots-grid,
                                            .premium-bots-grid {
                                                grid-template-columns: 1fr !important;
                                            }
                                        }
                                    `}
                                </style>
                            </div>
                        </div>

                        {/* NOVA ANALYSIS TAB */}
                        <div
                            label={
                                <>
                                    <svg
                                        width='31.2'
                                        height='31.2'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='nova-analysis-nav-icon'
                                    >
                                        <defs>
                                            <linearGradient id='novaGradNav' x1='0%' y1='0%' x2='100%' y2='100%'>
                                                <stop offset='0%' stopColor='#ffffff' />
                                                <stop offset='50%' stopColor='#fbbf24' />
                                                <stop offset='100%' stopColor='#f59e0b' />
                                            </linearGradient>
                                            <radialGradient id='novaRadialNav' cx='50%' cy='50%'>
                                                <stop offset='0%' stopColor='#fbbf24' stopOpacity='1' />
                                                <stop offset='100%' stopColor='#f59e0b' stopOpacity='0.3' />
                                            </radialGradient>
                                            <filter id='novaGlowNav'>
                                                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                                                <feMerge>
                                                    <feMergeNode in='coloredBlur'/>
                                                    <feMergeNode in='SourceGraphic'/>
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        
                                        {/* Central hexagon core */}
                                        <path 
                                            d='M12 4L16 7L16 13L12 16L8 13L8 7Z' 
                                            fill='url(#novaRadialNav)' 
                                            stroke='url(#novaGradNav)' 
                                            strokeWidth='1.5'
                                            filter='url(#novaGlowNav)'
                                        />
                                        
                                        {/* Inner energy core */}
                                        <circle cx='12' cy='10' r='2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        
                                        {/* Outer hexagonal ring */}
                                        <path 
                                            d='M12 2L18 6L18 14L12 18L6 14L6 6Z' 
                                            fill='none' 
                                            stroke='url(#novaGradNav)' 
                                            strokeWidth='1.5'
                                            opacity='0.7'
                                        />
                                        
                                        {/* Energy nodes at hexagon corners */}
                                        <circle cx='12' cy='2' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='18' cy='6' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='18' cy='14' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='12' cy='18' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='6' cy='14' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='6' cy='6' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        
                                        {/* Energy beams connecting to center */}
                                        <line x1='12' y1='2' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='18' y1='6' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='18' y1='14' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='12' y1='18' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='6' y1='14' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='6' y1='6' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        
                                        {/* Orbiting particles */}
                                        <circle cx='12' cy='6' r='0.8' fill='#ffffff' opacity='0.8' />
                                        <circle cx='15' cy='10' r='0.8' fill='#ffffff' opacity='0.8' />
                                        <circle cx='9' cy='10' r='0.8' fill='#ffffff' opacity='0.8' />
                                        
                                        <style>
                                            {`
                                                @keyframes novaRotateNav {
                                                    0% { transform: rotate(0deg); }
                                                    100% { transform: rotate(360deg); }
                                                }
                                                @keyframes novaPulseNav {
                                                    0%, 100% { opacity: 1; r: 2; }
                                                    50% { opacity: 0.6; r: 2.5; }
                                                }
                                                @keyframes nodeGlowNav {
                                                    0%, 100% { r: 1.2; opacity: 1; }
                                                    50% { r: 1.5; opacity: 0.6; }
                                                }
                                                @keyframes beamPulseNav {
                                                    0%, 100% { opacity: 0.5; }
                                                    50% { opacity: 1; }
                                                }
                                                @keyframes orbitRotateNav {
                                                    0% { transform: rotate(0deg) translateX(0); }
                                                    100% { transform: rotate(360deg) translateX(0); }
                                                }
                                                @keyframes hexagonPulseNav {
                                                    0%, 100% { opacity: 0.7; stroke-width: 1.5; }
                                                    50% { opacity: 1; stroke-width: 2; }
                                                }
                                                
                                                /* Scoped to only .nova-analysis-nav-icon */
                                                .nova-analysis-nav-icon path:nth-of-type(1) { 
                                                    animation: novaRotateNav 4s linear infinite; 
                                                    transform-origin: 12px 10px;
                                                }
                                                .nova-analysis-nav-icon path:nth-of-type(2) { 
                                                    animation: novaRotateNav 6s linear infinite reverse, hexagonPulseNav 2s ease-in-out infinite; 
                                                    transform-origin: 12px 10px;
                                                }
                                                .nova-analysis-nav-icon circle:nth-of-type(1) { 
                                                    animation: novaPulseNav 1.5s ease-in-out infinite; 
                                                }
                                                .nova-analysis-nav-icon circle:nth-of-type(2),
                                                .nova-analysis-nav-icon circle:nth-of-type(3),
                                                .nova-analysis-nav-icon circle:nth-of-type(4),
                                                .nova-analysis-nav-icon circle:nth-of-type(5),
                                                .nova-analysis-nav-icon circle:nth-of-type(6),
                                                .nova-analysis-nav-icon circle:nth-of-type(7) { 
                                                    animation: nodeGlowNav 1.5s ease-in-out infinite; 
                                                }
                                                .nova-analysis-nav-icon line { 
                                                    animation: beamPulseNav 1.5s ease-in-out infinite; 
                                                }
                                                .nova-analysis-nav-icon circle:nth-of-type(8),
                                                .nova-analysis-nav-icon circle:nth-of-type(9),
                                                .nova-analysis-nav-icon circle:nth-of-type(10) { 
                                                    animation: orbitRotateNav 3s linear infinite; 
                                                    transform-origin: 12px 10px;
                                                }
                                            `}
                                        </style>
                                    </svg>
                                    <Localize i18n_default_text='Nova Analysis' />
                                </>
                            }
                            id='id-nova-analysis'
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: 'calc(100vh - 120px)',
                                    minHeight: 'calc(100vh - 120px)',
                                    overflow: 'hidden',
                                }}
                            >
                                <iframe
                                    src='/nova/index.html'
                                    title='Nova Analysis Tool'
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        display: 'block',
                                    }}
                                />
                            </div>
                        </div>

                        {/* STATES FX ZONE TAB - MOVED TO ANALYSIS TOOL */}

                        {/* TICKSHARK TAB - MOVED TO ANALYSIS TOOL */}
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    {showRunPanel && <RunPanel />}
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog
                cancel_button_text={cancel_button_text || localize('Cancel')}
                confirm_button_text={ok_button_text || localize('Ok')}
                has_close_icon
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                title={title}
            >
                {message}
            </Dialog>
            
            {/* Admin Panel - Hidden, accessible via secret keyboard shortcut */}
            <AdminPanel 
                isOpen={isAdminPanelOpen} 
                onClose={() => setIsAdminPanelOpen(false)} 
            />
        </>
    );
});

export default AppWrapper;
