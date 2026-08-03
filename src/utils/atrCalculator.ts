export class ATRCalculator {
  length: number;
  maType: string;

  constructor(length = 14, maType = 'SMA') {
    this.length = Math.max(1, parseInt(String(length)) || 14);
    this.maType = maType || 'SMA';
  }

  calculate(candles: any[]): (number | undefined)[] {
    try {
      if (!candles || candles.length < 2) {
        return new Array(candles?.length || 0).fill(undefined);
      }
      const trueRanges = this.calculateTrueRange(candles);
      return this.applyMovingAverage(trueRanges);
    } catch (error) {
      console.error('ATR Calculation Error:', error);
      return new Array(candles?.length || 0).fill(undefined);
    }
  }

  calculateTrueRange(candles: any[]): number[] {
    const tr: number[] = [];
    for (let i = 0; i < candles.length; i++) {
      const current = candles[i];
      let trValue: number;
      if (i === 0) {
        trValue = (current.high || 0) - (current.low || 0);
      } else {
        const previous = candles[i - 1];
        const range = (current.high || 0) - (current.low || 0);
        const gapUp = Math.abs((current.high || 0) - (previous.close || 0));
        const gapDown = Math.abs((previous.close || 0) - (current.low || 0));
        trValue = Math.max(range, gapUp, gapDown);
      }
      tr.push(Math.max(0, trValue)); // Ensure non-negative
    }
    return tr;
  }

  applyMovingAverage(trueRanges: number[]): (number | undefined)[] {
    if (this.maType === 'EMA') return this.calculateEMA(trueRanges, this.length);
    if (this.maType === 'WMA') return this.calculateWMA(trueRanges, this.length);
    if (this.maType === 'RMA') return this.calculateRMA(trueRanges, this.length);
    return this.calculateSMA(trueRanges, this.length);
  }

  calculateRMA(values: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    let rma: number | undefined = undefined;
    const alpha = 1 / period;
    
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += values[j] || 0;
        rma = sum / period;
        result.push(rma);
      } else {
        rma = (values[i] || 0) * alpha + rma! * (1 - alpha);
        result.push(rma);
      }
    }
    return result;
  }

  calculateSMA(values: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += values[j] || 0;
        result.push(sum / period);
      }
    }
    return result;
  }

  calculateEMA(values: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    const multiplier = 2 / (period + 1);
    let ema: number | undefined = undefined;
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += values[j] || 0;
        ema = sum / period;
        result.push(ema);
      } else {
        ema = (values[i] || 0) * multiplier + ema! * (1 - multiplier);
        result.push(ema);
      }
    }
    return result;
  }

  calculateWMA(values: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = (period * (period + 1)) / 2;
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        let weightedSum = 0;
        for (let j = 0; j < period; j++) {
          weightedSum += (values[i - period + 1 + j] || 0) * weights[j];
        }
        result.push(weightedSum / weightSum);
      }
    }
    return result;
  }
}
