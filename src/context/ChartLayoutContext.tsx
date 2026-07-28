import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SyncConfig = {
  symbol: boolean;
  interval: boolean;
  crosshair: boolean;
  time: boolean;
  dateRange: boolean;
};

export type ChartPaneConfig = {
  id: string;
  symbol: string;
  interval: string;
  // Local state for indicators and drawings can be stored here or inside ChartPane
};

interface ChartLayoutContextType {
  activeLayout: string;
  setActiveLayout: (layout: string) => void;
  syncConfig: SyncConfig;
  setSyncConfig: (config: SyncConfig | ((prev: SyncConfig) => SyncConfig)) => void;
  chartPanes: ChartPaneConfig[];
  setChartPanes: React.Dispatch<React.SetStateAction<ChartPaneConfig[]>>;
  activePaneId: string;
  setActivePaneId: (id: string) => void;
  updatePane: (id: string, updates: Partial<ChartPaneConfig>) => void;
  syncCrosshair: (sourcePaneId: string, param: any) => void;
  syncedCrosshairParam: any;
  syncTimeRange: (sourcePaneId: string, range: any) => void;
  syncedTimeRange: any;
}

const ChartLayoutContext = createContext<ChartLayoutContextType | undefined>(undefined);

export const ChartLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [activeLayout, setActiveLayout] = useState('1');
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    symbol: false,
    interval: false,
    crosshair: false,
    time: true,
    dateRange: false,
  });

  const [chartPanes, setChartPanes] = useState<ChartPaneConfig[]>([
    { id: 'pane-1', symbol: 'NSE:RELIANCE', interval: '15m' },
    { id: 'pane-2', symbol: 'NSE:RELIANCE', interval: '15m' },
    { id: 'pane-3', symbol: 'NSE:RELIANCE', interval: '15m' },
  ]);

  const [activePaneId, setActivePaneId] = useState('pane-1');
  
  // Real-time synchronization state
  const [syncedCrosshairParam, setSyncedCrosshairParam] = useState<any>(null);
  const [syncedTimeRange, setSyncedTimeRange] = useState<any>(null);

  const updatePane = (id: string, updates: Partial<ChartPaneConfig>) => {
    setChartPanes(prev => {
      // If symbol or interval sync is ON, apply to all active panes instead
      const newPanes = [...prev];
      const targetIdx = newPanes.findIndex(p => p.id === id);
      if (targetIdx === -1) return prev;
      
      const updatedPane = { ...newPanes[targetIdx], ...updates };
      newPanes[targetIdx] = updatedPane;

      if (updates.symbol && syncConfig.symbol) {
        newPanes.forEach(p => p.symbol = updates.symbol as string);
      }
      if (updates.interval && syncConfig.interval) {
        newPanes.forEach(p => p.interval = updates.interval as string);
      }

      return newPanes;
    });
  };

  const syncCrosshair = (sourcePaneId: string, param: any) => {
    if (syncConfig.crosshair || syncConfig.time) {
      setSyncedCrosshairParam({ sourcePaneId, param });
    }
  };

  const syncTimeRange = (sourcePaneId: string, range: any) => {
    if (syncConfig.dateRange) {
      setSyncedTimeRange({ sourcePaneId, range });
    }
  };

  return (
    <ChartLayoutContext.Provider value={{
      activeLayout, setActiveLayout,
      syncConfig, setSyncConfig,
      chartPanes, setChartPanes,
      activePaneId, setActivePaneId,
      updatePane,
      syncCrosshair, syncedCrosshairParam,
      syncTimeRange, syncedTimeRange
    }}>
      {children}
    </ChartLayoutContext.Provider>
  );
};

export const useChartLayout = () => {
  const context = useContext(ChartLayoutContext);
  if (!context) {
    throw new Error("useChartLayout must be used within a ChartLayoutProvider");
  }
  return context;
};
