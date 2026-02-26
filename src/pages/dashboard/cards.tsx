//kept sometihings commented beacuse of mobx to integrate popup functionality here
import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import Text from '@/components/shared_ui/text';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { useNavigate } from 'react-router-dom';
import {
    DerivLightBotBuilderIcon,
    DerivLightGoogleDriveIcon,
    DerivLightLocalDeviceIcon,
    DerivLightMyComputerIcon,
    DerivLightQuickStrategyIcon,
} from '@deriv/quill-icons/Illustration';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { rudderStackSendOpenEvent } from '../../analytics/rudderstack-common-events';
import { rudderStackSendDashboardClickEvent } from '../../analytics/rudderstack-dashboard';
import DashboardBotList from './bot-list/dashboard-bot-list';

type TCardProps = {
    has_dashboard_strategies: boolean;
    is_mobile: boolean;
};

type TCardArray = {
    id: string;
    icon: React.ReactElement;
    content: React.ReactElement;
    callback: () => void;
    longPressHandlers?: {
        onMouseDown?: (e: React.MouseEvent) => void;
        onMouseUp?: (e: React.MouseEvent) => void;
        onMouseLeave?: (e: React.MouseEvent) => void;
        onTouchStart?: (e: React.TouchEvent) => void;
        onTouchEnd?: (e: React.TouchEvent) => void;
    };
};

// Speed Bot Icon Component
const SpeedBotIcon: React.FC<{ height?: string; width?: string }> = ({ height = '48px', width = '48px' }) => (
    <svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
        <defs>
            <linearGradient id='speedBotGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ff6b6b' />
                <stop offset='100%' stopColor='#ee5a24' />
            </linearGradient>
        </defs>
        <circle cx='24' cy='24' r='20' fill='url(#speedBotGradient)' />
        <path d='M24 8L26.18 20.52L40 22L26.18 23.48L24 36L21.82 23.48L8 22L21.82 20.52L24 8Z' fill='white' />
        <circle cx='38' cy='10' r='4' fill='#ffa502' />
        <circle cx='10' cy='38' r='4' fill='#ffa502' />
        <path
            d='M32 16L33.09 19.26L37 20L33.09 20.74L32 24L30.91 20.74L27 20L30.91 19.26L32 16Z'
            fill='white'
            opacity='0.8'
        />
    </svg>
);

