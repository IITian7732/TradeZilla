export class VwapCalculator {
  source: string;
  anchor: string;

  constructor(source = 'hlc3', anchor = 'Session') {
    this.source = source;
    this.anchor = anchor;
  }

  calculate(candles: any[]) {
    if (!candles || candles.length === 0) return [];

    const vwapValues = [];
    let cumulativeTypicalPriceVolume = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < candles.length; i++) {
      const currentCandle = candles[i];
      const currentDate = new Date(currentCandle.timestamp || currentCandle.time * 1000 || currentCandle.time);

      if (i > 0) {
        const prevCandle = candles[i - 1];
        const prevDate = new Date(prevCandle.timestamp || prevCandle.time * 1000 || prevCandle.time);
        
        if (this.isNewAnchor(currentDate, prevDate)) {
          cumulativeTypicalPriceVolume = 0;
          cumulativeVolume = 0;
        }
      }

      const price = this.getPrice(currentCandle);
      const volume = currentCandle.volume || 1; // Default to 1 (TWAP) if volume is 0 or missing

      cumulativeTypicalPriceVolume += price * volume;
      cumulativeVolume += volume;

      if (cumulativeVolume === 0) {
         // Fallback to simple price if no volume
         vwapValues.push(price);
      } else {
         vwapValues.push(cumulativeTypicalPriceVolume / cumulativeVolume);
      }
    }

    return vwapValues;
  }

  getPrice(candle: any) {
    switch (this.source.toLowerCase()) {
      case 'open': return candle.open;
      case 'high': return candle.high;
      case 'low': return candle.low;
      case 'close': return candle.close;
      case 'hlc3': 
      default:
        return (candle.high + candle.low + candle.close) / 3;
    }
  }

  isNewAnchor(currentDate: Date, prevDate: Date) {
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
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      const prevQuarter = Math.floor(prevDate.getMonth() / 3);
      return currentQuarter !== prevQuarter ||
             currentDate.getFullYear() !== prevDate.getFullYear();
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
