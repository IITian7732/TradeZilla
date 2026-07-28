export class RSICalculator {
  length: number;
  smoothingType: string;

  constructor(length = 14, smoothingType = 'SMA') {
    this.length = length;
    this.smoothingType = smoothingType;
  }

  calculate(closes: number[]): number[] {
    if (closes.length < this.length + 1) {
      return new Array(closes.length).fill(undefined);
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // Step 1: Calculate gains and losses
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Step 2: Smooth averages
    const smoothedGains = this.smooth(gains, this.length);
    const smoothedLosses = this.smooth(losses, this.length);

    // Step 3: Calculate RSI
    const rsi = new Array(this.length).fill(undefined);
    for (let i = 0; i < smoothedGains.length; i++) {
      let rs;
      if (smoothedLosses[i] === 0) {
        rs = 100; // if no losses, RSI is 100
      } else {
        rs = smoothedGains[i] / smoothedLosses[i];
      }
      
      if (smoothedLosses[i] === 0 && smoothedGains[i] === 0) {
        rsi.push(50); // no movement
      } else if (smoothedLosses[i] === 0) {
        rsi.push(100);
      } else {
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  smooth(values: number[], period: number): number[] {
    if (this.smoothingType === 'SMA') {
      return this.sma(values, period);
    } else if (this.smoothingType === 'EMA') {
      return this.ema(values, period);
    } else if (this.smoothingType === 'WMA') {
      return this.wma(values, period);
    }
    return this.sma(values, period);
  }

  sma(values: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i <= values.length - period; i++) {
      const sum = values.slice(i, i + period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  ema(values: number[], period: number): number[] {
    const result: number[] = [];
    if (values.length < period) return result;
    
    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);

    for (let i = period; i < values.length; i++) {
      ema = values[i] * multiplier + ema * (1 - multiplier);
      result.push(ema);
    }
    return result;
  }

  wma(values: number[], period: number): number[] {
    const result: number[] = [];
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = (period * (period + 1)) / 2;

    for (let i = 0; i <= values.length - period; i++) {
      let weightedSum = 0;
      for (let j = 0; j < period; j++) {
        weightedSum += values[i + j] * weights[j];
      }
      result.push(weightedSum / weightSum);
    }
    return result;
  }
}
