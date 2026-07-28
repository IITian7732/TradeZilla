const fs = require('fs');

const path = '/Users/yashjaiswal/Downloads/AI Build Project/TradeZilla/src/pages/Charts.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Pivot state
const pivotStateCode = `
  // Pivot Settings State
  const [pivotSettings, setPivotSettings] = useState({
    type: 'Traditional',
    showHistoricalPivots: true,
    timeframe: 'Auto',
    numberPivotsBack: 15,
    labelsFont: 11,
    showLabels: true,
    levels: {
      P: { show: true, color: '#f97316', thickness: 1 },
      'S1/R1': { show: true, color: '#f97316', thickness: 1 },
      'S2/R2': { show: true, color: '#f97316', thickness: 1 },
      'S3/R3': { show: true, color: '#f97316', thickness: 1 },
      'S4/R4': { show: true, color: '#f97316', thickness: 1 },
      'S5/R5': { show: true, color: '#f97316', thickness: 1 }
    }
  });
  const prevPivotSettings = useRef(pivotSettings);
  const [tempPivotSettings, setTempPivotSettings] = useState(pivotSettings);
  const [isPivotSettingsModalOpen, setIsPivotSettingsModalOpen] = useState(false);
  const [pivotSettingsActiveTab, setPivotSettingsActiveTab] = useState('Inputs');
`;

content = content.replace(
  "const [vwapSettingsActiveTab, setVwapSettingsActiveTab] = useState('Inputs');",
  "const [vwapSettingsActiveTab, setVwapSettingsActiveTab] = useState('Inputs');\n" + pivotStateCode
);

// 2. Add to ChartHistorySnapshot
content = content.replace(
  "vwapSettings: any;",
  "vwapSettings: any;\n    pivotSettings: any;"
);

// 3. Update History initial and currentState
content = content.replace(
  /setHistory\(\[\{ drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, volumeSettings, candleSettings \}\]\);/g,
  "setHistory([{ drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, pivotSettings, volumeSettings, candleSettings }]);"
);
content = content.replace(
  /const currentState = prevHistory\[prevIndex >= 0 \? prevIndex : 0\] \|\| \{ drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, volumeSettings, candleSettings \};/g,
  "const currentState = prevHistory[prevIndex >= 0 ? prevIndex : 0] || { drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, pivotSettings, volumeSettings, candleSettings };"
);

// 4. Update handleUndo / handleRedo
content = content.replace(
  "setVwapSettings(snapshot.vwapSettings);\n        setVolumeSettings(snapshot.volumeSettings);",
  "setVwapSettings(snapshot.vwapSettings);\n        setPivotSettings(snapshot.pivotSettings);\n        setVolumeSettings(snapshot.volumeSettings);"
);
content = content.replace(
  "setVwapSettings(snapshot.vwapSettings);\n        setVolumeSettings(snapshot.volumeSettings);",
  "setVwapSettings(snapshot.vwapSettings);\n        setPivotSettings(snapshot.pivotSettings);\n        setVolumeSettings(snapshot.volumeSettings);"
); // Two occurrences for undo and redo

// 5. Update useEffect dependencies
content = content.replace(
  "atrSettings, vwapSettings]);",
  "atrSettings, vwapSettings, pivotSettings]);"
);
content = content.replace(
  "atrSettings, vwapSettings]);",
  "atrSettings, vwapSettings, pivotSettings]);"
);

// 6. Update Legend settings click
const onClickPivot1 = `
                              } else if (ind.startsWith('PIVOT POINTS')) {
                                setTempPivotSettings(pivotSettings);
                                setPivotSettingsActiveTab('Inputs');
                                setIsPivotSettingsModalOpen(true);
`;
content = content.replace(
  "setIsVwapSettingsModalOpen(true);\n                              }",
  "setIsVwapSettingsModalOpen(true);\n                              }" + onClickPivot1
);
// Another one at line 1998
content = content.replace(
  "setIsVwapSettingsModalOpen(true);\n                                }",
  "setIsVwapSettingsModalOpen(true);\n                                }" + onClickPivot1
);

