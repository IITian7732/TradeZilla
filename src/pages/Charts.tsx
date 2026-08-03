import React, { useState, useEffect } from 'react';
import ChartInstance from './ChartInstance';
import { useNavigate } from 'react-router-dom';

export default function Charts() {
  const [activeLayout, setActiveLayout] = useState('1');
  const [syncLayout, setSyncLayout] = useState({ symbol: true, interval: true, crosshair: false, time: true, dateRange: false });
  const [sharedInterval, setSharedInterval] = useState<any>('15m');
  const [activePaneId, setActivePaneId] = useState(0);

  const navigate = useNavigate();

  const getGridStyle = () => {
    switch (activeLayout) {
      case '1': return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
      case '2a': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
      case '2b': return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr' };
      case '3a': return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr' };
      case '3b': return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr 1fr' };
      case '3c': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case '3d': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case '3e': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case '3f': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case '4': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case '5': return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' };
      default: return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    }
  };

  const getPaneStyle = (paneIndex: number) => {
    const baseStyle = {
      position: 'relative' as const, 
      overflow: 'hidden', 
      background: '#FFFFFF',
      border: (activeLayout !== '1' && activePaneId === paneIndex) ? '2px solid #2962FF' : '2px solid transparent',
      boxSizing: 'border-box' as const,
      height: '100%',
      width: '100%'
    };

    if (activeLayout === '3c') {
      if (paneIndex === 0) return { ...baseStyle, gridColumn: '1', gridRow: '1 / span 2' };
      if (paneIndex === 1) return { ...baseStyle, gridColumn: '2', gridRow: '1' };
      if (paneIndex === 2) return { ...baseStyle, gridColumn: '2', gridRow: '2' };
    }
    if (activeLayout === '3d') {
      if (paneIndex === 0) return { ...baseStyle, gridColumn: '1', gridRow: '1' };
      if (paneIndex === 1) return { ...baseStyle, gridColumn: '1', gridRow: '2' };
      if (paneIndex === 2) return { ...baseStyle, gridColumn: '2', gridRow: '1 / span 2' };
    }
    if (activeLayout === '3e') {
      if (paneIndex === 0) return { ...baseStyle, gridColumn: '1 / span 2', gridRow: '1' };
      if (paneIndex === 1) return { ...baseStyle, gridColumn: '1', gridRow: '2' };
      if (paneIndex === 2) return { ...baseStyle, gridColumn: '2', gridRow: '2' };
    }
    if (activeLayout === '3f') {
      if (paneIndex === 0) return { ...baseStyle, gridColumn: '1', gridRow: '1' };
      if (paneIndex === 1) return { ...baseStyle, gridColumn: '2', gridRow: '1' };
      if (paneIndex === 2) return { ...baseStyle, gridColumn: '1 / span 2', gridRow: '2' };
    }
    
    return baseStyle;
  };

  const getPanes = () => {
    if (activeLayout === '1') return [0];
    if (activeLayout.startsWith('2')) return [0, 1];
    if (activeLayout.startsWith('3')) return [0, 1, 2];
    if (activeLayout === '4') return [0, 1, 2, 3];
    if (activeLayout === '5') return [0, 1, 2, 3, 4];
    return [0];
  };

  return (
    <div id="charts-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#FFFFFF', color: '#0F172A', overflow: 'hidden' }}>
      {/* Global Top Toolbar Portal Placeholder */}
      <div id="top-toolbar-portal" style={{ flexShrink: 0, width: '100%', background: '#FFFFFF' }} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Global Left Toolbar Portal Placeholder */}
        <div id="left-toolbar-portal" style={{ flexShrink: 0, height: '100%', background: '#FFFFFF' }} />

        {/* Grid Container */}
        <div style={{ display: 'grid', flex: 1, ...getGridStyle(), gap: '2px', background: '#E2E8F0' }}>
          {getPanes().map((paneIndex) => (
            <div 
              key={paneIndex} 
              onClick={() => setActivePaneId(paneIndex)}
              style={getPaneStyle(paneIndex)}
            >
              <ChartInstance
                paneId={`pane-${paneIndex}`}
                isPrimary={paneIndex === 0}
                isActive={activePaneId === paneIndex}
                activeLayout={activeLayout}
                onLayoutChange={setActiveLayout}
                syncLayout={syncLayout}
                onSyncLayoutChange={setSyncLayout}
                sharedInterval={sharedInterval}
                onSharedIntervalChange={setSharedInterval}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
