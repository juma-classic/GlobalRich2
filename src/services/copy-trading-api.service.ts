/**
 * Copy Trading API Service
 * Handles Deriv API copy trading functionality
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';

export interface CopyTradingConfig {
    traderTokens: string[]; // API tokens of traders to copy
    assets?: string[]; // Optional: specific assets to copy
    minTradeStake?: number;
    maxTradeStake?: number;
    tradeTypes?: string[]; // e.g., ["CALL", "PUT"]
}

export interface CopyTradingStatus {
    isActive: boolean;
    traderTokens: string[];
    copiedTrades: number;
    totalProfit: number;
}

class CopyTradingAPIService {
    private isActive = false;
    private config: CopyTradingConfig | null = null;
    private copiedTrades = 0;
    private totalProfit = 0;

    /**
     * Start copy trading
     */
    async startCopyTrading(config: CopyTradingConfig): Promise<{ success: boolean; message?: string }> {
        try {
            if (!api_base.api) {
                return { success: false, message: 'API not connected. Please login first.' };
            }

            // Validate trader tokens
            if (!config.traderTokens || config.traderTokens.length === 0) {
                return { success: false, message: 'No trader tokens provided' };
            }

            console.log('🔗 Starting copy trading with config:', config);

            // Build the request payload
            const payload: any = {
                copy_start: config.traderTokens.join(','),
            };

            // Add optional parameters only if they have values
            if (config.assets && config.assets.length > 0) {
                payload.assets = config.assets;
            }
            if (config.minTradeStake !== undefined && config.minTradeStake > 0) {
                payload.min_trade_stake = config.minTradeStake;
            }
            if (config.maxTradeStake !== undefined && config.maxTradeStake > 0) {
                payload.max_trade_stake = config.maxTradeStake;
            }
            if (config.tradeTypes && config.tradeTypes.length > 0) {
                payload.trade_types = config.tradeTypes;
            }

            console.log('📤 Sending copy_start request:', payload);

            // Call Deriv API copy_start endpoint
            const response = await api_base.api.send(payload);

            console.log('📥 Received response:', response);

            if (response.error) {
                console.error('❌ Copy trading start failed:', response.error);
                return { success: false, message: response.error.message || 'Failed to start copy trading' };
            }

            this.isActive = true;
            this.config = config;
            this.copiedTrades = 0;
            this.totalProfit = 0;

            console.log('✅ Copy trading started successfully:', response);
            return { success: true, message: 'Copy trading started successfully' };
        } catch (error) {
            console.error('❌ Error starting copy trading:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Stop copy trading
     */
    async stopCopyTrading(): Promise<{ success: boolean; message?: string }> {
        try {
            if (!api_base.api) {
                return { success: false, message: 'API not connected. Please login first.' };
            }

            console.log('🛑 Stopping copy trading...');

            // Call Deriv API copy_stop endpoint
            const response = await api_base.api.send({
                copy_stop: 1,
            });

            console.log('📥 Stop response:', response);

            if (response.error) {
                console.error('❌ Copy trading stop failed:', response.error);
                return { success: false, message: response.error.message || 'Failed to stop copy trading' };
            }

            this.isActive = false;
            this.config = null;

            console.log('✅ Copy trading stopped successfully');
            return { success: true, message: 'Copy trading stopped successfully' };
        } catch (error) {
            console.error('❌ Error stopping copy trading:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Get copy trading list (active copy traders)
     */
    async getCopyTradingList(): Promise<any> {
        try {
            if (!api_base.api) {
                throw new Error('API not connected');
            }

            const response = await api_base.api.send({
                copytrading_list: 1,
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            return response.copytrading_list;
        } catch (error) {
            console.error('❌ Error getting copy trading list:', error);
            throw error;
        }
    }

    /**
     * Get copy trading statistics
     */
    async getCopyTradingStatistics(): Promise<any> {
        try {
            if (!api_base.api) {
                throw new Error('API not connected');
            }

            const response = await api_base.api.send({
                copytrading_statistics: 1,
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            return response.copytrading_statistics;
        } catch (error) {
            console.error('❌ Error getting copy trading statistics:', error);
            throw error;
        }
    }

    /**
     * Get current status
     */
    getStatus(): CopyTradingStatus {
        return {
            isActive: this.isActive,
            traderTokens: this.config?.traderTokens || [],
            copiedTrades: this.copiedTrades,
            totalProfit: this.totalProfit,
        };
    }

    /**
     * Check if copy trading is active
     */
    isRunning(): boolean {
        return this.isActive;
    }
}

export const copyTradingAPIService = new CopyTradingAPIService();
