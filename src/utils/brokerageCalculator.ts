// src/utils/brokerageCalculator.ts
// Upstox equity charges — mirroring the official Upstox brokerage calculator.

export interface ChargesBreakdown {
  brokerage: number;       // Brokerage fee
  stt: number;             // Securities Transaction Tax
  gst: number;             // 18% GST on (brokerage + exchange txn charge)
  stampDuty: number;       // Stamp duty (buy side only)
  exchangeTxnCharge: number; // NSE/BSE transaction charge 0.00307%
  sebiCharge: number;      // SEBI turnover charge ₹10/crore
  dematDPCharge: number;   // Demat DP charge (delivery sell only)
  total: number;           // Sum of all charges
}

export interface CalcChargesParams {
  side: 'BUY' | 'SELL';
  productType: 'INTRADAY' | 'DELIVERY';
  quantity: number;
  price: number;
  exchange?: 'NSE' | 'BSE';
}

export function calcCharges(params: CalcChargesParams): ChargesBreakdown {
  const { side, productType, quantity, price } = params;
  const orderValue = quantity * price;

  // 1. Brokerage
  // Intraday: lower of ₹20 or 0.1% per order
  // Delivery: flat ₹20 per order
  const brokerage =
    productType === 'INTRADAY'
      ? Math.min(20, orderValue * 0.001)
      : 20;

  // 2. STT (Securities Transaction Tax)
  // Intraday: 0.025% on SELL side only
  // Delivery: 0.1% on BOTH BUY and SELL
  let stt = 0;
  if (productType === 'INTRADAY') {
    if (side === 'SELL') stt = orderValue * 0.00025;
  } else {
    stt = orderValue * 0.001;
  }

  // 3. Exchange Transaction Charge — NSE 0.00307%
  const exchangeTxnCharge = orderValue * 0.0000307;

  // 4. GST — 18% on (brokerage + exchange txn charge)
  const gst = (brokerage + exchangeTxnCharge) * 0.18;

  // 5. Stamp Duty — BUY side only
  // Intraday: 0.003%, Delivery: 0.015%
  let stampDuty = 0;
  if (side === 'BUY') {
    stampDuty =
      productType === 'INTRADAY'
        ? orderValue * 0.00003
        : orderValue * 0.00015;
  }

  // 6. SEBI Turnover Charge — ₹10 per crore = 0.000001 of order value
  const sebiCharge = orderValue * 0.000001;

  // 7. Demat DP Charge
  // Intraday: Nil, Delivery SELL only: ₹20 per scrip/day
  const dematDPCharge =
    productType === 'DELIVERY' && side === 'SELL' ? 20 : 0;

  const total =
    brokerage + stt + gst + stampDuty + exchangeTxnCharge + sebiCharge + dematDPCharge;

  return {
    brokerage,
    stt,
    gst,
    stampDuty,
    exchangeTxnCharge,
    sebiCharge,
    dematDPCharge,
    total,
  };
}
