import { MacdCalculator } from './src/utils/macdCalculator';
import { generateMockOHLCV } from './src/api/marketData';

const candles = generateMockOHLCV('RELIANCE', '15m', 100);
const calc = new MacdCalculator(12, 26, 9, 'close');
const res = calc.calculate(candles);
console.log(res.slice(-5));
