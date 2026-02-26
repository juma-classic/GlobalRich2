import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage (will be replaced with a database in production)
// For now, we'll use environment variables to store the whitelist
let premiumAccounts: string[] = [];

// Initialize from environment variable
const initializeWhitelist = () => {
    const envWhitelist = process.env.PREMIUM_WHITELIST;
    if (envWhitelist) {
        try {
            premiumAccounts = JSON.parse(envWhitelist);
        } catch (error) {
            console.error('Error parsing PREMIUM_WHITELIST:', error);
            premiumAccounts = [];
        }
    }
};

// Admin password for API access
const ADMIN_PASSWORD = process.env.ADMIN_API_PASSWORD || 'novaprime_admin_2024';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Initialize whitelist
    initializeWhitelist();

    // GET - Fetch whitelist
    if (req.method === 'GET') {
        return res.status(200).json({
            premiumAccounts,
            lastUpdated: new Date().toISOString(),
        });
    }

    // Verify admin password for write operations
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // POST - Add account
    if (req.method === 'POST') {
        const { account } = req.body;

        if (!account || typeof account !== 'string') {
            return res.status(400).json({ error: 'Invalid account number' });
        }

        const trimmed = account.trim().toUpperCase();

        // Validate format
        if (!trimmed.match(/^(CR|VRTC)\d+$/)) {
            return res.status(400).json({ error: 'Invalid format. Use CR##### or VRTC#####' });
        }

        if (premiumAccounts.includes(trimmed)) {
            return res.status(400).json({ error: 'Account already in whitelist' });
        }

        premiumAccounts.push(trimmed);

        return res.status(200).json({
            success: true,
            message: 'Account added successfully',
            premiumAccounts,
        });
    }

    // DELETE - Remove account
    if (req.method === 'DELETE') {
        const { account } = req.body;

        if (!account || typeof account !== 'string') {
            return res.status(400).json({ error: 'Invalid account number' });
        }

        const trimmed = account.trim().toUpperCase();

        if (!premiumAccounts.includes(trimmed)) {
            return res.status(404).json({ error: 'Account not found in whitelist' });
        }

        premiumAccounts = premiumAccounts.filter(acc => acc !== trimmed);

        return res.status(200).json({
            success: true,
            message: 'Account removed successfully',
            premiumAccounts,
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
