import React, { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Trash2, GripVertical, PaintBucket, Pencil, Settings, Type, Bold, Italic } from 'lucide-react';

export type Point = { logical: number; price: number };
export type DrawingType = 'trend_line' | 'horizontal_line' | 'vertical_line' | 'rectangle' | 'circle' | 'parallel_channel' | 'fib_retracement' | 'text' | 'measure' | 'cursor' | 'long_position' | 'short_position' | 'alert';

export const DEFAULT_FIB_LEVELS = [
  { level: 0, visible: true, color: '#787B86' },
  { level: 0.236, visible: true, color: '#F44336' },
  { level: 0.382, visible: true, color: '#81C784' },
  { level: 0.5, visible: true, color: '#4CAF50' },
  { level: 0.618, visible: true, color: '#009688' },
  { level: 0.786, visible: true, color: '#64B5F6' },
  { level: 1, visible: true, color: '#787B86' },
  { level: 1.618, visible: true, color: '#2196F3' }
];

export interface Drawing {
  id: string;
  type: DrawingType;
  points: Point[];
  color: string;
  fillColor?: string;
  fillOpacity?: number;
  thickness?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  text?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  showBackground?: boolean;
  backgroundColor?: string;
  showBorder?: boolean;
  borderColor?: string;
  textWrap?: boolean;
  fibLevels?: { level: number; visible: boolean; color: string }[];
  showFibTrendline?: boolean;
  profitColor?: string;
  lossColor?: string;
}

interface ChartDrawingOverlayProps {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  activeTool: DrawingType;
  setActiveTool: (tool: DrawingType) => void;
  drawings: Drawing[];
  setDrawings: React.Dispatch<React.SetStateAction<Drawing[]>>;
  onHistoryCommit?: (newDrawings: Drawing[]) => void;
  triggerResize?: number;
  currentPrice?: number;
  candles?: any[];
  alerts?: any[];
  onRemoveAlert?: (id: number) => void;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#0ea5e9', '#3b82f6', '#a855f7', '#ec4899', '#64748b', '#000000'];
const FONT_SIZES = [10, 11, 12, 14, 16, 20, 24, 28, 32, 40];

export const ChartDrawingOverlay: React.FC<ChartDrawingOverlayProps> = ({ chart, series, activeTool, setActiveTool, drawings, setDrawings, onHistoryCommit, triggerResize, currentPrice, candles, alerts, onRemoveAlert }) => {
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [pointDrag, setPointDrag] = useState<{ id: string; type: 'body' | 'entry' | 'target' | 'stop' | 'right_edge' | 'move' | 'resize'; pointIndex?: number; startPoints: Point[]; startMouse: Point; currentMouse?: Point } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const [forceRender, setForceRender] = useState(0);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  useEffect(() => { hoveredIdRef.current = hoveredId; }, [hoveredId]);
  const [toolbarPos, setToolbarPos] = useState<{ x: number, y: number } | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFibSettingsOpen, setIsFibSettingsOpen] = useState(false);
  const [isTextSettingsOpen, setIsTextSettingsOpen] = useState(false);

