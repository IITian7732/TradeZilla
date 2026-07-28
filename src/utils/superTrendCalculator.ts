export class SuperTrendCalculator {
  length: number;
  factor: number;

  constructor(length = 10, factor = 3) {
    this.length = Math.max(1, parseInt(String(length)) || 10);
    this.factor = Math.max(0.1, parseFloat(String(factor)) || 3);
  }

  calculate(candles: any[]) {
    try {
      if (!candles || candles.length < this.length) {
        return new Array(candles?.length || 0).fill(undefined);
      }

      const tr   = new Array(candles.length).fill(0);
      const atr  = new Array(candles.length).fill(0);
      const finalUpperBand = new Array(candles.length).fill(0);
      const finalLowerBand = new Array(candles.length).fill(0);
      const superTrend     = new Array(candles.length).fill(0);
      const direction      = new Array(candles.length).fill(1); // 1=up, -1=down

      for (let i = 0; i < candles.length; i++) {
        const high      = Number(candles[i].high)  || 0;
        const low       = Number(candles[i].low)   || 0;
        const close     = Number(candles[i].close) || 0;
        const prevClose = i > 0 ? (Number(candles[i - 1].close) || 0) : close;

        // True Range
        tr[i] = Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low  - prevClose)
        );

        // ATR (RMA / Wilder smoothing)
        if (i === 0) {
          atr[i] = tr[i];
        } else if (i < this.length) {
          let sum = 0;
          for (let j = 0; j <= i; j++) sum += tr[j];
          atr[i] = sum / (i + 1);
        } else {
          atr[i] = (atr[i - 1] * (this.length - 1) + tr[i]) / this.length;
        }

        // Basic bands
        const hl2 = (high + low) / 2;
        const basicUpper = hl2 + this.factor * atr[i];
        const basicLower = hl2 - this.factor * atr[i];

        // Final bands
        if (i === 0) {
          finalUpperBand[i] = basicUpper;
          finalLowerBand[i] = basicLower;
        } else {
          finalUpperBand[i] = (basicUpper < finalUpperBand[i - 1] || prevClose > finalUpperBand[i - 1])
            ? basicUpper : finalUpperBand[i - 1];
          finalLowerBand[i] = (basicLower > finalLowerBand[i - 1] || prevClose < finalLowerBand[i - 1])
            ? basicLower : finalLowerBand[i - 1];
        }

        // SuperTrend direction
        if (i === 0) {
          superTrend[i] = finalUpperBand[i];
          direction[i] = -1;
        } else {
          if (superTrend[i - 1] === finalUpperBand[i - 1]) {
            superTrend[i] = close <= finalUpperBand[i] ? finalUpperBand[i] : finalLowerBand[i];
            direction[i]  = close <= finalUpperBand[i] ? -1 : 1;
          } else {
            superTrend[i] = close >= finalLowerBand[i] ? finalLowerBand[i] : finalUpperBand[i];
            direction[i]  = close >= finalLowerBand[i] ?  1 : -1;
          }
        }
      }

      return candles.map((_, i) => {
        if (i < this.length) return { value: undefined, direction: direction[i], isFlip: false };
        return {
          value:     superTrend[i],
          direction: direction[i],
          isFlip:    i > 0 && direction[i] !== direction[i - 1],
        };
      });
    } catch (error) {
      console.error('SuperTrend Calculation Error:', error);
      return new Array(candles?.length || 0).fill(undefined);
    }
  }
}
