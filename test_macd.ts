import { MacdCalculator } from './src/utils/macdCalculator';
const candles = [];
let val = 100;
for(let i=0; i<50; i++) {
  candles.push({ close: val });
  val += (Math.random() - 0.5) * 2;
}
const macd = new MacdCalculator(12, 26, 9, 'close');
const result = macd.calculate(candles);
console.log(result.slice(25, 40));
