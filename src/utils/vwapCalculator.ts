export class VwapCalculator {
  source: string;
  anchor: string;

  constructor(source = 'hlc3', anchor = 'Session') {
    this.source = source || 'hlc3';
    this.anchor = anchor || 'Session';
  }

  calculate(candles: any[]): (number | undefined)[] {
    try {
      if (!candles || candles.length === 0) return [];

      const vwapValues: (number | undefined)[] = [];
      let cumulativeTPV = 0;
      let cumulativeVolume = 0;

      for (let i = 0; i < candles.length; i++) {
        const currentCandle = candles[i];
        const currentDate = new Date(currentCandle.timestamp || currentCandle.time * 1000 || currentCandle.time);

        if (i > 0) {
          const prevCandle = candles[i - 1];
          const prevDate = new Date(prevCandle.timestamp || prevCandle.time * 1000 || prevCandle.time);
          if (this.isNewAnchor(currentDate, prevDate)) {
            cumulativeTPV = 0;
            cumulativeVolume = 0;
          }
        }

        const price = this.getPrice(currentCandle);
        const volume = currentCandle.volume || 1; // default to 1 (TWAP) if no volume

        cumulativeTPV += price * volume;
        cumulativeVolume += volume;

        vwapValues.push(cumulativeVolume === 0 ? undefined : cumulativeTPV / cumulativeVolume);
      }

      return vwapValues;
    } catch (error) {
      console.error('VWAP Calculation Error:', error);
      return new Array(candles?.length || 0).fill(undefined);
    }
  }

  getPrice(candle: any): number {
    switch (this.source.toLowerCase()) {
      case 'open':  return candle.open  || 0;
      case 'high':  return candle.high  || 0;
      case 'low':   return candle.low   || 0;
      case 'close': return candle.close || 0;
      case 'hlc3':
      default:
        return ((candle.high || 0) + (candle.low || 0) + (candle.close || 0)) / 3;
    }
  }

  isNewAnchor(currentDate: Date, prevDate: Date): boolean {
    const anchor = this.anchor.toLowerCase();
    if (anchor === 'session') {
      return currentDate.getDate() !== prevDate.getDate() ||
             currentDate.getMonth() !== prevDate.getMonth() ||
             currentDate.getFullYear() !== prevDate.getFullYear();
    }
    if (anchor === 'week') {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 7) return true;
      const currentDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      const prevDay = prevDate.getDay() === 0 ? 7 : prevDate.getDay();
      return currentDay < prevDay;
    }
    if (anchor === 'month') {
      return currentDate.getMonth() !== prevDate.getMonth() ||
             currentDate.getFullYear() !== prevDate.getFullYear();
    }
    if (anchor === 'quarter') {
      const currentQ = Math.floor(currentDate.getMonth() / 3);
      const prevQ = Math.floor(prevDate.getMonth() / 3);
      return currentQ !== prevQ || currentDate.getFullYear() !== prevDate.getFullYear();
    }
    if (anchor === 'year') {
      return currentDate.getFullYear() !== prevDate.getFullYear();
    }
    if (anchor === 'decade') {
      return Math.floor(currentDate.getFullYear() / 10) !== Math.floor(prevDate.getFullYear() / 10);
    }
    if (anchor === 'century') {
      return Math.floor(currentDate.getFullYear() / 100) !== Math.floor(prevDate.getFullYear() / 100);
    }
    return false;
  }
}
