import React from 'react';
import classNames from 'classnames';

import Text from '../text/text';

export type TLoadingProps = React.HTMLProps<HTMLDivElement> & {
    is_fullscreen: boolean;
    is_slow_loading: boolean;
    status: string[];
    theme: string;
};

const Loading = ({ className, id, is_fullscreen = true, is_slow_loading, status }: Partial<TLoadingProps>) => {
    return (
        <div
            data-testid='dt_initial_loader'
            className={classNames(
                'initial-loader',
                {
                    'initial-loader--fullscreen': is_fullscreen,
                },
                className
            )}
        >
            <div id={id} className='mechanical-globe-loader'>
                <svg
                    width='200'
                    height='200'
                    viewBox='0 0 200 200'
                    xmlns='http://www.w3.org/2000/svg'
                    className='globe-svg'
                >
                    <defs>
                        {/* Blue gradients */}
                        <linearGradient id='blueGlobe' x1='0%' y1='0%' x2='100%' y2='100%'>
                            <stop offset='0%' stopColor='#1e40af' />
                            <stop offset='50%' stopColor='#3b82f6' />
                            <stop offset='100%' stopColor='#60a5fa' />
                        </linearGradient>
                        <radialGradient id='blueGlow'>
                            <stop offset='0%' stopColor='#3b82f6' stopOpacity='0.8' />
                            <stop offset='100%' stopColor='#1e3a8a' stopOpacity='0' />
                        </radialGradient>
                        <linearGradient id='mechanicalGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                            <stop offset='0%' stopColor='#60a5fa' />
                            <stop offset='50%' stopColor='#3b82f6' />
                            <stop offset='100%' stopColor='#2563eb' />
                        </linearGradient>
                    </defs>

                    {/* Outer glow effect */}
                    <circle cx='100' cy='100' r='85' fill='url(#blueGlow)' opacity='0.4'>
                        <animate attributeName='r' values='85;90;85' dur='3s' repeatCount='indefinite' />
                        <animate attributeName='opacity' values='0.3;0.5;0.3' dur='3s' repeatCount='indefinite' />
                    </circle>

                    {/* Main globe sphere */}
                    <circle cx='100' cy='100' r='60' fill='url(#blueGlobe)' opacity='0.3' />
                    <circle cx='100' cy='100' r='60' fill='none' stroke='#3b82f6' strokeWidth='2' opacity='0.6' />

                    {/* Outer mechanical ring - rotating clockwise */}
                    <g className='clockwise-rotation'>
                        {/* Outer gear ring */}
                        <circle
                            cx='100'
                            cy='100'
                            r='75'
                            fill='none'
                            stroke='url(#mechanicalGrad)'
                            strokeWidth='3'
                            opacity='0.8'
                        />

                        {/* Gear teeth on outer ring */}
                        {[...Array(24)].map((_, i) => {
                            const angle = (i * 360) / 24;
                            const x = 100 + 75 * Math.cos((angle * Math.PI) / 180);
                            const y = 100 + 75 * Math.sin((angle * Math.PI) / 180);
                            return (
                                <rect
                                    key={`outer-tooth-${i}`}
                                    x={x - 1.5}
                                    y={y - 4}
                                    width='3'
                                    height='8'
                                    fill='#3b82f6'
                                    opacity='0.7'
                                    transform={`rotate(${angle} ${x} ${y})`}
                                />
                            );
                        })}

                        {/* Mechanical connectors */}
                        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                            const x1 = 100 + 65 * Math.cos((angle * Math.PI) / 180);
                            const y1 = 100 + 65 * Math.sin((angle * Math.PI) / 180);
                            const x2 = 100 + 75 * Math.cos((angle * Math.PI) / 180);
                            const y2 = 100 + 75 * Math.sin((angle * Math.PI) / 180);
                            return (
                                <line
                                    key={`outer-connector-${i}`}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke='#60a5fa'
                                    strokeWidth='2'
                                    opacity='0.6'
                                />
                            );
                        })}

                        {/* Decorative circles on outer ring */}
                        {[0, 90, 180, 270].map((angle, i) => {
                            const x = 100 + 75 * Math.cos((angle * Math.PI) / 180);
                            const y = 100 + 75 * Math.sin((angle * Math.PI) / 180);
                            return (
                                <circle
                                    key={`outer-circle-${i}`}
                                    cx={x}
                                    cy={y}
                                    r='4'
                                    fill='#3b82f6'
                                    stroke='#60a5fa'
                                    strokeWidth='1'
                                />
                            );
                        })}
                    </g>

                    {/* Inner mechanical ring - rotating counter-clockwise */}
                    <g className='counter-clockwise-rotation'>
                        {/* Inner gear ring */}
                        <circle
                            cx='100'
                            cy='100'
                            r='50'
                            fill='none'
                            stroke='url(#mechanicalGrad)'
                            strokeWidth='2.5'
                            opacity='0.8'
                        />

                        {/* Gear teeth on inner ring */}
                        {[...Array(16)].map((_, i) => {
                            const angle = (i * 360) / 16;
                            const x = 100 + 50 * Math.cos((angle * Math.PI) / 180);
                            const y = 100 + 50 * Math.sin((angle * Math.PI) / 180);
                            return (
                                <rect
                                    key={`inner-tooth-${i}`}
                                    x={x - 1}
                                    y={y - 3}
                                    width='2'
                                    height='6'
                                    fill='#60a5fa'
                                    opacity='0.7'
                                    transform={`rotate(${angle} ${x} ${y})`}
                                />
                            );
                        })}

                        {/* Inner mechanical spokes */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                            const x1 = 100 + 30 * Math.cos((angle * Math.PI) / 180);
                            const y1 = 100 + 30 * Math.sin((angle * Math.PI) / 180);
                            const x2 = 100 + 50 * Math.cos((angle * Math.PI) / 180);
                            const y2 = 100 + 50 * Math.sin((angle * Math.PI) / 180);
                            return (
                                <line
                                    key={`inner-spoke-${i}`}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke='#3b82f6'
                                    strokeWidth='1.5'
                                    opacity='0.6'
                                />
                            );
                        })}

                        {/* Decorative hexagons */}
                        {[30, 150, 270].map((angle, i) => {
                            const x = 100 + 50 * Math.cos((angle * Math.PI) / 180);
                            const y = 100 + 50 * Math.sin((angle * Math.PI) / 180);
                            return (
                                <polygon
                                    key={`hexagon-${i}`}
                                    points={`${x},${y - 3} ${x + 2.6},${y - 1.5} ${x + 2.6},${y + 1.5} ${x},${y + 3} ${x - 2.6},${y + 1.5} ${x - 2.6},${y - 1.5}`}
                                    fill='none'
                                    stroke='#60a5fa'
                                    strokeWidth='1'
                                    opacity='0.8'
                                />
                            );
                        })}
                    </g>

                    {/* Globe latitude/longitude lines */}
                    <g opacity='0.4'>
                        <ellipse cx='100' cy='100' rx='60' ry='15' fill='none' stroke='#60a5fa' strokeWidth='1' />
                        <ellipse cx='100' cy='100' rx='60' ry='30' fill='none' stroke='#60a5fa' strokeWidth='1' />
                        <ellipse cx='100' cy='100' rx='60' ry='45' fill='none' stroke='#60a5fa' strokeWidth='1' />
                        <ellipse cx='100' cy='100' rx='15' ry='60' fill='none' stroke='#3b82f6' strokeWidth='1' />
                        <ellipse cx='100' cy='100' rx='30' ry='60' fill='none' stroke='#3b82f6' strokeWidth='1' />
                        <ellipse cx='100' cy='100' rx='45' ry='60' fill='none' stroke='#3b82f6' strokeWidth='1' />
                    </g>

                    {/* Central core with pulsing effect */}
                    <circle cx='100' cy='100' r='20' fill='url(#blueGlobe)' opacity='0.6'>
                        <animate attributeName='r' values='20;22;20' dur='2s' repeatCount='indefinite' />
                        <animate attributeName='opacity' values='0.5;0.8;0.5' dur='2s' repeatCount='indefinite' />
                    </circle>
                    <circle cx='100' cy='100' r='15' fill='#1e40af' opacity='0.8'>
                        <animate attributeName='r' values='15;17;15' dur='2s' repeatCount='indefinite' />
                    </circle>
                    <circle cx='100' cy='100' r='8' fill='#60a5fa'>
                        <animate attributeName='opacity' values='0.8;1;0.8' dur='1.5s' repeatCount='indefinite' />
                    </circle>

                    {/* Orbiting data points */}
                    <g className='orbit-animation'>
                        <circle cx='100' cy='40' r='3' fill='#60a5fa' opacity='0.9' />
                        <circle cx='160' cy='100' r='3' fill='#3b82f6' opacity='0.9' />
                        <circle cx='100' cy='160' r='3' fill='#2563eb' opacity='0.9' />
                        <circle cx='40' cy='100' r='3' fill='#1e40af' opacity='0.9' />
                    </g>
                </svg>
            </div>
            {is_slow_loading &&
                status?.map((text, inx) => (
                    <Text as='h3' color='prominent' size='xs' align='center' key={inx}>
                        {text}
                    </Text>
                ))}
            <style>{`
                .mechanical-globe-loader {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 2rem 0;
                }
                
                .globe-svg {
                    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.4));
                }
                
                .clockwise-rotation {
                    animation: rotate-clockwise 8s linear infinite;
                    transform-origin: 100px 100px;
                }
                
                .counter-clockwise-rotation {
                    animation: rotate-counter-clockwise 6s linear infinite;
                    transform-origin: 100px 100px;
                }
                
                .orbit-animation {
                    animation: rotate-clockwise 10s linear infinite;
                    transform-origin: 100px 100px;
                }
                
                @keyframes rotate-clockwise {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                @keyframes rotate-counter-clockwise {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(-360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default Loading;
