import React from 'react';
import './nova-analysis-page.scss';

const NovaAnalysisPage: React.FC = () => {
    return (
        <div className='nova-analysis-page'>
            <iframe
                src='/nova/index.html'
                title='Nova Analysis Tool'
                className='nova-iframe'
                style={{
                    width: '100%',
                    height: '100vh',
                    border: 'none',
                    display: 'block',
                }}
            />
        </div>
    );
};

export default NovaAnalysisPage;
