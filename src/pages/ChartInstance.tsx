import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Smile, Moon, Sun, RefreshCw } from 'lucide-react';
import { EMOJI_CATEGORIES } from '../utils/emojiData';

import { RSICalculator } from '../utils/rsiCalculator';
import { OscillatorPane } from '../components/charts/OscillatorPane';
import { TimeAxisPane } from '../components/charts/TimeAxisPane';
import { ATRCalculator } from '../utils/atrCalculator';
import { VwapCalculator } from '../utils/vwapCalculator';
import { PivotCalculator } from '../utils/pivotCalculator';
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
  ArrowRight,
  Plus,
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
  Layout,
  ArrowUp,
  Minimize2,
  Maximize2,
  Lock,
  Unlock,
  Check,
  Calendar,
  Star
} from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { useAuthStore } from '../store/authStore';
import { useOHLCV, useQuote } from '../hooks/useMarketData';
import { usePortfolio, useUpdateHolding } from '../hooks/usePortfolio';
import { usePlaceOrder, useOrders, useCancelOrder } from '../hooks/useOrders';
import { useTradingStats } from '../hooks/useTradingStats';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { formatVolume } from '../utils/formatters';
import { searchStocks } from '../api/marketData';
import { SymbolSearchModal } from '../components/common/SymbolSearchModal';
import type { Timeframe } from '../types/market';
import { PriceAlertManager } from '../utils/PriceAlertManager';
import { ChartDrawingOverlay } from '../components/ChartDrawingOverlay';
import { ChartDashboardPanel } from '../components/charts/ChartDashboardPanel';
import { ChartTradePanel } from '../components/charts/ChartTradePanel';
import { ChartTradeOverlays } from '../components/charts/ChartTradeOverlays';
import { RealTimeClock } from '../components/RealTimeClock';
import type { OrderSide } from '../types/trade';
import { GoToModal } from '../components/common/GoToModal';
import type { Drawing, DrawingType } from '../components/ChartDrawingOverlay';
import * as ta from 'ta.js';

const CATEGORIZED_TIMEFRAMES = {
  SECONDS: [
    { label: '1 second', value: '1s', shortLabel: '1s' },
    { label: '5 seconds', value: '5s', shortLabel: '5s' },
    { label: '10 seconds', value: '10s', shortLabel: '10s' },
    { label: '15 seconds', value: '15s', shortLabel: '15s' },
    { label: '30 seconds', value: '30s', shortLabel: '30s' }
  ],
  MINUTES: [
    { label: '1 minute', value: '1m', shortLabel: '1m' },
    { label: '3 minutes', value: '3m', shortLabel: '3m' },
    { label: '5 minutes', value: '5m', shortLabel: '5m' },
    { label: '10 minutes', value: '10m', shortLabel: '10m' },
    { label: '15 minutes', value: '15m', shortLabel: '15m' },
    { label: '30 minutes', value: '30m', shortLabel: '30m' },
    { label: '45 minutes', value: '45m', shortLabel: '45m' }
  ],
  HOURS: [
    { label: '1 hour', value: '1h', shortLabel: '1h' },
    { label: '2 hours', value: '2h', shortLabel: '2h' },
    { label: '3 hours', value: '3h', shortLabel: '3h' },
    { label: '4 hours', value: '4h', shortLabel: '4h' }
  ],
  DAYS: [
    { label: '1 day', value: '1d', shortLabel: '1D' },
    { label: '1 week', value: '1W', shortLabel: '1W' },
    { label: '1 month', value: '1M', shortLabel: '1M' }
  ]
};

const ALL_TIMEFRAMES = Object.values(CATEGORIZED_TIMEFRAMES).flat();

const INDICATORS = ['VOLUME', 'EMA', 'RSI', 'SUPERTREND', 'MACD', 'ATR', 'PIVOT POINTS', 'VWAP', 'MOMENTUM'];

const LINE_TOOLS_GROUP = [
  { id: 'trend_line', label: 'Trend Line', icon: TrendingUp, category: 'LINES' },
  { id: 'ray', label: 'Ray', icon: ArrowUpRight, category: 'LINES' },
  { id: 'horizontal_line', label: 'Horizontal Line', icon: Minus, category: 'LINES' },
  { id: 'horizontal_ray', label: 'Horizontal Ray', icon: ArrowRight, category: 'LINES' },
  { id: 'vertical_line', label: 'Vertical Line', icon: SeparatorVertical, category: 'LINES' },
  { id: 'cross_line', label: 'Cross Line', icon: Plus, category: 'LINES' },
  { id: 'parallel_channel', label: 'Parallel Channel', icon: Columns, category: 'CHANNELS' },
];

