// src/types/trade.ts
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  orderType: OrderType;
  productType?: 'INTRADAY' | 'DELIVERY';
  side: OrderSide;
  quantity: number;
  price?: number;         // Limit/SL price; undefined for MARKET orders
  triggerPrice?: number;  // For SL / SL-M orders
  tp?: number;            // Take Profit for pending orders
  sl?: number;            // Stop Loss for pending orders
  status: OrderStatus;
  executedPrice?: number;
  executedAt?: string;
  createdAt: string;
}

export interface Holding {
  id: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number;
  currentValue?: number;
  investedValue: number;
  pnl?: number;
  pnlPct?: number;
  tp?: number; // Take Profit
  sl?: number; // Stop Loss
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  side: OrderSide;
  quantity: number;
  price: number;
  pnl?: number;  // populated on SELL only; NULL on BUY (not zero)
  tradedAt: string;
}
