export class ATRCalculator {
  length: number;
  maType: string;

  constructor(length = 14, maType = 'SMA') {
    this.length = length;
    this.maType = maType;
  }

  calculate(candles: any[]) {
    if (candles.length < 2) {
      return new Array(candles.length).fill(undefined);
    }

    const trueRanges = this.calculateTrueRange(candles);
    const atr = this.applyMovingAverage(trueRanges);

    return atr;
  }

  calculateTrueRange(candles: any[]) {
    const tr = [];
    for (let i = 0; i < candles.length; i++) {
      const current = candles[i];
      let trValue;

      if (i === 0) {
        trValue = current.high - current.low;
      } else {
        const previous = candles[i - 1];
        const range = current.high - current.low;
        const gapUp = current.high - previous.close;
        const gapDown = previous.close - current.low;
        trValue = Math.max(range, Math.abs(gapUp), Math.abs(gapDown));
      }
      tr.push(trValue);
    }
    return tr;
  }

  applyMovingAverage(trueRanges: number[]) {
    if (this.maType === 'SMA') {
      return this.calculateSMA(trueRanges, this.length);
    } else if (this.maType === 'EMA') {
      return this.calculateEMA(trueRanges, this.length);
    } else if (this.maType === 'WMA') {
      return this.calculateWMA(trueRanges, this.length);
    }
    return this.calculateSMA(trueRanges, this.length);
  }

  calculateSMA(values: number[], period: number) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sum += values[j];
        }
        result.push(sum / period);
      }
    }
    return result;
  }

  calculateEMA(values: number[], period: number) {
    const result = [];
    const multiplier = 2 / (period + 1);
    let ema: number | undefined = undefined;

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += values[j];
        }
        ema = sum / period;
        result.push(ema);
      } else {
        ema = values[i] * multiplier + ema! * (1 - multiplier);
        result.push(ema);
      }
    }
    return result;
  }

  calculateWMA(values: number[], period: number) {
    const result = [];
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = (period * (period + 1)) / 2;

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        let weightedSum = 0;
        for (let j = 0; j < period; j++) {
          const idx = i - period + 1 + j;
          weightedSum += values[idx] * weights[j];
        }
        result.push(weightedSum / weightSum);
      }
    }
    return result;
  }
}
