export class RSICalculator {
  length: number;
  smoothingType: string;

  constructor(length = 14, smoothingType = 'SMA') {
    this.length = Math.max(1, parseInt(String(length)) || 14);
    this.smoothingType = smoothingType || 'SMA';
  }

  calculate(closes: number[]): number[] {
    try {
      if (!closes || closes.length < this.length + 1) {
        return new Array(closes?.length || 0).fill(undefined);
      }

      const gains: number[] = [];
      const losses: number[] = [];

      for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }

      const smoothedGains = this.smooth(gains, this.length);
      const smoothedLosses = this.smooth(losses, this.length);

      const rsi = new Array(this.length).fill(undefined);
      for (let i = 0; i < smoothedGains.length; i++) {
        if (smoothedLosses[i] === 0 && smoothedGains[i] === 0) {
          rsi.push(50);
        } else if (smoothedLosses[i] === 0) {
          rsi.push(100);
        } else {
          const rs = smoothedGains[i] / (smoothedLosses[i] || 1);
          rsi.push(100 - (100 / (1 + rs)));
        }
      }

      return rsi;
    } catch (error) {
      console.error('RSI Calculation Error:', error);
      return new Array(closes?.length || 0).fill(undefined);
    }
  }

  smooth(values: number[], period: number): number[] {
    if (this.smoothingType === 'SMA') return this.sma(values, period);
    if (this.smoothingType === 'EMA') return this.ema(values, period);
    if (this.smoothingType === 'WMA') return this.wma(values, period);
    return this.sma(values, period);
  }

  sma(values: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i <= values.length - period; i++) {
      let sum = 0;
      for (let j = i; j < i + period; j++) sum += values[j] || 0;
      result.push(sum / period);
    }
    return result;
  }

  ema(values: number[], period: number): number[] {
    const result: number[] = [];
    if (values.length < period) return result;
    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((a, b) => a + (b || 0), 0) / period;
    result.push(ema);
    for (let i = period; i < values.length; i++) {
      ema = (values[i] || 0) * multiplier + ema * (1 - multiplier);
      result.push(ema);
    }
    return result;
  }

  wma(values: number[], period: number): number[] {
    const result: number[] = [];
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = (period * (period + 1)) / 2;
    for (let i = period - 1; i < values.length; i++) {
      let weightedSum = 0;
      for (let j = 0; j < period; j++) {
        weightedSum += (values[i - period + 1 + j] || 0) * weights[j];
      }
      result.push(weightedSum / weightSum);
    }
    return result;
  }
}
