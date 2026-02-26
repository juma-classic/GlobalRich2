export interface SignalConfig {
    prediction1: string;
    prediction2: string;
    takeProfit: string;
    stopLoss: string;
}

export interface NumericSignalConfig {
    prediction1: number;
    prediction2: number;
    takeProfit: number;
    stopLoss: number;
}

export type SignalType = 'OVER' | 'UNDER';

export type TradeOutcome = 'none' | 'win' | 'loss';

export interface SignalData {
    id: string;
    type: SignalType;
    market: string;
    confidence: number;
    createdAt: number;
    expiresAt: number;
    remainingSeconds: number;
    distributionAnalysis: DistributionAnalysis;
}

export interface DistributionAnalysis {
    recentTicks: number[];
    overCount: number;
    underCount: number;
    overPercentage: number;
    underPercentage: number;
    bias: 'OVER' | 'UNDER' | 'NEUTRAL';
    confidenceScore: number;
}

export interface TickData {
    quote: number;
    epoch: number;
}
