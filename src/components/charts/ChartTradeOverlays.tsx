import React, { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import type { Holding } from '../../types/trade';
import { X } from 'lucide-react';

interface ChartTradeOverlaysProps {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  holding: Holding;
  onConfirmExit: () => void;
  onConfirmTP: (price: number) => void;
  onConfirmSL: (price: number) => void;
  onRemoveTP: () => void;
  onRemoveSL: () => void;
}

export function ChartTradeOverlays({
  chart, series, holding,
  onConfirmExit, onConfirmTP, onConfirmSL, onRemoveTP, onRemoveSL
}: ChartTradeOverlaysProps) {
  
  const [coords, setCoords] = useState<{ entry: number | null, tp: number | null, sl: number | null }>({ entry: null, tp: null, sl: null });
  const [dragging, setDragging] = useState<'TP' | 'SL' | null>(null);
  const [dragPrice, setDragPrice] = useState<number | null>(null);
  
  // Reference for requestAnimationFrame loop
  const requestRef = useRef<number | null>(null);

  const calculateCoords = () => {
    if (!series) return;
    
    // We only update if the coordinates actually changed to avoid massive re-renders
    const newEntry = series.priceToCoordinate(holding.avgBuyPrice);
    const newTp = holding.tp ? series.priceToCoordinate(holding.tp) : null;
    const newSl = holding.sl ? series.priceToCoordinate(holding.sl) : null;

    if (newEntry === null) {
      console.log('ChartTradeOverlays: newEntry is null for price', holding.avgBuyPrice);
    }
    
    setCoords(prev => {
      if (prev.entry !== newEntry || prev.tp !== newTp || prev.sl !== newSl) {
        return { entry: newEntry ?? null, tp: newTp ?? null, sl: newSl ?? null };
      }
      return prev;
    });
    
    requestRef.current = requestAnimationFrame(calculateCoords);
  };

  useEffect(() => {
    if (!series) return;
    requestRef.current = requestAnimationFrame(calculateCoords);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [series, holding.avgBuyPrice, holding.tp, holding.sl]);

  // Dragging logic
  useEffect(() => {
    if (!dragging || !series) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = (chart?.chartElement() as HTMLElement)?.getBoundingClientRect();
      if (!rect) return;
      const y = e.clientY - rect.top;
      const price = series.coordinateToPrice(y as any);
      if (price !== null) setDragPrice(price);
    };

    const handleMouseUp = () => {
      if (dragPrice !== null) {
        if (dragging === 'TP') onConfirmTP(dragPrice);
        if (dragging === 'SL') onConfirmSL(dragPrice);
      }
      setDragging(null);
      setDragPrice(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragPrice, series, chart, onConfirmTP, onConfirmSL]);

  if (!series || coords.entry === null) return null;

  // Render variables
  const dragY = dragPrice !== null ? series.priceToCoordinate(dragPrice) : null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      
      {/* Dragging Preview Line */}
      {dragging && dragY !== null && dragPrice !== null && (
        <div style={{ position: 'absolute', top: dragY, left: 0, right: 0, height: 0, borderTop: `1px dashed ${dragging === 'TP' ? '#10B981' : '#F59E0B'}` }}>
          <div style={{ position: 'absolute', right: 0, top: -10, background: dragging === 'TP' ? '#10B981' : '#F59E0B', color: '#fff', padding: '2px 8px', fontSize: 12, borderRadius: '4px 0 0 4px' }}>
            {dragPrice.toFixed(2)}
          </div>
        </div>
      )}

      {/* --- ENTRY LINE OVERLAYS --- */}
      <div style={{ position: 'absolute', top: coords.entry - 12, right: '20%', display: 'flex', alignItems: 'center', pointerEvents: 'auto', gap: 4, paddingRight: 8 }}>
        
        {/* TP/SL Add Buttons */}
        <div style={{ display: 'flex', gap: 2 }}>
          {!holding.tp && (
            <div 
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('TP'); setDragPrice(holding.avgBuyPrice); }}
              style={{ background: '#1E293B', color: '#10B981', border: '1px solid #10B981', padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 2, cursor: 'ns-resize' }}
            >
              TP
            </div>
          )}
          {!holding.sl && (
            <div 
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('SL'); setDragPrice(holding.avgBuyPrice); }}
              style={{ background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B', padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 2, cursor: 'ns-resize' }}
            >
              SL
            </div>
          )}
        </div>

        {/* Entry Text Badge */}
        <div style={{ background: '#1E293B', color: '#3B82F6', border: '1px solid #3B82F6', padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
          Entry
        </div>

        {/* Main Badge Group */}
        <div style={{ display: 'flex', alignItems: 'stretch', background: '#1E293B', borderRadius: 4, overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#FFFFFF', background: '#3B82F6', display: 'flex', alignItems: 'center' }}>
            {holding.quantity}
          </div>
          <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: (holding.pnl ?? 0) >= 0 ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center' }}>
            {(holding.pnl ?? 0) >= 0 ? '+' : ''}{(holding.pnl ?? 0).toFixed(2)}
          </div>
          <div 
            onClick={onConfirmExit}
            style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderLeft: '1px solid #334155' }}
            title="Close Position"
          >
            <X size={12} color="#94A3B8" />
          </div>
        </div>
      </div>

      {/* --- TP LINE OVERLAYS --- */}
      {holding.tp && coords.tp !== null && (
        <div style={{ position: 'absolute', top: coords.tp - 12, right: '20%', display: 'flex', alignItems: 'center', pointerEvents: 'auto', gap: 4, paddingRight: 8 }}>
          
          {/* TP Badge */}
          <div 
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('TP'); setDragPrice(holding.tp!); }}
            style={{ background: '#1E293B', color: '#10B981', border: '1px solid #10B981', padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 2, cursor: 'ns-resize' }}
          >
            TP
          </div>

          {/* Main Badge Group */}
          <div style={{ display: 'flex', alignItems: 'stretch', background: '#1E293B', borderRadius: 4, overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#FFFFFF', background: '#3B82F6', display: 'flex', alignItems: 'center' }}>
              {holding.quantity}
            </div>
            <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center' }}>
              +{(holding.quantity * (holding.tp - holding.avgBuyPrice)).toFixed(2)}
            </div>
            <div 
              onClick={onRemoveTP}
              style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderLeft: '1px solid #334155' }}
              title="Remove TP"
            >
              <X size={12} color="#94A3B8" />
            </div>
          </div>
        </div>
      )}

      {/* --- SL LINE OVERLAYS --- */}
      {holding.sl && coords.sl !== null && (
        <div style={{ position: 'absolute', top: coords.sl - 12, right: '20%', display: 'flex', alignItems: 'center', pointerEvents: 'auto', gap: 4, paddingRight: 8 }}>
          
          {/* SL Badge */}
          <div 
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('SL'); setDragPrice(holding.sl!); }}
            style={{ background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B', padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 2, cursor: 'ns-resize' }}
          >
            SL
          </div>

          {/* Main Badge Group */}
          <div style={{ display: 'flex', alignItems: 'stretch', background: '#1E293B', borderRadius: 4, overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#FFFFFF', background: '#F59E0B', display: 'flex', alignItems: 'center' }}>
              {holding.quantity}
            </div>
            <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#F59E0B', display: 'flex', alignItems: 'center' }}>
              {(holding.quantity * (holding.sl - holding.avgBuyPrice)).toFixed(2)}
            </div>
            <div 
              onClick={onRemoveSL}
              style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderLeft: '1px solid #334155' }}
              title="Remove SL"
            >
              <X size={12} color="#94A3B8" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
