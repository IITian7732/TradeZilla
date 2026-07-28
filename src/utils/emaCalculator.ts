export class EMACalculator {
  length: number;
  source: string;
  smoothingLine: string;
  smoothingLength: number;
  offset: number;

  constructor(length = 200, source = 'close', smoothingLine = 'SMA', smoothingLength = 9, offset = 0) {
    this.length = Number(length) || 200;
    this.source = source;
    this.smoothingLine = smoothingLine;
    this.smoothingLength = Number(smoothingLength) || 9;
    this.offset = Number(offset) || 0;
  }

  // MAIN: Calculate EMA
  calculate(candles: any[]) {
    if (candles.length < this.length) {
      return new Array(candles.length).fill(undefined);
    }

    // Step 1: Extract source values
    const sourceValues = this.extractSource(candles);

    // Step 2: Calculate base EMA
    const baseEMA = this.calculateBaseEMA(sourceValues);

    // Step 3: Apply smoothing if needed
    let finalEMA = baseEMA;
    if (this.smoothingLine !== 'SMA' || this.smoothingLength > 1) {
      finalEMA = this.smoothEMA(baseEMA, this.smoothingLength, this.smoothingLine);
    }

    // Step 4: Apply offset
    const offsetEMA = this.applyOffset(finalEMA);

    return offsetEMA;
  }

  // Extract source from candle
  extractSource(candles: any[]) {
    return candles.map(candle => {
      switch (this.source) {
        case 'open':
          return Number(candle.open);
        case 'high':
          return Number(candle.high);
        case 'low':
          return Number(candle.low);
        case 'hl2':
          return (Number(candle.high) + Number(candle.low)) / 2;
        case 'hlc3':
          return (Number(candle.high) + Number(candle.low) + Number(candle.close)) / 3;
        case 'ohlc4':
          return (Number(candle.open) + Number(candle.high) + Number(candle.low) + Number(candle.close)) / 4;
        case 'close':
        default:
          return Number(candle.close);
      }
    });
  }

  // Calculate basic EMA with given period
  calculateBaseEMA(values: number[]) {
    if (values.length < this.length) {
      return new Array(values.length).fill(undefined);
    }

    const ema = new Array(values.length);
    const multiplier = 2 / (this.length + 1);

    // Fill undefined for first length-1 values
    for (let i = 0; i < this.length - 1; i++) {
      ema[i] = undefined;
    }

    // Calculate first EMA (using SMA for initialization)
    let sum = 0;
    for (let i = 0; i < this.length; i++) {
      sum += values[i];
    }
    let emaValue = sum / this.length;
    ema[this.length - 1] = emaValue;

    // Calculate subsequent EMAs
    for (let i = this.length; i < values.length; i++) {
      emaValue = values[i] * multiplier + emaValue * (1 - multiplier);
      ema[i] = emaValue;
    }

    return ema;
  }

  // Apply smoothing to EMA values
  smoothEMA(emaValues: any[], smoothingLength: number, smoothingType: string) {
    if (smoothingType === 'SMA') {
      return this.smoothWithSMA(emaValues, smoothingLength);
    } else if (smoothingType === 'EMA') {
      return this.smoothWithEMA(emaValues, smoothingLength);
    } else if (smoothingType === 'WMA') {
      return this.smoothWithWMA(emaValues, smoothingLength);
    }
    return emaValues;
  }

  // Smooth with SMA
  smoothWithSMA(values: any[], period: number) {
    const result = [...values];
    for (let i = period - 1; i < values.length; i++) {
      if (values[i] === undefined) continue;

      let sum = 0;
      let count = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (values[j] !== undefined) {
          sum += values[j];
          count++;
        }
      }
      
      if (count === period) {
        result[i] = sum / period;
      } else {
        result[i] = undefined;
      }
    }
    return result;
  }

  // Smooth with EMA
  smoothWithEMA(values: any[], period: number) {
    const result = new Array(values.length).fill(undefined);
    const multiplier = 2 / (period + 1);
    let ema: number | undefined = undefined;

    for (let i = 0; i < values.length; i++) {
      if (values[i] === undefined) {
        result[i] = undefined;
        continue;
      }

      if (ema === undefined) {
        // Initialize SMA for the first period
        let sum = 0;
        let count = 0;
        for(let j=i; j<i+period && j<values.length; j++) {
           if (values[j] !== undefined) {
              sum += values[j];
              count++;
           }
        }
        if (count === period) {
           ema = sum / period;
           for(let k=i; k<i+period-1; k++) {
              result[k] = undefined;
           }
           result[i+period-1] = ema;
           i = i + period - 1;
        } else {
           result[i] = undefined;
        }
      } else {
        ema = values[i] * multiplier + ema * (1 - multiplier);
        result[i] = ema;
      }
    }
    return result;
  }

  // Smooth with WMA
  smoothWithWMA(values: any[], period: number) {
    const result = new Array(values.length).fill(undefined);
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = (period * (period + 1)) / 2;

    for (let i = period - 1; i < values.length; i++) {
      if (values[i] === undefined) continue;

      let weightedSum = 0;
      let count = 0;
      for (let j = 0; j < period; j++) {
        const idx = i - period + 1 + j;
        if (values[idx] !== undefined) {
          weightedSum += values[idx] * weights[j];
          count++;
        }
      }

      if (count === period) {
        result[i] = weightedSum / weightSum;
      }
    }
    return result;
  }

  // Apply offset (shift the line forward/backward)
  applyOffset(values: any[]) {
    if (this.offset === 0) return values;

    const result = new Array(values.length).fill(undefined);

    if (this.offset > 0) {
      // Shift right
      for (let i = 0; i < values.length; i++) {
        result[i] = i - this.offset >= 0 ? values[i - this.offset] : undefined;
      }
    } else {
      // Shift left
      for (let i = 0; i < values.length; i++) {
        result[i] = i - this.offset < values.length ? values[i - this.offset] : undefined;
      }
    }

    return result;
  }
}
