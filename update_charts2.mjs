import fs from 'fs';

const path = '/Users/yashjaiswal/Downloads/AI Build Project/TradeZilla/src/pages/Charts.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add PivotCalculator import
if (!content.includes('import { PivotCalculator }')) {
  content = content.replace(
    "import { VwapCalculator } from '../utils/vwapCalculator';",
    "import { VwapCalculator } from '../utils/vwapCalculator';\nimport { PivotCalculator } from '../utils/pivotCalculator';"
  );
}

// 2. Add clearing of stale PIVOT POINTS
const stalePivotCode = `
    // Check if PIVOT POINTS settings changed and clear stale ones
    if (JSON.stringify(prevPivotSettings.current) !== JSON.stringify(pivotSettings)) {
       Object.keys(seriesRef.current).forEach(sid => {
         if (sid.startsWith('PIVOT POINTS')) {
            try { chart.removeSeries(seriesRef.current[sid]); } catch(e){}
            delete seriesRef.current[sid];
         }
       });
       prevPivotSettings.current = pivotSettings;
    }
`;
if (!content.includes('prevPivotSettings.current = pivotSettings;')) {
    content = content.replace(
      "// Check if VWAP settings changed and clear stale ones",
      stalePivotCode + "\n    // Check if VWAP settings changed and clear stale ones"
    );
}

// 3. Add PIVOT POINTS logic inside updateIndicators (around line 1122, after VWAP)
const pivotPointsIndicatorCode = `
        } else if (type === 'PIVOT POINTS') {
          const pivotCalc = new PivotCalculator(pivotSettings.type, pivotSettings.timeframe, pivotSettings.numberPivotsBack);
          const pivotData = pivotCalc.calculate(candles);
          
          Object.keys(pivotSettings.levels).forEach(level => {
             const setting = pivotSettings.levels[level];
             if (!setting.show) return;
             
             const levelSeries = chart.addSeries(LineSeries, {
                color: setting.color,
                lineWidth: setting.thickness,
                lineStyle: 0,
                lineType: 1, // StepLine
                visible: true,
                lastValueVisible: pivotSettings.showLabels,
                priceLineVisible: pivotSettings.showLabels,
                title: pivotSettings.showLabels ? level : '',
             });
             
             const data = candles.map((c, i) => ({
                time: c.time,
                value: pivotData[i] ? pivotData[i][level] : undefined
             })).filter(d => d.value !== undefined && !Number.isNaN(d.value));
             
             levelSeries.setData(data);
             seriesRef.current[id + '-' + level] = levelSeries;
          });
          // We don't have a base series for PIVOT POINTS, so we skip setting seriesRef.current[id]
          // But we want it to be considered "created", so we can set a dummy or just ignore it.
          seriesRef.current[id] = { applyOptions: (opt) => {} };
`;

// Replace `} else if (type === 'VWAP') { ... }` with the above appended
// I'll regex it carefully.
const regexVWAP = /(} else if \(type === 'VWAP'\) \{[\s\S]*?vwapCalc\.calculate\(candles\);\s*series\.setData.*?;\s*\})/;
content = content.replace(regexVWAP, "$1" + pivotPointsIndicatorCode);

// 4. Update the suffixes array for removing stale indicators
const regexSuffixes = /\[\'-mainbg\', \'-bg\', \'-upper\', \'-middle\', \'-lower\', \'-ma\', \'-border\', \'-histogram\', \'-signal\'\]/;
content = content.replace(regexSuffixes, "['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal', '-P', '-S1/R1', '-S2/R2', '-S3/R3', '-S4/R4', '-S5/R5']");

// Wait, the suffixes I used in PIVOT POINTS are level names ('P', 'S1/R1' etc).
// The level key is exactly what's in pivotSettings.levels.
// So id + '-P', id + '-S1/R1'.
// Let's make sure the suffixes cover them.

// 5. Update visibility toggling in else block
const replaceElseVisibility = `
      } else {
        if (seriesRef.current[id]) seriesRef.current[id].applyOptions({ visible: !hiddenIndicators.includes(id) });
        ['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal', '-P', '-S1/R1', '-S2/R2', '-S3/R3', '-S4/R4', '-S5/R5'].forEach(suffix => {
          if (seriesRef.current[id + suffix]) {
            seriesRef.current[id + suffix].applyOptions({ visible: !hiddenIndicators.includes(id) });
          }
        });
      }
`;
// Let's find the existing else block
const existingElseBlock = /\} else \{\s*seriesRef\.current\[id\]\.applyOptions\(\{ visible: !hiddenIndicators\.includes\(id\) \}\);\s*if \(seriesRef\.current\[id \+ '-histogram'\]\) \{\s*seriesRef\.current\[id \+ '-histogram'\]\.applyOptions\(\{ visible: !hiddenIndicators\.includes\(id\) \}\);\s*\}\s*if \(seriesRef\.current\[id \+ '-signal'\]\) \{\s*seriesRef\.current\[id \+ '-signal'\]\.applyOptions\(\{ visible: !hiddenIndicators\.includes\(id\) \}\);\s*\}\s*\}/;

content = content.replace(existingElseBlock, replaceElseVisibility);


fs.writeFileSync(path, content, 'utf8');
console.log("update_charts2 done");
