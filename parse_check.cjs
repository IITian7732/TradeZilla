const fs = require('fs');
const babel = require('@babel/parser');
const code = fs.readFileSync('src/components/ChartDrawingOverlay.tsx', 'utf-8');
try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Success");
} catch(e) {
  console.error(e.message);
}
