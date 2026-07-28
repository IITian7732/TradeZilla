const fs = require('fs');
const file = 'src/pages/Charts.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Refs
content = content.replace(
  "const chartContainerRef = useRef<HTMLDivElement>(null);",
  "const chartContainerRef = useRef<HTMLDivElement>(null);\n  const bottomChartContainersRef = useRef<Record<string, HTMLDivElement | null>>({});\n  const bottomChartsRef = useRef<Record<string, any>>({});"
);

// 2. Modify JSX
const jsxOld = `              <div ref={chartContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />`;
const jsxNew = `              <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div 
                  ref={chartContainerRef} 
                  style={{ height: activeIndicators.some(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR')) ? \`\${(1 - rsiHeightRatio) * 100}%\` : '100%', position: 'relative' }} 
                />
              </div>`;
content = content.replace(jsxOld, jsxNew);

// Write back
fs.writeFileSync(file, content);
console.log("Done");