  const overlayRef = useRef<SVGSVGElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [triggerResize]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Ignore clicks inside the toolbar
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }
      // Ignore clicks inside the settings modal
      if (modalRef.current && modalRef.current.contains(e.target as Node)) {
        return;
      }
      // Ignore clicks on the SVG drawings (let them handle their own selection)
      if (e.target instanceof SVGElement && overlayRef.current && overlayRef.current.contains(e.target as Node)) {
        return;
      }
      // Otherwise, we clicked somewhere else on the screen (including chart canvas), clear selection
      setSelectedId(null);
      setDrawings(prev => prev.filter(d => d.type !== 'measure'));
    };

    const handleMouseUp = () => {
      setPointDrag(prev => {
        if (prev) {
          if (prev.currentMouse) {
            // Apply drag to drawings
            setDrawings(oldDrawings => {
              const next = oldDrawings.map(d => {
                if (d.id !== prev.id) return d;
                const deltaLogical = prev.currentMouse!.logical - prev.startMouse.logical;
                const deltaPrice = prev.currentMouse!.price - prev.startMouse.price;
                const newPoints = [...prev.startPoints];
                if (prev.type === 'move' || prev.type === 'body') {
                  for (let i = 0; i < newPoints.length; i++) {
                    newPoints[i] = { logical: prev.startPoints[i].logical + deltaLogical, price: prev.startPoints[i].price + deltaPrice };
                  }
                } else if (prev.type === 'resize' && prev.pointIndex !== undefined) {
                  newPoints[prev.pointIndex] = { logical: prev.startPoints[prev.pointIndex].logical + deltaLogical, price: prev.startPoints[prev.pointIndex].price + deltaPrice };
                } else if (prev.type === 'entry') {
                  newPoints[0] = { logical: prev.startPoints[0].logical + deltaLogical, price: prev.startPoints[0].price + deltaPrice };
                  if (newPoints.length > 2) {
                    newPoints[1] = { logical: prev.startPoints[1].logical + deltaLogical, price: prev.startPoints[1].price + deltaPrice };
                    newPoints[2] = { logical: prev.startPoints[2].logical + deltaLogical, price: prev.startPoints[2].price + deltaPrice };
                  }
                } else if (prev.type === 'target') {
                  newPoints[1] = { logical: prev.startPoints[1].logical, price: prev.startPoints[1].price + deltaPrice };
                } else if (prev.type === 'stop') {
                  newPoints[2] = { logical: prev.startPoints[2].logical, price: prev.startPoints[2].price + deltaPrice };
                } else if (prev.type === 'right_edge') {
                  if (newPoints.length > 2) {
                    newPoints[1] = { logical: prev.startPoints[1].logical + deltaLogical, price: prev.startPoints[1].price };
                    newPoints[2] = { logical: prev.startPoints[2].logical + deltaLogical, price: prev.startPoints[2].price };
                  }
                }
                return { ...d, points: newPoints };
              });
              onHistoryCommit?.(next);
              return next;
            });
          } else {
             // Just committed on mouseup with no drag
          }
        }
        return null;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
        setDrawings(prev => {
          const next = prev.filter(d => d.id !== selectedIdRef.current);
          onHistoryCommit?.(next);
          return next;
        });
        setSelectedId(null);
      }
    };

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!hoveredIdRef.current) return;
      if (e.target instanceof SVGElement && overlayRef.current && overlayRef.current.contains(e.target as Node)) {
        return;
      }
      setHoveredId(null);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMoveGlobal);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
    };
  }, []);

  useEffect(() => {
    if (!chart) return;
    const handleTimeScaleChange = () => {
      // Use flushSync to force React to render synchronously and eliminate the 1-frame lag
      // between the chart canvas resizing/panning and the SVG overlay updating.
      flushSync(() => {
        setForceRender(prev => prev + 1);
      });
    };
    
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleTimeScaleChange);
    chart.timeScale().subscribeSizeChange(handleTimeScaleChange);
    
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleTimeScaleChange);
      chart.timeScale().unsubscribeSizeChange(handleTimeScaleChange);
    };
  }, [chart]);

  // When selectedId changes, compute initial toolbar pos
  useEffect(() => {
    if (selectedId && !toolbarPos) {
      const d = drawings.find(x => x.id === selectedId);
      if (d && d.points.length > 0) {
        const p1 = toPhysical(d.points[0]);
        if (p1) {
          setToolbarPos({ x: p1.x + 20, y: p1.y - 60 });
        }
      }
    }
    if (!selectedId) {
      setToolbarPos(null);
    }
  }, [selectedId, drawings, chart, series, forceRender]);

  if (!chart || !series) return null;

  const toLogical = (x: number, y: number): Point | null => {
    const timeScale = chart.timeScale();
    const logical = timeScale.coordinateToLogical(x as any);
    const price = series.coordinateToPrice(y);
    if (logical === null || price === null) return null;
    return { logical: logical as number, price };
  };

  const toPhysical = (p: Point | undefined) => {
    if (!p) return null;
    const x = chart?.timeScale().logicalToCoordinate(p.logical as any);
    const y = series?.priceToCoordinate(p.price);
    if (x === null || y === null) {
      console.warn('toPhysical returned null', { p, x, y, hasChart: !!chart, hasSeries: !!series });
      return null;
    }
    return { x, y };
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'cursor') {
      setSelectedId(null);
      return;
    }
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const logical = toLogical(x, y);
    if (!logical) return;

    if (!currentDrawing) {
      // Clear any existing measure tools when starting a new drawing
      setDrawings(prev => prev.filter(d => d.type !== 'measure'));

      const newDrawing: Drawing = {
        id: Math.random().toString(36).substring(7),
        type: activeTool,
        points: [logical],
        color: '#2196f3',
        fillColor: '#2196f3',
        fillOpacity: 20,
        thickness: 2,
        lineStyle: 'solid',
        fibLevels: activeTool === 'fib_retracement' ? JSON.parse(JSON.stringify(DEFAULT_FIB_LEVELS)) : undefined,
        showFibTrendline: activeTool === 'fib_retracement' ? true : undefined,
      };
      
      if (activeTool === 'horizontal_line' || activeTool === 'vertical_line') {
        setDrawings(prev => {
          const next = [...prev, newDrawing];
          onHistoryCommit?.(next);
          return next;
        });
        setSelectedId(newDrawing.id);
        const p = toPhysical(logical);
        if (p) setToolbarPos({ x: p.x + 20, y: p.y - 60 });
        setActiveTool('cursor');
      } else if (activeTool === 'text') {
        newDrawing.text = ''; // Start empty
        newDrawing.fontSize = 14;
        newDrawing.isBold = false;
        newDrawing.isItalic = false;
        newDrawing.showBackground = false;
        newDrawing.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        newDrawing.showBorder = false;
        newDrawing.borderColor = '#e2e8f0';
        newDrawing.textWrap = false;
        setDrawings(prev => {
          const next = [...prev, newDrawing];
          onHistoryCommit?.(next);
          return next;
        });
        setSelectedId(newDrawing.id);
        const p = toPhysical(logical);
        if (p) setToolbarPos({ x: p.x + 20, y: p.y - 60 });
        setActiveTool('cursor');
      } else if (activeTool === 'long_position' || activeTool === 'short_position') {
        const currentPrice = logical.price;
        const delta = currentPrice ? currentPrice * 0.02 : 10; // 2% of price for initial target/stop distance
        
        const isLong = activeTool === 'long_position';
        const targetPrice = isLong ? currentPrice + delta : currentPrice - delta;
        const stopPrice = isLong ? currentPrice - delta / 2 : currentPrice + delta / 2;
        
        const p = toPhysical(logical);
        let rightLogical = logical.logical;
        if (p && chart) {
          const rightL = chart.timeScale().coordinateToLogical((p.x + 150) as any);
          if (rightL !== null) rightLogical = rightL;
        }

        newDrawing.points = [
          logical,
          { logical: rightLogical, price: targetPrice },
          { logical: rightLogical, price: stopPrice }
        ];
        newDrawing.profitColor = '#10b981'; // solid green
        newDrawing.lossColor = '#ef4444';   // solid red
        newDrawing.color = '#ffffff';       // text color
        
        setDrawings(prev => {
          const next = [...prev, newDrawing];
          onHistoryCommit?.(next);
          return next;
        });
        setSelectedId(newDrawing.id);
        if (p) setToolbarPos({ x: p.x + 20, y: p.y - 60 });
        setActiveTool('cursor');
      } else {
        setCurrentDrawing(newDrawing);
      }
    } else {
      if (activeTool === 'parallel_channel' && currentDrawing.points.length === 1) {
        // Second click of parallel channel (completes baseline)
        setCurrentDrawing({ ...currentDrawing, points: [...currentDrawing.points, logical] });
      } else {
        // Final click for all tools (2nd for normal, 3rd for parallel channel)
        const finished = { ...currentDrawing, points: [...currentDrawing.points, logical] };
        setDrawings(prev => {
          const next = [...prev, finished];
          onHistoryCommit?.(next);
          return next;
        });
        setCurrentDrawing(null);
        setSelectedId(finished.id);
        const p = toPhysical(logical);
        if (p) setToolbarPos({ x: p.x + 20, y: p.y - 60 });
        setActiveTool('cursor');
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (pointDrag && activeTool === 'cursor') {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const logical = toLogical(x, y);
      if (!logical) return;
      setPointDrag(prev => prev ? { ...prev, currentMouse: logical } : null);
    } else if (currentDrawing) {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
    }
  };

  const handleDrawingClick = (e: React.MouseEvent, id: string, point?: Point) => {
    if (activeTool !== 'cursor') return;
    e.stopPropagation();
    setSelectedId(id);
    if (point) {
      const p = toPhysical(point);
      if (p) {
        setToolbarPos({ x: p.x + 20, y: p.y - 60 });
      }
    }
  };

  const updateSelected = (updates: Partial<Drawing>) => {
    setDrawings(prev => {
      const next = prev.map(d => d.id === selectedId ? { ...d, ...updates } : d);
      onHistoryCommit?.(next);
      return next;
    });
  };

  const deleteSelected = () => {
    setDrawings(prev => {
      const next = prev.filter(d => d.id !== selectedId);
      onHistoryCommit?.(next);
      return next;
    });
    setSelectedId(null);
  };

  const getDashArray = (style?: string, thickness: number = 2) => {
    if (style === 'dashed') return `${thickness * 3} ${thickness * 3}`;
    if (style === 'dotted') return `${thickness} ${thickness * 2}`;
    return 'none';
  };

  const renderDrawing = (originalDrawing: Drawing, isTemp = false) => {
    if (originalDrawing.points.length === 0) return null;
    let drawing = originalDrawing;
    if (pointDrag && pointDrag.id === originalDrawing.id && pointDrag.currentMouse) {
      const deltaLogical = pointDrag.currentMouse.logical - pointDrag.startMouse.logical;
      const deltaPrice = pointDrag.currentMouse.price - pointDrag.startMouse.price;
      const newPoints = [...pointDrag.startPoints];
      if (pointDrag.type === 'move' || pointDrag.type === 'body') {
        for (let i = 0; i < newPoints.length; i++) {
          newPoints[i] = { logical: pointDrag.startPoints[i].logical + deltaLogical, price: pointDrag.startPoints[i].price + deltaPrice };
        }
      } else if (pointDrag.type === 'resize' && pointDrag.pointIndex !== undefined) {
        newPoints[pointDrag.pointIndex] = { logical: pointDrag.startPoints[pointDrag.pointIndex].logical + deltaLogical, price: pointDrag.startPoints[pointDrag.pointIndex].price + deltaPrice };
      } else if (pointDrag.type === 'entry') {
        newPoints[0] = { logical: pointDrag.startPoints[0].logical + deltaLogical, price: pointDrag.startPoints[0].price + deltaPrice };
        if (newPoints.length > 2) {
          newPoints[1] = { logical: pointDrag.startPoints[1].logical + deltaLogical, price: pointDrag.startPoints[1].price + deltaPrice };
          newPoints[2] = { logical: pointDrag.startPoints[2].logical + deltaLogical, price: pointDrag.startPoints[2].price + deltaPrice };
        }
      } else if (pointDrag.type === 'target') {
        newPoints[1] = { logical: pointDrag.startPoints[1].logical, price: pointDrag.startPoints[1].price + deltaPrice };
      } else if (pointDrag.type === 'stop') {
        newPoints[2] = { logical: pointDrag.startPoints[2].logical, price: pointDrag.startPoints[2].price + deltaPrice };
      } else if (pointDrag.type === 'right_edge') {
        if (newPoints.length > 2) {
          newPoints[1] = { logical: pointDrag.startPoints[1].logical + deltaLogical, price: pointDrag.startPoints[1].price };
          newPoints[2] = { logical: pointDrag.startPoints[2].logical + deltaLogical, price: pointDrag.startPoints[2].price };
        }
      }
      drawing = { ...originalDrawing, points: newPoints };
    }

    const p1 = toPhysical(drawing.points[0]);
    const p2 = drawing.points.length > 1 ? toPhysical(drawing.points[1]) : (isTemp && mousePos ? mousePos : null);

    const isSelected = selectedId === drawing.id;
    const isHovered = hoveredId === drawing.id;
    const t = drawing.thickness || 2;
    const dash = getDashArray(drawing.lineStyle, t);
    
    const handleShapeMouseDown = (e: React.MouseEvent, type: 'move' | 'resize', pointIndex?: number) => {
      if (activeTool === 'cursor') {
        e.stopPropagation();
        setSelectedId(drawing.id);
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mousePoint = toLogical(e.clientX - rect.left, e.clientY - rect.top);
        if (mousePoint) {
          setPointDrag({ id: drawing.id, type: type as any, pointIndex, startPoints: drawing.points, startMouse: mousePoint });
        }
      }
    };
    
    const GroupWrapper = ({ children, hideDefaultCircles }: { children: React.ReactNode, hideDefaultCircles?: boolean }) => (
      <g 
        onClick={(e) => handleDrawingClick(e, drawing.id, drawing.points[0])}
        onMouseEnter={() => setHoveredId(drawing.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ pointerEvents: activeTool === 'cursor' ? 'stroke' : 'none' }}
      >
        {children}
        {!hideDefaultCircles && (isSelected || isHovered) && p1 && (
          <circle cx={p1.x} cy={p1.y} r={6} fill="#fff" stroke="#2196f3" strokeWidth={2} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => handleShapeMouseDown(e, 'resize', 0)} />
        )}
        {!hideDefaultCircles && (isSelected || isHovered) && p2 && (
          <circle cx={p2.x} cy={p2.y} r={6} fill="#fff" stroke="#2196f3" strokeWidth={2} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => handleShapeMouseDown(e, 'resize', 1)} />
        )}
      </g>
    );

    if (drawing.type === 'horizontal_line' && p1) {
      return (
        <GroupWrapper hideDefaultCircles>
          <line x1="0" y1={p1.y} x2="100%" y2={p1.y} stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'ns-resize' : 'crosshair' }} />
          <line x1="0" y1={p1.y} x2="100%" y2={p1.y} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
          {(isSelected || isHovered) && chart && (
             <circle cx="50%" cy={p1.y} r={6} fill="#fff" stroke={drawing.color} strokeWidth={2} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: 'ns-resize', pointerEvents: 'all' }} />
          )}
        </GroupWrapper>
      );
    }
    
    if (drawing.type === 'vertical_line' && p1) {
      return (
        <GroupWrapper hideDefaultCircles>
          <line x1={p1.x} y1="0" x2={p1.x} y2="100%" stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'ew-resize' : 'crosshair' }} />
          <line x1={p1.x} y1="0" x2={p1.x} y2="100%" stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
          {(isSelected || isHovered) && series && (
             <circle cx={p1.x} cy="50%" r={6} fill="#fff" stroke={drawing.color} strokeWidth={2} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: 'ew-resize', pointerEvents: 'all' }} />
          )}
        </GroupWrapper>
      );
    }
    
    if (drawing.type === 'text') {
      return null; // Rendered as HTML outside SVG
    }

    if (!p1 || !p2) return null;

    if (drawing.type === 'trend_line') {
      return (
        <GroupWrapper>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: 'stroke' }} />
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
        </GroupWrapper>
      );
    }
    if (drawing.type === 'rectangle') {
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const w = Math.abs(p1.x - p2.x);
      const h = Math.abs(p1.y - p2.y);
      return (
        <GroupWrapper>
          <rect x={minX} y={minY} width={w} height={h} fill="transparent" stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: 'stroke' }} />
          <rect x={minX} y={minY} width={w} height={h} fill={drawing.fillColor || drawing.color} fillOpacity={(drawing.fillOpacity ?? 20) / 100} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
        </GroupWrapper>
      );
    }
    
    if (drawing.type === 'circle') {
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const w = Math.abs(p1.x - p2.x);
      const h = Math.abs(p1.y - p2.y);
      const cx = minX + w / 2;
      const cy = minY + h / 2;
      const rx = w / 2;
      const ry = h / 2;
      return (
        <GroupWrapper>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="transparent" stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: 'stroke' }} />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={drawing.fillColor || drawing.color} fillOpacity={(drawing.fillOpacity ?? 20) / 100} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
        </GroupWrapper>
      );
    }
    
    if (drawing.type === 'parallel_channel') {
      let p3 = drawing.points.length > 2 ? toPhysical(drawing.points[2]) : (drawing.points.length === 2 && isTemp && mousePos ? mousePos : null);

      if (!p3) {
        return (
          <GroupWrapper>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={15} />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} />
          </GroupWrapper>
        );
      }

      const p4 = { x: p3.x + (p2.x - p1.x), y: p3.y + (p2.y - p1.y) };
      const mid1 = { x: (p1.x + p3.x) / 2, y: (p1.y + p3.y) / 2 };
      const mid2 = { x: (p2.x + p4.x) / 2, y: (p2.y + p4.y) / 2 };
      
      const polyPoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p4.x},${p4.y} ${p3.x},${p3.y}`;

      return (
        <GroupWrapper hideDefaultCircles>
          <polygon points={polyPoints} fill="transparent" stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: 'all' }} />
          <polygon points={polyPoints} fill={drawing.fillColor || drawing.color} fillOpacity={(drawing.fillOpacity ?? 20) / 100} style={{ pointerEvents: 'none' }} />
          
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
          <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={drawing.color} strokeWidth={t} strokeDasharray={dash} style={{ pointerEvents: 'none' }} />
          <line x1={mid1.x} y1={mid1.y} x2={mid2.x} y2={mid2.y} stroke={drawing.color} strokeWidth={Math.max(1, t - 1)} strokeDasharray="4 4" style={{ pointerEvents: 'none' }} />
          
          {(isSelected || isHovered) && (
            <>
              <circle cx={p1.x} cy={p1.y} r={6} fill="#fff" stroke="#2196f3" strokeWidth={2} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => handleShapeMouseDown(e, 'resize', 0)} />
              <circle cx={p2.x} cy={p2.y} r={6} fill="#fff" stroke="#2196f3" strokeWidth={2} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => handleShapeMouseDown(e, 'resize', 1)} />
              <circle cx={p3.x} cy={p3.y} r={6} fill="#fff" stroke="#2196f3" strokeWidth={2} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => handleShapeMouseDown(e, 'resize', 2)} />
            </>
          )}
        </GroupWrapper>
      );
    }
    
    if (drawing.type === 'fib_retracement') {
      const p3 = mousePos; // Not used for shape bounds but for temp 
      if (!p1 || (!p2 && !isTemp)) return null;
      
      const endP = p2 || p3;
      if (!endP) return null;

      const levels = drawing.fibLevels || DEFAULT_FIB_LEVELS;
      const minX = Math.min(p1.x, endP.x);
      let maxX = Math.max(p1.x, endP.x);
      if (maxX - minX < 50) maxX = minX + 50;
      
      const priceStart = drawing.points[0].price;
      const priceEnd = drawing.points[1]?.price ?? (isTemp && mousePos ? series.coordinateToPrice(mousePos.y) : priceStart);
      
      let boundsMinY = Math.min(p1.y, endP.y);
      let boundsMaxY = Math.max(p1.y, endP.y);
      if (priceEnd !== null) {
        const allY = levels.filter(l => l.visible).map(l => series.priceToCoordinate(priceEnd + (priceStart - priceEnd) * l.level)).filter(y => y !== null) as number[];
        if (allY.length > 0) {
          boundsMinY = Math.min(...allY);
          boundsMaxY = Math.max(...allY);
        }
      }

      return (
        <GroupWrapper>
          {/* Fib interactive background to move the tool */}
          <rect x={minX} y={boundsMinY} width={maxX - minX} height={boundsMaxY - boundsMinY} fill="transparent" stroke="transparent" onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: 'fill' }} />
          
          {/* Trendline */}
          {drawing.showFibTrendline !== false && (
            <>
              <line x1={p1.x} y1={p1.y} x2={endP.x} y2={endP.y} stroke="transparent" strokeWidth={15} onMouseDown={(e) => handleShapeMouseDown(e, 'move')} style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: 'stroke' }} />
              <line x1={p1.x} y1={p1.y} x2={endP.x} y2={endP.y} stroke={drawing.color} strokeWidth={t} strokeDasharray="6 6" style={{ pointerEvents: 'none' }} />
            </>
          )}

          {/* Levels */}
          <g style={{ pointerEvents: 'none' }}>
            {levels.filter(l => l.visible).map(level => {
              if (priceEnd === null) return null;

              const levelPrice = priceEnd + (priceStart - priceEnd) * level.level;
              const y = series.priceToCoordinate(levelPrice);
              if (y === null) return null;
              
              return (
                <g key={level.level}>
                  <line x1={minX} y1={y} x2={maxX} y2={y} stroke={level.color} strokeWidth={t} />
                  <text x={minX} y={y - 4} fill={level.color} fontSize={12} fontFamily="sans-serif">
                    {level.level}
                  </text>
                </g>
              );
            })}
          </g>
        </GroupWrapper>
      );
    }

    if (drawing.type === 'measure') {
      const p3 = mousePos;
      if (!p1 || (!p2 && !isTemp)) return null;
      
      const endP = p2 || p3;
      if (!endP) return null;

      const logicalStart = drawing.points[0].logical;
      const logicalEnd = drawing.points[1]?.logical ?? (isTemp && mousePos ? (chart.timeScale().coordinateToLogical(mousePos.x as any) ?? logicalStart) : logicalStart);
      const priceStart = drawing.points[0].price;
      const priceEnd = drawing.points[1]?.price ?? (isTemp && mousePos ? series.coordinateToPrice(mousePos.y) : priceStart);
      
      if (priceEnd === null) return null;

      const isUp = priceEnd >= priceStart;
      const color = isUp ? '#3b82f6' : '#ef4444'; 
      const bgColor = isUp ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      
      const priceDiff = (priceEnd - priceStart).toFixed(2);
      const pctDiff = ((priceEnd - priceStart) / priceStart * 100).toFixed(2);
      const bars = Math.abs(Math.round(logicalEnd - logicalStart));
      
      const minX = Math.min(p1.x, endP.x);
      const minY = Math.min(p1.y, endP.y);
      const w = Math.abs(p1.x - endP.x);
      const h = Math.abs(p1.y - endP.y);
      
      const cx = minX + w / 2;
      const cy = minY + h / 2;
      
      const arrowId = isUp ? 'arrow-blue' : 'arrow-red';

      return (
        <GroupWrapper>
          <rect x={minX} y={minY} width={w} height={h} fill={bgColor} stroke="transparent" strokeWidth={0} />
          
          {/* Vertical line: arrow on the UP side (y1 = minY) */}
          <line x1={cx} y1={minY} x2={cx} y2={minY + h} stroke={color} strokeWidth={1} markerStart={`url(#${arrowId})`} />
          {/* Horizontal line: arrow on the RIGHT side (x2 = minX + w) */}
          <line x1={minX} y1={cy} x2={minX + w} y2={cy} stroke={color} strokeWidth={1} markerEnd={`url(#${arrowId})`} />

          <g transform={`translate(${cx}, ${isUp ? minY - 40 : minY + h + 10})`}>
            <rect x="-80" y="0" width="160" height="40" rx="4" fill={color} />
            <text x="0" y="16" fill="#fff" fontSize="12" fontFamily="sans-serif" textAnchor="middle" fontWeight="500">
              {`${priceEnd >= priceStart ? '+' : ''}${priceDiff} (${priceEnd >= priceStart ? '+' : ''}${pctDiff}%)`}
            </text>
            <text x="0" y="32" fill="#fff" fontSize="11" fontFamily="sans-serif" textAnchor="middle">
              {`${bars} bars`}
            </text>
          </g>
        </GroupWrapper>
      );
    }
    
    if (drawing.type === 'long_position' || drawing.type === 'short_position') {
      const pEntry = toPhysical(drawing.points[0]);
      const pTarget = toPhysical(drawing.points[1]);
      const pStop = toPhysical(drawing.points[2]);
      
      if (!pEntry || !pTarget || !pStop) {
        console.warn('Position Tool Render Aborted: toPhysical returned null', { pEntry, pTarget, pStop, points: drawing.points });
        return null;
      }

      const leftX = pEntry.x;
      const rightX = pTarget.x !== pEntry.x ? pTarget.x : leftX + 150; // Fallback to 150px width if they are on same logical
      const width = Math.max(rightX - leftX, 10);
      
      const profitColor = drawing.profitColor || '#10b981';
      const lossColor = drawing.lossColor || '#ef4444';
      
      const targetY = pTarget.y;
      const stopY = pStop.y;
      const entryY = pEntry.y;
      const entryPrice = drawing.points[0].price;
      


      const handleMouseDown = (e: React.MouseEvent, type: 'body' | 'entry' | 'target' | 'stop' | 'right_edge') => {
        if (activeTool === 'cursor') {
          e.stopPropagation();
          setSelectedId(drawing.id);
          const mousePoint = toLogical(e.clientX - (overlayRef.current?.getBoundingClientRect().left || 0), e.clientY - (overlayRef.current?.getBoundingClientRect().top || 0));
          if (mousePoint) setPointDrag({ id: drawing.id, type, startPoints: drawing.points, startMouse: mousePoint });
        }
      };

      let isStoppedOut = false;
      let isTargetHit = false;
      let currentClose = entryPrice;
      let hitIndex = -1;

      if (candles && candles.length > 0) {
        const startIndex = Math.max(0, Math.round(drawing.points[0].logical));
        const rightLogical = Math.max(startIndex, Math.round(drawing.points[1].logical));
        const endIndex = Math.min(candles.length - 1, rightLogical);
        const tPrice = drawing.points[1].price;
        const sPrice = drawing.points[2].price;

        for (let i = startIndex; i <= endIndex; i++) {
          const candle = candles[i];
          if (!candle || !candle.high || !candle.low) continue;
          
          if (sPrice > entryPrice && candle.high >= sPrice) isStoppedOut = true;
          if (sPrice < entryPrice && candle.low <= sPrice) isStoppedOut = true;
          
          if (tPrice > entryPrice && candle.high >= tPrice) isTargetHit = true;
          if (tPrice < entryPrice && candle.low <= tPrice) isTargetHit = true;

          if (isStoppedOut || isTargetHit) {
            hitIndex = i;
            break;
          }
        }
        currentClose = candles[endIndex].close;
      } else if (currentPrice !== undefined) {
        currentClose = currentPrice;
      }

      const pCurrentClose = toPhysical({ logical: drawing.points[0].logical, price: currentClose });


      let fillWidth = width;
      if (candles && candles.length > 0) {
        const rightLogicalLimit = Math.round(drawing.points[1].logical);
        const maxLogical = hitIndex !== -1 ? hitIndex : (candles.length - 1);
        const fillLogical = Math.min(rightLogicalLimit, Math.max(drawing.points[0].logical, maxLogical));
        const pFill = toPhysical({ logical: fillLogical, price: entryPrice });
        if (pFill) {
          fillWidth = Math.max(0, Math.min(width, pFill.x - leftX));
        }
      }

      return (
        <GroupWrapper>
          {/* Target Box (Filled) */}
          <rect x={leftX} y={Math.min(entryY, targetY)} width={fillWidth} height={Math.abs(targetY - entryY)} fill={profitColor} fillOpacity={0.2} stroke="transparent"
            onMouseDown={(e) => handleMouseDown(e, 'body')}
            onMouseEnter={() => setHoveredId(drawing.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: activeTool === 'cursor' ? 'all' : 'none' }}
          />
          {/* Target Box (Unfilled) */}
          {width > fillWidth && (
             <rect x={leftX + fillWidth} y={Math.min(entryY, targetY)} width={width - fillWidth} height={Math.abs(targetY - entryY)} fill="transparent" stroke={profitColor} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4"
               onMouseDown={(e) => handleMouseDown(e, 'body')}
               onMouseEnter={() => setHoveredId(drawing.id)}
               onMouseLeave={() => setHoveredId(null)}
               style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: activeTool === 'cursor' ? 'all' : 'none' }}
             />
          )}

          {/* Stop Box (Filled) */}
          <rect x={leftX} y={Math.min(entryY, stopY)} width={fillWidth} height={Math.abs(stopY - entryY)} fill={lossColor} fillOpacity={0.2} stroke="transparent"
            onMouseDown={(e) => handleMouseDown(e, 'body')}
            onMouseEnter={() => setHoveredId(drawing.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: activeTool === 'cursor' ? 'all' : 'none' }}
          />
          {/* Stop Box (Unfilled) */}
          {width > fillWidth && (
             <rect x={leftX + fillWidth} y={Math.min(entryY, stopY)} width={width - fillWidth} height={Math.abs(stopY - entryY)} fill="transparent" stroke={lossColor} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4"
               onMouseDown={(e) => handleMouseDown(e, 'body')}
               onMouseEnter={() => setHoveredId(drawing.id)}
               onMouseLeave={() => setHoveredId(null)}
               style={{ cursor: activeTool === 'cursor' ? 'move' : 'crosshair', pointerEvents: activeTool === 'cursor' ? 'all' : 'none' }}
             />
          )}
          

          {/* Middle Line */}
          <line x1={leftX as number} y1={entryY as number} x2={(leftX + width) as number} y2={entryY as number} stroke="#000" strokeWidth={1} />

          {/* Right Edge Handle */}
          {(isSelected || hoveredId === drawing.id) && (
            <g>
              <circle cx={rightX as number} cy={entryY as number} r={16} fill="transparent" stroke="transparent"
                onMouseDown={(e) => handleMouseDown(e, 'right_edge')}
                style={{ cursor: 'ew-resize', pointerEvents: 'all' }}
              />
              <circle cx={rightX as number} cy={entryY as number} r={6} fill="#fff" stroke="#000" strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )}

          {/* Drag Handles */}
          {(isSelected || hoveredId === drawing.id) && (
            <>
              {/* Entry Handle */}
              <circle cx={leftX as number} cy={entryY as number} r={16} fill="transparent" stroke="transparent"
                onMouseDown={(e) => handleMouseDown(e, 'entry')}
                style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
              />
              <circle cx={leftX as number} cy={entryY as number} r={6} fill="#fff" stroke="#000" strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Target Handle */}
              <circle cx={leftX as number} cy={targetY as number} r={16} fill="transparent" stroke="transparent"
                onMouseDown={(e) => handleMouseDown(e, 'target')}
                style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
              />
              <circle cx={leftX as number} cy={targetY as number} r={6} fill="#fff" stroke={profitColor} strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Stop Handle */}
              <circle cx={leftX as number} cy={stopY as number} r={16} fill="transparent" stroke="transparent"
                onMouseDown={(e) => handleMouseDown(e, 'stop')}
                style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
              />
              <circle cx={leftX as number} cy={stopY as number} r={6} fill="#fff" stroke={lossColor} strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            </>
          )}
        </GroupWrapper>
      );
    }
    
    return null;
  };

  const selectedDrawing = drawings.find(d => d.id === selectedId);

  return (
    <>
      <svg
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: (activeTool === 'cursor' && !pointDrag) ? 'none' : 'auto',
          cursor: activeTool === 'cursor' ? 'default' : 'crosshair',
          zIndex: 10,
        }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
      >
        <defs>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
          </marker>
        </defs>
        {drawings.map(d => (
          <g key={d.id}>
            {renderDrawing(d)}
          </g>
        ))}
        {currentDrawing && (
          <g opacity={0.7}>
            {renderDrawing(currentDrawing, true)}
          </g>
        )}
        
        {/* Alerts Overlay */}
        {alerts && alerts.map(alert => {
          const p = toPhysical({ logical: 0, price: alert.price });
          if (!p) return null;
          const y = p.y;
          const isHovered = hoveredId === `alert-${alert.id}`;
          
          return (
            <g 
              key={`alert-${alert.id}`} 
              onMouseEnter={() => setHoveredId(`alert-${alert.id}`)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ pointerEvents: 'auto' }}
            >
              <line 
                x1={0} 
                y1={y} 
                x2="100%" 
                y2={y} 
                stroke="#f59e0b" 
                strokeWidth={isHovered ? 2 : 1} 
                strokeDasharray="4 4" 
              />
              <g transform={`translate(60, ${y - 12})`}>
                <rect 
                  width={isHovered ? 120 : 100} 
                  height={24} 
                  fill="#fff" 
                  stroke="#f59e0b" 
                  strokeWidth={1} 
                  rx={4} 
                />
                <text 
                  x={8} 
                  y={16} 
                  fill="#000" 
                  fontSize={12} 
                  fontFamily="sans-serif"
                >
                  Alert on {alert.price}
                </text>
                {isHovered && onRemoveAlert && (
                  <g 
                    transform="translate(100, 4)" 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAlert(alert.id);
                    }}
                  >
                    <rect width={16} height={16} fill="transparent" />
                    <line x1={4} y1={4} x2={12} y2={12} stroke="#64748b" strokeWidth={1.5} />
                    <line x1={12} y1={4} x2={4} y2={12} stroke="#64748b" strokeWidth={1.5} />
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* HTML Overlay for Text Drawings */}
      {drawings.map(d => {
        if (d.type !== 'text') return null;
        const p1 = toPhysical(d.points[0]);
        if (!p1) return null;
        const isSelected = selectedId === d.id;
        
        return (
          <div
            key={d.id}
            onMouseDown={(e) => {
              if (activeTool === 'cursor') {
                e.stopPropagation();
                setSelectedId(d.id);
                setToolbarPos({ x: p1.x + 20, y: p1.y - 60 });
                // If clicked on the wrapper (padding), start drag move
                if (e.target === e.currentTarget) {
                  const rect = overlayRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const mousePoint = toLogical(e.clientX - rect.left, e.clientY - rect.top);
                  if (mousePoint) {
                    setPointDrag({ id: d.id, type: 'move', startPoints: d.points, startMouse: mousePoint });
                  }
                }
              }
            }}
            style={{
              position: 'absolute',
              left: p1.x,
              top: p1.y,
              transform: 'translateY(-50%)',
              padding: '4px 8px',
              color: d.color || '#000',
              fontSize: d.fontSize || 14,
              fontWeight: d.isBold ? 'bold' : 'normal',
              fontStyle: d.isItalic ? 'italic' : 'normal',
              backgroundColor: d.showBackground ? (d.backgroundColor || 'rgba(255, 255, 255, 0.8)') : 'transparent',
              border: d.showBorder ? `1px solid ${d.borderColor || '#e2e8f0'}` : '1px solid transparent',
              borderRadius: 4,
              whiteSpace: 'pre',
              cursor: activeTool === 'cursor' ? 'pointer' : 'crosshair',
              pointerEvents: activeTool === 'cursor' ? 'auto' : 'none',
              zIndex: 20,
              boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
              minWidth: 40,
              minHeight: 24,
            }}
          >
            {isSelected ? (
              <textarea
                autoFocus
                value={d.text || ''}
                onChange={(e) => updateSelected({ text: e.target.value })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  fontStyle: 'inherit',
                  width: '100%',
                  minWidth: 100,
                  resize: 'none',
                  padding: 0,
                  margin: 0,
                  overflow: 'hidden',
                  whiteSpace: 'pre',
                }}
                rows={d.text ? d.text.split('\n').length : 1}
              />
            ) : (
              d.text || 'Add text'
            )}
          </div>
        );
      })}

      {/* HTML Overlay for Position Labels */}
      {drawings.map(d => {
        if (d.type !== 'long_position' && d.type !== 'short_position') return null;
        
        const isSelected = selectedId === d.id;
        const isHovered = hoveredId === d.id;
        if (!isSelected && !isHovered) return null;
        
        const pEntry = toPhysical(d.points[0]);
        const pTarget = toPhysical(d.points[1]);
        const pStop = toPhysical(d.points[2]);
        if (!pEntry || !pTarget || !pStop) return null;
        
        const isLong = d.type === 'long_position';
        const entryPrice = d.points[0].price;
        const targetPrice = d.points[1].price;
        const stopPrice = d.points[2].price;

        const risk = Math.abs(entryPrice - stopPrice);
        const reward = Math.abs(targetPrice - entryPrice);
        const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : '0';
        
        const targetPct = ((reward / entryPrice) * 100).toFixed(2);
        const stopPct = ((risk / entryPrice) * 100).toFixed(2);
        
        const targetTicks = (reward * 100).toFixed(0); 
        const stopTicks = (risk * 100).toFixed(0);
        
        const qty = 100; // Fixed quantity for now
        const targetAmount = (qty * reward).toFixed(2);
        const stopAmount = (qty * risk).toFixed(2);
        
        let statusStr = 'Open P&L';
        let pnlToDisplay = 0;
        let pnlColorVal = '#ffffff';

        const profitColor = d.profitColor || '#10b981';
        const lossColor = d.lossColor || '#ef4444';
        const textColor = d.color || '#ffffff';

        if (candles && candles.length > 0) {
          const startIndex = Math.max(0, Math.round(d.points[0].logical));
          const rightLogical = Math.max(startIndex, Math.round(d.points[1].logical));
          const endIndex = Math.min(candles.length - 1, rightLogical);

          let isStoppedOut = false;
          let isTargetHit = false;

          for (let i = startIndex; i <= endIndex; i++) {
            const candle = candles[i];
            if (!candle || !candle.high || !candle.low) continue;
            
            if (stopPrice > entryPrice && candle.high >= stopPrice) isStoppedOut = true;
            if (stopPrice < entryPrice && candle.low <= stopPrice) isStoppedOut = true;
            
            if (targetPrice > entryPrice && candle.high >= targetPrice) isTargetHit = true;
            if (targetPrice < entryPrice && candle.low <= targetPrice) isTargetHit = true;

            if (isStoppedOut || isTargetHit) break;
          }

          if (isTargetHit) {
            statusStr = 'Closed (Target)';
            pnlToDisplay = isLong ? (targetPrice - entryPrice) * qty : (entryPrice - targetPrice) * qty;
            pnlColorVal = profitColor;
          } else if (isStoppedOut) {
            statusStr = 'Closed (Stopped)';
            pnlToDisplay = isLong ? (stopPrice - entryPrice) * qty : (entryPrice - stopPrice) * qty;
            pnlColorVal = lossColor;
          } else {
            const currentClose = candles[endIndex].close;
            pnlToDisplay = isLong ? (currentClose - entryPrice) * qty : (entryPrice - currentClose) * qty;
            pnlColorVal = pnlToDisplay >= 0 ? profitColor : lossColor;
          }
        } else {
          const priceToUse = currentPrice ?? entryPrice;
          pnlToDisplay = isLong ? (priceToUse - entryPrice) * qty : (entryPrice - priceToUse) * qty;
          pnlColorVal = pnlToDisplay >= 0 ? profitColor : lossColor;
        }

        const targetLabel = `Target: ${reward.toFixed(2)} (${targetPct}%) ${targetTicks}, Amount: ${targetAmount}`;
        const stopLabel = `Stop: ${risk.toFixed(2)} (${stopPct}%) ${stopTicks}, Amount: ${stopAmount}`;
        
        const midLabel1 = `${statusStr}: ${pnlToDisplay > 0 ? '+' : ''}${pnlToDisplay.toFixed(2)}, Qty: ${qty}`;
        const midLabel2 = `Risk/Reward Ratio: ${rrRatio}`;
        
        const rightX = pTarget.x > pEntry.x ? pTarget.x : pEntry.x + 150;
        const midX = pEntry.x + (rightX - pEntry.x) / 2;

        return (
          <div key={`labels-${d.id}`} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 15, left: midX, transform: 'translateX(-50%)', top: 0, height: '100%' }}>
            {/* Target Label */}
            <div style={{ position: 'absolute', top: pTarget.y, transform: isLong ? 'translate(-50%, -100%)' : 'translate(-50%, 0)', marginTop: isLong ? -4 : 4, background: profitColor, color: textColor, padding: '2px 6px', borderRadius: 4, fontSize: 10, whiteSpace: 'nowrap' }}>
              {targetLabel}
            </div>
            {/* Middle Label */}
            <div style={{ position: 'absolute', top: pEntry.y, transform: isLong ? 'translate(-50%, 0)' : 'translate(-50%, -100%)', marginTop: isLong ? 4 : -4, background: pnlColorVal, color: textColor, padding: '2px 6px', borderRadius: 4, fontSize: 10, textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div>{midLabel1}</div>
              <div>{midLabel2}</div>
            </div>
            {/* Stop Label */}
            <div style={{ position: 'absolute', top: pStop.y, transform: isLong ? 'translate(-50%, 0)' : 'translate(-50%, -100%)', marginTop: isLong ? 4 : -4, background: lossColor, color: textColor, padding: '2px 6px', borderRadius: 4, fontSize: 10, whiteSpace: 'nowrap' }}>
              {stopLabel}
            </div>
          </div>
        );
      })}

      {/* Floating Toolbar */}
      {selectedDrawing && toolbarPos && (
        <div
          ref={toolbarRef}
          style={{
            position: 'absolute',
            left: toolbarPos.x,
            top: toolbarPos.y,
            zIndex: 50,
            background: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            gap: 4
          }}
        >
          <div 
            style={{ padding: '4px', cursor: 'grab', display: 'flex', alignItems: 'center', color: '#94a3b8' }}
            onMouseDown={(e) => {
              setIsDraggingToolbar(true);
              setDragOffset({ x: e.clientX - toolbarPos.x, y: e.clientY - toolbarPos.y });
            }}
          >
            <GripVertical size={16} />
          </div>

          <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

          {/* Text Tool Options */}
          {selectedDrawing.type === 'text' && (
            <>
              {/* Text Color */}
              <div style={{ position: 'relative', padding: '4px' }} className="group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' }} className="hover:bg-slate-100">
                  <Type size={14} color={selectedDrawing.color} />
                </div>
                <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, width: 140, flexWrap: 'wrap', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: 4, zIndex: 60 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => updateSelected({ color: c })} style={{ width: 20, height: 20, background: c, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0' }} />
                  ))}
                </div>
              </div>

              {/* Font Size Dropdown */}
              <div style={{ position: 'relative' }} className="group">
                <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                  {selectedDrawing.fontSize || 14}
                </button>
                <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, flexDirection: 'column', background: '#fff', padding: 4, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 60, width: 60 }}>
                  {FONT_SIZES.map(s => (
                    <button key={s} onClick={() => updateSelected({ fontSize: s })} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

              <button 
                onClick={() => setIsTextSettingsOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                className="hover:bg-slate-100"
                title="Settings"
              >
                <Settings size={14} color="#64748b" />
              </button>
              
              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />
            </>
          )}

          {/* Position Tool Options */}
          {(selectedDrawing.type === 'long_position' || selectedDrawing.type === 'short_position') && (
            <>
              {/* Text Color */}
              <div style={{ position: 'relative', padding: '4px' }} className="group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' }} className="hover:bg-slate-100" title="Text Color">
                  <Type size={14} color="#000" />
                </div>
                <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, width: 140, flexWrap: 'wrap', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: 4, zIndex: 60 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => updateSelected({ color: c })} style={{ width: 20, height: 20, background: c, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0' }} />
                  ))}
                </div>
              </div>

              {/* Profit Color */}
              <div style={{ position: 'relative', padding: '4px' }} className="group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' }} className="hover:bg-slate-100" title="Profit Color">
                  <PaintBucket size={14} color={selectedDrawing.profitColor || '#10b981'} />
                </div>
                <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, width: 140, flexWrap: 'wrap', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: 4, zIndex: 60 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => updateSelected({ profitColor: c })} style={{ width: 20, height: 20, background: c, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0' }} />
                  ))}
                </div>
              </div>

              {/* Loss Color */}
              <div style={{ position: 'relative', padding: '4px' }} className="group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' }} className="hover:bg-slate-100" title="Loss Color">
                  <PaintBucket size={14} color={selectedDrawing.lossColor || '#ef4444'} />
                </div>
                <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, width: 140, flexWrap: 'wrap', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: 4, zIndex: 60 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => updateSelected({ lossColor: c })} style={{ width: 20, height: 20, background: c, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0' }} />
                  ))}
                </div>
              </div>

              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />
            </>
          )}

          {/* Stroke Color Picker Popover */}
          {selectedDrawing.type !== 'measure' && selectedDrawing.type !== 'text' && selectedDrawing.type !== 'long_position' && selectedDrawing.type !== 'short_position' && (
            <div style={{ position: 'relative', padding: '4px' }} className="group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' }} className="hover:bg-slate-100">
                <Pencil size={14} color={selectedDrawing.color} />
              </div>
              <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, width: 140, flexWrap: 'wrap', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: 4, zIndex: 60 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => updateSelected({ color: c })} style={{ width: 20, height: 20, background: c, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0' }} />
                ))}
              </div>
            </div>
          )}

          {/* Fill Color Picker Popover */}
          {(selectedDrawing.type === 'rectangle' || selectedDrawing.type === 'circle' || selectedDrawing.type === 'parallel_channel') && (
            <div style={{ position: 'relative', padding: '4px' }} className="group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' }} className="hover:bg-slate-100">
                <PaintBucket size={14} color={selectedDrawing.fillColor || selectedDrawing.color} />
              </div>
              <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, width: 140, flexWrap: 'wrap', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: 4, zIndex: 60 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => updateSelected({ fillColor: c })} style={{ width: 20, height: 20, background: c, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0' }} />
                ))}
                
                <div style={{ width: '100%', marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Opacity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={selectedDrawing.fillOpacity ?? 20} 
                      onChange={(e) => updateSelected({ fillOpacity: parseInt(e.target.value) })}
                      style={{ flex: 1, accentColor: '#2196f3' }}
                    />
                    <span style={{ fontSize: 11, color: '#334155', width: 24 }}>{selectedDrawing.fillOpacity ?? 20}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thickness Dropdown */}
          {selectedDrawing.type !== 'measure' && selectedDrawing.type !== 'text' && selectedDrawing.type !== 'long_position' && selectedDrawing.type !== 'short_position' && (
            <div style={{ position: 'relative' }} className="group">
              <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                {selectedDrawing.thickness || 2}px
              </button>
              <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, flexDirection: 'column', background: '#fff', padding: 4, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 60, width: 60 }}>
                {[1, 2, 3, 4].map(t => (
                  <button key={t} onClick={() => updateSelected({ thickness: t })} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
                    {t}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line Style Dropdown */}
          {selectedDrawing.type !== 'fib_retracement' && selectedDrawing.type !== 'measure' && selectedDrawing.type !== 'text' && selectedDrawing.type !== 'long_position' && selectedDrawing.type !== 'short_position' && (
            <div style={{ position: 'relative' }} className="group">
              <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <svg width="24" height="12">
                  <line x1="0" y1="6" x2="24" y2="6" stroke="#334155" strokeWidth="2" strokeDasharray={getDashArray(selectedDrawing.lineStyle, 2)} />
                </svg>
              </button>
              <div className="hidden group-hover:flex" style={{ position: 'absolute', top: '100%', left: 0, flexDirection: 'column', background: '#fff', padding: 4, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 60, width: 80 }}>
                {['solid', 'dashed', 'dotted'].map(s => (
                  <button key={s} onClick={() => updateSelected({ lineStyle: s as any })} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="24" height="12"><line x1="0" y1="6" x2="24" y2="6" stroke="#334155" strokeWidth="2" strokeDasharray={getDashArray(s, 2)} /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDrawing.type === 'fib_retracement' && (
            <button onClick={() => setIsFibSettingsOpen(true)} style={{ padding: '6px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Settings size={16} />
            </button>
          )}

          <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

          <button onClick={deleteSelected} style={{ padding: '6px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Global dragging handler */}
      {isDraggingToolbar && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          onMouseMove={(e) => {
            setToolbarPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
          }}
          onMouseUp={() => setIsDraggingToolbar(false)}
          onMouseLeave={() => setIsDraggingToolbar(false)}
        />
      )}

      {/* Fib Settings Modal */}
      {isFibSettingsOpen && selectedDrawing && selectedDrawing.type === 'fib_retracement' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div ref={modalRef} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Fib Retracement</h3>
              <button onClick={() => setIsFibSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <input 
                type="checkbox" 
                checked={selectedDrawing.showFibTrendline !== false} 
                onChange={(e) => updateSelected({ showFibTrendline: e.target.checked })} 
                style={{ marginRight: 8, accentColor: '#2563eb' }} 
              />
              <span style={{ fontSize: 14, color: '#334155' }}>Trend line</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(selectedDrawing.fibLevels || DEFAULT_FIB_LEVELS).map((level, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={level.visible} 
                    onChange={(e) => {
                      const newLevels = [...(selectedDrawing.fibLevels || DEFAULT_FIB_LEVELS)];
                      newLevels[i].visible = e.target.checked;
                      updateSelected({ fibLevels: newLevels });
                    }} 
                    style={{ accentColor: '#2563eb' }}
                  />
                  <span style={{ fontSize: 13, color: '#475569', minWidth: 40 }}>{level.level}</span>
                  <input 
                    type="color" 
                    value={level.color} 
                    onChange={(e) => {
                      const newLevels = [...(selectedDrawing.fibLevels || DEFAULT_FIB_LEVELS)];
                      newLevels[i].color = e.target.value;
                      updateSelected({ fibLevels: newLevels });
                    }}
                    style={{ width: 24, height: 24, padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button 
                onClick={() => setIsFibSettingsOpen(false)}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Settings Modal */}
      {isTextSettingsOpen && selectedDrawing && selectedDrawing.type === 'text' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div ref={modalRef} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 340, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Text</h3>
              <button onClick={() => setIsTextSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ padding: '0 8px 8px', borderBottom: '2px solid #2563eb', marginBottom: -2, fontWeight: 600, color: '#0f172a' }}>Text</div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="color" value={selectedDrawing.color || '#000000'} onChange={(e) => updateSelected({ color: e.target.value })} style={{ width: 32, height: 32, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
              <select value={selectedDrawing.fontSize || 14} onChange={(e) => updateSelected({ fontSize: parseInt(e.target.value) })} style={{ height: 32, padding: '0 8px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', outline: 'none' }}>
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => updateSelected({ isBold: !selectedDrawing.isBold })} style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedDrawing.isBold ? '#eff6ff' : '#fff', border: `1px solid ${selectedDrawing.isBold ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 4, cursor: 'pointer', color: selectedDrawing.isBold ? '#1d4ed8' : '#334155' }}><Bold size={14} /></button>
              <button onClick={() => updateSelected({ isItalic: !selectedDrawing.isItalic })} style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedDrawing.isItalic ? '#eff6ff' : '#fff', border: `1px solid ${selectedDrawing.isItalic ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 4, cursor: 'pointer', color: selectedDrawing.isItalic ? '#1d4ed8' : '#334155' }}><Italic size={14} /></button>
            </div>

            <textarea 
              value={selectedDrawing.text || ''} 
              onChange={(e) => updateSelected({ text: e.target.value })}
              style={{ width: '100%', height: 100, padding: 8, border: '2px solid #3b82f6', borderRadius: 6, resize: 'none', marginBottom: 16, outline: 'none', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" checked={selectedDrawing.showBackground || false} onChange={(e) => updateSelected({ showBackground: e.target.checked })} style={{ accentColor: '#2563eb' }} />
                <span style={{ fontSize: 14, color: '#334155', flex: 1 }}>Background</span>
                <input type="color" value={(selectedDrawing.backgroundColor || '#ffffff').substring(0,7)} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} style={{ width: 24, height: 24, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'none', opacity: selectedDrawing.showBackground ? 1 : 0.5 }} disabled={!selectedDrawing.showBackground} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" checked={selectedDrawing.showBorder || false} onChange={(e) => updateSelected({ showBorder: e.target.checked })} style={{ accentColor: '#2563eb' }} />
                <span style={{ fontSize: 14, color: '#334155', flex: 1 }}>Border</span>
                <input type="color" value={(selectedDrawing.borderColor || '#e2e8f0').substring(0,7)} onChange={(e) => updateSelected({ borderColor: e.target.value })} style={{ width: 24, height: 24, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: 'none', opacity: selectedDrawing.showBorder ? 1 : 0.5 }} disabled={!selectedDrawing.showBorder} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <button onClick={() => setIsTextSettingsOpen(false)} style={{ background: '#fff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={() => setIsTextSettingsOpen(false)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Ok</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
