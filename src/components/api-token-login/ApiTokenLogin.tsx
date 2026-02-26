import React, { useState } from 'react';
import Button from '@/components/shared_ui/button';
import Modal from '@/components/shared_ui/modal';
import { Localize, useTranslations } from '@deriv-com/translations';
import './ApiTokenLogin.scss';

interface ApiTokenLoginProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (token: string) => Promise<void>;
}

export const ApiTokenLogin: React.FC<ApiTokenLoginProps> = ({ isOpen, onClose, onLogin }) => {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { localize } = useTranslations();

    const handleLogin = async () => {
        if (!token.trim()) {
            setError('Please enter your API token');
            return;
        }

        // Validate token format (Deriv tokens are alphanumeric)
        if (!/^[A-Za-z0-9_-]+$/.test(token)) {
            setError('Invalid token format');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onLogin(token);
            setToken('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please check your token.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setToken('');
        setError('');
        onClose();
    };

    return (
        <Modal
            is_open={isOpen}
            toggleModal={handleClose}
            title={localize('Login with API Token')}
            className='api-token-login-modal'
        >
            <div className='api-token-login'>
                <div className='api-token-login__info'>
                    <p>
                        <Localize i18n_default_text='Enter your Deriv API token to login and start trading.' />
                    </p>
                    <p className='api-token-login__info-note'>
                        <Localize i18n_default_text="Don't have a token?" />{' '}
                        <a
                            href='https://app.deriv.com/account/api-token'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='api-token-login__link'
                        >
                            <Localize i18n_default_text='Create one here' />
                        </a>
                    </p>
                </div>

                <div className='api-token-login__form'>
                    <label htmlFor='api-token-input' className='api-token-login__label'>
                        <Localize i18n_default_text='API Token' />
                    </label>
                    <input
                        id='api-token-input'
                        type='password'
                        value={token}
                        onChange={e => {
                            setToken(e.target.value);
                            setError('');
                        }}
                        placeholder='Enter your API token'
                        className='api-token-login__input'
                        disabled={isLoading}
                        onKeyPress={e => {
                            if (e.key === 'Enter') {
                                handleLogin();
                            }
                        }}
                    />
                    {error && <div className='api-token-login__error'>{error}</div>}
                </div>

                <div className='api-token-login__actions'>
                    <Button tertiary onClick={handleClose} disabled={isLoading}>
                        <Localize i18n_default_text='Cancel' />
                    </Button>
                    <Button primary onClick={handleLogin} disabled={isLoading || !token.trim()}>
                        {isLoading ? <Localize i18n_default_text='Logging in...' /> : <Localize i18n_default_text='Login' />}
                    </Button>
                </div>

                <div className='api-token-login__security'>
                    <p className='api-token-login__security-note'>
                        🔒 <Localize i18n_default_text='Your token is stored securely and never shared.' />
                    </p>
                </div>
            </div>
        </Modal>
    );
};
