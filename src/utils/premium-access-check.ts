/**
 * Check if a user has premium bot access for a specific bot
 * User must be whitelisted in the premium-whitelist.json file for that specific bot
 */
export const hasPremiumAccess = async (botName: string): Promise<boolean> => {
    try {
        // Get current user's account ID
        const activeLoginId = localStorage.getItem('active_loginid');
        
        if (!activeLoginId) {
            console.log('No active login ID found');
            return false;
        }

        // Fetch the whitelist from JSON file
        const response = await fetch('/premium-whitelist.json');
        if (!response.ok) {
            console.error('Failed to fetch premium whitelist');
            return false;
        }

        const data = await response.json();
        
        // Determine which bot's whitelist to check
        let whitelist: string[] = [];
        if (botName === 'Novagrid 2026') {
            whitelist = data.novagrid2026 || [];
        } else if (botName === 'Novagrid Elite') {
            whitelist = data.novagridElite || [];
        }
        
        // Check if current user's account is in the whitelist
        const hasAccess = whitelist.includes(activeLoginId);
        console.log(`Premium access check for ${botName} - Account: ${activeLoginId}:`, hasAccess ? '✅ GRANTED' : '❌ DENIED');
        console.log(`${botName} whitelist:`, whitelist);
        
        return hasAccess;
    } catch (error) {
        console.error('Error checking premium access:', error);
        return false;
    }
};

/**
 * Get the current user's account ID
 */
export const getCurrentAccountId = (): string | null => {
    try {
        const activeLoginId = localStorage.getItem('active_loginid');
        return activeLoginId;
    } catch (error) {
        console.error('Error getting current account ID:', error);
        return null;
    }
};

/**
 * Fetch the current premium whitelist from JSON file
 */
export const getPremiumWhitelist = async (): Promise<{ novagrid2026: string[], novagridElite: string[] }> => {
    try {
        const response = await fetch('/premium-whitelist.json');
        if (!response.ok) {
            console.error('Failed to fetch premium whitelist');
            return { novagrid2026: [], novagridElite: [] };
        }

        const data = await response.json();
        return {
            novagrid2026: data.novagrid2026 || [],
            novagridElite: data.novagridElite || []
        };
    } catch (error) {
        console.error('Error fetching premium whitelist:', error);
        return { novagrid2026: [], novagridElite: [] };
    }
};
