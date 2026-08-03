import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, type IChartApi } from 'lightweight-charts';

interface TimeAxisPaneProps {
  mainChart: IChartApi | null;
  data: any[];
}

export const TimeAxisPane: React.FC<TimeAxisPaneProps> = ({ mainChart, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const isSyncingRef = useRef(false);

  // Create chart once when mainChart is available
  useEffect(() => {
    if (!containerRef.current || !mainChart) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#FFFFFF' }, textColor: '#475569' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { mode: 1 },
      timeScale: {
        visible: true,
        timeVisible: true,
        rightOffset: 12,
        borderColor: '#E2E8F0',
      },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      // Enable horizontal scrolling and axis scaling for time axis interactions
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: false,
        pinch: false,
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
      },
    });

    chartRef.current = chart;

    const series = chart.addSeries(LineSeries, {
      visible: true,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      color: 'transparent',
    });
    seriesRef.current = series;

    const timeScale = chart.timeScale();
    const mainTimeScale = mainChart.timeScale();

    // Sync visible range: main → time axis (two-way sync)
    const syncMainToTime = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      const range = mainTimeScale.getVisibleLogicalRange();
      if (range) timeScale.setVisibleLogicalRange(range);
      isSyncingRef.current = false;
    };

    // Sync visible range: time axis → main (two-way sync)
    const syncTimeToMain = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      const range = timeScale.getVisibleLogicalRange();
      if (range) mainTimeScale.setVisibleLogicalRange(range);
      isSyncingRef.current = false;
    };

    // Sync crosshair from main chart
    const handleMainCrosshair = (param: any) => {
      if (!seriesRef.current) return;
      if (param.time !== undefined) {
        chart.setCrosshairPosition(0, param.time, seriesRef.current);
      } else {
        chart.clearCrosshairPosition();
      }
    };

    mainChart.subscribeCrosshairMove(handleMainCrosshair);
    mainTimeScale.subscribeVisibleLogicalRangeChange(syncMainToTime);
    timeScale.subscribeVisibleLogicalRangeChange(syncTimeToMain);

    // Resize observer to keep chart size in sync with container
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries[0] || entries[0].target !== containerRef.current) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      // Re-sync range after resize
      syncMainToTime();
    });
    resizeObserver.observe(containerRef.current);

    // Initial sync
    syncMainToTime();

    return () => {
      resizeObserver.disconnect();
      mainTimeScale.unsubscribeVisibleLogicalRangeChange(syncMainToTime);
      timeScale.unsubscribeVisibleLogicalRangeChange(syncTimeToMain);
      mainChart.unsubscribeCrosshairMove(handleMainCrosshair);
      try { chart.remove(); } catch (_) {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [mainChart]); // Only recreate when mainChart instance changes

  // Update series data separately without recreating the chart
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;
    seriesRef.current.setData(data.map((d: any) => ({ time: d.time, value: 0 })));

    // Re-sync range after data update
    if (chartRef.current && mainChart) {
      const range = mainChart.timeScale().getVisibleLogicalRange();
      if (range) chartRef.current.timeScale().setVisibleLogicalRange(range);
    }
  }, [data, mainChart]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '32px',
        flexShrink: 0,
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        overflow: 'hidden',
      }}
    />
  );
};
