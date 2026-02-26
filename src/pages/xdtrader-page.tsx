import React from 'react';
import './xdtrader-page.scss';

const XDTraderPage: React.FC = () => {
    return (
        <div className='xdtrader-page'>
            <iframe
                src='https://deriv-dtrader.vercel.app'
                title='xDTrader - Professional Trading Platform'
                className='xdtrader-iframe'
                allow='clipboard-read; clipboard-write'
                sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-modals'
            />
        </div>
    );
};

export default XDTraderPage;
