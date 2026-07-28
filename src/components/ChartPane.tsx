// src/pages/Charts.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RSICalculator } from '../utils/rsiCalculator';
import { ATRCalculator } from '../utils/atrCalculator';
import { VwapCalculator } from '../utils/vwapCalculator';
import { EMACalculator } from '../utils/emaCalculator';
import { SuperTrendCalculator } from '../utils/superTrendCalculator';
import { MacdCalculator } from '../utils/macdCalculator';
import {
  Search,
  ChevronDown,
  MousePointer2,
  TrendingUp,
  Minus,
  SeparatorVertical,
  Columns,
  List,
  Square,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  Type,
  Ruler,
  Bell,
  CandlestickChart,
  LineChart as LineChartIcon,
  PenTool,
  Maximize,
  Eye,
  EyeOff,
  Settings,
  Trash2,
  MoreHorizontal,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Layout
} from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { useOHLCV, useQuote } from '../hooks/useMarketData';
import { Skeleton } from '../components/ui/Skeleton';
import { formatVolume } from '../utils/formatters';
import { searchStocks } from '../api/marketData';
import type { Timeframe } from '../types/market';
import { PriceAlertManager } from '../utils/PriceAlertManager';
import { ChartDrawingOverlay } from '../components/ChartDrawingOverlay';
import { RealTimeClock } from '../components/RealTimeClock';
import type { Drawing, DrawingType } from '../components/ChartDrawingOverlay';
import * as ta from 'ta.js';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1M', value: '1M' },
];

const INDICATORS = ['VOLUME', 'EMA', 'RSI', 'SUPERTREND', 'MACD', 'ATR', 'PIVOT POINTS', 'VWAP'];

const DRAWING_TOOLS = [
  { id: 'cursor', icon: MousePointer2, label: 'CURSOR' },
  { id: 'trend_line', icon: TrendingUp, label: 'TREND LINE' },
  { id: 'horizontal_line', icon: Minus, label: 'HORIZONTAL LINE' },
  { id: 'vertical_line', icon: SeparatorVertical, label: 'VERTICAL LINE' },
  { id: 'parallel_channel', icon: Columns, label: 'PARALLEL CHANNEL' },
  { id: 'fib_retracement', icon: List, label: 'FIB RETRACEMENT' },
  { id: 'rectangle', icon: Square, label: 'RECTANGLE' },
  { id: 'circle', icon: Circle, label: 'CIRCLE' },
  { id: 'long_position', icon: ArrowUpRight, label: 'LONG POSITION' },
  { id: 'short_position', icon: ArrowDownRight, label: 'SHORT POSITION' },
  { id: 'text', icon: Type, label: 'TEXT' },
  { id: 'measure', icon: Ruler, label: 'MEASURE (Ruler)' },
  { id: 'alert', icon: Bell, label: 'PLACE AN ALERT' },
];

const IndicatorLegendRow = ({ ind, value, isHidden, hideValue, onToggleHide, onRemove, onSettings }: any) => {
  const [hovered, setHovered] = useState(false);
  const baseName = ind.split('-')[0];
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', pointerEvents: 'auto', padding: '2px 8px', height: 26, background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 4, width: 'fit-content' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontWeight: 500 }}>{baseName}</span>
      {value !== undefined && !hideValue && <span style={{ color: '#0B0F19', fontWeight: 600 }}>{value.toFixed(2)}</span>}
      {hovered ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 4, padding: '0 4px', height: 20 }}>
          <button onClick={onToggleHide} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onSettings} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <Settings size={14} />
          </button>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={14} />
          </button>
          <button style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <MoreHorizontal size={14} />
          </button>
        </div>
      ) : isHidden ? (
        <EyeOff size={14} color="#94A3B8" />
      ) : null}
    </div>
  );
};

const renderLayoutIcon = (id: string, active: boolean) => {
  const color = active ? '#2962FF' : '#94A3B8';
  const fill = active ? '#2962FF' : 'none';
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5, rx: 2, ry: 2 };
  
  if (id === '1') return <svg {...common} fill={fill}><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>;
  if (id === '2a') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>;
  if (id === '2b') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line></svg>;
  if (id === '3a') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>;
  if (id === '3b') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>;
  if (id === '3c') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><line x1="12" y1="12" x2="21" y2="12"></line></svg>;
  if (id === '3d') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><line x1="3" y1="12" x2="12" y2="12"></line></svg>;
  if (id === '3e') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line><line x1="12" y1="12" x2="12" y2="21"></line></svg>;
  if (id === '3f') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line><line x1="12" y1="3" x2="12" y2="12"></line></svg>;
  return null;
};

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    style={{ 
      width: 36, height: 20, borderRadius: 10, 
      background: checked ? '#2962FF' : '#CBD5E1',
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
    }}
  >
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#FFF',
      position: 'absolute', top: 2, left: checked ? 18 : 2, transition: 'left 0.2s'
    }} />
  </div>
);