// 7. Pivot Modal JSX
const pivotModalJSX = \`
      {/* Pivot Settings Modal */}
      {isPivotSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#0F172A', fontWeight: 600 }}>Pivots</h2>
              <button onClick={() => { setIsPivotSettingsModalOpen(false); setTempPivotSettings(pivotSettings); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
              {['Inputs', 'Style'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setPivotSettingsActiveTab(tab)}
                  style={{ 
                    padding: '16px 12px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: pivotSettingsActiveTab === tab ? 600 : 500,
                    color: pivotSettingsActiveTab === tab ? '#0F172A' : '#64748B',
                    borderBottom: pivotSettingsActiveTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                    marginRight: 16
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              {pivotSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Type</span>
                    <select value={tempPivotSettings.type} onChange={(e) => setTempPivotSettings({...tempPivotSettings, type: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      <option value="Traditional">Traditional</option>
                      <option value="Fibonacci">Fibonacci</option>
                      <option value="Woodie">Woodie</option>
                      <option value="Classic">Classic</option>
                      <option value="DM">DM</option>
                      <option value="Camarilla">Camarilla</option>
                    </select>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={tempPivotSettings.showHistoricalPivots} onChange={(e) => setTempPivotSettings({...tempPivotSettings, showHistoricalPivots: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Show historical pivots</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Pivots Timeframe</span>
                    <select value={tempPivotSettings.timeframe} onChange={(e) => setTempPivotSettings({...tempPivotSettings, timeframe: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      <option value="Auto">Auto</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Number of Pivots Back</span>
                    <input type="number" value={tempPivotSettings.numberPivotsBack} onChange={(e) => setTempPivotSettings({...tempPivotSettings, numberPivotsBack: parseInt(e.target.value)})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              
              {pivotSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#0F172A', minWidth: 80 }}>Labels font</span>
                    <select value={tempPivotSettings.labelsFont} onChange={(e) => setTempPivotSettings({...tempPivotSettings, labelsFont: parseInt(e.target.value)})} style={{ width: 80, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      {[8, 9, 10, 11, 12, 14, 16, 20, 24].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={tempPivotSettings.showLabels} onChange={(e) => setTempPivotSettings({...tempPivotSettings, showLabels: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Labels</span>
                  </label>

                  {['P', 'S1/R1', 'S2/R2', 'S3/R3', 'S4/R4', 'S5/R5'].map(level => (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minWidth: 80 }}>
                        <input 
                          type="checkbox" 
                          checked={tempPivotSettings.levels[level].show} 
                          onChange={(e) => setTempPivotSettings({
                            ...tempPivotSettings, 
                            levels: { 
                              ...tempPivotSettings.levels, 
                              [level]: { ...tempPivotSettings.levels[level], show: e.target.checked } 
                            }
                          })} 
                          style={{ width: 16, height: 16, accentColor: '#3b82f6' }} 
                        />
                        <span style={{ fontSize: 14, color: '#0F172A' }}>{level}</span>
                      </label>
                      
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                        <input 
                          type="color" 
                          value={tempPivotSettings.levels[level].color} 
                          onChange={(e) => setTempPivotSettings({
                            ...tempPivotSettings, 
                            levels: { 
                              ...tempPivotSettings.levels, 
                              [level]: { ...tempPivotSettings.levels[level], color: e.target.value } 
                            }
                          })} 
                          style={{ width: 36, height: 32, padding: 0, border: 'none', cursor: 'pointer' }} 
                        />
                        <div style={{ width: 1, height: 32, background: '#E2E8F0' }} />
                        <select 
                          value={tempPivotSettings.levels[level].thickness} 
                          onChange={(e) => setTempPivotSettings({
                            ...tempPivotSettings, 
                            levels: { 
                              ...tempPivotSettings.levels, 
                              [level]: { ...tempPivotSettings.levels[level], thickness: parseInt(e.target.value) } 
                            }
                          })} 
                          style={{ width: 44, height: 32, padding: '0 4px', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value={1}>—</option>
                          <option value={2}>▬▬</option>
                          <option value={3}>██</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsPivotSettingsModalOpen(false); setTempPivotSettings(pivotSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setPivotSettings(tempPivotSettings); pushToHistory({ pivotSettings: tempPivotSettings }); setIsPivotSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
\`;
`;

content = content.replace(
  "{/* VWAP Settings Modal */}",
  pivotModalJSX + "\n      {/* VWAP Settings Modal */}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully updated Charts.tsx");
