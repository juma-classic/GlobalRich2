/**
 * Copy Trading API Service
 * Implements copy trading using real Deriv API endpoints
 * Monitors trader transactions and replicates trades automatically
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';

export interface CopyTradingConfig {
    traderTokens: string[]; // API tokens of traders to copy
    assets?: string[]; // Optional: specific assets to copy
    minTradeStake?: number;
    maxTradeStake?: number;
    tradeTypes?: string[]; // e.g., ["CALL", "PUT"]
    copyRatio?: number; // Multiplier for stake amounts (default 1.0)
    copyToRealAccount?: boolean; // Copy from demo to real account
    realAccountToken?: string; // Real account token (if copying to real)
}

export interface CopyTradingStatus {
    isActive: boolean;
    traderTokens: string[];
    copiedTrades: number;
    totalProfit: number;
    lastCopiedTrade?: string;
}

export interface TraderConnection {
    token: string;
    ws: WebSocket | null;
    authorized: boolean;
    loginid: string;
    balance: number;
    accountType: 'demo' | 'real'; // Track account type
}

class CopyTradingAPIService {
    private isActive = false;
    private config: CopyTradingConfig | null = null;
    private copiedTrades = 0;
    private totalProfit = 0;
    private traderConnections: Map<string, TraderConnection> = new Map();
    private processedTransactions: Set<string> = new Set();
    private monitoringInterval: NodeJS.Timeout | null = null;
    private realAccountWs: WebSocket | null = null; // Separate WebSocket for real account
    private realAccountAuthorized = false;

    /**
     * Start copy trading - Real implementation using Deriv API
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

            // Validate real account token if copying to real
            if (config.copyToRealAccount && !config.realAccountToken) {
                return { success: false, message: 'Real account token required for demo-to-real copy trading' };
            }

            console.log('🔗 Starting copy trading with config:', config);

            // If copying to real account, connect to real account first
            if (config.copyToRealAccount && config.realAccountToken) {
                const realConnected = await this.connectToRealAccount(config.realAccountToken);
                if (!realConnected) {
                    return { success: false, message: 'Failed to connect to real account. Please check the token.' };
                }
                console.log('✅ Connected to real account for copying');
            }

            // Connect to each trader's account
            for (const token of config.traderTokens) {
                const connected = await this.connectToTrader(token);
                if (!connected) {
                    console.warn(`⚠️ Failed to connect to trader with token: ${token.substring(0, 10)}...`);
                }
            }

            // Check if at least one trader connected
            if (this.traderConnections.size === 0) {
                return { success: false, message: 'Failed to connect to any traders. Please check the tokens.' };
            }

            this.isActive = true;
            this.config = config;
            this.copiedTrades = 0;
            this.totalProfit = 0;

            // Start monitoring trader transactions
            this.startMonitoring();

            const copyMode = config.copyToRealAccount ? 'DEMO → REAL' : 'SAME ACCOUNT TYPE';
            console.log(
                `✅ Copy trading started successfully. Mode: ${copyMode}, Monitoring ${this.traderConnections.size} trader(s)`
            );
            return {
                success: true,
                message: `Copy trading started (${copyMode}). Monitoring ${this.traderConnections.size} trader(s)`,
            };
        } catch (error) {
            console.error('❌ Error starting copy trading:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Connect to a trader's account using their API token
     */
    private async connectToTrader(token: string): Promise<boolean> {
        try {
            const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

            return new Promise(resolve => {
                ws.onopen = () => {
                    console.log(`📡 WebSocket opened for trader token: ${token.substring(0, 10)}...`);

                    // Authorize with trader's token
                    ws.send(
                        JSON.stringify({
                            authorize: token,
                            req_id: Date.now(),
                        })
                    );
                };

                ws.onmessage = event => {
                    const data = JSON.parse(event.data);

                    if (data.msg_type === 'authorize') {
                        if (data.error) {
                            console.error('❌ Authorization failed:', data.error);
                            ws.close();
                            resolve(false);
                        } else {
                            console.log('✅ Trader authorized:', data.authorize.loginid);

                            // Determine account type from loginid
                            const accountType =
                                data.authorize.loginid.startsWith('VRT') || data.authorize.loginid.startsWith('VRW')
                                    ? 'demo'
                                    : 'real';

                            // Store connection
                            this.traderConnections.set(token, {
                                token,
                                ws,
                                authorized: true,
                                loginid: data.authorize.loginid,
                                balance: data.authorize.balance,
                                accountType,
                            });

                            console.log(`📊 Trader account type: ${accountType.toUpperCase()}`);

                            // Subscribe to transactions
                            ws.send(
                                JSON.stringify({
                                    transaction: 1,
                                    subscribe: 1,
                                    req_id: Date.now(),
                                })
                            );

                            resolve(true);
                        }
                    } else if (data.msg_type === 'transaction') {
                        // Handle trader transactions
                        this.handleTraderTransaction(token, data.transaction);
                    }
                };

                ws.onerror = error => {
                    console.error('❌ WebSocket error:', error);
                    resolve(false);
                };

                ws.onclose = () => {
                    console.log('🔌 WebSocket closed for trader');
                    this.traderConnections.delete(token);
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!this.traderConnections.has(token)) {
                        ws.close();
                        resolve(false);
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('❌ Error connecting to trader:', error);
            return false;
        }
    }

    /**
     * Handle trader transaction and copy the trade
     */
    private async handleTraderTransaction(traderToken: string, transaction: any): Promise<void> {
        try {
            // Skip if already processed
            const txId = `${traderToken}-${transaction.transaction_id}`;
            if (this.processedTransactions.has(txId)) {
                return;
            }

            console.log('📊 Trader transaction detected:', transaction);

            // Only copy buy transactions (new trades)
            if (transaction.action !== 'buy') {
                return;
            }

            // Check if we should copy this trade based on config
            if (!this.shouldCopyTrade(transaction)) {
                console.log('⏭️ Skipping trade based on filters');
                return;
            }

            // Mark as processed
            this.processedTransactions.add(txId);

            // Copy the trade
            await this.copyTrade(transaction);
        } catch (error) {
            console.error('❌ Error handling trader transaction:', error);
        }
    }

    /**
     * Check if trade should be copied based on config filters
     */
    private shouldCopyTrade(transaction: any): boolean {
        const config = this.config;
        if (!config) return false;

        // Check asset filter
        if (config.assets && config.assets.length > 0) {
            if (!config.assets.includes(transaction.symbol)) {
                return false;
            }
        }

        // Check stake limits
        const stake = transaction.amount;
        if (config.minTradeStake && stake < config.minTradeStake) {
            return false;
        }
        if (config.maxTradeStake && stake > config.maxTradeStake) {
            return false;
        }

        // Check trade types
        if (config.tradeTypes && config.tradeTypes.length > 0) {
            if (!config.tradeTypes.includes(transaction.contract_type)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Copy a trade from trader to your account
     */
    private async copyTrade(transaction: any): Promise<void> {
        try {
            console.log('🔄 Copying trade:', transaction);

            // Determine which API to use
            const useRealAccount = this.config?.copyToRealAccount && this.realAccountAuthorized;

            if (useRealAccount && !this.realAccountWs) {
                console.error('❌ Real account WebSocket not available');
                return;
            }

            if (!useRealAccount && !api_base.api) {
                console.error('❌ API not connected');
                return;
            }

            // Get trader account type
            const traderConnection = Array.from(this.traderConnections.values()).find(
                conn => conn.loginid === transaction.loginid
            );
            const traderAccountType = traderConnection?.accountType || 'unknown';

            console.log(`📊 Copy mode: ${traderAccountType.toUpperCase()} → ${useRealAccount ? 'REAL' : 'CURRENT'}`);

            // Calculate stake with copy ratio
            const copyRatio = this.config?.copyRatio || 1.0;
            const stake = transaction.amount * copyRatio;

            // Build proposal payload
            const proposalPayload: any = {
                proposal: 1,
                amount: stake,
                basis: 'stake',
                contract_type: transaction.contract_type,
                currency: 'USD',
                duration: transaction.duration || 5,
                duration_unit: transaction.duration_unit || 't',
                symbol: transaction.symbol,
            };

            // Add barrier if present
            if (transaction.barrier) {
                proposalPayload.barrier = transaction.barrier;
            }

            console.log('📤 Getting proposal:', proposalPayload);

            let proposalResponse;
            let buyResponse;

            if (useRealAccount && this.realAccountWs) {
                // Use real account WebSocket
                proposalResponse = await this.sendToRealAccount(proposalPayload);

                if (proposalResponse.error) {
                    console.error('❌ Proposal failed:', proposalResponse.error);
                    return;
                }

                // Buy the contract on real account
                const buyPayload = {
                    buy: proposalResponse.proposal.id,
                    price: proposalResponse.proposal.ask_price,
                };

                console.log('📤 Buying contract on REAL account:', buyPayload);
                buyResponse = await this.sendToRealAccount(buyPayload);
            } else {
                // Use current account API
                proposalResponse = await api_base.api.send(proposalPayload);

                if (proposalResponse.error) {
                    console.error('❌ Proposal failed:', proposalResponse.error);
                    return;
                }

                // Buy the contract
                const buyPayload = {
                    buy: proposalResponse.proposal.id,
                    price: proposalResponse.proposal.ask_price,
                };

                console.log('📤 Buying contract:', buyPayload);
                buyResponse = await api_base.api.send(buyPayload);
            }

            if (buyResponse.error) {
                console.error('❌ Buy failed:', buyResponse.error);
                return;
            }

            this.copiedTrades++;
            console.log(
                `✅ Trade copied successfully (${traderAccountType.toUpperCase()} → ${useRealAccount ? 'REAL' : 'CURRENT'}):`,
                buyResponse.buy
            );

            // Subscribe to contract updates to track profit
            this.subscribeToContract(buyResponse.buy.contract_id, useRealAccount);
        } catch (error) {
            console.error('❌ Error copying trade:', error);
        }
    }

    /**
     * Send request to real account WebSocket
     */
    private sendToRealAccount(payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.realAccountWs || this.realAccountWs.readyState !== WebSocket.OPEN) {
                reject(new Error('Real account WebSocket not connected'));
                return;
            }

            const reqId = Date.now();
            payload.req_id = reqId;

            const handler = (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                if (data.req_id === reqId) {
                    this.realAccountWs?.removeEventListener('message', handler);
                    resolve(data);
                }
            };

            this.realAccountWs.addEventListener('message', handler);
            this.realAccountWs.send(JSON.stringify(payload));

            // Timeout after 10 seconds
            setTimeout(() => {
                this.realAccountWs?.removeEventListener('message', handler);
                reject(new Error('Request timeout'));
            }, 10000);
        });
    }

    /**
     * Subscribe to contract updates to track profit/loss
     */
    private async subscribeToContract(contractId: number, useRealAccount: boolean = false): Promise<void> {
        try {
            const payload = {
                proposal_open_contract: 1,
                contract_id: contractId,
                subscribe: 1,
            };

            if (useRealAccount && this.realAccountWs) {
                // Subscribe via real account WebSocket
                const response = await this.sendToRealAccount(payload);

                if (response.error) {
                    console.error('❌ Failed to subscribe to contract:', response.error);
                    return;
                }

                // Listen for updates on real account WebSocket
                const handler = (event: MessageEvent) => {
                    const data = JSON.parse(event.data);
                    if (
                        data.msg_type === 'proposal_open_contract' &&
                        data.proposal_open_contract?.contract_id === contractId
                    ) {
                        const contract = data.proposal_open_contract;

                        if (contract.is_sold || contract.status === 'sold') {
                            const profit = contract.profit || 0;
                            this.totalProfit += profit;
                            console.log(
                                `💰 REAL Account Contract closed. Profit: $${profit.toFixed(2)}, Total: $${this.totalProfit.toFixed(2)}`
                            );
                            this.realAccountWs?.removeEventListener('message', handler);
                        }
                    }
                };

                this.realAccountWs.addEventListener('message', handler);
            } else if (api_base.api) {
                // Subscribe via current account API
                const response = await api_base.api.send(payload);

                if (response.error) {
                    console.error('❌ Failed to subscribe to contract:', response.error);
                    return;
                }

                // Handle contract updates
                const subscription = api_base.api.onMessage().subscribe((msg: any) => {
                    if (
                        msg.msg_type === 'proposal_open_contract' &&
                        msg.proposal_open_contract?.contract_id === contractId
                    ) {
                        const contract = msg.proposal_open_contract;

                        if (contract.is_sold || contract.status === 'sold') {
                            const profit = contract.profit || 0;
                            this.totalProfit += profit;
                            console.log(
                                `💰 Contract closed. Profit: $${profit.toFixed(2)}, Total: $${this.totalProfit.toFixed(2)}`
                            );
                            subscription.unsubscribe();
                        }
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error subscribing to contract:', error);
        }
    }

    /**
     * Start monitoring (periodic check)
     */
    private startMonitoring(): void {
        // Clear any existing interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Check connection status every 30 seconds
        this.monitoringInterval = setInterval(() => {
            console.log(
                `📊 Copy Trading Status: ${this.traderConnections.size} trader(s) connected, ${this.copiedTrades} trades copied`
            );

            // Reconnect to disconnected traders
            this.traderConnections.forEach((connection, token) => {
                if (connection.ws?.readyState === WebSocket.CLOSED) {
                    console.log('🔄 Reconnecting to trader...');
                    this.connectToTrader(token);
                }
            });
        }, 30000);
    }

    /**
     * Stop copy trading
     */
    async stopCopyTrading(): Promise<{ success: boolean; message?: string }> {
        try {
            console.log('🛑 Stopping copy trading...');

            // Stop monitoring
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            // Close real account connection if exists
            if (this.realAccountWs && this.realAccountWs.readyState === WebSocket.OPEN) {
                this.realAccountWs.close();
                this.realAccountWs = null;
                this.realAccountAuthorized = false;
            }

            // Close all trader connections
            this.traderConnections.forEach(connection => {
                if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.close();
                }
            });

            this.traderConnections.clear();
            this.processedTransactions.clear();
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
     * Get connected traders info
     */
    getConnectedTraders(): Array<{ loginid: string; balance: number; token: string; accountType: string }> {
        const traders: Array<{ loginid: string; balance: number; token: string; accountType: string }> = [];

        this.traderConnections.forEach(connection => {
            if (connection.authorized) {
                traders.push({
                    loginid: connection.loginid,
                    balance: connection.balance,
                    token: connection.token.substring(0, 10) + '...',
                    accountType: connection.accountType.toUpperCase(),
                });
            }
        });

        return traders;
    }

    /**
     * Get detailed statistics
     */
    getDetailedStatistics() {
        return {
            isActive: this.isActive,
            connectedTraders: this.traderConnections.size,
            copiedTrades: this.copiedTrades,
            totalProfit: this.totalProfit,
            averageProfitPerTrade: this.copiedTrades > 0 ? this.totalProfit / this.copiedTrades : 0,
            processedTransactions: this.processedTransactions.size,
        };
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

    /**
     * Connect to real account for demo-to-real copy trading
     */
    private async connectToRealAccount(token: string): Promise<boolean> {
        try {
            this.realAccountWs = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

            return new Promise(resolve => {
                if (!this.realAccountWs) {
                    resolve(false);
                    return;
                }

                this.realAccountWs.onopen = () => {
                    console.log('📡 Real account WebSocket opened');

                    // Authorize with real account token
                    this.realAccountWs?.send(
                        JSON.stringify({
                            authorize: token,
                            req_id: Date.now(),
                        })
                    );
                };

                this.realAccountWs.onmessage = event => {
                    const data = JSON.parse(event.data);

                    if (data.msg_type === 'authorize') {
                        if (data.error) {
                            console.error('❌ Real account authorization failed:', data.error);
                            this.realAccountWs?.close();
                            resolve(false);
                        } else {
                            const loginid = data.authorize.loginid;
                            const isReal = !loginid.startsWith('VRT') && !loginid.startsWith('VRW');

                            if (!isReal) {
                                console.error('❌ Provided token is not a real account');
                                this.realAccountWs?.close();
                                resolve(false);
                                return;
                            }

                            console.log('✅ Real account authorized:', loginid);
                            this.realAccountAuthorized = true;
                            resolve(true);
                        }
                    }
                };

                this.realAccountWs.onerror = error => {
                    console.error('❌ Real account WebSocket error:', error);
                    resolve(false);
                };

                this.realAccountWs.onclose = () => {
                    console.log('🔌 Real account WebSocket closed');
                    this.realAccountAuthorized = false;
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!this.realAccountAuthorized) {
                        this.realAccountWs?.close();
                        resolve(false);
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('❌ Error connecting to real account:', error);
            return false;
        }
    }
}

export const copyTradingAPIService = new CopyTradingAPIService();
