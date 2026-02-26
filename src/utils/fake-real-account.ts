/**
 * Fake Real Account Utilities
 * Handles custom transaction IDs and account messages for fake real mode
 */

/**
 * Check if fake real mode is active
 */
export const isFakeRealMode = (): boolean => {
    return localStorage.getItem('demo_icon_us_flag') === 'true';
};

/**
 * Generate a static transaction ID for fake real mode based on original demo ID
 * Format: 1461[XXXXXXX1] where XXXXXXX1 is derived from the original transaction ID and always ends with 1
 */
export const generateStaticTransactionId = (originalId: string): string => {
    // Create a consistent hash from the original ID
    let hash = 0;
    for (let i = 0; i < originalId.length; i++) {
        const char = originalId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Ensure positive number and map to range 1000000-9999999 (7 digits)
    const positiveHash = Math.abs(hash);
    const baseNumber = 1000000;
    const range = 8999999; // 9999999 - 1000000
    const mappedNumber = baseNumber + (positiveHash % (range + 1));

    // Ensure it's always 7 digits
    const paddedDigits = mappedNumber.toString().padStart(7, '0');

    // Construct the full ID: 1461 + [7 consistent digits] + 1 (fixed last digit)
    return `1461${paddedDigits}1`;
};

/**
 * Transform transaction ID for display in fake real mode
 * If fake real mode is active and account starts with 6, replace with static generated ID
 */
export const transformTransactionId = (originalId: string | number): string => {
    if (!isFakeRealMode()) {
        return String(originalId);
    }

    const idStr = String(originalId);

    // Check if this looks like a demo account transaction ID (starts with 6)
    if (idStr.startsWith('6')) {
        return generateStaticTransactionId(idStr);
    }

    return idStr;
};

/**
 * Transform currency display for fake real mode
 * In fake real mode, show "USD" instead of "Demo" or currency name
 */
export const transformCurrencyDisplay = (originalCurrency: string): string => {
    if (!isFakeRealMode()) {
        return originalCurrency;
    }

    // In fake real mode, always show "USD" for the account message
    if (originalCurrency === 'Demo' || originalCurrency === 'demo') {
        return 'USD';
    }

    return originalCurrency;
};

/**
 * Get custom account message for fake real mode
 */
export const getCustomAccountMessage = (originalCurrency: string): string => {
    if (!isFakeRealMode()) {
        return `You are using your ${originalCurrency} account.`;
    }

    // In fake real mode, always show "You are using your USD account."
    return 'You are using your USD account.';
};