const DRAWING_TOOLS = [
  { id: 'cursor', icon: MousePointer2, label: 'CURSOR' },
  { id: 'line_tools_group', icon: TrendingUp, label: 'LINE TOOLS' },
  { id: 'fib_retracement', icon: List, label: 'FIB RETRACEMENT' },
  { id: 'rectangle', icon: Square, label: 'RECTANGLE' },
  { id: 'circle', icon: Circle, label: 'CIRCLE' },
  { id: 'long_position', icon: ArrowUpRight, label: 'LONG POSITION' },
  { id: 'short_position', icon: ArrowDownRight, label: 'SHORT POSITION' },
  { id: 'text', icon: Type, label: 'TEXT' },
  { id: 'measure', icon: Ruler, label: 'MEASURE (Ruler)' },
  { id: 'alert', icon: Bell, label: 'PLACE AN ALERT' },
  { id: 'emoji', icon: Smile, label: 'EMOJIS' },
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

export interface ChartInstanceProps {
  paneId: string;
  isPrimary?: boolean;
  isActive?: boolean;
  activeLayout?: string;
  onLayoutChange?: (layout: string) => void;
  syncLayout?: { symbol: boolean, interval: boolean, crosshair: boolean, time: boolean, dateRange: boolean };
  onSyncLayoutChange?: (sync: any) => void;
  sharedSymbol?: string;
  onSharedSymbolChange?: (symbol: string) => void;
  sharedInterval?: Timeframe;
  onSharedIntervalChange?: (interval: Timeframe) => void;
}

export default function ChartInstance({
  paneId,
  isPrimary = true,
  isActive = false,
  activeLayout = '1',
  onLayoutChange,
  syncLayout: parentSyncLayout = { symbol: false, interval: false, crosshair: false, time: true, dateRange: false },
  onSyncLayoutChange,
  sharedSymbol,
  onSharedSymbolChange,
  sharedInterval,
  onSharedIntervalChange
}: ChartInstanceProps) {
  const navigate = useNavigate();
  const syncLayout = parentSyncLayout;
  const setSyncLayout = onSyncLayoutChange || (() => {});
  const { selectedSymbol: globalSymbol, selectedExchange: globalExchange, setSelectedSymbol: setGlobalSymbol } = useMarketStore();
  const [localSymbol, setLocalSymbol] = useState(globalSymbol);
  const [localExchange, setLocalExchange] = useState(globalExchange);
  const [isMountedState, setIsMountedState] = useState(false);
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
  
  useEffect(() => {
    setIsMountedState(true);
    if (syncLayout.symbol) {
      setLocalSymbol(globalSymbol);
      setLocalExchange(globalExchange);
    }
  }, [globalSymbol, globalExchange, syncLayout.symbol]);

  const selectedSymbol = syncLayout.symbol ? globalSymbol : localSymbol;
  const selectedExchange = syncLayout.symbol ? globalExchange : localExchange;
  const setSelectedSymbol = (sym: string, exch: 'NSE' | 'BSE') => {
    if (syncLayout.symbol) {
      setGlobalSymbol(sym, exch);
    } else {
      setLocalSymbol(sym);
      setLocalExchange(exch);
    }
  };

  const fullScreenRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<Record<string, any>>({});
  const priceLineRefs = useRef<{ entry?: any; tp?: any; sl?: any }>({});
  const alertManager = useRef(new PriceAlertManager());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [mainChartInstance, setMainChartInstance] = useState<any>(null);
  const parentContainerRef = useRef<HTMLDivElement>(null);
  const [parentHeight, setParentHeight] = useState(0);

  const [localTimeframe, setLocalTimeframe] = useState<Timeframe>(sharedInterval || '15m');
  
  useEffect(() => {
    if (syncLayout.interval && sharedInterval) {
      setLocalTimeframe(sharedInterval);
    }
  }, [sharedInterval, syncLayout.interval]);

  useEffect(() => {
    if (!parentContainerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== parentContainerRef.current) return;
      const { height } = entries[0].contentRect;
      setParentHeight(height);
    });
    resizeObserver.observe(parentContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const timeframe = syncLayout.interval ? (sharedInterval || '15m') : localTimeframe;
  const setTimeframe = (tf: Timeframe) => {
    if (syncLayout.interval && onSharedIntervalChange) {
      onSharedIntervalChange(tf);
    } else {
      setLocalTimeframe(tf);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchStocks>>([]);

  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isInstantOrder, setIsInstantOrder] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [maximizedPane, setMaximizedPane] = useState<string | null>(null);
  const [minimizedPanes, setMinimizedPanes] = useState<string[]>([]);
  const [hiddenIndicators, setHiddenIndicators] = useState<string[]>([]);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);

  const handleGoToDate = (targetDate: Date) => {
    if (!chartRef.current || !candles || candles.length === 0) return;
    const targetTime = targetDate.getTime() / 1000;

    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < candles.length; i++) {
      const t = typeof candles[i].time === 'string' ? new Date(candles[i].time).getTime() / 1000 : candles[i].time as number;
      const diff = Math.abs(t - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const logicalRange = chartRef.current.timeScale().getVisibleLogicalRange();
    const width = logicalRange ? (logicalRange.to - logicalRange.from) : 50;
    
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: closestIndex - width / 2,
      to: closestIndex + width / 2
    });
  };

  const handleGoToRange = (from: Date, to: Date) => {
    if (!chartRef.current || !candles || candles.length === 0) return;
    const fromTime = from.getTime() / 1000;
    const toTime = to.getTime() / 1000;
    
    let fromIndex = 0;
    let toIndex = candles.length - 1;
    let minDiffFrom = Infinity;
    let minDiffTo = Infinity;
    
    for (let i = 0; i < candles.length; i++) {
      const t = typeof candles[i].time === 'string' ? new Date(candles[i].time).getTime() / 1000 : candles[i].time as number;
      const diffFrom = Math.abs(t - fromTime);
      const diffTo = Math.abs(t - toTime);
      
      if (diffFrom < minDiffFrom) {
        minDiffFrom = diffFrom;
        fromIndex = i;
      }
      if (diffTo < minDiffTo) {
        minDiffTo = diffTo;
        toIndex = i;
      }
    }
    
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: fromIndex - 1,
      to: toIndex + 1
    });
  };

  const { holdings, totalUnrealisedPnL } = usePortfolio();
  const { updateTP, updateSL } = useUpdateHolding();
  const { data: orders = [] } = useOrders();
  const { stats } = useTradingStats();
  const { account } = useAuthStore();
  const placeOrder = usePlaceOrder();
  const cancelOrder = useCancelOrder();

  // Overlay states
  const [confirmExitModal, setConfirmExitModal] = useState(false);
  const [confirmTPModal, setConfirmTPModal] = useState<number | null>(null);
  const [confirmSLModal, setConfirmSLModal] = useState<number | null>(null);
  const [removeTPModal, setRemoveTPModal] = useState(false);
  const [removeSLModal, setRemoveSLModal] = useState(false);
  
  const activeHolding = holdings.find(h => h.symbol === selectedSymbol && h.quantity > 0);
  const pendingOrder = orders.find(o => o.symbol === selectedSymbol && o.status === 'PENDING' && o.orderType === 'LIMIT');

  const activeOverlayTarget = activeHolding || (pendingOrder ? {
    id: pendingOrder.id,
    symbol: pendingOrder.symbol,
    exchange: pendingOrder.exchange,
    companyName: pendingOrder.companyName,
    quantity: pendingOrder.quantity,
    avgBuyPrice: pendingOrder.price!,
    investedValue: 0,
    tp: pendingOrder.tp,
    sl: pendingOrder.sl,
    pnl: undefined,
    isPendingOrder: true
  } : null);

  // Draw active trade lines
  useEffect(() => {
    const candlestickSeries = seriesRef.current['candlestick'];
    if (!candlestickSeries) return;

    // Clear existing price lines
    if (priceLineRefs.current.entry) { try { candlestickSeries.removePriceLine(priceLineRefs.current.entry); } catch(e){} priceLineRefs.current.entry = undefined; }
    if (priceLineRefs.current.tp) { try { candlestickSeries.removePriceLine(priceLineRefs.current.tp); } catch(e){} priceLineRefs.current.tp = undefined; }
    if (priceLineRefs.current.sl) { try { candlestickSeries.removePriceLine(priceLineRefs.current.sl); } catch(e){} priceLineRefs.current.sl = undefined; }

    if (activeOverlayTarget) {
      priceLineRefs.current.entry = candlestickSeries.createPriceLine({
        price: activeOverlayTarget.avgBuyPrice,
        color: '#2563EB',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Entry',
      });

      if (activeOverlayTarget.tp) {
        priceLineRefs.current.tp = candlestickSeries.createPriceLine({
          price: activeOverlayTarget.tp,
          color: '#10B981',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'TP',
        });
      }

      if (activeOverlayTarget.sl) {
        priceLineRefs.current.sl = candlestickSeries.createPriceLine({
          price: activeOverlayTarget.sl,
          color: '#EF4444',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'SL',
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOverlayTarget?.avgBuyPrice, activeOverlayTarget?.tp, activeOverlayTarget?.sl, activeOverlayTarget?.id, selectedSymbol]);

  const handleExitPosition = () => {
    if (!activeOverlayTarget) return;
    const isShort = !!(activeOverlayTarget as any).isShort;
    placeOrder.mutate({
      symbol: (activeOverlayTarget as any).symbol,
      exchange: (activeOverlayTarget as any).exchange,
      companyName: (activeOverlayTarget as any).companyName,
      side: isShort ? 'BUY' : 'SELL', // Cover short with BUY, exit long with SELL
      orderType: 'MARKET',
      productType: (activeOverlayTarget as any).productType ?? 'DELIVERY',
      quantity: (activeOverlayTarget as any).quantity,
    });
  };

  const handleExitAll = () => {
    if (!holdings || holdings.length === 0) return;
    holdings.forEach(h => {
      placeOrder.mutate({
        symbol: h.symbol,
        exchange: h.exchange as any,
        companyName: h.companyName,
        side: 'SELL',
        orderType: 'MARKET',
        quantity: h.quantity,
        price: h.currentPrice,
      });
    });
  };

  const [indicatorSearch, setIndicatorSearch] = useState('');

  // Dashboard Panel State
  const [isDashboardPanelOpen, setIsDashboardPanelOpen] = useState(false);
  const [isDashboardMaximized, setIsDashboardMaximized] = useState(false);
  const [isTradePanelOpen, setIsTradePanelOpen] = useState(false);
  const [tradePanelSide, setTradePanelSide] = useState<OrderSide>('BUY');
  const [activeDashboardTab, setActiveDashboardTab] = useState('Positions');
  const [activeOrderTab, setActiveOrderTab] = useState('All');
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingType>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [drawingMode, setDrawingMode] = useState<DrawingType | null>(null);
  const [isGoToModalOpen, setIsGoToModalOpen] = useState(false);
  const [favoriteTimeframes, setFavoriteTimeframes] = useState<string[]>(['1m', '5m', '15m', '1h', '1d']);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [activeBottomTf, setActiveBottomTf] = useState('1D');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawingsLocked, setIsDrawingsLocked] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState({ drawings: false, indicators: false, positions: false });
  const [isHideMenuOpen, setIsHideMenuOpen] = useState(false);
  
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paneWeights, setPaneWeights] = useState<Record<string, number>>({});
  const [activeResizerIndex, setActiveResizerIndex] = useState<number | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [selectedLineTool, setSelectedLineTool] = useState<any>('trend_line');
  const [isLinesMenuOpen, setIsLinesMenuOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('people');
  const emojiScrollRef = useRef<HTMLDivElement>(null);

  const emojiPopoverRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const linesPopoverRef = useRef<HTMLDivElement>(null);
  const linesButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (isEmojiOpen && emojiPopoverRef.current && !emojiPopoverRef.current.contains(targetNode) && emojiButtonRef.current && !emojiButtonRef.current.contains(targetNode)) {
        setIsEmojiOpen(false);
      }
      if (isLinesMenuOpen && linesPopoverRef.current && !linesPopoverRef.current.contains(targetNode) && linesButtonRef.current && !linesButtonRef.current.contains(targetNode)) {
        setIsLinesMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiOpen, isLinesMenuOpen]);
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent_emojis');
      return saved ? JSON.parse(saved) : ['😀', '🔥', '🚀', '📈', '📉', '👍', '❤️', '🎯'];
    } catch (e) {
      return ['😀', '🔥', '🚀', '📈', '📉', '👍', '❤️', '🎯'];
    }
  });

  const addRecentEmoji = (emoji: string) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      const updated = [emoji, ...filtered].slice(0, 16);
      try {
        localStorage.setItem('recent_emojis', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };
  // const [activeLayout, setActiveLayout] = useState('1');
  // const [syncLayout, setSyncLayout] = useState({ symbol: false, interval: false, crosshair: false, time: true, dateRange: false });

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
    middleLimit: false, 
    middleLimitColor: '#b2b5be', 
    middleLimitValue: 50,
    middleLimitLineStyle: 1, // Dotted
    lowerLimit: true,
    lowerLimitColor: '#b2b5be', 
    lowerLimitValue: 30,
    lowerLimitLineStyle: 2, // Dashed
    hlinesBackground: true,
    hlinesBackgroundColor: 'rgba(88, 28, 135, 0.15)', // Dark purple fill
  });
  const prevRsiSettings = useRef(rsiSettings);
  const [tempRsiSettings, setTempRsiSettings] = useState(rsiSettings);
  const [isRsiSettingsModalOpen, setIsRsiSettingsModalOpen] = useState(false);
  const [rsiSettingsActiveTab, setRsiSettingsActiveTab] = useState('Inputs');

  // MOM Settings State
  const [momSettings, setMomSettings] = useState({
    length: 10,
    source: 'close',
    momPlot: true,
    momColor: '#2563eb',
    momLineWidth: 2,
    momLineStyle: 0,
    zeroLine: true,
    zeroLineColor: '#94a3b8',
    zeroLineWidth: 1,
    zeroLineStyle: 2,
    precision: 2,
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
  });
  const prevMomSettings = useRef(momSettings);
  const [tempMomSettings, setTempMomSettings] = useState(momSettings);
  const [isMomSettingsModalOpen, setIsMomSettingsModalOpen] = useState(false);
  const [momSettingsActiveTab, setMomSettingsActiveTab] = useState('Inputs');
  
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
    plotColor: '#000000',
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
    plotColor: '#808080',
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

  // Pivot Settings State
  const [pivotSettings, setPivotSettings] = useState({
    type: 'Traditional',
    showHistoricalPivots: true,
    timeframe: 'Auto',
    numberPivotsBack: 15,
    labelsFont: 11,
    showLabels: true,
    levels: {
      P: { show: true, color: '#f59e0b', thickness: 1 },
      'S1/R1': { show: true, color: '#f59e0b', thickness: 1 },
      'S2/R2': { show: true, color: '#f59e0b', thickness: 1 },
      'S3/R3': { show: true, color: '#f59e0b', thickness: 1 },
      'S4/R4': { show: true, color: '#f59e0b', thickness: 1 },
      'S5/R5': { show: true, color: '#f59e0b', thickness: 1 }
    }
  });
  const prevPivotSettings = useRef(pivotSettings);
  const [tempPivotSettings, setTempPivotSettings] = useState(pivotSettings);
  const [isPivotSettingsModalOpen, setIsPivotSettingsModalOpen] = useState(false);
  const [pivotSettingsActiveTab, setPivotSettingsActiveTab] = useState('Inputs');

  
  interface ChartHistorySnapshot {
    drawings: Drawing[];
    activeIndicators: string[];
    rsiSettings: any;
    momSettings: any;
    emaSettings: any;
    superTrendSettings: any;
    macdSettings: any;
    atrSettings: any;
    vwapSettings: any;
    pivotSettings: any;
    volumeSettings: any;
    candleSettings: any;
  }
  // Invert scale shortcut (Alt + I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mac Option generates different e.key, check e.code or lowercased key
      if (e.altKey && (e.key.toLowerCase() === 'i' || e.code === 'KeyI' || e.key === 'ˆ')) {
        e.preventDefault();
        const currentScale = chartRef.current?.priceScale('right');
        if (currentScale) {
          const currentOptions = currentScale.options();
          currentScale.applyOptions({
            invertScale: !currentOptions.invertScale,
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);



  // Undo/Redo State
  const [history, setHistory] = useState<ChartHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, pivotSettings, volumeSettings, candleSettings, momSettings }]);
      setHistoryIndex(0);
      historyIndexRef.current = 0;
    }
  }, []); // Initialize history

  const pushToHistory = (partial: Partial<ChartHistorySnapshot>) => {
    setHistory(prevHistory => {
      const prevIndex = historyIndexRef.current;
      const currentState = prevHistory[prevIndex >= 0 ? prevIndex : 0] || { drawings, activeIndicators, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, pivotSettings, volumeSettings, candleSettings, momSettings };
      const nextSnapshot = { ...currentState, ...partial };
      
      if (JSON.stringify(currentState) === JSON.stringify(nextSnapshot)) {
        return prevHistory;
      }

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
        setMomSettings(snapshot.momSettings);
        setEmaSettings(snapshot.emaSettings);
        setSuperTrendSettings(snapshot.superTrendSettings);
        setMacdSettings(snapshot.macdSettings);
        setAtrSettings(snapshot.atrSettings);
        setVwapSettings(snapshot.vwapSettings);
        setPivotSettings(snapshot.pivotSettings);
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
        setMomSettings(snapshot.momSettings);
        setEmaSettings(snapshot.emaSettings);
        setSuperTrendSettings(snapshot.superTrendSettings);
        setMacdSettings(snapshot.macdSettings);
        setAtrSettings(snapshot.atrSettings);
        setVwapSettings(snapshot.vwapSettings);
        setPivotSettings(snapshot.pivotSettings);
        setVolumeSettings(snapshot.volumeSettings);
        setCandleSettings(snapshot.candleSettings);
      }
      return prevHistory;
    });
  };

  const commitHistory = (newDrawings: Drawing[]) => {
    pushToHistory({ drawings: newDrawings });
  };

  const toggleFullScreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = document.getElementById('charts-container');
    const doc = document as any;
    const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    
    if (!isFs) {
      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(err => {
          console.error(`Fullscreen error:`, err);
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  const startResizingOscillators = (unminIdx: number, unminimizedPanes: string[], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const paneAboveId = unminimizedPanes[unminIdx];
    const paneBelowId = unminimizedPanes[unminIdx + 1];
    
    const elAbove = document.getElementById(`pane-wrapper-${paneAboveId}`);
    const elBelow = document.getElementById(`pane-wrapper-${paneBelowId}`);
    
    if (!elAbove || !elBelow) return;
    
    const hAbove = elAbove.clientHeight;
    const hBelow = elBelow.clientHeight;
    const totalHeight = hAbove + hBelow;
    
    const wAbove = paneWeights[paneAboveId] || 1;
    const wBelow = paneWeights[paneBelowId] || 1;
    const totalWeight = wAbove + wBelow;
    
    const startY = e.clientY;
    setActiveResizerIndex(unminIdx);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dy = moveEvent.clientY - startY;
      let newHAbove = hAbove + dy;
      let newHBelow = hBelow - dy;
      
      const minH = 50;
      if (newHAbove < minH) {
        newHAbove = minH;
        newHBelow = totalHeight - minH;
      } else if (newHBelow < minH) {
        newHBelow = minH;
        newHAbove = totalHeight - minH;
      }
      
      const newWAbove = (newHAbove / totalHeight) * totalWeight;
      const newWBelow = totalWeight - newWAbove;
      
      setPaneWeights(prev => ({
        ...prev,
        [paneAboveId]: newWAbove,
        [paneBelowId]: newWBelow
      }));
    };
    
    const handleMouseUp = () => {
      setActiveResizerIndex(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // State for candle data on crosshair hover
  const [hoveredCandle, setHoveredCandle] = useState<{ open: number; high: number; low: number; close: number; volume?: number; prevClose?: number } | null>(null);
  const [indicatorValues, setIndicatorValues] = useState<Record<string, number>>({});
  const [oscillatorValues, setOscillatorValues] = useState<Record<string, number>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, price?: number } | null>(null);
  const isHoveringRef = useRef(false);
  const lastCrosshairPoint = useRef<{ logical: number; price: number } | null>(null);

  if (typeof window !== 'undefined') {
    (window as any)._chartHistory = history;
    (window as any)._chartHistoryIndex = historyIndex;
    (window as any)._chartHistoryIndexRef = historyIndexRef.current;
  }

  const { data: quote } = useQuote(selectedSymbol, selectedExchange);
  const { data: candles, isLoading: candlesLoading } = useOHLCV(selectedSymbol, selectedExchange, timeframe, 150);

  const [pendingZoom, setPendingZoom] = useState<string | null>(null);

  const executeZoom = useCallback((tf: string) => {
    if (!chartRef.current || !candles || candles.length === 0) return;
    const lastCandle = candles[candles.length - 1];
    const latestTime = typeof lastCandle.time === 'string' ? new Date(lastCandle.time).getTime() / 1000 : lastCandle.time as number;
    let fromTime = latestTime;
    const day = 24 * 60 * 60;
    switch (tf) {
      case '1D': fromTime = latestTime - day; break;
      case '5D': fromTime = latestTime - 5 * day; break;
      case '1M': fromTime = latestTime - 30 * day; break;
      case '3M': fromTime = latestTime - 90 * day; break;
      case '6M': fromTime = latestTime - 180 * day; break;
      case '1Y': fromTime = latestTime - 365 * day; break;
      case '5Y': fromTime = latestTime - 5 * 365 * day; break;
    }
    
    let fromIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < candles.length; i++) {
      const t = typeof candles[i].time === 'string' ? new Date(candles[i].time).getTime() / 1000 : candles[i].time as number;
      const diff = Math.abs(t - fromTime);
      if (diff < minDiff) {
        minDiff = diff;
        fromIndex = i;
      }
    }
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: fromIndex,
      to: candles.length + Math.floor((candles.length - fromIndex) * 0.1)
    });
  }, [candles]);

  const handleBottomTfClick = useCallback((tf: string) => {
    setActiveBottomTf(tf);
    
    // Map bottom timeframe ranges to sensible candle intervals
    let newCandleTf = timeframe;
    switch (tf) {
      case '1D': newCandleTf = '5m'; break;
      case '5D': newCandleTf = '15m'; break;
      case '1M': newCandleTf = '1h'; break;
      case '3M': newCandleTf = '1d'; break;
      case '6M': newCandleTf = '1d'; break;
      case '1Y': newCandleTf = '1d'; break;
      case '5Y': newCandleTf = '1w'; break;
    }

    if (newCandleTf !== timeframe) {
      setTimeframe(newCandleTf as Timeframe);
      setPendingZoom(tf);
    } else {
      executeZoom(tf);
    }
  }, [timeframe, executeZoom]);

  useEffect(() => {
    if (pendingZoom && candles && candles.length > 0 && !candlesLoading) {
      executeZoom(pendingZoom);
      setPendingZoom(null);
    }
  }, [candles, candlesLoading, pendingZoom, executeZoom]);

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
      if (cmdOrCtrl && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'x')) {
        e.preventDefault();
        if (e.key.toLowerCase() === 'x' || e.shiftKey) {
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
          case 'KeyH': {
            e.preventDefault();
            if (lastCrosshairPoint.current) {
              const newDrawing: Drawing = {
                id: Math.random().toString(36).substring(7),
                type: 'horizontal_line',
                points: [{ logical: lastCrosshairPoint.current.logical, price: lastCrosshairPoint.current.price }],
                color: '#2196f3',
                fillColor: '#2196f3',
                fillOpacity: 20,
                thickness: 2,
                lineStyle: 'solid'
              };
              setDrawings(prev => {
                const next = [...prev, newDrawing];
                commitHistory(next);
                return next;
              });
            } else {
              setActiveDrawingTool('horizontal_line');
            }
            break;
          }
          case 'KeyV': {
            e.preventDefault();
            if (lastCrosshairPoint.current) {
              const newDrawing: Drawing = {
                id: Math.random().toString(36).substring(7),
                type: 'vertical_line',
                points: [{ logical: lastCrosshairPoint.current.logical, price: lastCrosshairPoint.current.price }],
                color: '#2196f3',
                fillColor: '#2196f3',
                fillOpacity: 20,
                thickness: 2,
                lineStyle: 'solid'
              };
              setDrawings(prev => {
                const next = [...prev, newDrawing];
                commitHistory(next);
                return next;
              });
            } else {
              setActiveDrawingTool('vertical_line');
            }
            break;
          }
          case 'KeyJ': {
            e.preventDefault();
            if (lastCrosshairPoint.current) {
              const newDrawing: Drawing = {
                id: Math.random().toString(36).substring(7),
                type: 'ray',
                points: [
                  { logical: lastCrosshairPoint.current.logical, price: lastCrosshairPoint.current.price },
                  { logical: lastCrosshairPoint.current.logical + 10, price: lastCrosshairPoint.current.price }
                ],
                color: '#2196f3',
                fillColor: '#2196f3',
                fillOpacity: 20,
                thickness: 2,
                lineStyle: 'solid'
              };
              setDrawings(prev => {
                const next = [...prev, newDrawing];
                commitHistory(next);
                return next;
              });
            } else {
              setActiveDrawingTool('ray');
            }
            break;
          }
          case 'KeyC': {
            e.preventDefault();
            if (lastCrosshairPoint.current) {
              const newDrawing: Drawing = {
                id: Math.random().toString(36).substring(7),
                type: 'cross_line',
                points: [{ logical: lastCrosshairPoint.current.logical, price: lastCrosshairPoint.current.price }],
                color: '#2196f3',
                fillColor: '#2196f3',
                fillOpacity: 20,
                thickness: 2,
                lineStyle: 'solid'
              };
              setDrawings(prev => {
                const next = [...prev, newDrawing];
                commitHistory(next);
                return next;
              });
            } else {
              setActiveDrawingTool('cross_line');
            }
            break;
          }
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

        const bottomPaneIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR') || id.startsWith('MOMENTUM'));
        const visibleBottomPanes = bottomPaneIndicators.filter(id => !minimizedPanes.includes(id));
        const hasBottomPanes = visibleBottomPanes.length > 0;

        const chart = createChart(chartContainerRef.current!, {
          width,
          height,
          layout: { background: { color: 'transparent' }, textColor: '#475569' },
          grid: { vertLines: { color: '#F8FAFC' }, horzLines: { color: '#F8FAFC' } },
          crosshair: { mode: 0 },
          rightPriceScale: { borderColor: '#E2E8F0' },
          timeScale: { borderColor: '#E2E8F0', timeVisible: true, rightOffset: 12, visible: !hasBottomPanes },
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

        // Hide TV watermark for main chart as we are rendering a fixed one globally
        const hideWatermark = () => {
          if (!chartContainerRef.current) return;
          const logo = chartContainerRef.current.querySelector('#tv-attr-logo');
          if (logo) (logo as HTMLElement).style.display = 'none';
        };
        setTimeout(hideWatermark, 0);
        setTimeout(hideWatermark, 50);
        setTimeout(hideWatermark, 500);

        const lineSeries = chart.addSeries(LineSeries, { color: '#0E7490', lineWidth: 2, visible: chartType === 'line' });
        lineSeries.setData(candles.map(c => ({ time: timeFormat(c), value: c.close })));
        seriesRef.current['line'] = lineSeries;

        // Indicators are now added dynamically via a separate useEffect

        chart.timeScale().fitContent();

        // Subscription for crosshair move to update OHLC legend
        chart.subscribeCrosshairMove((param: any) => {
          if (param.point) {
            const price = candlestickSeries.coordinateToPrice(param.point.y);
            const logical = chart.timeScale().coordinateToLogical(param.point.x);
            if (price !== null && logical !== null) {
              lastCrosshairPoint.current = { logical, price };
            }
          }
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
                if (series) {
                  const dataItem = param.seriesData.get(series) as any;
                  if (dataItem) {
                    newIndicatorValues[id] = dataItem.value ?? dataItem.close;
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
        setMainChartInstance(chart);

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

  useEffect(() => {
    if (chartRef.current) {
      const bottomPaneIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR') || id.startsWith('MOMENTUM'));
      
      chartRef.current.timeScale().applyOptions({ visible: bottomPaneIndicators.length === 0 });
      // Update watermarks visibility just in case
      if (chartContainerRef.current) {
        const rows = chartContainerRef.current.querySelectorAll('table tr');
        if (rows.length > 1) {
          (rows[1] as HTMLElement).style.display = bottomPaneIndicators.length === 0 ? '' : 'none';
        }
      }
    }
  }, [activeIndicators, minimizedPanes]);

// Dynamic Indicator Management
useEffect(() => {
  if (!chartRef.current || !candles || candles.length === 0) return;

  let isMounted = true;

  const updateIndicators = async () => {
    const { LineSeries, HistogramSeries, BaselineSeries, AreaSeries, createSeriesMarkers } = await import('lightweight-charts');
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

    // Check if MOMENTUM settings changed and clear stale ones
    if (JSON.stringify(prevMomSettings.current) !== JSON.stringify(momSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('MOMENTUM')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevMomSettings.current = momSettings;
    }
    
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
          // RSI is now rendered via OscillatorPane component in a separate canvas
        } else if (type === 'ATR') {
          // ATR is now rendered via OscillatorPane component in a separate canvas
        } else if (type === 'MOMENTUM') {
          // MOMENTUM is now rendered via OscillatorPane component in a separate canvas
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
          // Handled externally by OscillatorPane
        } else if (type === 'ATR') {
          // Handled externally by OscillatorPane
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
        } else if (type === 'PIVOT POINTS') {
          // Always delete stale pivot sub-series so timeframe changes recreate them fresh
          Object.keys(seriesRef.current).forEach(sid => {
            if (sid !== id && sid.startsWith(id + '-')) {
              try { chart.removeSeries(seriesRef.current[sid]); } catch(e) {}
              delete seriesRef.current[sid];
            }
          });

          const effectivePivotsBack = pivotSettings.showHistoricalPivots ? pivotSettings.numberPivotsBack : 0;
          const pivotCalc = new PivotCalculator(pivotSettings.type, pivotSettings.timeframe, effectivePivotsBack);
          const pivotData = pivotCalc.calculate(candles);

          Object.keys(pivotSettings.levels).forEach(level => {
             const setting = pivotSettings.levels[level as keyof typeof pivotSettings.levels];
             if (!setting.show) return;

             // A level key can be 'P' or 'S1/R1' etc.
             const subLevels = level.split('/');
             subLevels.forEach(subLevel => {
                 const levelSeries = chart.addSeries(LineSeries, {
                    color: setting.color,
                    lineWidth: setting.thickness,
                    lineStyle: 0,
                    lineType: 0,
                    crosshairMarkerVisible: false,
                    visible: true,
                    lastValueVisible: false,  // We draw our own labels via markers
                    priceLineVisible: false,
                 });

                 const data: any[] = [];
                 const labelMarkers: any[] = [];
                 let lastPeriodIndex = -1;
                 let periodStartVal: number | null = null;
                 let periodStartTime: any = null;

                 for (let i = 0; i < candles.length; i++) {
                     if (!pivotData[i]) continue;
                     const val = pivotData[i][subLevel];
                     if (val === undefined || Number.isNaN(val)) continue;

                     const isNewPeriod = pivotData[i].periodIndex !== lastPeriodIndex;

                     if (isNewPeriod && lastPeriodIndex !== -1) {
                       // Insert a transparent gap point to visually break the line between periods
                       data.push({ time: candles[i].time, value: val, color: 'rgba(0,0,0,0)' });
                     } else {
                       data.push({ time: candles[i].time, value: val, color: setting.color });
                     }

                     if (isNewPeriod) {
                       periodStartVal = val;
                       periodStartTime = candles[i].time;
                       // Store label marker for the START of each new period
                       if (pivotSettings.showLabels) {
                         labelMarkers.push({
                           time: candles[i].time,
                           position: 'price',
                           price: val,
                           color: setting.color,
                           shape: 'circle',
                           size: 0,
                           text: subLevel,
                         });
                       }
                     }

                     lastPeriodIndex = pivotData[i].periodIndex;
                 }

                 levelSeries.setData(data);

                 // Use createSeriesMarkers (v5 API) to add inline price-positioned labels
                 if (labelMarkers.length > 0 && pivotSettings.showLabels) {
                     try {
                         createSeriesMarkers(levelSeries, labelMarkers);
                     } catch(e) {
                         console.warn('Pivot label markers error:', e);
                     }
                 }

                 seriesRef.current[id + '-' + subLevel] = levelSeries;
             });
          });

          // Dummy entry so the indicator is considered "created"
          seriesRef.current[id] = { applyOptions: (opt: any) => {} };
        }

        if (id.startsWith('VOLUME') && seriesRef.current['VOLUME']) {
          const series = seriesRef.current['VOLUME'] as any;
          series.applyOptions({ visible: !(hiddenLayers.indicators || hiddenIndicators.includes(id)) });
        } else if (id.startsWith('EMA') || id.startsWith('VWAP') || id.startsWith('SUPERTREND') || id.startsWith('PIVOT POINTS')) {
          seriesRef.current[id] = series;
          if (series) {
            series.applyOptions({ visible: !(hiddenLayers.indicators || hiddenIndicators.includes(id)) });
          }
          if (id.startsWith('SUPERTREND') || id.startsWith('PIVOT POINTS')) {
            ['', '_up', '_down', ...Array.from({ length: 10 }).map((_, i) => `_${i}`)].forEach(suffix => {
              if (seriesRef.current[id + suffix]) {
                seriesRef.current[id + suffix].applyOptions({ visible: !(hiddenLayers.indicators || hiddenIndicators.includes(id)) });
              }
            });
          }
        } else if (series) {
          series.applyOptions({ visible: !hiddenIndicators.includes(id) });
          seriesRef.current[id] = series;
        }
      
      } else {
        if (seriesRef.current[id]) seriesRef.current[id].applyOptions({ visible: !(hiddenLayers.indicators || hiddenIndicators.includes(id)) });
        ['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal', '-P', '-S1', '-R1', '-S2', '-R2', '-S3', '-R3', '-S4', '-R4', '-S5', '-R5'].forEach(suffix => {
          if (seriesRef.current[id + suffix]) {
            seriesRef.current[id + suffix].applyOptions({ visible: !(hiddenLayers.indicators || hiddenIndicators.includes(id)) });
          }
        });
      }

    }

    // Remove stale indicators
    const activeIds = new Set(activeIndicators);
    Object.keys(seriesRef.current).forEach(id => {
      let baseId = id;
      ['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal', '-P', '-S1', '-R1', '-S2', '-R2', '-S3', '-R3', '-S4', '-R4', '-S5', '-R5'].forEach(suffix => {
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
      const bottomIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR') || id.startsWith('MOMENTUM'));
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
}, [activeIndicators, hiddenIndicators, hiddenLayers.indicators, candles, rsiSettings, emaSettings, superTrendSettings, macdSettings, atrSettings, vwapSettings, pivotSettings]);

    // Handle all price scale margins dynamically
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const bottomIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR') || id.startsWith('MOMENTUM'));
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

  useEffect(() => {
    if (chartRef.current) {
      const bottomIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR') || id.startsWith('MOMENTUM'));
      const visibleBottomPanes = bottomIndicators.filter(id => !minimizedPanes.includes(id));
      const hasBottomPanes = bottomIndicators.length > 0;
      chartRef.current.timeScale().applyOptions({ visible: !hasBottomPanes });
    }
  }, [activeIndicators, minimizedPanes]);

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
      // Pivot series are always fully recreated by updateIndicators when candles change.
      // No in-place update needed here — skip PIVOT POINTS.
    });
  }, [candleSettings, volumeSettings, candles, atrSettings, vwapSettings, pivotSettings]);

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
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', color: '#0F172A', overflow: 'hidden' }}>
    {/* Fullscreen Wrapper */}
    <div ref={fullScreenRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#FFFFFF' }}>
      {/* Sub-header (Toolbar Area) */}
      {isActive && isMountedState && document.getElementById('top-toolbar-portal') && createPortal(
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0, overflow: 'visible', flexWrap: 'wrap', background: '#FFFFFF' }}>

        {/* Symbol Search Trigger */}
        <button
          onClick={() => setIsSymbolSearchOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
            borderRadius: 8, border: 'none', background: 'transparent',
            cursor: 'pointer', color: '#0F172A', fontWeight: 800, fontSize: 16
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Search size={18} color="#64748B" />
          {localSymbol}
        </button>

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Timeframe tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
          {favoriteTimeframes.map(favVal => {
            const tfObj = ALL_TIMEFRAMES.find(t => t.value === favVal);
            if (!tfObj) return null;
            return (
              <button key={tfObj.value} onClick={() => setTimeframe(tfObj.value as Timeframe)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: timeframe === tfObj.value ? '#2563EB' : 'transparent',
                  background: timeframe === tfObj.value ? 'rgba(37, 99, 235,0.1)' : 'transparent',
                  color: timeframe === tfObj.value ? '#2563EB' : '#475569',
                  fontWeight: timeframe === tfObj.value ? 600 : 500, fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                {tfObj.shortLabel}
              </button>
            )
          })}
          
          {/* Active timeframe (if not in favorites) + Dropdown Toggle */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 8, border: '1px solid',
                borderColor: (!favoriteTimeframes.includes(timeframe)) ? '#2563EB' : 'transparent',
                background: (!favoriteTimeframes.includes(timeframe)) ? 'rgba(37, 99, 235,0.1)' : 'transparent',
                color: (!favoriteTimeframes.includes(timeframe)) ? '#2563EB' : '#475569',
                fontWeight: (!favoriteTimeframes.includes(timeframe)) ? 600 : 500, fontSize: 14, cursor: 'pointer',
              }}
            >
              {!favoriteTimeframes.includes(timeframe) && (ALL_TIMEFRAMES.find(t => t.value === timeframe)?.shortLabel || timeframe)}
              <ChevronDown size={16} />
            </button>

            {isTimeframeDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsTimeframeDropdownOpen(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 1000, width: 220, maxHeight: 400, overflowY: 'auto' }}>
                  {Object.entries(CATEGORIZED_TIMEFRAMES).map(([category, tfs]) => (
                    <div key={category} style={{ padding: '8px 0' }}>
                      <div style={{ padding: '4px 16px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {category}
                      </div>
                      {tfs.map(tf => {
                        const isFav = favoriteTimeframes.includes(tf.value);
                        return (
                          <div 
                            key={tf.value}
                            className="tf-dropdown-item"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', cursor: 'pointer', background: timeframe === tf.value ? '#2563EB' : 'transparent', color: timeframe === tf.value ? '#FFFFFF' : '#0F172A' }}
                            onClick={() => {
                              setTimeframe(tf.value as Timeframe);
                              setIsTimeframeDropdownOpen(false);
                            }}
                          >
                            <span style={{ fontSize: 14 }}>{tf.label}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFavoriteTimeframes(prev => isFav ? prev.filter(v => v !== tf.value) : [...prev, tf.value]);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                            >
                              <Star size={16} color={isFav ? '#F59E0B' : 'transparent'} fill={isFav ? '#F59E0B' : 'none'} className="tf-star-icon" style={{ stroke: isFav ? '#F59E0B' : (timeframe === tf.value ? 'rgba(255,255,255,0.5)' : '#CBD5E1') }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
            onClick={() => setIsOptionChainOpen(true)}
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
                  let displayTool = tool;
                  if (tool.id === 'line_tools_group') {
                    const matched = LINE_TOOLS_GROUP.find(t => t.id === selectedLineTool) || LINE_TOOLS_GROUP[0];
                    displayTool = { id: matched.id, icon: matched.icon, label: matched.label.toUpperCase() };
                  }
                  const Icon = displayTool.icon;
                  const isActive = activeDrawingTool === displayTool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveDrawingTool(displayTool.id as DrawingType);
                        setIsToolsOpen(false);
                        if (displayTool.id === 'alert') {
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

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0, marginLeft: 8, marginRight: 8 }} />

        {/* Instant Order Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Instant Order</span>
          <div 
            onClick={() => setIsInstantOrder(!isInstantOrder)}
            style={{ 
              width: 36, height: 20, borderRadius: 10, background: isInstantOrder ? '#2563EB' : '#CBD5E1',
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
            }}
          >
            <div style={{ 
              position: 'absolute', top: 2, left: isInstantOrder ? 18 : 2, width: 16, height: 16, 
              background: '#FFFFFF', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
            }} />
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          
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
                      <div onClick={() => { if (onLayoutChange) onLayoutChange('1'); }} style={{ padding: 4, borderRadius: 4, cursor: 'pointer', background: activeLayout === '1' ? 'rgba(41, 98, 255, 0.1)' : 'transparent' }}>
                        {renderLayoutIcon('1', activeLayout === '1')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', width: 12 }}>2</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['2a', '2b'].map(id => (
                        <div key={id} onClick={() => { if (onLayoutChange) onLayoutChange(id); }} style={{ padding: 4, borderRadius: 4, cursor: 'pointer', background: activeLayout === id ? 'rgba(41, 98, 255, 0.1)' : 'transparent' }}>
                          {renderLayoutIcon(id, activeLayout === id)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', width: 12 }}>3</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['3a', '3b', '3c', '3d', '3e', '3f'].map(id => (
                        <div key={id} onClick={() => { if (onLayoutChange) onLayoutChange(id); }} style={{ padding: 4, borderRadius: 4, cursor: 'pointer', background: activeLayout === id ? 'rgba(41, 98, 255, 0.1)' : 'transparent' }}>
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
                      <ToggleSwitch checked={syncLayout[item.key as keyof typeof syncLayout]} onChange={() => setSyncLayout({ ...syncLayout, [item.key]: !syncLayout[item.key as keyof typeof syncLayout] })} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => {
                chartRef.current?.timeScale().resetTimeScale();
                chartRef.current?.priceScale('right').applyOptions({ autoScale: true });
              }}
              title="Refresh Chart"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', color: '#475569', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0B0F19'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', color: '#475569', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0B0F19'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
              title="Change Theme"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
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
            title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', color: '#475569', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0B0F19'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
          </button>
          </div>
        </div>
      </div>
      , document.getElementById('top-toolbar-portal')!)}

      {/* Symbol Search Modal */}
      <SymbolSearchModal
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        onSelect={(symbol, exchange) => {
          setLocalSymbol(symbol);
          setLocalExchange(exchange as 'NSE' | 'BSE');
          if (syncLayout.symbol) {
            setGlobalSymbol(symbol, exchange as 'NSE' | 'BSE');
          }
        }}
      />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#FFFFFF', padding: '16px', gap: '12px' }}>

        {/* Left Sidebar area */}
        {isActive && isMountedState && document.getElementById('left-toolbar-portal') && createPortal(
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', width: isSidebarOpen ? 48 : 32, transition: 'width 0.2s', background: '#FFFFFF', padding: '8px 0', borderRight: '1px solid #E2E8F0' }}>
          {isSidebarOpen && (
            <div style={{ overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {DRAWING_TOOLS.map(tool => {
                const Icon = tool.icon;
                const isActive = activeDrawingTool === tool.id;

                if (tool.id === 'emoji') {
                  return (
                    <button
                      ref={emojiButtonRef}
                      key={tool.id}
                      title={tool.label}
                      onClick={() => {
                        setIsEmojiOpen(!isEmojiOpen);
                        setIsLinesMenuOpen(false);
                      }}
                      style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                        background: isActive || isEmojiOpen ? 'rgba(14, 116, 144, 0.05)' : 'transparent',
                        color: isActive || isEmojiOpen ? '#0E7490' : '#475569',
                        border: 'none', cursor: 'pointer', flexShrink: 0
                      }}
                      onMouseEnter={(e) => { if (!isActive && !isEmojiOpen) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { if (!isActive && !isEmojiOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Smile size={18} />
                    </button>
                  );
                }

                if (tool.id === 'line_tools_group') {
                  const activeLineToolItem = LINE_TOOLS_GROUP.find(t => t.id === selectedLineTool) || LINE_TOOLS_GROUP[0];
                  const GroupIcon = activeLineToolItem.icon;
                  const isGroupActive = LINE_TOOLS_GROUP.some(t => t.id === activeDrawingTool);

                  return (
                    <div ref={linesButtonRef} key={tool.id} style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <button
                        title={activeLineToolItem.label.toUpperCase()}
                        onClick={() => {
                          setActiveDrawingTool(activeLineToolItem.id as DrawingType);
                          setIsEmojiOpen(false);
                          setIsLinesMenuOpen(false);
                        }}
                        style={{
                          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                          background: isGroupActive || isLinesMenuOpen ? 'rgba(14, 116, 144, 0.05)' : 'transparent',
                          color: isGroupActive || isLinesMenuOpen ? '#0E7490' : '#475569',
                          border: 'none', cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { if (!isGroupActive && !isLinesMenuOpen) e.currentTarget.style.background = '#F8FAFC'; }}
                        onMouseLeave={(e) => { if (!isGroupActive && !isLinesMenuOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <GroupIcon size={18} />
                      </button>

                      {/* Tiny triangle arrow in bottom-right corner to toggle popover */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLinesMenuOpen(!isLinesMenuOpen);
                          setIsEmojiOpen(false);
                        }}
                        style={{
                          position: 'absolute', right: 2, bottom: 2,
                          width: 0, height: 0,
                          cursor: 'pointer', zIndex: 10,
                          borderStyle: 'solid', borderWidth: '4px 3px 0 3px',
                          borderColor: isGroupActive || isLinesMenuOpen ? '#0E7490 transparent transparent transparent' : '#94A3B8 transparent transparent transparent'
                        }}
                      />
                    </div>
                  );
                }

                return (
                  <button
                    key={tool.id}
                    title={tool.label}
                    onClick={() => {
                      setActiveDrawingTool(tool.id as DrawingType);
                      setIsEmojiOpen(false);
                      setIsLinesMenuOpen(false);
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

          {isSidebarOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
              <button 
                title={isDrawingsLocked ? "Unlock all drawings" : "Lock all drawings"}
                onClick={() => setIsDrawingsLocked(!isDrawingsLocked)}
                style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', color: isDrawingsLocked ? '#0E7490' : '#475569', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {isDrawingsLocked ? <Lock size={18} /> : <Unlock size={18} />}
              </button>
              
              <div style={{ position: 'relative' }}>
                <button 
                  title="Hide/Show"
                  onClick={() => setIsHideMenuOpen(!isHideMenuOpen)}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'transparent', color: (hiddenLayers.drawings || hiddenLayers.indicators) ? '#0E7490' : '#475569', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {(hiddenLayers.drawings || hiddenLayers.indicators) ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {isHideMenuOpen && (
                  <div style={{ position: 'absolute', left: 44, bottom: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', zIndex: 9999, width: 200, padding: '4px 0' }}>
                    <div 
                      onClick={() => { setHiddenLayers(prev => ({ ...prev, drawings: !prev.drawings })); setIsHideMenuOpen(false); }}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#0F172A' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>Hide drawings</span>
                      {hiddenLayers.drawings && <Check size={14} color="#0E7490" />}
                    </div>
                    <div 
                      onClick={() => { setHiddenLayers(prev => ({ ...prev, indicators: !prev.indicators })); setIsHideMenuOpen(false); }}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#0F172A' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>Hide indicators</span>
                      {hiddenLayers.indicators && <Check size={14} color="#0E7490" />}
                    </div>
                    <div 
                      onClick={() => { 
                        const hideAll = !(hiddenLayers.drawings && hiddenLayers.indicators);
                        setHiddenLayers({ drawings: hideAll, indicators: hideAll, positions: false }); 
                        setIsHideMenuOpen(false); 
                      }}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #E2E8F0', color: '#0F172A' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>Hide all</span>
                      {(hiddenLayers.drawings && hiddenLayers.indicators) && <Check size={14} color="#0E7490" />}
                    </div>
                  </div>
                )}
              </div>
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
          {isEmojiOpen && (
            <div ref={emojiPopoverRef} style={{
              position: 'absolute',
              left: isSidebarOpen ? 48 : 32,
              bottom: 40,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
              width: 320,
              height: 380,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Category tabs at the top */}
              <div style={{
                display: 'flex',
                background: '#FFFFFF',
                borderBottom: '1px solid #F1F5F9',
                padding: '4px 6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                {/* Clock tab for Recent */}
                <button
                  title="Recently Used"
                  onClick={() => {
                    setActiveEmojiCategory('recent');
                    const container = emojiScrollRef.current;
                    const target = document.getElementById('emoji-section-recent');
                    if (container && target) {
                      container.scrollTop = target.offsetTop - container.offsetTop;
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: 16,
                    padding: '4px 6px',
                    cursor: 'pointer',
                    borderBottom: activeEmojiCategory === 'recent' ? '2px solid #2563EB' : '2px solid transparent',
                    color: activeEmojiCategory === 'recent' ? '#2563EB' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  🕒
                </button>

                {EMOJI_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    title={cat.label}
                    onClick={() => {
                      setActiveEmojiCategory(cat.id);
                      const container = emojiScrollRef.current;
                      const target = document.getElementById(`emoji-section-${cat.id}`);
                      if (container && target) {
                        container.scrollTop = target.offsetTop - container.offsetTop;
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: 16,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderBottom: activeEmojiCategory === cat.id ? '2px solid #2563EB' : '2px solid transparent',
                      color: activeEmojiCategory === cat.id ? '#2563EB' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>

              {/* Scrollable grid area */}
              <div
                ref={emojiScrollRef}
                onScroll={() => {
                  const container = emojiScrollRef.current;
                  if (!container) return;
                  let currentCat = 'recent';
                  let minDiff = Infinity;
                  const categoriesToCheck = ['recent', ...EMOJI_CATEGORIES.map(c => c.id)];
                  for (const catId of categoriesToCheck) {
                    const el = document.getElementById(`emoji-section-${catId}`);
                    if (el) {
                      const diff = Math.abs(el.offsetTop - container.scrollTop - container.offsetTop);
                      if (diff < minDiff) {
                        minDiff = diff;
                        currentCat = catId;
                      }
                    }
                  }
                  setActiveEmojiCategory(currentCat);
                }}
                style={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  padding: 12,
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Recently Used section */}
                {recentEmojis.length > 0 && (
                  <div id="emoji-section-recent" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, textAlign: 'left' }}>
                      RECENTLY USED
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                      {recentEmojis.map((em, idx) => (
                        <button
                          key={`recent-${em}-${idx}`}
                          onClick={() => {
                            setSelectedEmoji(em);
                            setActiveDrawingTool('emoji');
                            addRecentEmoji(em);
                            setIsEmojiOpen(false);
                          }}
                          style={{
                            fontSize: 22,
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            padding: 0,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s ease, background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F1F5F9';
                            e.currentTarget.style.transform = 'scale(1.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard categories */}
                {EMOJI_CATEGORIES.map(cat => (
                  <div key={cat.id} id={`emoji-section-${cat.id}`} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, textAlign: 'left' }}>
                      {cat.label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                      {cat.emojis.map((em, idx) => (
                        <button
                          key={`${cat.id}-${em}-${idx}`}
                          onClick={() => {
                            setSelectedEmoji(em);
                            setActiveDrawingTool('emoji');
                            addRecentEmoji(em);
                            setIsEmojiOpen(false);
                          }}
                          style={{
                            fontSize: 22,
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            padding: 0,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s ease, background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F1F5F9';
                            e.currentTarget.style.transform = 'scale(1.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isLinesMenuOpen && (
            <div ref={linesPopoverRef} style={{
              position: 'absolute',
              left: isSidebarOpen ? 48 : 32,
              top: 44,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
              width: 220,
              display: 'flex',
              flexDirection: 'column',
              padding: '6px 0'
            }}>
              {/* Category: LINES */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', padding: '6px 12px', textAlign: 'left' }}>
                Lines
              </div>
              {LINE_TOOLS_GROUP.filter(t => t.category === 'LINES').map(item => {
                const ItemIcon = item.icon;
                const isItemActive = activeDrawingTool === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveDrawingTool(item.id as DrawingType);
                      setSelectedLineTool(item.id);
                      setIsLinesMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '8px 16px',
                      background: isItemActive ? 'rgba(14, 116, 144, 0.05)' : 'transparent',
                      color: isItemActive ? '#0E7490' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                      fontWeight: isItemActive ? 600 : 400
                    }}
                    onMouseEnter={(e) => { if (!isItemActive) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (!isItemActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ItemIcon size={16} />
                    {item.label}
                  </button>
                );
              })}

              <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

              {/* Category: CHANNELS */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', padding: '6px 12px', textAlign: 'left' }}>
                Channels
              </div>
              {LINE_TOOLS_GROUP.filter(t => t.category === 'CHANNELS').map(item => {
                const ItemIcon = item.icon;
                const isItemActive = activeDrawingTool === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveDrawingTool(item.id as DrawingType);
                      setSelectedLineTool(item.id);
                      setIsLinesMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '8px 16px',
                      background: isItemActive ? 'rgba(14, 116, 144, 0.05)' : 'transparent',
                      color: isItemActive ? '#0E7490' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                      fontWeight: isItemActive ? 600 : 400
                    }}
                    onMouseEnter={(e) => { if (!isItemActive) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (!isItemActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ItemIcon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        , document.getElementById('left-toolbar-portal')!)}

        {/* Main Content Area (Chart + Trade Panel) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Chart Container */}
          <div 
            ref={parentContainerRef}
            style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid black', borderRadius: '4px' }}
            onDoubleClickCapture={(e) => {
            let price: number | undefined = undefined;
            if (chartContainerRef.current && chartContainerRef.current.contains(e.target as Node)) {
              const rect = chartContainerRef.current.getBoundingClientRect();
              const y = e.clientY - rect.top;
              try {
                if (seriesRef.current['candlestick']) {
                  const p = (seriesRef.current['candlestick'] as any).coordinateToPrice(y);
                  if (p !== null) price = p;
                }
              } catch (err) {}
            }
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              price
            });
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            let price: number | undefined = undefined;
            if (chartContainerRef.current && chartContainerRef.current.contains(e.target as Node)) {
              const rect = chartContainerRef.current.getBoundingClientRect();
              const y = e.clientY - rect.top;
              try {
                if (seriesRef.current['candlestick']) {
                  const p = (seriesRef.current['candlestick'] as any).coordinateToPrice(y);
                  if (p !== null) price = p;
                }
              } catch (err) {}
            }
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              price
            });
          }}
        >
          {/* Fixed TradingView Logo */}
          <div className="tv-watermark-container">
            <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="tv-watermark-link">
              <span className="tv-watermark-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#131722"/>
                  <g transform="translate(4, 4) scale(0.667)">
                    <path d="M15.8654 8.2789c0 1.3541-1.0978 2.4519-2.452 2.4519-1.354 0-2.4519-1.0978-2.4519-2.452 0-1.354 1.0978-2.4518 2.452-2.4518 1.3541 0 2.4519 1.0977 2.4519 2.4519zM9.75 6H0v4.9038h4.8462v7.2692H9.75Zm8.5962 0H24l-5.1058 12.173h-5.6538z" fill="#FFFFFF"/>
                  </g>
                </svg>
              </span>
              <span className="tv-watermark-text">Chart by TradingView</span>
            </a>
          </div>

          {/* TradingView Style Legend Overlay */}
          {hoveredCandle && quote && (
            <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
              {/* Symbol & Timeframe */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: '#0B0F19' }}>
                <button
                  onClick={() => setIsSymbolSearchOpen(true)}
                  style={{
                    background: 'none', border: 'none', padding: 0, margin: 0,
                    fontSize: 16, fontWeight: 700, color: '#0B0F19', cursor: 'pointer',
                    pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 4
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0E7490'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#0B0F19'}
                  title="Change symbol"
                >
                  {(quote as any).companyName || quote.symbol}
                </button>
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
                  onClick={() => { setTradePanelSide('SELL'); setIsTradePanelOpen(true); }}
                  style={{ background: '#fff', border: '1px solid #EF4444', color: '#EF4444', padding: '2px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  Sell
                </button>
                <span style={{ fontSize: 12, color: '#475569' }}>0.00</span>
                <button
                  onClick={() => { setTradePanelSide('BUY'); setIsTradePanelOpen(true); }}
                  style={{ background: '#fff', border: '1px solid #10B981', color: '#10B981', padding: '2px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  Buy
                </button>
              </div>

              {/* Indicator Legend (Top Pane) */}
              {(() => {
                const topPaneIndicators = activeIndicators.filter(id => !id.startsWith('RSI') && !id.startsWith('MACD') && !id.startsWith('ATR') && !id.startsWith('MOMENTUM'));
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
                            isHidden={hiddenLayers.indicators || hiddenIndicators.includes(ind)}
                            hideValue={(ind.startsWith('EMA') && !emaSettings.valuesInStatusLine) || (ind.startsWith('SUPERTREND') && !superTrendSettings.valuesInStatusLine) || (ind.startsWith('MACD') && !macdSettings.valuesInStatusLine) || (ind.startsWith('ATR') && !atrSettings.valuesInStatusLine) || (ind.startsWith('VWAP') && !vwapSettings.valuesInStatusLine) || (ind.startsWith('MOMENTUM') && !momSettings.valuesInStatusLine)}
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
                              } else if (ind.startsWith('MOMENTUM')) {
                                setTempMomSettings(momSettings);
                                setMomSettingsActiveTab('Inputs');
                                setIsMomSettingsModalOpen(true);
                              } else if (ind.startsWith('VWAP')) {
                                setTempVwapSettings(vwapSettings);
                                setVwapSettingsActiveTab('Inputs');
                                setIsVwapSettingsModalOpen(true);
                              } else if (ind.startsWith('PIVOT POINTS')) {
                                setTempPivotSettings(pivotSettings);
                                setPivotSettingsActiveTab('Inputs');
                                setIsPivotSettingsModalOpen(true);
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
            (() => {
              const bottomPaneIndicators = activeIndicators.filter(id => id.startsWith('RSI') || id.startsWith('MACD') || id.startsWith('ATR') || id.startsWith('MOMENTUM'));
              const unminimizedBottomPanes = bottomPaneIndicators.filter(id => !minimizedPanes.includes(id));
              const isAnyMaximized = maximizedPane !== null && activeIndicators.includes(maximizedPane);
              
              const minimizedBottomPanes = bottomPaneIndicators.filter(id => minimizedPanes.includes(id));
              // Minimum pixels including 32px for the time axis at the bottom
              const minPixelsForBottom = (unminimizedBottomPanes.length * 110) + (minimizedBottomPanes.length * 38) + 32;

              // Calculate boundary height of bottom panes in pixels
              const H = parentHeight || 500;
              const boundaryHeight = bottomPaneIndicators.length === 0 
                ? 0 
                : Math.max(minPixelsForBottom, Math.min(0.8 * H, rsiHeightRatio * H));

              const mainChartBottom = boundaryHeight;
                
              const bottomPanesTop = bottomPaneIndicators.length === 0
                ? H
                : H - boundaryHeight;

              return (
                <>
                  <div 
                    id="main-chart-container" 
                    ref={chartContainerRef} 
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: mainChartBottom, visibility: isAnyMaximized ? 'hidden' : 'visible', zIndex: 1 }}
                  />
                  
                  {/* --- HTML Trade Overlays --- */}
                  {activeOverlayTarget && mainChartInstance && seriesRef.current['candlestick'] && !isAnyMaximized && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: mainChartBottom, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}>
                      <ChartTradeOverlays
                        chart={mainChartInstance}
                        series={seriesRef.current['candlestick']}
                        holding={activeOverlayTarget as any}
                        onConfirmExit={() => {
                          if (isInstantOrder) handleExitPosition();
                          else setConfirmExitModal(true);
                        }}
                        onConfirmTP={(price) => {
                          if ((activeOverlayTarget as any).isPendingOrder) return;
                          if (isInstantOrder) updateTP.mutate({ symbol: selectedSymbol, tp: price });
                          else setConfirmTPModal(price);
                        }}
                        onConfirmSL={(price) => {
                          if ((activeOverlayTarget as any).isPendingOrder) return;
                          if (isInstantOrder) updateSL.mutate({ symbol: selectedSymbol, sl: price });
                          else setConfirmSLModal(price);
                        }}
                        onRemoveTP={() => { 
                          if ((activeOverlayTarget as any).isPendingOrder) return;
                          if (isInstantOrder) updateTP.mutate({ symbol: selectedSymbol, tp: undefined });
                          else setRemoveTPModal(true); 
                        }}
                        onRemoveSL={() => { 
                          if ((activeOverlayTarget as any).isPendingOrder) return;
                          if (isInstantOrder) updateSL.mutate({ symbol: selectedSymbol, sl: undefined });
                          else setRemoveSLModal(true); 
                        }}
                      />
                    </div>
                  )}

                  {bottomPaneIndicators.length > 0 && (
                    <>

                      {/* Resizer with Blur Line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: bottomPanesTop,
                          left: 0,
                          right: 0,
                          height: '8px',
                          marginTop: '-4px',
                          cursor: 'row-resize',
                          zIndex: 50,
                          background: isResizingRsi ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          display: (isAnyMaximized || unminimizedBottomPanes.length === 0) ? 'none' : 'flex',
                          alignItems: 'center',
                        }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsResizingRsi(true);
                      
                      const handle = e.currentTarget as HTMLDivElement;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        if (!chartContainerRef.current || !chartContainerRef.current.parentElement) return;
                        const rect = chartContainerRef.current.parentElement.getBoundingClientRect();
                        const y = moveEvent.clientY - rect.top;
                        const newRatio = 1 - (y / rect.height);
                        const minimizedBottomPanesCount = bottomPaneIndicators.length - unminimizedBottomPanes.length;
                        const minPixels = (unminimizedBottomPanes.length * 110) + (minimizedBottomPanesCount * 38) + 32; // Include 32px for time axis
                        const minRatio = rect.height > 0 ? minPixels / rect.height : 0.15;
                        const clampedRatio = Math.max(minRatio, Math.min(0.8, newRatio));
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

                  {/* Render True Multi-Canvas Oscillators */}
                  <div style={{ position: 'absolute', top: isAnyMaximized ? 0 : bottomPanesTop, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: isAnyMaximized ? 40 : 10, background: '#FFFFFF' }}>
                    {(() => {
                      const visibleBottomPanes = bottomPaneIndicators.filter(
                        id => !minimizedPanes.includes(id) && !(hiddenLayers.indicators || hiddenIndicators.includes(id))
                      );
                      const timeFormat = (c: any) => c.time as any;

                      return bottomPaneIndicators.map((id, idx) => {
                      const type = id.startsWith('RSI') ? 'RSI' : (id.startsWith('MACD') ? 'MACD' : (id.startsWith('ATR') ? 'ATR' : 'MOMENTUM'));
                      const settings = type === 'RSI' ? rsiSettings : (type === 'MACD' ? macdSettings : (type === 'ATR' ? atrSettings : momSettings));
                      
                      const isMaximized = maximizedPane === id;
                      const isMinimized = minimizedPanes.includes(id);
                      
                      if (isAnyMaximized && !isMaximized) return null;
                      
                      const isPaneHidden = hiddenLayers.indicators || hiddenIndicators.includes(id);
                      const flexStyle = isPaneHidden 
                        ? { display: 'none' } 
                        : (isMaximized 
                            ? { flex: 1 } 
                            : (isMinimized 
                                ? { flex: '0 0 38px' } 
                                : { flex: `${paneWeights[id] || 1} 1 0%` }
                              )
                          );

                      return (
                        <div 
                          key={id} 
                          id={`pane-wrapper-${id}`}
                          style={{ display: isPaneHidden ? 'none' : 'flex', width: '100%', ...flexStyle, position: 'relative', minHeight: 0 }}
                        >
                          <div style={{ position: 'absolute', top: isMinimized ? '50%' : 4, transform: isMinimized ? 'translateY(-50%)' : 'none', left: 16, zIndex: 60, pointerEvents: 'auto' }}>
                            <IndicatorLegendRow
                              ind={id}
                              value={oscillatorValues[id]}
                              isHidden={hiddenLayers.indicators || hiddenIndicators.includes(id)}
                              hideValue={(id.startsWith('EMA') && !emaSettings.valuesInStatusLine) || (id.startsWith('SUPERTREND') && !superTrendSettings.valuesInStatusLine) || (id.startsWith('MACD') && !macdSettings.valuesInStatusLine) || (id.startsWith('ATR') && !atrSettings.valuesInStatusLine) || (id.startsWith('VWAP') && !vwapSettings.valuesInStatusLine)}
                              onToggleHide={() => {
                                setHiddenIndicators(prev =>
                                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                );
                              }}
                              onRemove={() => {
                                setActiveIndicators(prev => {
                                  const next = prev.filter(i => i !== id);
                                  pushToHistory({ activeIndicators: next });
                                  return next;
                                });
                              }}
                              onSettings={() => {
                                if (id.startsWith('VOLUME')) {
                                  setTempVolumeSettings(volumeSettings);
                                  setIsVolumeSettingsModalOpen(true);
                                } else if (id.startsWith('RSI')) {
                                  setTempRsiSettings(rsiSettings);
                                  setRsiSettingsActiveTab('Inputs');
                                  setIsRsiSettingsModalOpen(true);
                                } else if (id.startsWith('EMA')) {
                                  setTempEmaSettings(emaSettings);
                                  setEmaSettingsActiveTab('Inputs');
                                  setIsEmaSettingsModalOpen(true);
                                } else if (id.startsWith('SUPERTREND')) {
                                  setTempSuperTrendSettings(superTrendSettings);
                                  setSuperTrendSettingsActiveTab('Inputs');
                                  setIsSuperTrendSettingsModalOpen(true);
                                } else if (id.startsWith('MACD')) {
                                  setTempMacdSettings(macdSettings);
                                  setMacdSettingsActiveTab('Inputs');
                                  setIsMacdSettingsModalOpen(true);
                                } else if (id.startsWith('ATR')) {
                                  setTempAtrSettings(atrSettings);
                                  setAtrSettingsActiveTab('Inputs');
                                  setIsAtrSettingsModalOpen(true);
                                } else if (id.startsWith('VWAP')) {
                                  setTempVwapSettings(vwapSettings);
                                  setVwapSettingsActiveTab('Inputs');
                                  setIsVwapSettingsModalOpen(true);
                                } else if (id.startsWith('PIVOT POINTS')) {
                                  setTempPivotSettings(pivotSettings);
                                  setPivotSettingsActiveTab('Inputs');
                                  setIsPivotSettingsModalOpen(true);
                                }
                              }}
                            />
                          </div>
                          <OscillatorPane 
                            id={id}
                            type={type}
                            data={candles || []}
                            settings={settings}
                            mainChart={chartRef.current}
                            flexStyle={{ flex: 1 }}
                            isMinimized={isMinimized}
                            isBottomPane={false}
                            onValueChange={(val) => {
                              setOscillatorValues(prev => {
                                if (prev[id] === val) return prev;
                                return { ...prev, [id]: val as number };
                              });
                            }}
                          >
                            <div style={{ position: 'absolute', top: 4, right: 64, display: 'flex', gap: 4, zIndex: 50, background: '#FFFFFF', padding: '2px 4px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                              {idx > 0 && !isAnyMaximized && (
                                <button
                                  title="Move Up"
                                  style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B' }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                                  onClick={() => {
                                    setActiveIndicators(prev => {
                                      const next = [...prev];
                                      const currentIndex = next.indexOf(id);
                                      // Find the previous oscillator
                                      let prevIndex = -1;
                                      for (let i = currentIndex - 1; i >= 0; i--) {
                                        if (next[i].startsWith('RSI') || next[i].startsWith('MACD') || next[i].startsWith('ATR') || next[i].startsWith('MOMENTUM')) {
                                          prevIndex = i;
                                          break;
                                        }
                                      }
                                      if (prevIndex !== -1) {
                                        [next[currentIndex], next[prevIndex]] = [next[prevIndex], next[currentIndex]];
                                        pushToHistory({ activeIndicators: next });
                                      }
                                      return next;
                                    });
                                  }}
                                >
                                  <ArrowUp size={14} />
                                </button>
                              )}
                              <button
                                title="Remove Pane"
                                style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                                onClick={() => {
                                  if (maximizedPane === id) setMaximizedPane(null);
                                  setMinimizedPanes(prev => prev.filter(p => p !== id));
                                  setActiveIndicators(prev => {
                                    const next = prev.filter(i => i !== id);
                                    pushToHistory({ activeIndicators: next });
                                    return next;
                                  });
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                title={isMaximized ? "Restore Pane" : "Maximize Pane"}
                                style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
                                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                                onClick={() => {
                                  if (isMaximized) {
                                    setMaximizedPane(null);
                                  } else {
                                    setMaximizedPane(id);
                                    setMinimizedPanes(prev => prev.filter(p => p !== id));
                                  }
                                }}
                              >
                                {isMaximized ? <Minimize2 size={14} /> : <Square size={14} />}
                              </button>
                            </div>
                          </OscillatorPane>
                          
                          {/* Horizontal Resizer between adjacent oscillator panes */}
                          {(() => {
                            const unminIdx = visibleBottomPanes.indexOf(id);
                            if (unminIdx !== -1 && unminIdx < visibleBottomPanes.length - 1 && !isAnyMaximized) {
                              return (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    left: 0,
                                    right: 0,
                                    height: '8px',
                                    cursor: 'row-resize',
                                    zIndex: 50,
                                    background: activeResizerIndex === unminIdx ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                  onMouseDown={(e) => startResizingOscillators(unminIdx, visibleBottomPanes, e)}
                                >
                                  <div style={{ width: '100%', height: '1px', background: 'rgba(148, 163, 184, 0.3)' }} />
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      );
                      });
                    })()}
                    {bottomPaneIndicators.length > 0 && mainChartInstance && (
                      <div style={{ flexShrink: 0 }}>
                        <TimeAxisPane mainChart={mainChartInstance} data={(candles || []).map(c => ({ time: c.time as any }))} />
                      </div>
                    )}
                  </div>
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
                  isLocked={isDrawingsLocked}
                  isHidden={hiddenLayers.drawings}
                  selectedEmoji={selectedEmoji}
                />
              )}
            </>
          );
        })()
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
                    <input type="checkbox" checked={tempPivotSettings.showHistoricalPivots} onChange={(e) => setTempPivotSettings({...tempPivotSettings, showHistoricalPivots: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} />
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
                    <input type="checkbox" checked={tempPivotSettings.showLabels} onChange={(e) => setTempPivotSettings({...tempPivotSettings, showLabels: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ fontSize: 14, color: '#0F172A' }}>Labels</span>
                  </label>

                  {['P', 'S1/R1', 'S2/R2', 'S3/R3', 'S4/R4', 'S5/R5'].map(level => (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minWidth: 80 }}>
                        <input 
                          type="checkbox" 
                          checked={tempPivotSettings.levels[level as keyof typeof tempPivotSettings.levels].show} 
                          onChange={(e) => setTempPivotSettings({
                            ...tempPivotSettings, 
                            levels: { 
                              ...tempPivotSettings.levels, 
                              [level]: { ...tempPivotSettings.levels[level as keyof typeof tempPivotSettings.levels], show: e.target.checked } 
                            }
                          })} 
                          style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} 
                        />
                        <span style={{ fontSize: 14, color: '#0F172A' }}>{level}</span>
                      </label>
                      
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                        <input 
                          type="color" 
                          value={tempPivotSettings.levels[level as keyof typeof tempPivotSettings.levels].color} 
                          onChange={(e) => setTempPivotSettings({
                            ...tempPivotSettings, 
                            levels: { 
                              ...tempPivotSettings.levels, 
                              [level]: { ...tempPivotSettings.levels[level as keyof typeof tempPivotSettings.levels], color: e.target.value } 
                            }
                          })} 
                          style={{ width: 44, height: 32, padding: 0, border: 'none', cursor: 'pointer' }} 
                        />
                        <div style={{ width: 1, height: 32, background: '#E2E8F0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <select 
                            value={tempPivotSettings.levels[level as keyof typeof tempPivotSettings.levels].thickness} 
                            onChange={(e) => setTempPivotSettings({
                              ...tempPivotSettings, 
                              levels: { 
                                ...tempPivotSettings.levels, 
                                [level]: { ...tempPivotSettings.levels[level as keyof typeof tempPivotSettings.levels], thickness: parseInt(e.target.value) } 
                              }
                            })} 
                            style={{ width: 60, height: 32, padding: '0 8px', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                          >
                            <option value={1}>—</option>
                            <option value={2}>▬▬</option>
                            <option value={3}>██</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsPivotSettingsModalOpen(false); setTempPivotSettings(pivotSettings); }} style={{ padding: '8px 24px', background: 'transparent', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#3b82f6', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setPivotSettings(tempPivotSettings); pushToHistory({ pivotSettings: tempPivotSettings }); setIsPivotSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
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

      {/* Context Menu on Double Click */}
      {contextMenu && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9999 }} 
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 10000,
              background: '#FFFFFF',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              padding: '4px 0',
              minWidth: '220px',
              fontSize: '13px',
              color: '#0F172A',
            }}
          >
            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setTradePanelSide('BUY'); setIsTradePanelOpen(true); setContextMenu(null); }}
            >
              Trade
            </div>

            {(() => {
              const activeHolding = holdings.find(h => h.symbol === selectedSymbol && h.quantity > 0);
              if (activeHolding && contextMenu.price) {
                return (
                  <>
                    <div 
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#10B981' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { updateTP.mutate({ symbol: selectedSymbol, tp: contextMenu.price }); setContextMenu(null); }}
                    >
                      Set Take Profit at {contextMenu.price.toFixed(2)}
                    </div>
                    <div 
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { updateSL.mutate({ symbol: selectedSymbol, sl: contextMenu.price }); setContextMenu(null); }}
                    >
                      Set Stop Loss at {contextMenu.price.toFixed(2)}
                    </div>
                  </>
                );
              }
              return null;
            })()}

            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setIsOptionChainOpen(true); setContextMenu(null); }}
            >
              Option Chain
            </div>
            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setContextMenu(null); }}
            >
              Create Alert
            </div>
            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { 
                chartRef.current?.timeScale().resetTimeScale();
                chartRef.current?.priceScale('right').applyOptions({ autoScale: true });
                setContextMenu(null); 
              }}
            >
              <span>Reset chart view</span>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>⌥ R</span>
            </div>

            <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />

            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { 
                navigator.clipboard.writeText(contextMenu.price?.toFixed(2) || '0.00');
                setContextMenu(null); 
              }}
            >
              <span>Copy price {contextMenu.price?.toFixed(2) || ''}</span>
            </div>
            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setContextMenu(null); }}
            >
              <span>Paste</span>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>⌘ V</span>
            </div>

            <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />

            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setContextMenu(null); }}
            >
              <span>Add {selectedSymbol} to watchlist</span>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>⌥ W</span>
            </div>

            <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />

            <div 
              style={{ padding: '8px 16px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { 
                setDrawings([]); 
                pushToHistory({ drawings: [] });
                setContextMenu(null); 
              }}
            >
              Remove drawings
            </div>
            <div 
              style={{ padding: '8px 16px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { 
                setActiveIndicators([]); 
                pushToHistory({ activeIndicators: [] });
                setContextMenu(null); 
              }}
            >
              Remove indicators
            </div>

            <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />

            <div 
              style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { 
                setTempCandleSettings(candleSettings); 
                setIsChartSettingsModalOpen(true); 
                setContextMenu(null); 
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings...
            </div>
          </div>
        </>
      )}
      {/* MOMENTUM Settings Modal */}
      {isMomSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div ref={modalRef} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>Mom</h3>
              <button onClick={() => setIsMomSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
              <button onClick={() => setMomSettingsActiveTab('Inputs')} style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: momSettingsActiveTab === 'Inputs' ? '2px solid #0f172a' : '2px solid transparent', fontSize: 15, fontWeight: momSettingsActiveTab === 'Inputs' ? 600 : 500, color: momSettingsActiveTab === 'Inputs' ? '#0f172a' : '#64748b', cursor: 'pointer' }}>Inputs</button>
              <button onClick={() => setMomSettingsActiveTab('Style')} style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: momSettingsActiveTab === 'Style' ? '2px solid #0f172a' : '2px solid transparent', fontSize: 15, fontWeight: momSettingsActiveTab === 'Style' ? 600 : 500, color: momSettingsActiveTab === 'Style' ? '#0f172a' : '#64748b', cursor: 'pointer' }}>Style</button>
            </div>

            {momSettingsActiveTab === 'Inputs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#0f172a' }}>Length</span>
                  <input type="number" value={tempMomSettings.length} onChange={(e) => setTempMomSettings({...tempMomSettings, length: parseInt(e.target.value) || 0})} style={{ width: 120, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#0f172a' }}>Source</span>
                  <select value={tempMomSettings.source} onChange={(e) => setTempMomSettings({...tempMomSettings, source: e.target.value})} style={{ width: 120, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value="close">close</option>
                    <option value="open">open</option>
                    <option value="high">high</option>
                    <option value="low">low</option>
                  </select>
                </div>
              </div>
            )}

            {momSettingsActiveTab === 'Style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" checked={tempMomSettings.momPlot} onChange={(e) => setTempMomSettings({...tempMomSettings, momPlot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, color: '#0f172a', width: 60 }}>Mom</span>
                  <input type="color" value={tempMomSettings.momColor} onChange={(e) => setTempMomSettings({...tempMomSettings, momColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }} />
                  <input type="number" min={1} max={10} value={tempMomSettings.momLineWidth} onChange={(e) => setTempMomSettings({...tempMomSettings, momLineWidth: parseInt(e.target.value) || 2})} title="Line Thickness" style={{ width: 60, padding: '6px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, outline: 'none' }} />
                  <select value={tempMomSettings.momLineStyle} onChange={(e) => setTempMomSettings({...tempMomSettings, momLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value={0}>Solid</option>
                    <option value={1}>Dotted</option>
                    <option value={2}>Dashed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" checked={tempMomSettings.zeroLine} onChange={(e) => setTempMomSettings({...tempMomSettings, zeroLine: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, color: '#0f172a', width: 60 }}>Zero</span>
                  <input type="color" value={tempMomSettings.zeroLineColor} onChange={(e) => setTempMomSettings({...tempMomSettings, zeroLineColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }} />
                  <select value={tempMomSettings.zeroLineStyle} onChange={(e) => setTempMomSettings({...tempMomSettings, zeroLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value={0}>Solid</option>
                    <option value={1}>Dotted</option>
                    <option value={2}>Dashed</option>
                  </select>
                  <input type="number" value={0} disabled style={{ width: 60, padding: '6px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#f8fafc', color: '#94a3b8' }} />
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 16, marginBottom: 8 }}>OUTPUTS</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#0f172a' }}>Precision</span>
                  <select value={tempMomSettings.precision} onChange={(e) => setTempMomSettings({...tempMomSettings, precision: parseInt(e.target.value)})} style={{ width: 120, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={tempMomSettings.labelsOnPriceScale} onChange={(e) => setTempMomSettings({...tempMomSettings, labelsOnPriceScale: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, color: '#0f172a' }}>Labels on price scale</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={tempMomSettings.valuesInStatusLine} onChange={(e) => setTempMomSettings({...tempMomSettings, valuesInStatusLine: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, color: '#0f172a' }}>Values in status line</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button onClick={() => setIsMomSettingsModalOpen(false)} style={{ padding: '8px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Cancel</button>
              <button onClick={() => { setMomSettings(tempMomSettings); pushToHistory({ momSettings: tempMomSettings }); setIsMomSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#fff' }}>Ok</button>
            </div>
          </div>
        </div>
      )}

      {/* Option Chain Modal (Centered) */}
      {isOptionChainOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ width: '80%', maxWidth: 900, height: '70%', maxHeight: 600, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', textTransform: 'uppercase' }}>
                  {(quote as any)?.companyName || selectedSymbol}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  {hoveredCandle ? hoveredCandle.close.toFixed(2) : ''}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: isPositive ? '#10B981' : '#EF4444' }}>
                  {isPositive ? '+' : ''}{candleChangePct.toFixed(2)}%
                </span>
              </div>
              <button onClick={() => setIsOptionChainOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: 20, color: '#0F172A', fontWeight: 500 }}>
                Futures & Options unavailable for this symbol.
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Trade Panel */}
      {isTradePanelOpen && (
        <ChartTradePanel 
          initialSide={tradePanelSide}
          onClose={() => setIsTradePanelOpen(false)}
          isInstantOrder={isInstantOrder}
        />
      )}
      
      </div>

      {/* Bottom Footer Toolbar */}
      <div style={{ height: 36, borderTop: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
        {/* Left Side: Timeframes, Go to, P&L, Exit All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {['5Y', '1Y', '6M', '3M', '1M', '5D', '1D'].map((tf) => (
              <button 
                key={tf} 
                onClick={() => handleBottomTfClick(tf)}
                style={{ 
                  background: 'none', border: 'none', fontSize: 13, 
                  fontWeight: activeBottomTf === tf ? 600 : 500, 
                  color: activeBottomTf === tf ? '#2563EB' : '#64748B', 
                  cursor: 'pointer', padding: '4px 6px', borderRadius: 4 
                }}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <button onClick={() => setIsGoToModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Go to">
            <Calendar size={16} />
          </button>
          
          <div style={{ fontSize: 13, fontWeight: 600, color: totalUnrealisedPnL >= 0 ? '#10B981' : '#EF4444', marginLeft: 8 }}>
            Total Positions P&L: {totalUnrealisedPnL >= 0 ? '+' : ''}{totalUnrealisedPnL.toFixed(2)}
          </div>
          
          <button 
            onClick={handleExitAll}
            disabled={!holdings || holdings.length === 0 || placeOrder.isPending}
            style={{ 
              background: (!holdings || holdings.length === 0) ? '#F1F5F9' : '#EF4444', 
              border: '1px solid',
              borderColor: (!holdings || holdings.length === 0) ? '#E2E8F0' : '#EF4444',
              borderRadius: 4, 
              padding: '4px 12px', 
              fontSize: 12, 
              fontWeight: 600, 
              color: (!holdings || holdings.length === 0) ? '#94A3B8' : '#FFFFFF', 
              cursor: (!holdings || holdings.length === 0) ? 'not-allowed' : 'pointer', 
              marginLeft: 16 
            }}>
            {placeOrder.isPending ? 'Exiting...' : 'Exit All'}
          </button>
        </div>
        
        {/* Right Side: Dashboard Tab & Panel Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <RealTimeClock style={{ fontSize: 13, color: '#475569', fontWeight: 500 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 4, padding: 2 }}>
            <div 
              onClick={() => setIsDashboardPanelOpen(!isDashboardPanelOpen)}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', borderRadius: 2, cursor: 'pointer' }}
            >
              Dashboard
            </div>
            <div 
              onClick={() => setIsTradePanelOpen(!isTradePanelOpen)}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, color: '#64748B', cursor: 'pointer', background: isTradePanelOpen ? '#EFF6FF' : 'transparent' }}
            >
              Trade
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => setIsDashboardPanelOpen(!isDashboardPanelOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title={isDashboardPanelOpen ? "Close Panel" : "Open Panel"}
            >
              {isDashboardPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button 
              onClick={() => {
                setIsDashboardPanelOpen(true);
                setIsDashboardMaximized(!isDashboardMaximized);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title={isDashboardMaximized ? "Restore Panel" : "Maximize Panel"}
            >
              {isDashboardMaximized ? <Minimize2 size={14} /> : <Square size={14} />}
            </button>
          </div>
        </div>
      </div>

      {isDashboardPanelOpen && (
        <ChartDashboardPanel 
          isMaximized={isDashboardMaximized}
          activeTab={activeDashboardTab}
          setActiveTab={setActiveDashboardTab}
          activeOrderTab={activeOrderTab}
          setActiveOrderTab={setActiveOrderTab}
          onToggleMaximize={() => setIsDashboardMaximized(!isDashboardMaximized)}
          onClose={() => setIsDashboardPanelOpen(false)}
        />
      )}

      <GoToModal 
        isOpen={isGoToModalOpen} 
        onClose={() => setIsGoToModalOpen(false)} 
        onGoToDate={handleGoToDate}
        onGoToRange={handleGoToRange}
      />

      {/* Trade Confirm Modals */}
      <Modal
        isOpen={confirmExitModal}
        onClose={() => setConfirmExitModal(false)}
        title="Close Position"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmExitModal(false)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={() => { 
                if (activeHolding) {
                  placeOrder.mutate({
                    symbol: activeHolding.symbol,
                    exchange: activeHolding.exchange,
                    companyName: activeHolding.companyName,
                    side: 'SELL',
                    orderType: 'MARKET',
                    quantity: activeHolding.quantity,
                  });
                }
                setConfirmExitModal(false); 
              }} 
              style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            >
              Confirm Exit
            </button>
          </div>
        }
      >
        <p style={{ fontSize: 14, color: '#475569' }}>Are you sure you want to close your position of {activeHolding?.quantity} shares of {selectedSymbol}?</p>
      </Modal>

      <Modal
        isOpen={confirmTPModal !== null}
        onClose={() => setConfirmTPModal(null)}
        title="Modify Take Profit"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmTPModal(null)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={() => { 
                if (confirmTPModal !== null) updateTP.mutate({ symbol: selectedSymbol, tp: confirmTPModal });
                setConfirmTPModal(null);
              }} 
              style={{ flex: 1, padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            >
              Confirm TP
            </button>
          </div>
        }
      >
        <p style={{ fontSize: 14, color: '#475569' }}>Are you sure you want to set your Take Profit to ₹{confirmTPModal?.toFixed(2)}?</p>
      </Modal>

      <Modal
        isOpen={confirmSLModal !== null}
        onClose={() => setConfirmSLModal(null)}
        title="Modify Stop Loss"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmSLModal(null)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={() => { 
                if (confirmSLModal !== null) updateSL.mutate({ symbol: selectedSymbol, sl: confirmSLModal });
                setConfirmSLModal(null);
              }} 
              style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            >
              Confirm SL
            </button>
          </div>
        }
      >
        <p style={{ fontSize: 14, color: '#475569' }}>Are you sure you want to set your Stop Loss to ₹{confirmSLModal?.toFixed(2)}?</p>
      </Modal>

      <Modal
        isOpen={removeTPModal}
        onClose={() => setRemoveTPModal(false)}
        title="Remove Take Profit"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setRemoveTPModal(false)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={() => { 
                updateTP.mutate({ symbol: selectedSymbol, tp: undefined });
                setRemoveTPModal(false);
              }} 
              style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            >
              Remove TP
            </button>
          </div>
        }
      >
        <p style={{ fontSize: 14, color: '#475569' }}>Are you sure you want to remove the Take Profit order for {selectedSymbol}?</p>
      </Modal>

      <Modal
        isOpen={removeSLModal}
        onClose={() => setRemoveSLModal(false)}
        title="Remove Stop Loss"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setRemoveSLModal(false)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={() => { 
                updateSL.mutate({ symbol: selectedSymbol, sl: undefined });
                setRemoveSLModal(false);
              }} 
              style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            >
              Remove SL
            </button>
          </div>
        }
      >
        <p style={{ fontSize: 14, color: '#475569' }}>Are you sure you want to remove the Stop Loss order for {selectedSymbol}?</p>
      </Modal>

    </div>
  </div>
);
}
