export class EMACalculator {
  length: number;
  source: string;
  smoothingLine: string;
  smoothingLength: number;
  offset: number;

  constructor(length = 200, source = 'close', smoothingLine = 'SMA', smoothingLength = 9, offset = 0) {
    this.length = Math.max(1, parseInt(String(length)) || 200);
    this.source = source || 'close';
    this.smoothingLine = smoothingLine || 'SMA';
    this.smoothingLength = Math.max(1, parseInt(String(smoothingLength)) || 9);
    this.offset = parseInt(String(offset)) || 0;
  }

  calculate(candles: any[]): (number | undefined)[] {
    try {
      if (!candles || candles.length < this.length + 1) {
        return new Array(candles?.length || 0).fill(undefined);
      }
      const sourceValues = this.extractSource(candles);
      const baseEMA = this.calculateBaseEMA(sourceValues);
      let finalEMA = baseEMA;
      if (this.smoothingLine !== 'SMA' || this.smoothingLength > 1) {
        finalEMA = this.smoothEMA(baseEMA, this.smoothingLength, this.smoothingLine);
      }
      return this.applyOffset(finalEMA);
    } catch (error) {
      console.error('EMA Calculation Error:', error);
      return new Array(candles?.length || 0).fill(undefined);
    }
  }

  extractSource(candles: any[]): number[] {
    return candles.map(candle => {
      switch (this.source) {
        case 'open':   return candle.open  || 0;
        case 'high':   return candle.high  || 0;
        case 'low':    return candle.low   || 0;
        case 'hl2':    return ((candle.high || 0) + (candle.low  || 0)) / 2;
        case 'hlc3':   return ((candle.high || 0) + (candle.low  || 0) + (candle.close || 0)) / 3;
        case 'ohlc4':  return ((candle.open || 0) + (candle.high || 0) + (candle.low  || 0) + (candle.close || 0)) / 4;
        case 'close':
        default:       return candle.close || 0;
      }
    });
  }

  calculateBaseEMA(values: number[]): (number | undefined)[] {
    if (values.length < this.length) {
      return new Array(values.length).fill(undefined);
    }
    const ema: (number | undefined)[] = new Array(this.length - 1).fill(undefined);
    const multiplier = 2 / (this.length + 1);
    let sum = 0;
    for (let i = 0; i < this.length; i++) sum += values[i] || 0;
    let emaValue = sum / this.length;
    ema.push(emaValue);
    for (let i = this.length; i < values.length; i++) {
      emaValue = (values[i] || 0) * multiplier + emaValue * (1 - multiplier);
      ema.push(emaValue);
    }
    return ema;
  }

  smoothEMA(emaValues: (number | undefined)[], smoothingLength: number, smoothingType: string): (number | undefined)[] {
    if (smoothingType === 'EMA') return this.smoothWithEMA(emaValues, smoothingLength);
    if (smoothingType === 'WMA') return this.smoothWithWMA(emaValues, smoothingLength);
    return this.smoothWithSMA(emaValues, smoothingLength);
  }

  smoothWithSMA(values: (number | undefined)[], period: number): (number | undefined)[] {
    const result = [...values];
    for (let i = period - 1; i < values.length; i++) {
      if (values[i] === undefined) continue;
      let sum = 0;
      let count = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (values[j] !== undefined) { sum += values[j] as number; count++; }
      }
      result[i] = count === period ? sum / period : undefined;
    }
    return result;
  }

  smoothWithEMA(values: (number | undefined)[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = new Array(values.length).fill(undefined);
    const multiplier = 2 / (period + 1);
    let ema: number | undefined = undefined;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === undefined) { result[i] = undefined; continue; }
      if (ema === undefined) ema = values[i] as number;
      else ema = (values[i] as number) * multiplier + ema * (1 - multiplier);
      result[i] = ema;
    }
    return result;
  }

  smoothWithWMA(values: (number | undefined)[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = new Array(values.length).fill(undefined);
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = (period * (period + 1)) / 2;
    for (let i = period - 1; i < values.length; i++) {
      if (values[i] === undefined) continue;
      let weightedSum = 0;
      let count = 0;
      for (let j = 0; j < period; j++) {
        const idx = i - period + 1 + j;
        if (values[idx] !== undefined) { weightedSum += (values[idx] as number) * weights[j]; count++; }
      }
      if (count === period) result[i] = weightedSum / weightSum;
    }
    return result;
  }

  applyOffset(values: (number | undefined)[]): (number | undefined)[] {
    if (this.offset === 0) return values;
    const result: (number | undefined)[] = new Array(values.length).fill(undefined);
    if (this.offset > 0) {
      for (let i = 0; i < values.length; i++) {
        result[i] = i - this.offset >= 0 ? values[i - this.offset] : undefined;
      }
    } else {
      for (let i = 0; i < values.length; i++) {
        result[i] = i - this.offset < values.length ? values[i - this.offset] : undefined;
      }
    }
    return result;
  }
}
