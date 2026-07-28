export class MacdCalculator {
  fastLength: number;
  slowLength: number;
  signalLength: number;
  source: string;

  constructor(fastLength = 12, slowLength = 26, signalLength = 9, source = 'close') {
    this.fastLength = Math.max(1, parseInt(String(fastLength)) || 12);
    this.slowLength = Math.max(1, parseInt(String(slowLength)) || 26);
    this.signalLength = Math.max(1, parseInt(String(signalLength)) || 9);
    this.source = source || 'close';
  }

  private calculateEMA(data: (number | undefined)[], length: number): (number | undefined)[] {
    const k = 2 / (length + 1);
    const ema: (number | undefined)[] = new Array(data.length).fill(undefined);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] === undefined || Number.isNaN(data[i])) continue;
      if (count < length) {
        sum += data[i] as number;
        count++;
        if (count === length) {
          ema[i] = sum / length;
        }
      } else {
        ema[i] = (data[i] as number) * k + (ema[i - 1] as number) * (1 - k);
      }
    }
    return ema;
  }

  calculate(candles: any[]) {
    try {
      if (!candles || candles.length === 0) return [];

      const sourceData = candles.map(c => {
        const val = Number(c[this.source]);
        return Number.isNaN(val) ? 0 : val;
      });

      const fastEma = this.calculateEMA(sourceData, this.fastLength);
      const slowEma = this.calculateEMA(sourceData, this.slowLength);

      const macdLine: (number | undefined)[] = new Array(candles.length).fill(undefined);
      for (let i = 0; i < candles.length; i++) {
        if (fastEma[i] !== undefined && slowEma[i] !== undefined) {
          macdLine[i] = (fastEma[i] as number) - (slowEma[i] as number);
        }
      }

      const signalLine = this.calculateEMA(macdLine, this.signalLength);

      const histogram: (number | undefined)[] = new Array(candles.length).fill(undefined);
      for (let i = 0; i < candles.length; i++) {
        if (macdLine[i] !== undefined && signalLine[i] !== undefined) {
          histogram[i] = (macdLine[i] as number) - (signalLine[i] as number);
        }
      }

      return candles.map((_, i) => {
        let phase = 0;
        if (histogram[i] !== undefined) {
          const currentHist = histogram[i] as number;
          const prevHist = i > 0 && histogram[i - 1] !== undefined ? histogram[i - 1] as number : currentHist;
          if (currentHist >= 0) {
            phase = currentHist >= prevHist ? 0 : 1;
          } else {
            phase = currentHist >= prevHist ? 2 : 3;
          }
        }
        return { macd: macdLine[i], signal: signalLine[i], histogram: histogram[i], phase };
      });
    } catch (error) {
      console.error('MACD Calculation Error:', error);
      return candles.map(() => ({ macd: undefined, signal: undefined, histogram: undefined, phase: 0 }));
    }
  }
}
