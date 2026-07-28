export class SuperTrendCalculator {
  length: number;
  factor: number;

  constructor(length = 10, factor = 3) {
    this.length = Number(length) || 10;
    this.factor = Number(factor) || 3;
  }

  calculate(candles: any[]) {
    if (candles.length === 0) return [];

    const result = new Array(candles.length).fill(undefined);
    const tr = new Array(candles.length).fill(0);
    const atr = new Array(candles.length).fill(0);

    let finalUpperBand = new Array(candles.length).fill(0);
    let finalLowerBand = new Array(candles.length).fill(0);
    let superTrend = new Array(candles.length).fill(0);
    let direction = new Array(candles.length).fill(1); // 1 = up, -1 = down

    for (let i = 0; i < candles.length; i++) {
      const high = Number(candles[i].high);
      const low = Number(candles[i].low);
      const close = Number(candles[i].close);
      const prevClose = i > 0 ? Number(candles[i - 1].close) : close;

      // 1. True Range
      tr[i] = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );

      // 2. ATR (RMA smoothing)
      if (i === 0) {
        atr[i] = tr[i];
      } else if (i < this.length) {
        let sum = 0;
        for (let j = 0; j <= i; j++) sum += tr[j];
        atr[i] = sum / (i + 1);
      } else {
        atr[i] = (atr[i - 1] * (this.length - 1) + tr[i]) / this.length;
      }

      // 3. Basic Bands
      const hl2 = (high + low) / 2;
      const basicUpperBand = hl2 + this.factor * atr[i];
      const basicLowerBand = hl2 - this.factor * atr[i];

      // 4. Final Bands
      if (i === 0) {
        finalUpperBand[i] = basicUpperBand;
        finalLowerBand[i] = basicLowerBand;
      } else {
        if (basicUpperBand < finalUpperBand[i - 1] || prevClose > finalUpperBand[i - 1]) {
          finalUpperBand[i] = basicUpperBand;
        } else {
          finalUpperBand[i] = finalUpperBand[i - 1];
        }

        if (basicLowerBand > finalLowerBand[i - 1] || prevClose < finalLowerBand[i - 1]) {
          finalLowerBand[i] = basicLowerBand;
        } else {
          finalLowerBand[i] = finalLowerBand[i - 1];
        }
      }

      // 5. SuperTrend Value
      if (i === 0) {
        superTrend[i] = finalUpperBand[i];
        direction[i] = -1; // Default starting assumption
      } else {
        const prevSuperTrend = superTrend[i - 1];
        if (prevSuperTrend === finalUpperBand[i - 1]) {
          if (close <= finalUpperBand[i]) {
            superTrend[i] = finalUpperBand[i];
            direction[i] = -1;
          } else {
            superTrend[i] = finalLowerBand[i];
            direction[i] = 1;
          }
        } else if (prevSuperTrend === finalLowerBand[i - 1]) {
          if (close >= finalLowerBand[i]) {
            superTrend[i] = finalLowerBand[i];
            direction[i] = 1;
          } else {
            superTrend[i] = finalUpperBand[i];
            direction[i] = -1;
          }
        }
      }

      // Map to output
      result[i] = {
        value: superTrend[i],
        direction: direction[i],
        isFlip: i > 0 && direction[i] !== direction[i - 1]
      };
    }

    // Usually, the first few values of ATR are unreliable until length is reached
    for(let i = 0; i < this.length && i < result.length; i++) {
        result[i].value = undefined;
    }

    return result;
  }
}
