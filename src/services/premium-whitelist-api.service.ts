/**
 * Premium Whitelist API Service
 * Handles communication with the backend API for managing premium bot access
 */

const API_BASE_URL = '/api/premium-whitelist';
const ADMIN_PASSWORD = 'novaprime_admin_2024'; // Should match .env ADMIN_API_PASSWORD

export interface WhitelistResponse {
    premiumAccounts: string[];
    lastUpdated: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
    premiumAccounts?: string[];
    error?: string;
}

/**
 * Fetch the current premium whitelist
 */
export const fetchWhitelist = async (): Promise<string[]> => {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch whitelist');
        }
        const data: WhitelistResponse = await response.json();
        return data.premiumAccounts || [];
    } catch (error) {
        console.error('Error fetching whitelist:', error);
        return [];
    }
};

/**
 * Add an account to the premium whitelist
 */
export const addToWhitelist = async (account: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_PASSWORD}`,
            },
            body: JSON.stringify({ account }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.error || 'Failed to add account',
            };
        }

        return {
            success: true,
            message: data.message,
            premiumAccounts: data.premiumAccounts,
        };
    } catch (error) {
        console.error('Error adding to whitelist:', error);
        return {
            success: false,
            message: 'Network error. Please try again.',
        };
    }
};

/**
 * Remove an account from the premium whitelist
 */
export const removeFromWhitelist = async (account: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_PASSWORD}`,
            },
            body: JSON.stringify({ account }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.error || 'Failed to remove account',
            };
        }

        return {
            success: true,
            message: data.message,
            premiumAccounts: data.premiumAccounts,
        };
    } catch (error) {
        console.error('Error removing from whitelist:', error);
        return {
            success: false,
            message: 'Network error. Please try again.',
        };
    }
};
