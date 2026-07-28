import fs from 'fs';

const path = '/Users/yashjaiswal/Downloads/AI Build Project/TradeZilla/src/pages/Charts.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the block:
//          Object.keys(pivotSettings.levels).forEach(level => { ... })
// and replace it.

const regex = /Object\.keys\(pivotSettings\.levels\)\.forEach\(level => \{[\s\S]*?\}\);/;

const replacement = `Object.keys(pivotSettings.levels).forEach(level => {
             const setting = pivotSettings.levels[level];
             if (!setting.show) return;
             
             // A level key can be 'P' or 'S1/R1' etc.
             const subLevels = level.split('/');
             subLevels.forEach(subLevel => {
                 const levelSeries = chart.addSeries(LineSeries, {
                    color: setting.color,
                    lineWidth: setting.thickness,
                    lineStyle: 0,
                    lineType: 1, // StepLine
                    visible: true,
                    lastValueVisible: pivotSettings.showLabels,
                    priceLineVisible: pivotSettings.showLabels,
                    title: pivotSettings.showLabels ? subLevel : '',
                 });
                 
                 const data = candles.map((c, i) => ({
                    time: c.time,
                    value: pivotData[i] ? pivotData[i][subLevel] : undefined
                 })).filter(d => d.value !== undefined && !Number.isNaN(d.value));
                 
                 levelSeries.setData(data);
                 seriesRef.current[id + '-' + subLevel] = levelSeries;
             });
          });`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("update_charts3 done");
