export class PivotCalculator {
  type: string;
  timeframe: string;
  numberPivotsBack: number;

  constructor(type = 'Traditional', timeframe = 'Auto', numberPivotsBack = 15) {
    this.type = type;
    this.timeframe = timeframe === 'Auto' ? 'Daily' : timeframe;
    this.numberPivotsBack = numberPivotsBack;
  }

  calculate(candles: any[]) {
    if (!candles || candles.length === 0) return [];

    const results = [];
    
    // We need to find the high, low, close of the *previous* period.
    // A period is defined by timeframe (e.g. Daily).
    
    let currentPeriodHigh = -Infinity;
    let currentPeriodLow = Infinity;
    let currentPeriodClose = 0;
    
    let prevPeriodHigh = -Infinity;
    let prevPeriodLow = Infinity;
    let prevPeriodClose = 0;
    
    let hasPrevPeriod = false;
    let currentPivots: any = null;

    let periodCount = 0;
    let periodStarts = []; // To keep track of where periods start for numberPivotsBack filtering

    for (let i = 0; i < candles.length; i++) {
      const currentCandle = candles[i];
      const currentDate = new Date(currentCandle.timestamp || currentCandle.time * 1000 || currentCandle.time);
      
      let isNewPeriod = false;
      if (i === 0) {
          isNewPeriod = true;
          currentPeriodHigh = currentCandle.high;
          currentPeriodLow = currentCandle.low;
          currentPeriodClose = currentCandle.close;
      } else {
        const prevCandle = candles[i - 1];
        const prevDate = new Date(prevCandle.timestamp || prevCandle.time * 1000 || prevCandle.time);
        isNewPeriod = this.isNewAnchor(currentDate, prevDate);
      }

      if (isNewPeriod && i > 0) {
        prevPeriodHigh = currentPeriodHigh;
        prevPeriodLow = currentPeriodLow;
        prevPeriodClose = currentPeriodClose;
        hasPrevPeriod = true;
        
        currentPeriodHigh = currentCandle.high;
        currentPeriodLow = currentCandle.low;
        currentPeriodClose = currentCandle.close;
        
        currentPivots = this.calculatePivots(prevPeriodHigh, prevPeriodLow, prevPeriodClose);
        periodCount++;
        periodStarts.push(i);
      } else if (i > 0) {
        currentPeriodHigh = Math.max(currentPeriodHigh, currentCandle.high);
        currentPeriodLow = Math.min(currentPeriodLow, currentCandle.low);
        currentPeriodClose = currentCandle.close;
      }

      if (hasPrevPeriod && currentPivots) {
        results.push({ ...currentPivots, periodIndex: periodCount });
      } else {
        results.push(null);
      }
    }
    
    // Process numberPivotsBack
    const thresholdPeriod = periodCount - this.numberPivotsBack;
    for (let i = 0; i < results.length; i++) {
        if (results[i] && results[i].periodIndex < thresholdPeriod) {
            results[i] = null; // Only keep the last N pivots
        }
    }
    
    return results;
  }

  calculatePivots(H: number, L: number, C: number) {
    let P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5;
    
    if (this.type === 'Fibonacci') {
        P = (H + L + C) / 3;
        const range = H - L;
        R1 = P + 0.382 * range;
        S1 = P - 0.382 * range;
        R2 = P + 0.618 * range;
        S2 = P - 0.618 * range;
        R3 = P + 1.000 * range;
        S3 = P - 1.000 * range;
        R4 = P + 1.382 * range;
        S4 = P - 1.382 * range;
        R5 = P + 1.618 * range;
        S5 = P - 1.618 * range;
    } else if (this.type === 'Woodie') {
        P = (H + L + 2 * C) / 4;
        const range = H - L;
        R1 = (2 * P) - L;
        S1 = (2 * P) - H;
        R2 = P + range;
        S2 = P - range;
        R3 = H + 2 * (P - L);
        S3 = L - 2 * (H - P);
        R4 = R3 + range;
        S4 = S3 - range;
        R5 = R4 + range;
        S5 = S4 - range;
    } else if (this.type === 'Camarilla') {
        const range = H - L;
        P = (H + L + C) / 3;
        R1 = C + range * 1.1 / 12;
        S1 = C - range * 1.1 / 12;
        R2 = C + range * 1.1 / 6;
        S2 = C - range * 1.1 / 6;
        R3 = C + range * 1.1 / 4;
        S3 = C - range * 1.1 / 4;
        R4 = C + range * 1.1 / 2;
        S4 = C - range * 1.1 / 2;
        R5 = H / L * C;
        S5 = C - (R5 - C);
    } else {
        // Traditional / Classic / DM etc (Defaulting to Traditional)
        P = (H + L + C) / 3;
        R1 = (2 * P) - L;
        S1 = (2 * P) - H;
        R2 = P + (H - L);
        S2 = P - (H - L);
        R3 = H + 2 * (P - L);
        S3 = L - 2 * (H - P);
        R4 = P + 3 * (H - L);
        S4 = P - 3 * (H - L);
        R5 = P + 4 * (H - L);
        S5 = P - 4 * (H - L);
    }
    
    return { P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5 };
  }

  isNewAnchor(currentDate: Date, prevDate: Date) {
    const anchor = this.timeframe.toLowerCase();
    
    if (anchor === 'daily' || anchor === 'auto') {
      return currentDate.getDate() !== prevDate.getDate() || 
             currentDate.getMonth() !== prevDate.getMonth() || 
             currentDate.getFullYear() !== prevDate.getFullYear();
    }
    
    if (anchor === 'weekly') {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 7) return true;
      
      const currentDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      const prevDay = prevDate.getDay() === 0 ? 7 : prevDate.getDay();
      return currentDay < prevDay;
    }

    if (anchor === 'monthly') {
      return currentDate.getMonth() !== prevDate.getMonth() ||
             currentDate.getFullYear() !== prevDate.getFullYear();
    }
    
    if (anchor === 'yearly') {
      return currentDate.getFullYear() !== prevDate.getFullYear();
    }

    return false;
  }
}