const Cards = observer(({ is_mobile, has_dashboard_strategies }: TCardProps) => {
    const { dashboard, load_modal, quick_strategy } = useStore();
    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { isDesktop } = useDevice();
    const { onCloseDialog, dialog_options, is_dialog_open, setActiveTab, setPreviewOnPopup } = dashboard;
    const { setFormVisibility } = quick_strategy;
    const navigate = useNavigate();

    // Secret admin mode state
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [isFakeRealModeActive, setIsFakeRealModeActive] = useState(
        localStorage.getItem('demo_icon_us_flag') === 'true'
    );
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    // Update fake real mode status on component mount and when localStorage changes
    useEffect(() => {
        const checkFakeRealMode = () => {
            const isActive = localStorage.getItem('demo_icon_us_flag') === 'true';
            setIsFakeRealModeActive(isActive);
        };

        // Check initial state
        checkFakeRealMode();

        // Listen for storage changes (in case changed from another tab)
        window.addEventListener('storage', checkFakeRealMode);
        
        return () => {
            window.removeEventListener('storage', checkFakeRealMode);
        };
    }, []);
    // Handle long press start
    const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        console.log('🖱️ Long press started');
        isLongPressRef.current = false;
        setIsLongPressing(true);
        
        longPressTimeoutRef.current = setTimeout(() => {
            // Long press detected after 2 seconds - toggle fake real mode silently
            isLongPressRef.current = true;
            setIsLongPressing(false);
            
            console.log('🔍 Long press detected! Current fake mode status:', isFakeRealModeActive);
            
            if (isFakeRealModeActive) {
                // Deactivate fake real mode silently
                localStorage.removeItem('demo_icon_us_flag');
                console.log('🔓 Fake Real Mode Deactivated!');
                console.log('🔍 localStorage after removal:', localStorage.getItem('demo_icon_us_flag'));
            } else {
                // Activate fake real mode silently
                localStorage.setItem('demo_icon_us_flag', 'true');
                console.log('🎭 Fake Real Mode Activated!');
                console.log('🔍 localStorage after setting:', localStorage.getItem('demo_icon_us_flag'));
            }
            
            // Update state immediately before refresh
            setIsFakeRealModeActive(!isFakeRealModeActive);
            
            // Refresh the page to apply changes
            console.log('🔄 Refreshing page to apply changes...');
            window.location.reload();
        }, 2000);
    };

    // Handle long press end
    const handleLongPressEnd = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        console.log('🖱️ Long press ended, was long press:', isLongPressRef.current);
        setIsLongPressing(false);
        
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
        
        // If it wasn't a long press, perform normal click action
        if (!isLongPressRef.current) {
            console.log('👆 Normal click detected, opening Bot Builder');
            setTimeout(() => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                rudderStackSendDashboardClickEvent({
                    subpage_name: 'bot_builder',
                });
            }, 50); // Small delay to ensure long press check is complete
        }
        
        isLongPressRef.current = false;
    };

    // Handle normal bot builder click (fallback)
    const handleBotBuilderClick = () => {
        // This is now handled by the long press logic
        // But keep as fallback for any edge cases
        if (!isLongPressRef.current) {
            setActiveTab(DBOT_TABS.BOT_BUILDER);
            rudderStackSendDashboardClickEvent({
                subpage_name: 'bot_builder',
            });
        }
    };

    const openGoogleDriveDialog = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 1 : 2);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 0 : 1);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const actions: TCardArray[] = [
        {
            id: 'my-computer',
            icon: is_mobile ? (
                <DerivLightLocalDeviceIcon height='48px' width='48px' />
            ) : (
                <DerivLightMyComputerIcon height='48px' width='48px' />
            ),
            content: is_mobile ? <Localize i18n_default_text='Local' /> : <Localize i18n_default_text='My computer' />,
            callback: () => {
                openFileLoader();
                rudderStackSendOpenEvent({
                    subpage_name: 'bot_builder',
                    subform_source: 'dashboard',
                    subform_name: 'quick_strategy',
                });
            },
        },
        {
            id: 'google-drive',
            icon: <DerivLightGoogleDriveIcon height='48px' width='48px' />,
            content: <Localize i18n_default_text='Google Drive' />,
            callback: () => {
                openGoogleDriveDialog();
                rudderStackSendOpenEvent({
                    subpage_name: 'bot_builder',
                    subform_source: 'dashboard',
                    subform_name: 'quick_strategy',
                });
            },
        },
        {
            id: 'bot-builder',
            icon: (
                <div style={{ position: 'relative' }}>
                    <DerivLightBotBuilderIcon 
                        height='48px' 
                        width='48px' 
                        style={{
                            transition: 'all 0.3s ease',
                            transform: isLongPressing ? 'scale(1.1)' : 'scale(1)',
                            filter: isLongPressing ? 'brightness(1.2)' : 'brightness(1)',
                        }}
                    />
                    {isFakeRealModeActive && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#00ff00',
                                borderRadius: '50%',
                                border: '2px solid #fff',
                                boxShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
                                animation: 'pulse 2s infinite',
                            }}
                            title="Fake Real Mode Active"
                        />
                    )}
                    {isLongPressing && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '60px',
                                height: '60px',
                                border: '3px solid #ff6b35',
                                borderRadius: '50%',
                                borderTop: '3px solid transparent',
                                animation: 'longPressSpinner 2s linear',
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </div>
            ),
            content: <Localize i18n_default_text='Bot builder' />,
            callback: handleBotBuilderClick,
            longPressHandlers: {
                onMouseDown: handleLongPressStart,
                onMouseUp: handleLongPressEnd,
                onMouseLeave: handleLongPressEnd,
                onTouchStart: handleLongPressStart,
                onTouchEnd: handleLongPressEnd,
            },
        },
        {
            id: 'quick-strategy',
            icon: <DerivLightQuickStrategyIcon height='48px' width='48px' />,
            content: <Localize i18n_default_text='Quick strategy' />,
            callback: () => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                setFormVisibility(true);
                rudderStackSendOpenEvent({
                    subpage_name: 'bot_builder',
                    subform_source: 'dashboard',
                    subform_name: 'quick_strategy',
                });
            },
        },
        {
            id: 'speed-bot',
            icon: <SpeedBotIcon height='48px' width='48px' />,
            content: <Localize i18n_default_text='Speed Bot' />,
            callback: () => {
                navigate('/speed-bot');
                rudderStackSendOpenEvent({
                    subpage_name: 'dashboard',
                    subform_source: 'dashboard',
                    subform_name: 'quick_strategy',
                });
            },
        },
    ];

    return React.useMemo(
        () => (
            <>
                <style>
                    {`
                        @keyframes pulse {
                            0% {
                                transform: scale(1);
                                opacity: 1;
                            }
                            50% {
                                transform: scale(1.2);
                                opacity: 0.7;
                            }
                            100% {
                                transform: scale(1);
                                opacity: 1;
                            }
                        }
                        
                        @keyframes longPressSpinner {
                            0% {
                                transform: translate(-50%, -50%) rotate(0deg);
                                border-top-color: #ff6b35;
                            }
                            25% {
                                border-top-color: #ffa502;
                            }
                            50% {
                                border-top-color: #ff6348;
                            }
                            75% {
                                border-top-color: #ff9ff3;
                            }
                            100% {
                                transform: translate(-50%, -50%) rotate(360deg);
                                border-top-color: #ff6b35;
                            }
                        }
                    `}
                </style>
                <div
                    className={classNames('tab__dashboard__table', {
                        'tab__dashboard__table--minimized': has_dashboard_strategies && is_mobile,
                    })}
                >
                <div
                    className={classNames('tab__dashboard__table__tiles', {
                        'tab__dashboard__table__tiles--minimized': has_dashboard_strategies && is_mobile,
                    })}
                    id='tab__dashboard__table__tiles'
                >
                    {actions.map(icons => {
                        const { icon, content, callback, id, longPressHandlers } = icons;
                        return (
                            <div
                                key={id}
                                className={classNames('tab__dashboard__table__block', {
                                    'tab__dashboard__table__block--minimized': has_dashboard_strategies && is_mobile,
                                })}
                            >
                                <div
                                    className={classNames('tab__dashboard__table__images', {
                                        'tab__dashboard__table__images--minimized': has_dashboard_strategies,
                                    })}
                                    id={id}
                                    onClick={longPressHandlers ? undefined : () => callback()}
                                    {...(longPressHandlers || {})}
                                    style={{
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {icon}
                                </div>
                                <Text color='prominent' size={is_mobile ? 'xxs' : 'xs'}>
                                    {content}
                                </Text>
                            </div>
                        );
                    })}

                    {!isDesktop ? (
                        <>
                            <Dialog
                                title={dialog_options.title}
                                is_visible={is_dialog_open}
                                onCancel={onCloseDialog}
                                onConfirm={onCloseDialog}
                                is_mobile_full_width
                                className='dc-dialog__wrapper--google-drive'
                                has_close_icon
                            >
                                <GoogleDrive />
                            </Dialog>
                        </>
                    ) : (
                        <>
                            <MobileFullPageModal
                                is_modal_open={is_dialog_open}
                                className='load-strategy__wrapper'
                                header={localize('Load strategy')}
                                onClickClose={() => {
                                    setPreviewOnPopup(false);
                                    onCloseDialog();
                                }}
                                height_offset='80px'
                            >
                                <div label='Google Drive' className='google-drive-label'>
                                    <GoogleDrive />
                                </div>
                            </MobileFullPageModal>
                        </>
                    )}
                </div>
                <DashboardBotList />
            </div>
            </>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [is_dialog_open, has_dashboard_strategies, isLongPressing, isFakeRealModeActive]
    );
});

export default Cards;
