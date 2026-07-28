export class MacdCalculator {
  fastLength: number;
  slowLength: number;
  signalLength: number;
  source: string;

  constructor(fastLength = 12, slowLength = 26, signalLength = 9, source = 'close') {
    this.fastLength = Number(fastLength) || 12;
    this.slowLength = Number(slowLength) || 26;
    this.signalLength = Number(signalLength) || 9;
    this.source = source;
  }

  private calculateEMA(data: number[], length: number): number[] {
    const k = 2 / (length + 1);
    const ema = new Array(data.length).fill(undefined);
    
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i] === undefined || Number.isNaN(data[i])) {
        continue;
      }
      
      if (count < length) {
        sum += data[i];
        count++;
        if (count === length) {
          ema[i] = sum / length;
        }
      } else {
        ema[i] = data[i] * k + ema[i - 1] * (1 - k);
      }
    }
    
    return ema;
  }

  calculate(candles: any[]) {
    if (candles.length === 0) return [];

    const sourceData = candles.map(c => {
      const val = Number(c[this.source]);
      return Number.isNaN(val) ? 0 : val;
    });

    const fastEma = this.calculateEMA(sourceData, this.fastLength);
    const slowEma = this.calculateEMA(sourceData, this.slowLength);
    
    const macdLine = new Array(candles.length).fill(undefined);
    for (let i = 0; i < candles.length; i++) {
      if (fastEma[i] !== undefined && slowEma[i] !== undefined) {
        macdLine[i] = fastEma[i] - slowEma[i];
      }
    }

    const signalLine = this.calculateEMA(macdLine, this.signalLength);
    
    const histogram = new Array(candles.length).fill(undefined);
    for (let i = 0; i < candles.length; i++) {
      if (macdLine[i] !== undefined && signalLine[i] !== undefined) {
        histogram[i] = macdLine[i] - signalLine[i];
      }
    }

    const result = new Array(candles.length).fill(undefined);
    for (let i = 0; i < candles.length; i++) {
      let phase = 0; // 0 = default
      if (histogram[i] !== undefined) {
        const currentHist = histogram[i];
        const prevHist = i > 0 && histogram[i-1] !== undefined ? histogram[i-1] : currentHist;
        
        if (currentHist >= 0) {
          phase = currentHist >= prevHist ? 0 : 1;
        } else {
          phase = currentHist >= prevHist ? 2 : 3;
        }
      }

      result[i] = {
        macd: macdLine[i],
        signal: signalLine[i],
        histogram: histogram[i],
        phase: phase
      };
    }

    return result;
  }
}
