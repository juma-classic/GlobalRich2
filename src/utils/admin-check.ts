/**
 * Admin Check Utility
 * Determines if the current user has admin access
 */

/**
 * Get the list of admin account identifiers from localStorage
 * @returns Array of admin account IDs
 */
const getAdminAccounts = (): string[] => {
    try {
        const stored = localStorage.getItem('novaprime_admin_accounts');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Default admin accounts if none are stored
        const defaultAdmins = [
            'CR5186289',
            'VRTC90460',
            'VRTC10463082',
            'CR7005911',
            'CR2371589',
            'VRTC4143924',
        ];
        
        // Initialize localStorage with defaults
        localStorage.setItem('novaprime_admin_accounts', JSON.stringify(defaultAdmins));
        return defaultAdmins;
    } catch (error) {
        console.error('Error getting admin accounts:', error);
        return [];
    }
};

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export const isAdmin = (): boolean => {
    try {
        const ADMIN_IDENTIFIERS = getAdminAccounts();
        
        // Check localStorage for user info
        const clientAccounts = localStorage.getItem('client.accounts');
        const activeLoginId = localStorage.getItem('active_loginid');

        if (activeLoginId && ADMIN_IDENTIFIERS.includes(activeLoginId)) {
            return true;
        }

        // Check if any account matches admin identifiers
        if (clientAccounts) {
            const accounts = JSON.parse(clientAccounts);
            const accountIds = Object.keys(accounts);

            for (const id of accountIds) {
                if (ADMIN_IDENTIFIERS.includes(id)) {
                    return true;
                }

                // Check email
                const account = accounts[id];
                if (account?.email && ADMIN_IDENTIFIERS.includes(account.email)) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Get current user's login ID
 * @returns login ID or null
 */
export const getCurrentLoginId = (): string | null => {
    try {
        return localStorage.getItem('active_loginid');
    } catch (error) {
        console.error('Error getting login ID:', error);
        return null;
    }
};