export default function Charts() {
  const navigate = useNavigate();
  const { selectedSymbol, selectedExchange, setSelectedSymbol } = useMarketStore();
  const fullScreenRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<Record<string, any>>({});
  const alertManager = useRef(new PriceAlertManager());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchStocks>>([]);

  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [hiddenIndicators, setHiddenIndicators] = useState<string[]>([]);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingType>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Alert Modal State
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ condition: 'above', value: '' });

  // Interval Modal State
  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [intervalInput, setIntervalInput] = useState('');
  
  // Option Chain State
  const [isOptionChainOpen, setIsOptionChainOpen] = useState(false);
  
  // Layout Settings State
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [activeLayout, setActiveLayout] = useState('1');
  const [syncLayout, setSyncLayout] = useState({ symbol: false, interval: false, crosshair: false, time: true, dateRange: false });

  // Candle Settings State
  const [candleSettings, setCandleSettings] = useState({
    bodyVisible: true,
    bodyUpColor: '#10B981',
    bodyDownColor: '#EF4444',
    borderVisible: true,
    borderUpColor: '#10B981',
    borderDownColor: '#EF4444',
    wickVisible: true,
    wickUpColor: '#10B981',
    wickDownColor: '#EF4444',
  });
  const [tempCandleSettings, setTempCandleSettings] = useState(candleSettings);
  const [isChartSettingsModalOpen, setIsChartSettingsModalOpen] = useState(false);
  
  // Volume Settings State
  const [volumeSettings, setVolumeSettings] = useState({
    upColor: '#10B981',
    downColor: '#EF4444'
  });
  const [tempVolumeSettings, setTempVolumeSettings] = useState(volumeSettings);
  const [isVolumeSettingsModalOpen, setIsVolumeSettingsModalOpen] = useState(false);

  // RSI Settings State
  const [rsiSettings, setRsiSettings] = useState({
    length: 14,
    smoothingLine: 'SMA',
    smoothingLength: 14,
    plot: true,
    plotColor: '#7e22ce', // Purple
    plotLineWidth: 1.5,
    smoothedMA: false,
    smoothedMAColor: '#64b5f6',
    upperLimit: true,
    upperLimitColor: '#b2b5be', // Gray
    upperLimitValue: 70,
    upperLimitLineStyle: 2, // Dashed
    middleLimit: true, 
    middleLimitColor: '#b2b5be', 
    middleLimitValue: 50,
    middleLimitLineStyle: 2, 
    lowerLimit: true,
    lowerLimitColor: '#b2b5be', 
    lowerLimitValue: 30,
    lowerLimitLineStyle: 2, 
    hlinesBackground: true,
    hlinesBackgroundColor: 'rgba(126, 34, 206, 0.08)', // Very faint purple fill
  });
  const prevRsiSettings = useRef(rsiSettings);
  const [tempRsiSettings, setTempRsiSettings] = useState(rsiSettings);
  const [isRsiSettingsModalOpen, setIsRsiSettingsModalOpen] = useState(false);
  const [rsiSettingsActiveTab, setRsiSettingsActiveTab] = useState('Inputs');
  
  // RSI Resize State
  const [rsiHeightRatio, setRsiHeightRatio] = useState(0.15);
  const [isResizingRsi, setIsResizingRsi] = useState(false);
  const rsiHeightRatioRef = useRef(rsiHeightRatio);
  useEffect(() => { rsiHeightRatioRef.current = rsiHeightRatio; }, [rsiHeightRatio]);
  
  // EMA Settings State
  const [emaSettings, setEmaSettings] = useState({
    length: 9,
    source: 'close',
    offset: 0,
    smoothingLine: 'SMA',
    smoothingLength: 9,
    plot: true,
    plotColor: '#2962FF',
    plotLineWidth: 2,
    plotLineStyle: 0,
    precision: 2,
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
  });
  const prevEmaSettings = useRef(emaSettings);
  const [tempEmaSettings, setTempEmaSettings] = useState(emaSettings);
  const [isEmaSettingsModalOpen, setIsEmaSettingsModalOpen] = useState(false);
  const [emaSettingsActiveTab, setEmaSettingsActiveTab] = useState('Inputs');

  // SuperTrend Settings State
  const [superTrendSettings, setSuperTrendSettings] = useState({
    length: 10,
    factor: 3,
    plot: true,
    colorUp: '#4CAF50',
    colorDown: '#F44336',
    lineWidth: 2,
    lineStyle: 0,
    upArrow: true,
    upArrowColor: '#4CAF50',
    upArrowLocation: 'belowBar',
    downArrow: true,
    downArrowColor: '#F44336',
    downArrowLocation: 'aboveBar',
    precision: 2,
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
  });
  const prevSuperTrendSettings = useRef(superTrendSettings);
  const [tempSuperTrendSettings, setTempSuperTrendSettings] = useState(superTrendSettings);
  const [isSuperTrendSettingsModalOpen, setIsSuperTrendSettingsModalOpen] = useState(false);
  const [superTrendSettingsActiveTab, setSuperTrendSettingsActiveTab] = useState('Inputs');

  // MACD Settings State
  const [macdSettings, setMacdSettings] = useState({
    fastLength: 12,
    slowLength: 26,
    source: 'close',
    signalLength: 9,
    histogramPlot: true,
    color0: '#22ab94',
    color1: '#a6d8c6',
    color2: '#f2a9a9',
    color3: '#f23645',
    macdPlot: true,
    macdColor: '#2962FF',
    macdLineWidth: 2,
    macdLineStyle: 0,
    signalPlot: true,
    signalColor: '#FF6D00',
    signalLineWidth: 2,
    signalLineStyle: 0,
    precision: 2,
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
  });
  const prevMacdSettings = useRef(macdSettings);
  const [tempMacdSettings, setTempMacdSettings] = useState(macdSettings);
  const [isMacdSettingsModalOpen, setIsMacdSettingsModalOpen] = useState(false);
  const [macdSettingsActiveTab, setMacdSettingsActiveTab] = useState('Inputs');

  // ATR Settings State
  const [atrSettings, setAtrSettings] = useState({
    length: 14,
    maType: 'SMA',
    plot: true,
    plotColor: '#7E1B1B',
    plotLineWidth: 2,
    plotLineStyle: 0,
    precision: 2,
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
  });
  const prevAtrSettings = useRef(atrSettings);
  const [tempAtrSettings, setTempAtrSettings] = useState(atrSettings);
  const [isAtrSettingsModalOpen, setIsAtrSettingsModalOpen] = useState(false);
  const [atrSettingsActiveTab, setAtrSettingsActiveTab] = useState('Inputs');

  // VWAP Settings State
  const [vwapSettings, setVwapSettings] = useState({
    source: 'hlc3',
    anchorPeriod: 'Session',
    plot: true,
    plotColor: '#2962FF',
    plotLineWidth: 2,
    plotLineStyle: 0, // 0 = Solid, 1 = Dashed, 2 = Dotted
    precision: 2,
    labelsOnScale: true,
    valuesInStatusLine: true,
  });
  const prevVwapSettings = useRef(vwapSettings);
  const [tempVwapSettings, setTempVwapSettings] = useState(vwapSettings);
  const [isVwapSettingsModalOpen, setIsVwapSettingsModalOpen] = useState(false);
  const [vwapSettingsActiveTab, setVwapSettingsActiveTab] = useState('Inputs');
  
  interface ChartHistorySnapshot {
    drawings: Drawing[];
    activeIndicators: string[];
    rsiSettings: any;
    emaSettings: any;
    superTrendSettings: any;
    macdSettings: any;
    atrSettings: any;
    vwapSettings: any;
    volumeSettings: any;
    candleSettings: any;
  }
  
  // Undo/Redo State
  const [history, setHistory] = useState<ChartHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, volumeSettings, candleSettings }]);
      setHistoryIndex(0);
      historyIndexRef.current = 0;
    }
  }, []); // Initialize history

  const pushToHistory = (partial: Partial<ChartHistorySnapshot>) => {
    setHistory(prevHistory => {
      const prevIndex = historyIndexRef.current;
      const currentState = prevHistory[prevIndex >= 0 ? prevIndex : 0] || { drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, volumeSettings, candleSettings };
      const nextSnapshot = { ...currentState, ...partial };
      const newHistory = [...prevHistory.slice(0, prevIndex + 1), nextSnapshot];
      
      const newIndex = newHistory.length - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      
      setHistory(prevHistory => {
        const snapshot = prevHistory[newIndex];
        setDrawings(snapshot.drawings);
        setActiveIndicators(snapshot.activeIndicators);
        setRsiSettings(snapshot.rsiSettings);
        setEmaSettings(snapshot.emaSettings);
        setSuperTrendSettings(snapshot.superTrendSettings);
        setMacdSettings(snapshot.macdSettings);
        setAtrSettings(snapshot.atrSettings);
        setVwapSettings(snapshot.vwapSettings);
        setVolumeSettings(snapshot.volumeSettings);
        setCandleSettings(snapshot.candleSettings);
        return prevHistory;
      });
    }
  };

  const handleRedo = () => {
    setHistory(prevHistory => {
      if (historyIndexRef.current < prevHistory.length - 1) {
        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        const snapshot = prevHistory[newIndex];
        setDrawings(snapshot.drawings);
        setActiveIndicators(snapshot.activeIndicators);
        setRsiSettings(snapshot.rsiSettings);
        setEmaSettings(snapshot.emaSettings);
        setSuperTrendSettings(snapshot.superTrendSettings);
        setMacdSettings(snapshot.macdSettings);
        setAtrSettings(snapshot.atrSettings);
        setVwapSettings(snapshot.vwapSettings);
        setVolumeSettings(snapshot.volumeSettings);
        setCandleSettings(snapshot.candleSettings);
      }
      return prevHistory;
    });
  };

  const commitHistory = (newDrawings: Drawing[]) => {
    pushToHistory({ drawings: newDrawings });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      fullScreenRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // State for candle data on crosshair hover
  const [hoveredCandle, setHoveredCandle] = useState<{ open: number; high: number; low: number; close: number; volume?: number; prevClose?: number } | null>(null);
  const [indicatorValues, setIndicatorValues] = useState<Record<string, number>>({});
  const isHoveringRef = useRef(false);

  const { data: quote } = useQuote(selectedSymbol, selectedExchange);
  const { data: candles, isLoading: candlesLoading } = useOHLCV(selectedSymbol, selectedExchange, timeframe, 150);

  // Search
  useEffect(() => {
    if (searchQuery.length >= 1) {
      setSearchResults(searchStocks(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = () => {
      setIsIndicatorsOpen(false);
      setIsChartTypeOpen(false);
      setIsToolsOpen(false);
      setIsLayoutOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const altOrOpt = e.altKey;

      // Undo / Redo
      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      
      if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Drawing Tools (Alt/Option + Key)
      if (altOrOpt) {
        switch (e.code) {
          case 'KeyT': e.preventDefault(); setActiveDrawingTool('trend_line'); break;
          case 'KeyH': e.preventDefault(); setActiveDrawingTool('horizontal_line'); break;
          case 'KeyV': e.preventDefault(); setActiveDrawingTool('vertical_line'); break;
          case 'KeyF': e.preventDefault(); setActiveDrawingTool('fib_retracement'); break;
          case 'KeyP': e.preventDefault(); setActiveDrawingTool('parallel_channel'); break;
          case 'KeyN': e.preventDefault(); setActiveDrawingTool('text'); break;
          case 'KeyR': e.preventDefault(); setActiveDrawingTool('rectangle'); break;
          case 'KeyA': 
            e.preventDefault();
            setAlertForm({ condition: 'above', value: hoveredCandle ? hoveredCandle.close.toString() : (quote as any)?.price?.toString() || '' });
            setIsAlertModalOpen(true);
            setActiveDrawingTool('cursor');
            break;
        }
        return;
      }

      // Shift for Measure
      if (e.key === 'Shift') {
        setActiveDrawingTool('measure');
      }

      // Cursor cycle / exit
      if (e.key === 'Escape' || (cmdOrCtrl && (e.key === '`' || e.key === ' '))) {
        e.preventDefault();
        setActiveDrawingTool('cursor');
      }

      // Interval change (typing numbers only initially)
      if (!cmdOrCtrl && !altOrOpt && !e.shiftKey) {
        if (/^[0-9]$/.test(e.key)) {
          setIsIntervalModalOpen(true);
          setIntervalInput(e.key);
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (activeDrawingTool === 'measure') {
          setActiveDrawingTool('cursor');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, hoveredCandle, selectedSymbol, alertManager, activeDrawingTool]);

  const addIndicator = (ind: string) => {
    const id = `${ind}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setActiveIndicators(prev => {
      const next = [...prev, id];
      pushToHistory({ activeIndicators: next });
      return next;
    });
  };

  const filteredIndicators = INDICATORS.filter(ind => ind.toLowerCase().includes(indicatorSearch.toLowerCase()));

  // Setup the chart and add standard series + indicators
  useEffect(() => {
    if (!chartContainerRef.current || !candles || candles.length === 0) return;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries, LineSeries } = await import('lightweight-charts');

        if (chartRef.current) {
          (chartRef.current as { remove: () => void }).remove();
          chartRef.current = null;
          seriesRef.current = {};
        }

        const width = chartContainerRef.current!.clientWidth || 400;
        const height = chartContainerRef.current!.clientHeight || 320;
        setContainerSize({ width, height });

        const chart = createChart(chartContainerRef.current!, {
          width,
          height,
          layout: { background: { color: '#FFFFFF' }, textColor: '#475569' },
          grid: { vertLines: { color: '#F8FAFC' }, horzLines: { color: '#F8FAFC' } },
          crosshair: { mode: 0 },
          rightPriceScale: { borderColor: '#E2E8F0' },
          timeScale: { borderColor: '#E2E8F0', timeVisible: true, rightOffset: 12 },
        });

        const timeFormat = (c: any) => c.time as unknown as import('lightweight-charts').UTCTimestamp;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: candleSettings.bodyVisible ? candleSettings.bodyUpColor : 'transparent', 
          downColor: candleSettings.bodyVisible ? candleSettings.bodyDownColor : 'transparent', 
          borderUpColor: candleSettings.borderUpColor, 
          borderDownColor: candleSettings.borderDownColor, 
          wickUpColor: candleSettings.wickUpColor, 
          wickDownColor: candleSettings.wickDownColor,
          borderVisible: candleSettings.borderVisible,
          wickVisible: candleSettings.wickVisible,
          visible: chartType === 'candle'
        });
        candlestickSeries.setData(candles.map(c => ({ time: timeFormat(c), open: c.open, high: c.high, low: c.low, close: c.close })));
        seriesRef.current['candlestick'] = candlestickSeries;

        const lineSeries = chart.addSeries(LineSeries, { color: '#0E7490', lineWidth: 2, visible: chartType === 'line' });
        lineSeries.setData(candles.map(c => ({ time: timeFormat(c), value: c.close })));
        seriesRef.current['line'] = lineSeries;

        // Indicators are now added dynamically via a separate useEffect

        chart.timeScale().fitContent();

        // Subscription for crosshair move to update OHLC legend
        chart.subscribeCrosshairMove((param: any) => {
          if (param.time && param.seriesData && param.seriesData.size > 0) {
            isHoveringRef.current = true;
            const data = param.seriesData.get(candlestickSeries) || param.seriesData.get(lineSeries);
            if (data) {
              const candleIndex = candles.findIndex(c => c.time === param.time);
              const prevCandle = candleIndex > 0 ? candles[candleIndex - 1] : null;
              
              setHoveredCandle({
                open: data.open ?? data.value,
                high: data.high ?? data.value,
                low: data.low ?? data.value,
                close: data.close ?? data.value,
                volume: candles[candleIndex]?.volume,
                prevClose: prevCandle?.close,
              });
            }

            const newIndicatorValues: Record<string, number> = {};
            Object.keys(seriesRef.current).forEach(id => {
              if (id !== 'candlestick' && id !== 'line') {
                const series = seriesRef.current[id];
                if (series) {
                  const seriesData = param.seriesData.get(series);
                  if (seriesData && seriesData.value !== undefined) {
                    newIndicatorValues[id] = seriesData.value;
                  }
                }
              }
            });
            setIndicatorValues(newIndicatorValues);

          } else {
            isHoveringRef.current = false;
            const newCandle = { ...candles![candles!.length - 1] };
            const prev = candles.length > 1 ? candles[candles.length - 2] : null;
            if (newCandle) {
              setHoveredCandle({
                open: newCandle.open, high: newCandle.high, low: newCandle.low, close: newCandle.close,
                volume: newCandle.volume, prevClose: prev?.close,
              });
            } else {
              setHoveredCandle(null);
            }
            
            const newIndicatorValues: Record<string, number> = {};
            Object.keys(seriesRef.current).forEach(id => {
              if (id !== 'candlestick' && id !== 'line') {
                const series = seriesRef.current[id];
                if (series && typeof series.data === 'function') {
                  const data = series.data();
                  if (data && data.length > 0) {
                    newIndicatorValues[id] = data[data.length - 1].value ?? data[data.length - 1].close;
                  }
                }
              }
            });
            setIndicatorValues(newIndicatorValues);
          }
        });

        const latest = candles[candles.length - 1];
        const prev = candles.length > 1 ? candles[candles.length - 2] : null;
        if (latest) {
          setHoveredCandle({
            open: latest.open, high: latest.high, low: latest.low, close: latest.close,
            volume: latest.volume, prevClose: prev?.close,
          });
        }
        setIndicatorValues({});

        chartRef.current = chart;

        const resizeObserver = new ResizeObserver(entries => {
          if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
          const newRect = entries[0].contentRect;
          chart.applyOptions({ width: newRect.width, height: newRect.height });
          setContainerSize({ width: newRect.width, height: newRect.height });
        });
        resizeObserver.observe(chartContainerRef.current!);
        
        return () => {
          resizeObserver.disconnect();
        };
      } catch (err) {
        console.error('Chart init error:', err);
      }
    };

initChart();
  }, [candles]);

// Dynamic Indicator Management
useEffect(() => {
  if (!chartRef.current || !candles || candles.length === 0) return;

  let isMounted = true;

  const updateIndicators = async () => {
    const { LineSeries, HistogramSeries, BaselineSeries, AreaSeries } = await import('lightweight-charts');
    if (!isMounted || !chartRef.current) return;
    const chart = chartRef.current as any;
    
    // Check if RSI settings changed and clear stale ones
    if (JSON.stringify(prevRsiSettings.current) !== JSON.stringify(rsiSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('RSI')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevRsiSettings.current = rsiSettings;
    }
    // Check if EMA settings changed and clear stale ones
    if (JSON.stringify(prevEmaSettings.current) !== JSON.stringify(emaSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('EMA')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevEmaSettings.current = emaSettings;
    }
    // Check if SuperTrend settings changed and clear stale ones
    if (JSON.stringify(prevSuperTrendSettings.current) !== JSON.stringify(superTrendSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('SUPERTREND')) {
            try { 
              if (seriesRef.current[id].setMarkers) {
                seriesRef.current[id].setMarkers([]);
              }
              chart.removeSeries(seriesRef.current[id]); 
            } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevSuperTrendSettings.current = superTrendSettings;
    }
    // Check if MACD settings changed and clear stale ones
    if (JSON.stringify(prevMacdSettings.current) !== JSON.stringify(macdSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('MACD')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevMacdSettings.current = macdSettings;
    }
    // Check if ATR settings changed and clear stale ones
    if (JSON.stringify(prevAtrSettings.current) !== JSON.stringify(atrSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('ATR')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevAtrSettings.current = atrSettings;
    }
    // Check if VWAP settings changed and clear stale ones
    if (JSON.stringify(prevVwapSettings.current) !== JSON.stringify(vwapSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('VWAP')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevVwapSettings.current = vwapSettings;
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const timeFormat = (c: any) => c.time as any;

    // Add missing indicators
    for (const id of activeIndicators) {
      if (!seriesRef.current[id]) {
        const type = id.split('-')[0];
        let series;
        if (type === 'VOLUME') {
          series = chart.addSeries(HistogramSeries, { color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '' });
          series.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
          series.setData(candles.map((c: any) => ({ 
            time: timeFormat(c), 
            value: c.volume || 0,
            color: c.close >= c.open ? volumeSettings.upColor : volumeSettings.downColor
          })));
        } else if (type === 'EMA') {
          series = chart.addSeries(LineSeries, { 
            color: emaSettings.plotColor, 
            lineWidth: emaSettings.plotLineWidth,
            lineStyle: emaSettings.plotLineStyle,
            visible: emaSettings.plot,
            lastValueVisible: emaSettings.labelsOnPriceScale,
            priceLineVisible: emaSettings.labelsOnPriceScale,
            priceFormat: {
              type: 'price',
              precision: emaSettings.precision,
              minMove: 1 / Math.pow(10, emaSettings.precision),
            }
          });
          
          const emaCalc = new EMACalculator(
            emaSettings.length,
            emaSettings.source,
            emaSettings.smoothingLine,
            emaSettings.smoothingLength,
            emaSettings.offset
          );
          
          const emaValues = emaCalc.calculate(candles);
          
          const formattedData = candles.map((c: any, i: number) => ({
            time: timeFormat(c),
            value: emaValues[i],
          })).filter((d: any) => d.value !== undefined && !Number.isNaN(d.value));
          
          series.setData(formattedData as any);
        } else if (type === 'RSI') {
          const rsiCalc = new RSICalculator(rsiSettings.length, rsiSettings.smoothingLine);
          const rsiValues = rsiCalc.calculate(closes);
          const rsiData = candles.map((c: any, i: number) => ({ time: timeFormat(c), value: rsiValues[i] !== undefined ? rsiValues[i] : 50 }));
          
          const extendedLimitData = [...rsiData];
          
          // Remove paneBg to avoid drawing issues.
          
          if (rsiSettings.hlinesBackground) {
            const bgFillColor = rsiSettings.hlinesBackgroundColor || '#c4b5fd';
            
            const bgSeries = chart.addSeries(BaselineSeries, {
              priceScaleId: id,
              baseValue: { type: 'price', price: rsiSettings.lowerLimitValue },
              topFillColor1: bgFillColor,
              topFillColor2: bgFillColor,
              bottomFillColor1: 'transparent',
              bottomFillColor2: 'transparent',
              topLineColor: 'transparent',
              bottomLineColor: 'transparent',
              lineWidth: 0,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            bgSeries.setData(extendedLimitData.map(d => ({ time: d.time, value: rsiSettings.upperLimitValue })));
            seriesRef.current[`${id}-bg`] = bgSeries;
          }

          if (rsiSettings.smoothedMA) {
             const maCalc = new RSICalculator(rsiSettings.smoothingLength, rsiSettings.smoothingLine);
             const validRsi = rsiValues.filter(v => v !== undefined);
             const maValues = maCalc.smooth(validRsi, rsiSettings.smoothingLength);
             let maDataIndex = 0;
             const maData = rsiData.map((d, i) => {
                if (i < rsiSettings.smoothingLength - 1) return undefined;
                return { time: d.time, value: maValues[maDataIndex++] };
             }).filter(d => d !== undefined);
             
             const maSeries = chart.addSeries(LineSeries, {
               priceScaleId: id,
               color: rsiSettings.smoothedMAColor,
               lineWidth: 2,
               crosshairMarkerVisible: false,
               priceLineVisible: false,
               lastValueVisible: false,
             });
             maSeries.setData(maData as any);
             seriesRef.current[`${id}-ma`] = maSeries;
          }

          series = chart.addSeries(LineSeries, { 
            color: rsiSettings.plotColor, 
            lineWidth: rsiSettings.plotLineWidth,
            priceScaleId: id,
            visible: rsiSettings.plot,
            priceLineVisible: true,
            lastValueVisible: true,
          });
          series.setData(rsiData);

          if (rsiSettings.upperLimit) {
            series.createPriceLine({
              price: rsiSettings.upperLimitValue,
              color: rsiSettings.upperLimitColor,
              lineWidth: 1,
              lineStyle: rsiSettings.upperLimitLineStyle,
              axisLabelVisible: false,
            });
          }

          if (rsiSettings.middleLimit) {
            series.createPriceLine({
              price: rsiSettings.middleLimitValue,
              color: rsiSettings.middleLimitColor,
              lineWidth: 1,
              lineStyle: rsiSettings.middleLimitLineStyle,
              axisLabelVisible: false,
            });
          }

          if (rsiSettings.lowerLimit) {
            series.createPriceLine({
              price: rsiSettings.lowerLimitValue,
              color: rsiSettings.lowerLimitColor,
              lineWidth: 1,
              lineStyle: rsiSettings.lowerLimitLineStyle,
              axisLabelVisible: false,
            });
          }
          

        } else if (type === 'SUPERTREND') {
          series = chart.addSeries(LineSeries, { 
            lineWidth: superTrendSettings.lineWidth,
            lineStyle: superTrendSettings.lineStyle,
            lineType: 1, // LineType.WithSteps
            visible: superTrendSettings.plot,
            lastValueVisible: superTrendSettings.labelsOnPriceScale,
            priceLineVisible: superTrendSettings.labelsOnPriceScale,
            priceFormat: {
              type: 'price',
              precision: superTrendSettings.precision,
              minMove: 1 / Math.pow(10, superTrendSettings.precision),
            }
          });

          const stCalc = new SuperTrendCalculator(superTrendSettings.length, superTrendSettings.factor);
          const stData = stCalc.calculate(candles);
          
          const formattedData = candles.map((c: any, i: number) => ({
            time: timeFormat(c),
            value: stData[i]?.value,
            color: stData[i]?.direction === 1 ? superTrendSettings.colorUp : superTrendSettings.colorDown
          })).filter((d: any) => d.value !== undefined && !Number.isNaN(d.value));
          
          series.setData(formattedData as any);

          // Add markers for Up/Down arrows
          const markers = [];
          for (let i = 0; i < candles.length; i++) {
            const point = stData[i];
            if (point && point.isFlip) {
              if (point.direction === 1 && superTrendSettings.upArrow) {
                markers.push({
                  time: timeFormat(candles[i]),
                  position: superTrendSettings.upArrowLocation === 'belowBar' ? 'belowBar' : 'aboveBar',
                  color: superTrendSettings.upArrowColor,
                  shape: 'arrowUp',
                  size: 2
                });
              } else if (point.direction === -1 && superTrendSettings.downArrow) {
                markers.push({
                  time: timeFormat(candles[i]),
                  position: superTrendSettings.downArrowLocation === 'aboveBar' ? 'aboveBar' : 'belowBar',
                  color: superTrendSettings.downArrowColor,
                  shape: 'arrowDown',
                  size: 2
                });
              }
            }
          }
          
          if (markers.length > 0) {
            try {
              series.setMarkers(markers);
            } catch(e) {}
          }
        } else if (type === 'MACD') {
          const macdCalc = new MacdCalculator(macdSettings.fastLength, macdSettings.slowLength, macdSettings.signalLength, macdSettings.source);
          const macdData = macdCalc.calculate(candles);
          
          const commonOptions = {
            priceScaleId: id,
            lastValueVisible: macdSettings.labelsOnPriceScale,
            priceLineVisible: macdSettings.labelsOnPriceScale,
            priceFormat: {
              type: 'price',
              precision: macdSettings.precision,
              minMove: 1 / Math.pow(10, macdSettings.precision),
            }
          };

          const histogramSeries = chart.addSeries(HistogramSeries, {
            ...commonOptions,
            visible: macdSettings.histogramPlot,
          });
          const histData = candles.map((c: any, i: number) => {
            let color = macdSettings.color0;
            switch(macdData[i]?.phase) {
              case 1: color = macdSettings.color1; break;
              case 2: color = macdSettings.color2; break;
              case 3: color = macdSettings.color3; break;
            }
            return { time: timeFormat(c), value: macdData[i]?.histogram, color };
          }).filter((d: any) => d.value !== undefined && !Number.isNaN(d.value));
          histogramSeries.setData(histData as any);
          seriesRef.current[id + '-histogram'] = histogramSeries;

          const signalSeries = chart.addSeries(LineSeries, {
            ...commonOptions,
            color: macdSettings.signalColor,
            lineWidth: macdSettings.signalLineWidth,
            lineStyle: macdSettings.signalLineStyle,
            visible: macdSettings.signalPlot,
          });
          const signalData = candles.map((c: any, i: number) => ({
            time: timeFormat(c), value: macdData[i]?.signal
          })).filter((d: any) => d.value !== undefined && !Number.isNaN(d.value));
          signalSeries.setData(signalData as any);
          seriesRef.current[id + '-signal'] = signalSeries;

          series = chart.addSeries(LineSeries, { 
            ...commonOptions,
            color: macdSettings.macdColor, 
            lineWidth: macdSettings.macdLineWidth,
            lineStyle: macdSettings.macdLineStyle,
            visible: macdSettings.macdPlot,
          });
          const lineData = candles.map((c: any, i: number) => ({
            time: timeFormat(c), value: macdData[i]?.macd
          })).filter((d: any) => d.value !== undefined && !Number.isNaN(d.value));
          series.setData(lineData as any);
          
          
        } else if (type === 'ATR') {
          const commonOptions = {
            priceScaleId: id,
            lastValueVisible: atrSettings.labelsOnPriceScale,
            priceLineVisible: atrSettings.labelsOnPriceScale,
            priceFormat: {
              type: 'price',
              precision: atrSettings.precision,
              minMove: 1 / Math.pow(10, atrSettings.precision),
            }
          };

          series = chart.addSeries(LineSeries, { 
            ...commonOptions,
            color: atrSettings.plotColor, 
            lineWidth: atrSettings.plotLineWidth,
            lineStyle: atrSettings.plotLineStyle,
            visible: atrSettings.plot,
          });
          const atrCalc = new ATRCalculator(atrSettings.length, atrSettings.maType);
          const atrData = atrCalc.calculate(candles);
          series.setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: atrData[i] || 0 })));
          
          
        } else if (type === 'VWAP') {
          series = chart.addSeries(LineSeries, { 
            color: vwapSettings.plotColor, 
            lineWidth: vwapSettings.plotLineWidth,
            lineStyle: vwapSettings.plotLineStyle,
            visible: vwapSettings.plot,
            lastValueVisible: vwapSettings.labelsOnScale,
            priceLineVisible: vwapSettings.labelsOnScale,
            priceFormat: {
              type: 'price',
              precision: vwapSettings.precision,
              minMove: 1 / Math.pow(10, vwapSettings.precision),
            }
          });
          const vwapCalc = new VwapCalculator(vwapSettings.source, vwapSettings.anchorPeriod);
          const vwapData = vwapCalc.calculate(candles);
          series.setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: vwapData[i] || 0 })));
        }

        if (series) {
          series.applyOptions({ visible: !hiddenIndicators.includes(id) });
          seriesRef.current[id] = series;
        }
      } else {
        seriesRef.current[id].applyOptions({ visible: !hiddenIndicators.includes(id) });
        if (seriesRef.current[id + '-histogram']) {
          seriesRef.current[id + '-histogram'].applyOptions({ visible: !hiddenIndicators.includes(id) });
        }
        if (seriesRef.current[id + '-signal']) {
          seriesRef.current[id + '-signal'].applyOptions({ visible: !hiddenIndicators.includes(id) });
        }
      }
    }

    // Remove stale indicators
    const activeIds = new Set(activeIndicators);
    Object.keys(seriesRef.current).forEach(id => {
      let baseId = id;
      ['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal'].forEach(suffix => {
        if (id.endsWith(suffix)) baseId = id.slice(0, -suffix.length);
      });
      if (baseId !== 'candlestick' && baseId !== 'line' && !activeIds.has(baseId)) {
        if (seriesRef.current[id].setMarkers) {
          try {
            seriesRef.current[id].setMarkers([]);
          } catch (e) {}
        }
        try {
          chart.removeSeries(seriesRef.current[id]);
        } catch (e) {
          console.error('Error removing series', e);
        }
        delete seriesRef.current[id];
      }
    });

    if (!isHoveringRef.current) {
      const newIndicatorValues: Record<string, number> = {};
      Object.keys(seriesRef.current).forEach(id => {
        if (id !== 'candlestick' && id !== 'line') {
          const series = seriesRef.current[id];
          if (series && typeof series.data === 'function') {
            const data = series.data();
            if (data && data.length > 0) {
              newIndicatorValues[id] = data[data.length - 1].value ?? data[data.length - 1].close;
            }
          }
        }
      });
      
      setIndicatorValues(newIndicatorValues);
    }

    // Re-apply margins synchronously to newly created indicator price scales
    if (chartRef.current) {
      const chart = chartRef.current;
      const bottomIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR'));
      const oscillatorCount = bottomIndicators.length;
      const bottomPaneActive = oscillatorCount > 0;
      const totalRatio = rsiHeightRatioRef.current;
      
      chart.priceScale('right').applyOptions({
        scaleMargins: { top: 0.1, bottom: bottomPaneActive ? totalRatio + 0.05 : 0.05 },
      });

      Object.keys(seriesRef.current).forEach(id => {
        if (id.startsWith('VOLUME')) {
          const s = seriesRef.current[id];
          if (s && s.priceScale) {
             const bottomMargin = bottomPaneActive ? totalRatio + 0.05 : 0.05;
             s.priceScale().applyOptions({ scaleMargins: { top: 1 - bottomMargin - 0.2, bottom: bottomMargin } });
          }
        }
      });

      if (bottomPaneActive) {
        const paneHeight = totalRatio / oscillatorCount;
        bottomIndicators.forEach((id, index) => {
          const topMargin = 1 - totalRatio + (index * paneHeight);
          const bottomMargin = totalRatio - ((index + 1) * paneHeight);
          try {
            chart.priceScale(id).applyOptions({
              scaleMargins: { top: topMargin, bottom: bottomMargin },
              borderColor: '#E2E8F0',
            });
          } catch(e) {}
        });
      }
    }
  };

    updateIndicators();

  return () => { isMounted = false; };
}, [activeIndicators, hiddenIndicators, candles, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings]);

    // Handle all price scale margins dynamically
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const bottomIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR'));
      const oscillatorCount = bottomIndicators.length;
      const bottomPaneActive = oscillatorCount > 0;
      const totalRatio = rsiHeightRatio;
      
      chart.priceScale('right').applyOptions({
        scaleMargins: { top: 0.1, bottom: bottomPaneActive ? totalRatio + 0.05 : 0.05 },
      });

      // Update volume margins
      Object.keys(seriesRef.current).forEach(id => {
        if (id.startsWith('VOLUME')) {
          const series = seriesRef.current[id];
          if (series) {
             const bottomMargin = bottomPaneActive ? totalRatio + 0.05 : 0.05;
             series.priceScale().applyOptions({ scaleMargins: { top: 1 - bottomMargin - 0.2, bottom: bottomMargin } });
          }
        }
      });

      // Distribute pane space evenly among active oscillators
      if (bottomPaneActive) {
        const paneHeight = totalRatio / oscillatorCount;
        bottomIndicators.forEach((id, index) => {
          const topMargin = 1 - totalRatio + (index * paneHeight);
          const bottomMargin = totalRatio - ((index + 1) * paneHeight);
          try {
            chart.priceScale(id).applyOptions({
              scaleMargins: { top: topMargin, bottom: bottomMargin },
              borderColor: '#E2E8F0',
            });
          } catch(e) {}
        });
      }
    }
  }, [rsiHeightRatio, activeIndicators]);

  // Apply Candle Settings Dynamically
  useEffect(() => {
    if (!candles) return;
    if (seriesRef.current['candlestick']) {
      seriesRef.current['candlestick'].applyOptions({
        upColor: candleSettings.bodyVisible ? candleSettings.bodyUpColor : 'transparent',
        downColor: candleSettings.bodyVisible ? candleSettings.bodyDownColor : 'transparent',
        borderUpColor: candleSettings.borderUpColor,
        borderDownColor: candleSettings.borderDownColor,
        wickUpColor: candleSettings.wickUpColor,
        wickDownColor: candleSettings.wickDownColor,
        borderVisible: candleSettings.borderVisible,
        wickVisible: candleSettings.wickVisible,
      });
    }
    
    const timeFormat = (c: any) => c.time as any;
    Object.keys(seriesRef.current).forEach(id => {
      if (id.startsWith('VOLUME-')) {
        seriesRef.current[id].setData(candles.map((c: any) => ({ 
          time: timeFormat(c), 
          value: c.volume || 0,
          color: c.close >= c.open ? volumeSettings.upColor : volumeSettings.downColor
        })));
      }
      
      if (id.startsWith('ATR-')) {
        const atrCalc = new ATRCalculator(atrSettings.length, atrSettings.maType);
        const atrData = atrCalc.calculate(candles);
        seriesRef.current[id].setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: atrData[i] || 0 })));
        seriesRef.current[id].applyOptions({
           color: atrSettings.plotColor, 
           lineWidth: atrSettings.plotLineWidth,
           lineStyle: atrSettings.plotLineStyle,
           visible: atrSettings.plot,
           lastValueVisible: atrSettings.labelsOnPriceScale,
           priceLineVisible: atrSettings.labelsOnPriceScale,
           priceFormat: {
              type: 'price',
              precision: atrSettings.precision,
              minMove: 1 / Math.pow(10, atrSettings.precision),
           }
        });
      }
      if (id.startsWith('VWAP-')) {
        const vwapCalc = new VwapCalculator(vwapSettings.source, vwapSettings.anchorPeriod);
        const vwapData = vwapCalc.calculate(candles);
        seriesRef.current[id].setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: vwapData[i] || 0 })));
        seriesRef.current[id].applyOptions({
           color: vwapSettings.plotColor, 
           lineWidth: vwapSettings.plotLineWidth,
           lineStyle: vwapSettings.plotLineStyle,
           visible: vwapSettings.plot,
           lastValueVisible: vwapSettings.labelsOnScale,
           priceLineVisible: vwapSettings.labelsOnScale,
           priceFormat: {
              type: 'price',
              precision: vwapSettings.precision,
              minMove: 1 / Math.pow(10, vwapSettings.precision),
           }
        });
      }
    });
  }, [candleSettings, volumeSettings, candles, atrSettings, vwapSettings]);

useEffect(() => {
  if (!chartRef.current) return;
  if (seriesRef.current['candlestick']) {
    seriesRef.current['candlestick'].applyOptions({ visible: chartType === 'candle' });
  }
  if (seriesRef.current['line']) {
    seriesRef.current['line'].applyOptions({ visible: chartType === 'line' });
  }
}, [chartType]);

// Alert simulation update
useEffect(() => {
  if (hoveredCandle) {
    const triggeredIds = alertManager.current.checkAlerts(selectedSymbol, hoveredCandle.close);
    if (triggeredIds && triggeredIds.length > 0) {
      setAlerts(prev => prev.filter(a => !triggeredIds.includes(a.id)));
    }
  }
}, [hoveredCandle, alertManager, selectedSymbol]);

const candleChange = hoveredCandle?.prevClose
  ? hoveredCandle.close - hoveredCandle.prevClose
  : (hoveredCandle ? hoveredCandle.close - hoveredCandle.open : 0);
const candleChangePct = hoveredCandle?.prevClose
  ? (candleChange / hoveredCandle.prevClose) * 100
  : (hoveredCandle ? (candleChange / hoveredCandle.open) * 100 : 0);
const isPositive = candleChange >= 0;

return (
  <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
    {/* Symbol selector */}
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', position: 'relative', flexShrink: 0, background: '#FFFFFF' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search symbol..."
            className="input-base"
            style={{ paddingLeft: 36, paddingTop: 10, paddingBottom: 10, width: '100%' }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              {searchResults.map(s => (
                <button key={s.symbol} onClick={() => { setSelectedSymbol(s.symbol, s.exchange as 'NSE' | 'BSE'); setSearchQuery(''); setSearchResults([]); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#0B0F19', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', fontSize: 14 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ fontWeight: 600 }}>{s.symbol}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{s.exchange}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/trade')}
          style={{ padding: '10px 16px', background: '#0E7490', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Trade
        </button>
      </div>
    </div>

    {/* Fullscreen Wrapper */}
    <div ref={fullScreenRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#FFFFFF' }}>
      {/* Sub-header (Toolbar Area) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0, overflow: 'visible', flexWrap: 'wrap', background: '#FFFFFF' }}>

        {/* Timeframe tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => setTimeframe(tf.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid',
                borderColor: timeframe === tf.value ? '#0E7490' : 'transparent',
                background: timeframe === tf.value ? 'rgba(14, 116, 144,0.1)' : 'transparent',
                color: timeframe === tf.value ? '#0E7490' : '#64748B',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
              {tf.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />
        
        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Undo (Ctrl+Z)"
            style={{
              padding: '6px', borderRadius: 8, border: '1px solid transparent',
              background: 'transparent', color: historyIndex === 0 ? '#CBD5E1' : '#475569',
              cursor: historyIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Redo (Ctrl+Y)"
            style={{
              padding: '6px', borderRadius: 8, border: '1px solid transparent',
              background: 'transparent', color: historyIndex === history.length - 1 ? '#CBD5E1' : '#475569',
              cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
          </button>
        </div>
        
        {/* Option Chain */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOptionChainOpen(!isOptionChainOpen)}
            title="Option Chain"
            style={{
              padding: '6px 8px', borderRadius: 8, border: '1px solid transparent',
              background: isOptionChainOpen ? '#F1F5F9' : 'transparent', color: '#475569',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600
            }}
            onMouseEnter={(e) => { if (!isOptionChainOpen) e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={(e) => { if (!isOptionChainOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="4" y1="6" x2="10" y2="6" />
              <line x1="6" y1="10" x2="10" y2="10" />
              <line x1="8" y1="14" x2="10" y2="14" />
              <line x1="14" y1="10" x2="18" y2="10" />
              <line x1="14" y1="14" x2="20" y2="14" />
              <line x1="14" y1="18" x2="22" y2="18" />
            </svg>
            Option Chain
          </button>
          
          {isOptionChainOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, padding: '12px 16px', zIndex: 50,
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', whiteSpace: 'nowrap', fontSize: 14, color: '#0F172A', fontWeight: 500
            }}>
              To be Updated
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Chart Types */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setIsChartTypeOpen(!isChartTypeOpen); setIsIndicatorsOpen(false); setIsToolsOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid transparent', background: isChartTypeOpen ? '#F1F5F9' : 'transparent', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {chartType === 'candle' ? <CandlestickChart size={16} /> : <LineChartIcon size={16} />}
            <span>{chartType === 'candle' ? 'Candles' : 'Line'}</span>
            <ChevronDown size={14} />
          </button>

          {isChartTypeOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 200, zIndex: 50,
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
            }}>
              <div style={{ padding: '6px 0' }}>
                <button
                  onClick={() => { setChartType('candle'); setIsChartTypeOpen(false); }}
                  style={{
                    width: '100%', padding: '10px 16px', background: chartType === 'candle' ? 'rgba(14, 116, 144, 0.05)' : 'none',
                    border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                    color: chartType === 'candle' ? '#0E7490' : '#475569',
                    fontWeight: chartType === 'candle' ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (chartType !== 'candle') e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { if (chartType !== 'candle') e.currentTarget.style.background = 'none'; }}
                >
                  <CandlestickChart size={16} />
                  CandleStick
                </button>
                <button
                  onClick={() => { setChartType('line'); setIsChartTypeOpen(false); }}
                  style={{
                    width: '100%', padding: '10px 16px', background: chartType === 'line' ? 'rgba(14, 116, 144, 0.05)' : 'none',
                    border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                    color: chartType === 'line' ? '#0E7490' : '#475569',
                    fontWeight: chartType === 'line' ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (chartType !== 'line') e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { if (chartType !== 'line') e.currentTarget.style.background = 'none'; }}
                >
                  <LineChartIcon size={16} />
                  Line Chart
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Indicators */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => { setIsIndicatorsOpen(!isIndicatorsOpen); setIsChartTypeOpen(false); setIsToolsOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid transparent', background: isIndicatorsOpen ? '#F1F5F9' : 'transparent', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontWeight: 'bold' }}>fx</span>
              <span>Indicators</span>
              <ChevronDown size={14} />
            </button>

          </div>

          {isIndicatorsOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 240, zIndex: 50,
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ padding: 12, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    autoFocus
                    value={indicatorSearch}
                    onChange={(e) => setIndicatorSearch(e.target.value)}
                    placeholder="Search..."
                    style={{ width: '100%', padding: '6px 12px 6px 30px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
                {filteredIndicators.map(ind => {
                  const isActive = activeIndicators.some(id => id.startsWith(ind + '-'));
                  return (
                    <button
                      key={ind}
                      onClick={() => addIndicator(ind)}
                      style={{
                        width: '100%', padding: '8px 16px', background: isActive ? 'rgba(14, 116, 144, 0.05)' : 'none',
                        border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13,
                        color: isActive ? '#0E7490' : '#475569',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                    >
                      {ind}
                    </button>
                  );
                })}
                {filteredIndicators.length === 0 && (
                  <div style={{ padding: '12px 16px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No indicators found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Tools */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setIsToolsOpen(!isToolsOpen); setIsIndicatorsOpen(false); setIsChartTypeOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid transparent', background: isToolsOpen ? '#F1F5F9' : 'transparent', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <PenTool size={16} />
            <span>Tools</span>
            <ChevronDown size={14} />
          </button>

          {isToolsOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 200, zIndex: 50,
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
            }}>
              <div style={{ padding: '6px 0', maxHeight: 300, overflowY: 'auto' }}>
                {DRAWING_TOOLS.map(tool => {
                  const Icon = tool.icon;
                  const isActive = activeDrawingTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveDrawingTool(tool.id as DrawingType);
                        setIsToolsOpen(false);
                        if (tool.id === 'alert') {
                           setAlertForm({ condition: 'above', value: hoveredCandle ? hoveredCandle.close.toString() : (quote as any)?.price?.toString() || '' });
                           setIsAlertModalOpen(true);
                           setActiveDrawingTool('cursor');
                        }
                      }}
                      style={{
                        width: '100%', padding: '10px 16px', background: isActive ? 'rgba(14, 116, 144, 0.05)' : 'none',
                        border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                        color: isActive ? '#0E7490' : '#475569',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                    >
                      <Icon size={16} />
                      {tool.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <RealTimeClock style={{ padding: '4px 8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }} />
          
          {/* Layout Dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setIsLayoutOpen(!isLayoutOpen); setIsIndicatorsOpen(false); setIsChartTypeOpen(false); setIsToolsOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid transparent', background: isLayoutOpen ? '#F1F5F9' : 'transparent', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Layout size={16} />
              <span>Layout</span>
              <ChevronDown size={14} />
            </button>
            {isLayoutOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 280, zIndex: 50,
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: 16
              }}>
                {/* 1, 2, 3 rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', width: 12 }}>1</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div onClick={() => setActiveLayout('1')} style={{ padding: 4, borderRadius: 4, cursor: 'pointer', background: activeLayout === '1' ? 'rgba(41, 98, 255, 0.1)' : 'transparent' }}>
                        {renderLayoutIcon('1', activeLayout === '1')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', width: 12 }}>2</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['2a', '2b'].map(id => (
                        <div key={id} onClick={() => setActiveLayout(id)} style={{ padding: 4, borderRadius: 4, cursor: 'pointer', background: activeLayout === id ? 'rgba(41, 98, 255, 0.1)' : 'transparent' }}>
                          {renderLayoutIcon(id, activeLayout === id)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', width: 12 }}>3</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['3a', '3b', '3c', '3d', '3e', '3f'].map(id => (
                        <div key={id} onClick={() => setActiveLayout(id)} style={{ padding: 4, borderRadius: 4, cursor: 'pointer', background: activeLayout === id ? 'rgba(41, 98, 255, 0.1)' : 'transparent' }}>
                          {renderLayoutIcon(id, activeLayout === id)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sync in Layout text */}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>
                  SYNC IN LAYOUT
                </div>

                {/* 5 Bottom Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'interval', label: 'Interval' },
                    { key: 'crosshair', label: 'Crosshair' },
                    { key: 'time', label: 'Time' },
                    { key: 'dateRange', label: 'Date range' }
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>{item.label}</span>
                        <Info size={12} color="#94A3B8" />
                      </div>
                      <ToggleSwitch checked={syncLayout[item.key as keyof typeof syncLayout]} onChange={() => setSyncLayout(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof syncLayout] }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
            onClick={() => { setTempCandleSettings(candleSettings); setIsChartSettingsModalOpen(true); }}
            title="Chart Settings"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', color: '#475569', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0B0F19'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <Settings size={18} />
          </button>
          <button
            onClick={toggleFullScreen}
            title="Full Screen"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', color: '#475569', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0B0F19'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <Maximize size={18} />
          </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#FFFFFF', padding: '16px', gap: '12px' }}>

        {/* Left Sidebar area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', width: isSidebarOpen ? 48 : 32, transition: 'width 0.2s', border: '1px solid black', borderRadius: '4px', background: '#FFFFFF', padding: '8px 0' }}>
          {isSidebarOpen && (
            <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', scrollbarWidth: 'none', msOverflowStyle: 'none', marginBottom: 8 }}>
              {DRAWING_TOOLS.map(tool => {
                const Icon = tool.icon;
                const isActive = activeDrawingTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    title={tool.label}
                    onClick={() => {
                      setActiveDrawingTool(tool.id as DrawingType);
                      if (tool.id === 'alert') {
                         setAlertForm({ condition: 'above', value: hoveredCandle ? hoveredCandle.close.toString() : (quote as any)?.price?.toString() || '' });
                         setIsAlertModalOpen(true);
                         setActiveDrawingTool('cursor');
                      }
                    }}
                    style={{
                      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                      background: isActive ? 'rgba(14, 116, 144, 0.05)' : 'transparent',
                      color: isActive ? '#0E7490' : '#475569',
                      border: 'none', cursor: 'pointer', flexShrink: 0
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          )}
          
          <button 
             title={isSidebarOpen ? "Hide drawing tools panel" : "Show drawing tools panel"}
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', color: '#64748B', border: 'none', cursor: 'pointer', alignSelf: 'center', marginTop: isSidebarOpen ? 0 : 12 }}
             onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
             onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
           >
             {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Chart Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid black', borderRadius: '4px' }}>
          {/* TradingView Style Legend Overlay */}
          {hoveredCandle && quote && (
            <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
              {/* Symbol & Timeframe */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: '#0B0F19' }}>
                <span>{(quote as any).companyName || quote.symbol}</span>
                <span style={{ color: '#94A3B8', fontSize: 14 }}>•</span>
                <span style={{ fontSize: 14 }}>{timeframe}</span>
                <span style={{ color: '#94A3B8', fontSize: 14 }}>•</span>
                <span style={{ fontSize: 14, color: '#64748B' }}>{quote.exchange}</span>
              </div>

              {/* OHLCV Data */}
              <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
                <span>O <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.open.toFixed(2)}</span></span>
                <span>H <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.high.toFixed(2)}</span></span>
                <span>L <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.low.toFixed(2)}</span></span>
                <span>C <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.close.toFixed(2)}</span></span>
                <span style={{ fontWeight: 600, color: isPositive ? '#10B981' : '#EF4444' }}>
                  {isPositive ? '+' : ''}{candleChange.toFixed(2)} ({isPositive ? '+' : ''}{candleChangePct.toFixed(2)}%)
                </span>
                {hoveredCandle.volume !== undefined && (
                  <span>Vol <span style={{ fontWeight: 600, color: '#0B0F19' }}>{formatVolume(hoveredCandle.volume)}</span></span>
                )}
              </div>

              {/* Buy/Sell Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto', marginTop: 4 }}>
                <button
                  onClick={() => navigate('/trade')}
                  style={{ background: '#fff', border: '1px solid #EF4444', color: '#EF4444', padding: '2px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  {hoveredCandle.close.toFixed(2)}
                </button>
                <span style={{ fontSize: 12, color: '#475569' }}>0.00</span>
                <button
                  onClick={() => navigate('/trade')}
                  style={{ background: '#fff', border: '1px solid #10B981', color: '#10B981', padding: '2px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  {hoveredCandle.close.toFixed(2)}
                </button>
              </div>

              {/* Indicator Legend (Top Pane) */}
              {(() => {
                const topPaneIndicators = activeIndicators.filter(id => !id.startsWith('RSI') && !id.startsWith('MACD') && !id.startsWith('ATR'));
                return topPaneIndicators.length > 0 && (
                  <div style={{ pointerEvents: 'auto', marginTop: 4 }}>
                    <button
                      onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                      style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#0F172A' }}
                    >
                      {isLegendExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {topPaneIndicators.length}
                    </button>
                    {isLegendExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6, gap: 2 }}>
                        {topPaneIndicators.map(ind => (
                          <IndicatorLegendRow
                            key={ind}
                            ind={ind}
                            value={indicatorValues[ind]}
                            isHidden={hiddenIndicators.includes(ind)}
                            hideValue={(ind.startsWith('EMA') && !emaSettings.valuesInStatusLine) || (ind.startsWith('SUPERTREND') && !superTrendSettings.valuesInStatusLine) || (ind.startsWith('MACD') && !macdSettings.valuesInStatusLine) || (ind.startsWith('ATR') && !atrSettings.valuesInStatusLine) || (ind.startsWith('VWAP') && !vwapSettings.valuesInStatusLine)}
                            onToggleHide={() => {
                              setHiddenIndicators(prev =>
                                prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
                              );
                            }}
                            onRemove={() => {
                              setActiveIndicators(prev => {
                                const next = prev.filter(i => i !== ind);
                                pushToHistory({ activeIndicators: next });
                                return next;
                              });
                            }}
                            onSettings={() => {
                              if (ind.startsWith('VOLUME')) {
                                setTempVolumeSettings(volumeSettings);
                                setIsVolumeSettingsModalOpen(true);
                              } else if (ind.startsWith('RSI')) {
                                setTempRsiSettings(rsiSettings);
                                setRsiSettingsActiveTab('Inputs');
                                setIsRsiSettingsModalOpen(true);
                              } else if (ind.startsWith('EMA')) {
                                setTempEmaSettings(emaSettings);
                                setEmaSettingsActiveTab('Inputs');
                                setIsEmaSettingsModalOpen(true);
                              } else if (ind.startsWith('SUPERTREND')) {
                                setTempSuperTrendSettings(superTrendSettings);
                                setSuperTrendSettingsActiveTab('Inputs');
                                setIsSuperTrendSettingsModalOpen(true);
                              } else if (ind.startsWith('MACD')) {
                                setTempMacdSettings(macdSettings);
                                setMacdSettingsActiveTab('Inputs');
                                setIsMacdSettingsModalOpen(true);
                              } else if (ind.startsWith('ATR')) {
                                setTempAtrSettings(atrSettings);
                                setAtrSettingsActiveTab('Inputs');
                                setIsAtrSettingsModalOpen(true);
                              } else if (ind.startsWith('VWAP')) {
                                setTempVwapSettings(vwapSettings);
                                setVwapSettingsActiveTab('Inputs');
                                setIsVwapSettingsModalOpen(true);
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {candlesLoading ? (
            <div style={{ height: '100%', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
              <Skeleton width="100%" height="100%" borderRadius={0} />
            </div>
          ) : (
            <>
              <div ref={chartContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              
              {activeIndicators.some(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR')) && (
                <>
                  {/* Resizer with Blur Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${(1 - rsiHeightRatio) * 100}%`,
                      left: 0,
                      right: 0,
                      height: '8px',
                      marginTop: '-4px', // Center the drag handle over the line
                      cursor: 'row-resize',
                      zIndex: 50,
                      background: isResizingRsi ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsResizingRsi(true);
                      
                      const handle = e.currentTarget as HTMLDivElement;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        if (!chartContainerRef.current) return;
                        const rect = chartContainerRef.current.getBoundingClientRect();
                        const y = moveEvent.clientY - rect.top;
                        const newRatio = 1 - (y / rect.height);
                        const clampedRatio = Math.max(0.1, Math.min(0.8, newRatio));
                        handle.style.top = `${(1 - clampedRatio) * 100}%`;
                        handle.setAttribute('data-ratio', clampedRatio.toString());
                      };
                      
                      const handleMouseUp = () => {
                        setIsResizingRsi(false);
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        
                        const finalRatio = handle.getAttribute('data-ratio');
                        if (finalRatio) {
                          setRsiHeightRatio(parseFloat(finalRatio));
                        }
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <div style={{ width: '100%', height: '1px', background: 'rgba(148, 163, 184, 0.5)', boxShadow: '0 0 4px rgba(148, 163, 184, 0.8)' }} />
                  </div>

                  {/* Bottom Pane Legends */}
                  {(() => {
                    const bottomPaneIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR'));
                    return bottomPaneIndicators.map((ind, index) => {
                      const paneHeight = rsiHeightRatio / bottomPaneIndicators.length;
                      const topMargin = 1 - rsiHeightRatio + (index * paneHeight);
                      return (
                        <div key={`legend-${ind}`} style={{ position: 'absolute', top: `calc(${topMargin * 100}% - 28px)`, left: 16, zIndex: 10, pointerEvents: 'auto' }}>
                          <IndicatorLegendRow
                            ind={ind}
                            value={indicatorValues[ind]}
                            isHidden={hiddenIndicators.includes(ind)}
                            hideValue={(ind.startsWith('EMA') && !emaSettings.valuesInStatusLine) || (ind.startsWith('SUPERTREND') && !superTrendSettings.valuesInStatusLine) || (ind.startsWith('MACD') && !macdSettings.valuesInStatusLine) || (ind.startsWith('ATR') && !atrSettings.valuesInStatusLine) || (ind.startsWith('VWAP') && !vwapSettings.valuesInStatusLine)}
                            onToggleHide={() => {
                              setHiddenIndicators(prev =>
                                prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
                              );
                            }}
                            onRemove={() => {
                              setActiveIndicators(prev => {
                                const next = prev.filter(i => i !== ind);
                                pushToHistory({ activeIndicators: next });
                                return next;
                              });
                            }}
                            onSettings={() => {
                              if (ind.startsWith('VOLUME')) {
                                setTempVolumeSettings(volumeSettings);
                                setIsVolumeSettingsModalOpen(true);
                              } else if (ind.startsWith('RSI')) {
                                setTempRsiSettings(rsiSettings);
                                setRsiSettingsActiveTab('Inputs');
                                setIsRsiSettingsModalOpen(true);
                              } else if (ind.startsWith('EMA')) {
                                setTempEmaSettings(emaSettings);
                                setEmaSettingsActiveTab('Inputs');
                                setIsEmaSettingsModalOpen(true);
                              } else if (ind.startsWith('SUPERTREND')) {
                                setTempSuperTrendSettings(superTrendSettings);
                                setSuperTrendSettingsActiveTab('Inputs');
                                setIsSuperTrendSettingsModalOpen(true);
                              } else if (ind.startsWith('MACD')) {
                                setTempMacdSettings(macdSettings);
                                setMacdSettingsActiveTab('Inputs');
                                setIsMacdSettingsModalOpen(true);
                              } else if (ind.startsWith('ATR')) {
                                setTempAtrSettings(atrSettings);
                                setAtrSettingsActiveTab('Inputs');
                                setIsAtrSettingsModalOpen(true);
                              } else if (ind.startsWith('VWAP')) {
                                setTempVwapSettings(vwapSettings);
                                setVwapSettingsActiveTab('Inputs');
                                setIsVwapSettingsModalOpen(true);
                              }
                            }}
                          />
                        </div>
                      );
                    });
                  })()}
                </>
              )}

              {containerSize.width > 0 && containerSize.height > 0 && (
                <ChartDrawingOverlay
                  chart={chartRef.current as any}
                  series={seriesRef.current['candlestick'] || null}
                  activeTool={activeDrawingTool}
                  setActiveTool={setActiveDrawingTool}
                  drawings={drawings}
                  setDrawings={setDrawings}
                  onHistoryCommit={commitHistory}
                  triggerResize={containerSize.width + containerSize.height}
                  currentPrice={candles && candles.length > 0 ? candles[candles.length - 1].close : undefined}
                  candles={candles}
                  alerts={alerts}
                  onRemoveAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Alert Modal */}
      {isAlertModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Create alert on {(quote as any)?.companyName || selectedSymbol}</h3>
              <button onClick={() => setIsAlertModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ width: 100, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Scrip</label>
                <div style={{ flex: 1, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, background: '#F8FAFC', fontSize: 14, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{(quote as any)?.companyName || selectedSymbol}</span>
                  <ChevronDown size={16} />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ width: 100, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Condition</label>
                <div style={{ flex: 1, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, background: '#F8FAFC', fontSize: 14, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Price</span>
                  <ChevronDown size={16} />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ width: 100 }}></label>
                <select 
                  value={alertForm.condition} 
                  onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: '#0F172A', outline: 'none', appearance: 'none', background: 'transparent' }}
                >
                  <option value="above">↗ Crossing above</option>
                  <option value="below">↘ Crossing down</option>
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: 32, pointerEvents: 'none', color: '#0F172A' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <label style={{ width: 100, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Value</label>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 14, color: '#0F172A' }}>₹</span>
                  <input 
                    type="number" 
                    value={alertForm.value}
                    onChange={(e) => setAlertForm({ ...alertForm, value: e.target.value })}
                    style={{ width: '100%', padding: '10px 32px 10px 28px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: '#0F172A', outline: 'none' }} 
                  />
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsAlertModalOpen(false)} style={{ padding: '8px 24px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  const val = parseFloat(alertForm.value);
                  if (!isNaN(val)) {
                    const newAlert = alertManager.current.addAlert(selectedSymbol, val, alertForm.condition as 'above' | 'below');
                    setAlerts(prev => [...prev, newAlert]);
                  }
                  setIsAlertModalOpen(false);
                }}
                style={{ padding: '8px 24px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#0E7490'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interval Modal */}
      {isIntervalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '24px 32px', width: 320, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Change interval</h3>
                <Info size={16} color="#94A3B8" />
              </div>
              <button onClick={() => setIsIntervalModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 0 }}>
                <X size={20} />
              </button>
            </div>
            
            <input 
              autoFocus
              type="text" 
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = intervalInput.toUpperCase();
                  let mapped = '';
                  if (val === '1') mapped = '1m';
                  else if (val === '5') mapped = '5m';
                  else if (val === '15') mapped = '15m';
                  else if (val === '1H') mapped = '1h';
                  else if (val === '1D') mapped = '1d';
                  else if (val === '1M') mapped = '1M';
                  
                  if (mapped) {
                    setTimeframe(mapped as any);
                  }
                  setIsIntervalModalOpen(false);
                } else if (e.key === 'Escape') {
                  setIsIntervalModalOpen(false);
                }
              }}
              style={{ width: '100%', padding: '12px', border: '2px solid #3B82F6', borderRadius: 8, fontSize: 18, color: '#0F172A', outline: 'none', textAlign: 'center', marginBottom: 8 }} 
            />
            
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {intervalInput === '1' ? '1 minute' : 
               intervalInput === '5' ? '5 minutes' : 
               intervalInput === '15' ? '15 minutes' : 
               intervalInput.toUpperCase() === '1H' ? '1 hour' : 
               intervalInput.toUpperCase() === '1D' ? '1 day' : 
               intervalInput.toUpperCase() === '1M' ? '1 month' : 
               'Invalid interval'}
            </span>
          </div>
        </div>
      )}
      
      {/* Chart Settings Modal */}
      {isChartSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Candle Setting</h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, letterSpacing: 0.5, marginBottom: 20 }}>CANDLES</div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <input type="checkbox" checked={tempCandleSettings.bodyVisible} onChange={(e) => setTempCandleSettings({...tempCandleSettings, bodyVisible: e.target.checked})} style={{ width: 20, height: 20, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Body</span>
                <input type="color" value={tempCandleSettings.bodyUpColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, bodyUpColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
                <input type="color" value={tempCandleSettings.bodyDownColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, bodyDownColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <input type="checkbox" checked={tempCandleSettings.borderVisible} onChange={(e) => setTempCandleSettings({...tempCandleSettings, borderVisible: e.target.checked})} style={{ width: 20, height: 20, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Borders</span>
                <input type="color" value={tempCandleSettings.borderUpColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, borderUpColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
                <input type="color" value={tempCandleSettings.borderDownColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, borderDownColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <input type="checkbox" checked={tempCandleSettings.wickVisible} onChange={(e) => setTempCandleSettings({...tempCandleSettings, wickVisible: e.target.checked})} style={{ width: 20, height: 20, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Wick</span>
                <input type="color" value={tempCandleSettings.wickUpColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, wickUpColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
                <input type="color" value={tempCandleSettings.wickDownColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, wickDownColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsChartSettingsModalOpen(false); setTempCandleSettings(candleSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setCandleSettings(tempCandleSettings); pushToHistory({ candleSettings: tempCandleSettings }); setIsChartSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Volume Settings Modal */}
      {isVolumeSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Volume Bar setting</h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Bullish Volume</span>
                <input type="color" value={tempVolumeSettings.upColor} onChange={(e) => setTempVolumeSettings({...tempVolumeSettings, upColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Bearish Volume</span>
                <input type="color" value={tempVolumeSettings.downColor} onChange={(e) => setTempVolumeSettings({...tempVolumeSettings, downColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsVolumeSettingsModalOpen(false); setTempVolumeSettings(volumeSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setVolumeSettings(tempVolumeSettings); pushToHistory({ volumeSettings: tempVolumeSettings }); setIsVolumeSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* RSI Settings Modal */}
      {isRsiSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>RSI</h3>
              <button onClick={() => setIsRsiSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid #E2E8F0', gap: 24 }}>
              <button 
                onClick={() => setRsiSettingsActiveTab('Inputs')}
                style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: rsiSettingsActiveTab === 'Inputs' ? '2px solid #0F172A' : '2px solid transparent', fontSize: 15, fontWeight: rsiSettingsActiveTab === 'Inputs' ? 600 : 500, color: rsiSettingsActiveTab === 'Inputs' ? '#0F172A' : '#64748B', cursor: 'pointer' }}
              >Inputs</button>
              <button 
                onClick={() => setRsiSettingsActiveTab('Style')}
                style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: rsiSettingsActiveTab === 'Style' ? '2px solid #0F172A' : '2px solid transparent', fontSize: 15, fontWeight: rsiSettingsActiveTab === 'Style' ? 600 : 500, color: rsiSettingsActiveTab === 'Style' ? '#0F172A' : '#64748B', cursor: 'pointer' }}
              >Style</button>
            </div>
            
            <div style={{ padding: '24px 20px', flex: 1, minHeight: 250 }}>
              {rsiSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Length</span>
                    <input type="number" value={tempRsiSettings.length} onChange={(e) => setTempRsiSettings({...tempRsiSettings, length: parseInt(e.target.value) || 0})} style={{ width: 120, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothing Line</span>
                    <select value={tempRsiSettings.smoothingLine} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothingLine: e.target.value})} style={{ width: 120, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="SMA">SMA</option>
                      <option value="EMA">EMA</option>
                      <option value="WMA">WMA</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothing Length</span>
                    <input type="number" value={tempRsiSettings.smoothingLength} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothingLength: parseInt(e.target.value) || 0})} style={{ width: 120, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              {rsiSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Plot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.plot} onChange={(e) => setTempRsiSettings({...tempRsiSettings, plot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>RSI</span>
                    <input type="color" value={tempRsiSettings.plotColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, plotColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <input type="number" min={1} max={10} value={tempRsiSettings.plotLineWidth} onChange={(e) => setTempRsiSettings({...tempRsiSettings, plotLineWidth: parseInt(e.target.value) || 2})} title="Line Thickness" style={{ width: 60, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none' }} />
                  </div>
                  {/* Smoothed MA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.smoothedMA} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothedMA: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothed MA</span>
                    <input type="color" value={tempRsiSettings.smoothedMAColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothedMAColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                  </div>
                  {/* UpperLimit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.upperLimit} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimit: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>UpperLimit</span>
                    <input type="color" value={tempRsiSettings.upperLimitColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimitColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempRsiSettings.upperLimitLineStyle} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimitLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                    <input type="number" value={tempRsiSettings.upperLimitValue} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimitValue: parseInt(e.target.value) || 0})} style={{ width: 70, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  {/* MiddleLimit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.middleLimit} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimit: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>MiddleLimit</span>
                    <input type="color" value={tempRsiSettings.middleLimitColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimitColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempRsiSettings.middleLimitLineStyle} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimitLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                    <input type="number" value={tempRsiSettings.middleLimitValue} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimitValue: parseInt(e.target.value) || 0})} style={{ width: 70, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  {/* LowerLimit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.lowerLimit} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimit: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>LowerLimit</span>
                    <input type="color" value={tempRsiSettings.lowerLimitColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimitColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempRsiSettings.lowerLimitLineStyle} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimitLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                    <input type="number" value={tempRsiSettings.lowerLimitValue} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimitValue: parseInt(e.target.value) || 0})} style={{ width: 70, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  {/* Hlines Background */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.hlinesBackground} onChange={(e) => setTempRsiSettings({...tempRsiSettings, hlinesBackground: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Hlines Background</span>
                    <input type="color" value={tempRsiSettings.hlinesBackgroundColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, hlinesBackgroundColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsRsiSettingsModalOpen(false); setTempRsiSettings(rsiSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setRsiSettings(tempRsiSettings); pushToHistory({ rsiSettings: tempRsiSettings }); setIsRsiSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}

      {/* EMA Settings Modal */}
      {isEmaSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>EMA</h3>
              <button onClick={() => setIsEmaSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px' }}>
              {['Inputs', 'Style'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setEmaSettingsActiveTab(tab)}
                  style={{
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: emaSettingsActiveTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                    color: emaSettingsActiveTab === tab ? '#0F172A' : '#64748B',
                    fontWeight: emaSettingsActiveTab === tab ? 600 : 500,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div style={{ padding: '24px 20px', flex: 1, minHeight: 250, overflowY: 'auto' }}>
              {emaSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Length</span>
                    <input type="number" value={tempEmaSettings.length} onChange={(e) => setTempEmaSettings({...tempEmaSettings, length: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Source</span>
                    <select value={tempEmaSettings.source} onChange={(e) => setTempEmaSettings({...tempEmaSettings, source: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="open">open</option>
                      <option value="high">high</option>
                      <option value="low">low</option>
                      <option value="close">close</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Offset</span>
                    <input type="number" value={tempEmaSettings.offset} onChange={(e) => setTempEmaSettings({...tempEmaSettings, offset: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothing Line</span>
                    <select value={tempEmaSettings.smoothingLine} onChange={(e) => setTempEmaSettings({...tempEmaSettings, smoothingLine: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="SMA">SMA</option>
                      <option value="EMA">EMA</option>
                      <option value="WMA">WMA</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothing Length</span>
                    <input type="number" value={tempEmaSettings.smoothingLength} onChange={(e) => setTempEmaSettings({...tempEmaSettings, smoothingLength: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              {emaSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempEmaSettings.plot} onChange={(e) => setTempEmaSettings({...tempEmaSettings, plot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Plot</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #E2E8F0', padding: 4, borderRadius: 6 }}>
                      <input type="color" value={tempEmaSettings.plotColor} onChange={(e) => setTempEmaSettings({...tempEmaSettings, plotColor: e.target.value})} style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
                      <div style={{ width: 1, height: 20, background: '#E2E8F0' }}></div>
                      <select value={tempEmaSettings.plotLineWidth} onChange={(e) => setTempEmaSettings({...tempEmaSettings, plotLineWidth: parseInt(e.target.value) || 2})} title="Line Thickness" style={{ border: 'none', outline: 'none', background: 'transparent', width: 44, cursor: 'pointer' }}>
                        <option value={1}>1px</option>
                        <option value={2}>2px</option>
                        <option value={3}>3px</option>
                        <option value={4}>4px</option>
                      </select>
                    </div>
                    <select value={tempEmaSettings.plotLineStyle} onChange={(e) => setTempEmaSettings({...tempEmaSettings, plotLineStyle: parseInt(e.target.value) || 0})} style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 8px', outline: 'none', cursor: 'pointer' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                  </div>
                  
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 12, textTransform: 'uppercase' }}>Outputs</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Precision</span>
                    <select value={tempEmaSettings.precision} onChange={(e) => setTempEmaSettings({...tempEmaSettings, precision: parseInt(e.target.value) || 2})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                      <option value={7}>7</option>
                      <option value={8}>8</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <input type="checkbox" checked={tempEmaSettings.labelsOnPriceScale} onChange={(e) => setTempEmaSettings({...tempEmaSettings, labelsOnPriceScale: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Labels on price scale</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempEmaSettings.valuesInStatusLine} onChange={(e) => setTempEmaSettings({...tempEmaSettings, valuesInStatusLine: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Values in status line</span>
                  </div>
                </div>
              )}

            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => { setIsEmaSettingsModalOpen(false); setTempEmaSettings(emaSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setEmaSettings(tempEmaSettings); pushToHistory({ emaSettings: tempEmaSettings }); setIsEmaSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#2962FF', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
      {/* SuperTrend Settings Modal */}
      {isSuperTrendSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F172A' }}>SuperTrend</h3>
              <button onClick={() => setIsSuperTrendSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px' }}>
              {['Inputs', 'Style'].map(tab => (
                <div 
                  key={tab} 
                  onClick={() => setSuperTrendSettingsActiveTab(tab)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    fontSize: 14, 
                    fontWeight: superTrendSettingsActiveTab === tab ? 600 : 500,
                    color: superTrendSettingsActiveTab === tab ? '#0F172A' : '#64748B',
                    borderBottom: superTrendSettingsActiveTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                    marginBottom: -1
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            
            <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              
              {superTrendSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Length</span>
                    <input type="number" value={tempSuperTrendSettings.length} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, length: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Factor</span>
                    <input type="number" value={tempSuperTrendSettings.factor} step="0.1" onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, factor: parseFloat(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              
              {superTrendSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* SuperTrend Plot */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <input type="checkbox" checked={tempSuperTrendSettings.plot} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, plot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer', marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, color: '#0F172A', marginBottom: 8 }}>SuperTrend</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>Color 0</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={tempSuperTrendSettings.colorUp} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, colorUp: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                          <select value={tempSuperTrendSettings.lineWidth} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, lineWidth: parseInt(e.target.value)})} style={{ width: 60, padding: '4px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                            <option value={1}>1px</option>
                            <option value={2}>2px</option>
                            <option value={3}>3px</option>
                            <option value={4}>4px</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>Color 1</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={tempSuperTrendSettings.colorDown} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, colorDown: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                          <select value={tempSuperTrendSettings.lineStyle} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, lineStyle: parseInt(e.target.value)})} style={{ width: 60, padding: '4px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                            <option value={0}>Solid</option>
                            <option value={1}>Dotted</option>
                            <option value={2}>Dashed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Up Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempSuperTrendSettings.upArrow} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, upArrow: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Up Arrow</span>
                    <input type="color" value={tempSuperTrendSettings.upArrowColor} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, upArrowColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempSuperTrendSettings.upArrowLocation} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, upArrowLocation: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                      <option value="belowBar">Below bar</option>
                      <option value="aboveBar">Above bar</option>
                    </select>
                  </div>

                  {/* Down Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempSuperTrendSettings.downArrow} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, downArrow: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Down Arrow</span>
                    <input type="color" value={tempSuperTrendSettings.downArrowColor} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, downArrowColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempSuperTrendSettings.downArrowLocation} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, downArrowLocation: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                      <option value="aboveBar">Above bar</option>
                      <option value="belowBar">Below bar</option>
                    </select>
                  </div>
                  
                  <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }}></div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.5px' }}>OUTPUTS</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Precision</span>
                    <select value={tempSuperTrendSettings.precision} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, precision: parseInt(e.target.value)})} style={{ width: 100, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 6, outline: 'none' }}>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <input type="checkbox" checked={tempSuperTrendSettings.labelsOnPriceScale} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, labelsOnPriceScale: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Labels on price scale</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempSuperTrendSettings.valuesInStatusLine} onChange={(e) => setTempSuperTrendSettings({...tempSuperTrendSettings, valuesInStatusLine: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Values in status line</span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsSuperTrendSettingsModalOpen(false); setTempSuperTrendSettings(superTrendSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setSuperTrendSettings(tempSuperTrendSettings); pushToHistory({ superTrendSettings: tempSuperTrendSettings }); setIsSuperTrendSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#2962FF', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
      {/* MACD Settings Modal */}
      {isMacdSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F172A' }}>MACD</h3>
              <button onClick={() => setIsMacdSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px' }}>
              {['Inputs', 'Style'].map(tab => (
                <div 
                  key={tab} 
                  onClick={() => setMacdSettingsActiveTab(tab)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    fontSize: 14, 
                    fontWeight: macdSettingsActiveTab === tab ? 600 : 500,
                    color: macdSettingsActiveTab === tab ? '#0F172A' : '#64748B',
                    borderBottom: macdSettingsActiveTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                    marginBottom: -1
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            
            <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              
              {macdSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="radio" checked={true} readOnly style={{ width: 16, height: 16, accentColor: '#2962FF', cursor: 'pointer' }} />
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Main chart symbol</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="radio" checked={false} readOnly style={{ width: 16, height: 16, accentColor: '#2962FF', cursor: 'pointer' }} />
                    <span style={{ fontSize: 14, color: '#0F172A', flex: 1 }}>Another symbol</span>
                    <input type="text" disabled style={{ width: 100, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, background: '#F8FAFC' }} />
                  </div>

                  <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }}></div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>FastLength</span>
                    <input type="number" value={tempMacdSettings.fastLength} onChange={(e) => setTempMacdSettings({...tempMacdSettings, fastLength: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>SlowLength</span>
                    <input type="number" value={tempMacdSettings.slowLength} onChange={(e) => setTempMacdSettings({...tempMacdSettings, slowLength: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Source</span>
                    <select value={tempMacdSettings.source} onChange={(e) => setTempMacdSettings({...tempMacdSettings, source: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }}>
                      <option value="close">close</option>
                      <option value="open">open</option>
                      <option value="high">high</option>
                      <option value="low">low</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>SignalLength</span>
                    <input type="number" value={tempMacdSettings.signalLength} onChange={(e) => setTempMacdSettings({...tempMacdSettings, signalLength: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              
              {macdSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Histogram */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <input type="checkbox" checked={tempMacdSettings.histogramPlot} onChange={(e) => setTempMacdSettings({...tempMacdSettings, histogramPlot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer', marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, color: '#0F172A', marginBottom: 12 }}>Histogram</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>Color 0</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={tempMacdSettings.color0} onChange={(e) => setTempMacdSettings({...tempMacdSettings, color0: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>Color 1</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={tempMacdSettings.color1} onChange={(e) => setTempMacdSettings({...tempMacdSettings, color1: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>Color 2</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={tempMacdSettings.color2} onChange={(e) => setTempMacdSettings({...tempMacdSettings, color2: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>Color 3</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={tempMacdSettings.color3} onChange={(e) => setTempMacdSettings({...tempMacdSettings, color3: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MACD Line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempMacdSettings.macdPlot} onChange={(e) => setTempMacdSettings({...tempMacdSettings, macdPlot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>MACD</span>
                    <input type="color" value={tempMacdSettings.macdColor} onChange={(e) => setTempMacdSettings({...tempMacdSettings, macdColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempMacdSettings.macdLineWidth} onChange={(e) => setTempMacdSettings({...tempMacdSettings, macdLineWidth: parseInt(e.target.value)})} style={{ width: 60, padding: '4px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                      <option value={1}>1px</option>
                      <option value={2}>2px</option>
                      <option value={3}>3px</option>
                      <option value={4}>4px</option>
                    </select>
                  </div>

                  {/* Signal Line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempMacdSettings.signalPlot} onChange={(e) => setTempMacdSettings({...tempMacdSettings, signalPlot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Signal</span>
                    <input type="color" value={tempMacdSettings.signalColor} onChange={(e) => setTempMacdSettings({...tempMacdSettings, signalColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempMacdSettings.signalLineWidth} onChange={(e) => setTempMacdSettings({...tempMacdSettings, signalLineWidth: parseInt(e.target.value)})} style={{ width: 60, padding: '4px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                      <option value={1}>1px</option>
                      <option value={2}>2px</option>
                      <option value={3}>3px</option>
                      <option value={4}>4px</option>
                    </select>
                  </div>
                  
                  <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }}></div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.5px' }}>OUTPUTS</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Precision</span>
                    <select value={tempMacdSettings.precision} onChange={(e) => setTempMacdSettings({...tempMacdSettings, precision: parseInt(e.target.value)})} style={{ width: 100, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 6, outline: 'none' }}>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <input type="checkbox" checked={tempMacdSettings.labelsOnPriceScale} onChange={(e) => setTempMacdSettings({...tempMacdSettings, labelsOnPriceScale: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Labels on price scale</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempMacdSettings.valuesInStatusLine} onChange={(e) => setTempMacdSettings({...tempMacdSettings, valuesInStatusLine: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Values in status line</span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsMacdSettingsModalOpen(false); setTempMacdSettings(macdSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setMacdSettings(tempMacdSettings); pushToHistory({ macdSettings: tempMacdSettings }); setIsMacdSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#2962FF', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
      {/* ATR Settings Modal */}
      {isAtrSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F172A' }}>ATR</h3>
              <button onClick={() => setIsAtrSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px' }}>
              {['Inputs', 'Style'].map(tab => (
                <div 
                  key={tab} 
                  onClick={() => setAtrSettingsActiveTab(tab)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    fontSize: 14, 
                    fontWeight: atrSettingsActiveTab === tab ? 600 : 500,
                    color: atrSettingsActiveTab === tab ? '#0F172A' : '#64748B',
                    borderBottom: atrSettingsActiveTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                    marginBottom: -1
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            
            <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              
              {atrSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Length</span>
                    <input type="number" value={tempAtrSettings.length} onChange={(e) => setTempAtrSettings({...tempAtrSettings, length: parseInt(e.target.value) || 0})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>MA Type</span>
                    <select value={tempAtrSettings.maType} onChange={(e) => setTempAtrSettings({...tempAtrSettings, maType: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      <option value="SMA">SMA</option>
                      <option value="EMA">EMA</option>
                      <option value="WMA">WMA</option>
                    </select>
                  </div>
                </div>
              )}
              
              {atrSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* ATR Line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempAtrSettings.plot} onChange={(e) => setTempAtrSettings({...tempAtrSettings, plot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Plot</span>
                    <input type="color" value={tempAtrSettings.plotColor} onChange={(e) => setTempAtrSettings({...tempAtrSettings, plotColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempAtrSettings.plotLineWidth} onChange={(e) => setTempAtrSettings({...tempAtrSettings, plotLineWidth: parseInt(e.target.value)})} style={{ width: 60, padding: '4px', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                      <option value={1}>1px</option>
                      <option value={2}>2px</option>
                      <option value={3}>3px</option>
                      <option value={4}>4px</option>
                    </select>
                  </div>
                  
                  <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }}></div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.5px' }}>OUTPUTS</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Precision</span>
                    <select value={tempAtrSettings.precision} onChange={(e) => setTempAtrSettings({...tempAtrSettings, precision: parseInt(e.target.value)})} style={{ width: 100, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 6, outline: 'none' }}>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <input type="checkbox" checked={tempAtrSettings.labelsOnPriceScale} onChange={(e) => setTempAtrSettings({...tempAtrSettings, labelsOnPriceScale: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Labels on price scale</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempAtrSettings.valuesInStatusLine} onChange={(e) => setTempAtrSettings({...tempAtrSettings, valuesInStatusLine: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Values in status line</span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsAtrSettingsModalOpen(false); setTempAtrSettings(atrSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setAtrSettings(tempAtrSettings); pushToHistory({ atrSettings: tempAtrSettings }); setIsAtrSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#2962FF', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}

      {/* VWAP Settings Modal */}
      {isVwapSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#0F172A', fontWeight: 600 }}>VWAP</h2>
              <button onClick={() => { setIsVwapSettingsModalOpen(false); setTempVwapSettings(vwapSettings); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
              {['Inputs', 'Style'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setVwapSettingsActiveTab(tab)}
                  style={{ 
                    padding: '16px 12px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: vwapSettingsActiveTab === tab ? 600 : 500,
                    color: vwapSettingsActiveTab === tab ? '#0F172A' : '#64748B',
                    borderBottom: vwapSettingsActiveTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                    marginRight: 16
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {vwapSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Source</span>
                    <select value={tempVwapSettings.source} onChange={(e) => setTempVwapSettings({...tempVwapSettings, source: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      <option value="high">high</option>
                      <option value="low">low</option>
                      <option value="close">close</option>
                      <option value="open">open</option>
                      <option value="hlc3">hlc3</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Anchor Period</span>
                    <select value={tempVwapSettings.anchorPeriod} onChange={(e) => setTempVwapSettings({...tempVwapSettings, anchorPeriod: e.target.value})} style={{ width: 140, padding: '8px 12px', border: '1px solid #2962FF', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      <option value="Session">Session</option>
                      <option value="Week">Week</option>
                      <option value="Month">Month</option>
                      <option value="Quarter">Quarter</option>
                      <option value="Year">Year</option>
                      <option value="Decade">Decade</option>
                      <option value="Century">Century</option>
                    </select>
                  </div>
                </div>
              )}
              
              {vwapSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={tempVwapSettings.plot} onChange={(e) => setTempVwapSettings({...tempVwapSettings, plot: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2962FF' }} />
                      <span style={{ fontSize: 14, color: '#0F172A' }}>VWAP</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="color" value={tempVwapSettings.plotColor} onChange={(e) => setTempVwapSettings({...tempVwapSettings, plotColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                      <select value={tempVwapSettings.plotLineWidth} onChange={(e) => setTempVwapSettings({...tempVwapSettings, plotLineWidth: parseInt(e.target.value)})} style={{ width: 60, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, outline: 'none' }}>
                        {[1, 2, 3, 4].map(w => <option key={w} value={w}>{w}px</option>)}
                      </select>
                      <select value={tempVwapSettings.plotLineStyle} onChange={(e) => setTempVwapSettings({...tempVwapSettings, plotLineStyle: parseInt(e.target.value)})} style={{ width: 60, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, outline: 'none' }}>
                        <option value={0}>Solid</option>
                        <option value={1}>Dashed</option>
                        <option value={2}>Dotted</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ height: 1, background: '#E2E8F0' }} />
                  
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>OUTPUTS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, color: '#0F172A' }}>Precision</span>
                        <select value={tempVwapSettings.precision} onChange={(e) => setTempVwapSettings({...tempVwapSettings, precision: parseInt(e.target.value)})} style={{ width: 140, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                          {[0, 1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={tempVwapSettings.labelsOnScale} onChange={(e) => setTempVwapSettings({...tempVwapSettings, labelsOnScale: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2962FF' }} />
                        <span style={{ fontSize: 14, color: '#0F172A' }}>Labels on price scale</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={tempVwapSettings.valuesInStatusLine} onChange={(e) => setTempVwapSettings({...tempVwapSettings, valuesInStatusLine: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2962FF' }} />
                        <span style={{ fontSize: 14, color: '#0F172A' }}>Values in status line</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsVwapSettingsModalOpen(false); setTempVwapSettings(vwapSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setVwapSettings(tempVwapSettings); pushToHistory({ vwapSettings: tempVwapSettings }); setIsVwapSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#2962FF', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
