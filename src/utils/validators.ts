// src/utils/validators.ts
import type { OrderSide, OrderType } from '../types/trade';

export interface OrderValidationInput {
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  availableBalance: number;
  currentHoldings: number; // shares owned for this symbol
  marketPrice: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>; // field name → error message
}

export function validateOrder(input: OrderValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Quantity must be a positive integer
  if (!input.quantity || input.quantity <= 0) {
    errors.quantity = 'Quantity must be at least 1 share';
  } else if (!Number.isInteger(input.quantity)) {
    errors.quantity = 'Quantity must be a whole number';
  }

  // Limit orders require a price
  if ((input.orderType === 'LIMIT' || input.orderType === 'SL') && !input.price) {
    errors.price = 'Price is required for this order type';
  }
  if (input.price !== undefined && input.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  // SL/SL-M require trigger price
  if ((input.orderType === 'SL' || input.orderType === 'SL-M') && !input.triggerPrice) {
    errors.triggerPrice = 'Trigger price is required for stop-loss orders';
  }

  // BUY: check balance
  if (input.side === 'BUY' && input.quantity > 0) {
    const estimatedCost = input.quantity * (input.price ?? input.marketPrice);
    if (estimatedCost > input.availableBalance) {
      errors.quantity = `Insufficient balance. Need ₹${estimatedCost.toFixed(2)}, have ₹${input.availableBalance.toFixed(2)}`;
    }
  }

  // SELL: check holdings
  if (input.side === 'SELL' && input.quantity > input.currentHoldings) {
    errors.quantity = `Cannot sell more than you own (${input.currentHoldings} shares)`;
  }
  if (input.side === 'SELL' && input.currentHoldings === 0) {
    errors.quantity = 'You do not own any shares of this stock';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateAlertPrice(targetPrice: number, currentPrice: number, condition: 'ABOVE' | 'BELOW'): string | null {
  if (targetPrice <= 0) return 'Target price must be greater than 0';
  if (condition === 'ABOVE' && targetPrice <= currentPrice) {
    return `Target price must be above current price (₹${currentPrice.toFixed(2)})`;
  }
  if (condition === 'BELOW' && targetPrice >= currentPrice) {
    return `Target price must be below current price (₹${currentPrice.toFixed(2)})`;
  }
  return null;
}
