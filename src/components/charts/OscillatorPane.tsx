import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, HistogramSeries, BaselineSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { RSICalculator } from '../../utils/rsiCalculator';
import { MacdCalculator } from '../../utils/macdCalculator';
import { ATRCalculator } from '../../utils/atrCalculator';
import { MomCalculator } from '../../utils/momCalculator';

class BandPrimitive {
  series: any = null;
  options: any;
  _paneViews: any[];

  constructor(options: { top: number, bottom: number, color: string }) {
    this.options = options;
    this._paneViews = [{
      update: () => {},
      renderer: () => ({
        draw: (target: any) => {
          target.useMediaCoordinateSpace((scope: any) => {
            if (!this.series) return;
            const topY = this.series.priceToCoordinate(this.options.top);
            const bottomY = this.series.priceToCoordinate(this.options.bottom);
            if (topY === null || bottomY === null) return;
            const ctx = scope.context;
            ctx.fillStyle = this.options.color;
            ctx.fillRect(0, Math.min(topY, bottomY), scope.mediaSize.width, Math.abs(bottomY - topY));
          });
        }
      }),
      zOrder: () => 'normal',
    }];
  }

  attached(param: any) {
    this.series = param.series;
    param.requestUpdate();
  }

  detached() {
    this.series = null;
  }

  paneViews() {
    return this._paneViews;
  }
  
  updateAllViews() {}
}

interface OscillatorPaneProps {
  id: string;
  type: string;
  data: any[]; // The candle data
  settings: any;
  mainChart: IChartApi | null;
  flexStyle?: React.CSSProperties;
  isMinimized?: boolean;
  onValueChange?: (value: number | undefined) => void;
  children?: React.ReactNode;
  isBottomPane?: boolean;
}

export const OscillatorPane: React.FC<OscillatorPaneProps> = ({ id, type, data, settings, mainChart, flexStyle, isMinimized, onValueChange, children, isBottomPane = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !mainChart) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#FFFFFF' }, textColor: '#475569' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { mode: 0 },
      timeScale: { visible: false, timeVisible: true, rightOffset: 12, borderColor: '#E2E8F0' }, // Dynamically show/hide time scale
      rightPriceScale: { borderColor: '#E2E8F0', scaleMargins: { top: 0.15, bottom: 0.15 } },
    });
    chartRef.current = chart;

    // Sync logical range
    const timeScale = chart.timeScale();
    const mainTimeScale = mainChart.timeScale();
    
    let isInitializing = true;
    setTimeout(() => { isInitializing = false; }, 100);

    const syncMainToOsc = () => {
      const range = mainTimeScale.getVisibleLogicalRange();
      if (range) timeScale.setVisibleLogicalRange(range);
    };
    const syncOscToMain = () => {
      if (isInitializing) return;
      const range = timeScale.getVisibleLogicalRange();
      if (range) mainTimeScale.setVisibleLogicalRange(range);
    };

    // Aggressively hide TV watermark row for oscillators
    const hideWatermark = () => {
      if (!containerRef.current) return;
      const logo = containerRef.current.querySelector('#tv-attr-logo');
      if (logo) (logo as HTMLElement).style.display = 'none';
      const rows = containerRef.current.querySelectorAll('table tr');
      if (rows.length > 1) {
        // The second row contains the watermark if timeScale is hidden, or the timeScale if visible.
        (rows[1] as HTMLElement).style.display = isBottomPane ? '' : 'none';
      }
    };
    setTimeout(hideWatermark, 0);
    setTimeout(hideWatermark, 50);
    setTimeout(hideWatermark, 500);

    let activeSeries: any = null;

    // Sync crosshair
    const handleMainCrosshair = (param: any) => {
      let val: number | undefined;
      if (param.time !== undefined) {
        val = timeToValue.get(param.time as number);
      }
      if (param.time && activeSeries && val !== undefined) {
        chart.setCrosshairPosition(val, param.time, activeSeries);
      }
      if (onValueChange) {
        if (val !== undefined) {
          onValueChange(val);
        } else {
          onValueChange(lastValue);
        }
      }
    };
    mainChart.subscribeCrosshairMove(handleMainCrosshair);

    const timeToValue = new Map<number, number>();
    let lastValue: number | undefined;

    // Draw the indicator
    if (type === 'RSI') {
      const rsiCalc = new RSICalculator(settings.length, settings.smoothingLine);
      const closes = data.map(d => d.close);
      const rsiValues = rsiCalc.calculate(closes);
      const rsiData = data.map((c, i) => {
        const val = rsiValues[i] !== undefined ? rsiValues[i] : 50;
        if (rsiValues[i] !== undefined) {
          timeToValue.set(c.time as number, rsiValues[i]);
          lastValue = rsiValues[i];
        }
        return { time: c.time, value: val };
      });
      
      const series = chart.addSeries(LineSeries, {
        color: settings.plotColor,
        lineWidth: settings.plotLineWidth,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      activeSeries = series;
      series.setData(rsiData);
      
      if (settings.hlinesBackground) {
        const bgFillColor = settings.hlinesBackgroundColor || 'rgba(88, 28, 135, 0.15)';
        const band = new BandPrimitive({
          top: settings.upperLimitValue,
          bottom: settings.lowerLimitValue,
          color: bgFillColor
        });
        series.attachPrimitive(band as any);
      }
      
      if (settings.smoothedMA) {
        const maCalc = new RSICalculator(settings.smoothingLength, settings.smoothingLine);
        const validRsi = rsiValues.filter(v => v !== undefined) as number[];
        const maValues = maCalc.smooth(validRsi, settings.smoothingLength);
        let maDataIndex = 0;
        const maData = rsiData.map((d, i) => {
          if (i < settings.smoothingLength - 1) return { time: d.time };
          return { time: d.time, value: maValues[maDataIndex++] };
        });
        
        const maSeries = chart.addSeries(LineSeries, {
          color: settings.smoothedMAColor,
          lineWidth: 2,
          crosshairMarkerVisible: false,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        maSeries.setData(maData as any);
      }
      
      if (settings.upperLimit) {
        series.createPriceLine({ price: settings.upperLimitValue, color: settings.upperLimitColor, lineWidth: 1, lineStyle: settings.upperLimitLineStyle });
      }
      if (settings.lowerLimit) {
        series.createPriceLine({ price: settings.lowerLimitValue, color: settings.lowerLimitColor, lineWidth: 1, lineStyle: settings.lowerLimitLineStyle });
      }
    } else if (type === 'MACD') {
      const macdCalc = new MacdCalculator(settings.fastLength, settings.slowLength, settings.signalLength);
      const macdValues = macdCalc.calculate(data);
      
      const macdData = data.map((c, i) => {
        if (macdValues[i]?.macd !== undefined) {
          timeToValue.set(c.time as number, macdValues[i]!.macd!);
          lastValue = macdValues[i]!.macd!;
          return { time: c.time, value: macdValues[i]!.macd! };
        }
        return { time: c.time };
      });
      const signalData = data.map((c, i) => {
        if (macdValues[i]?.signal !== undefined) {
          return { time: c.time, value: macdValues[i]!.signal! };
        }
        return { time: c.time };
      });
      const histData = data.map((c, i) => {
        const hist = macdValues[i]?.histogram;
        if (hist !== undefined) {
          return { time: c.time, value: hist, color: hist >= 0 ? '#26A69A' : '#EF5350' };
        }
        return { time: c.time };
      });

      const histSeries = chart.addSeries(HistogramSeries, { color: '#26A69A', priceLineVisible: false, lastValueVisible: false });
      histSeries.setData(histData as any);
      activeSeries = histSeries;
      
      const macdSeries = chart.addSeries(LineSeries, { color: settings.macdColor, lineWidth: 2, priceLineVisible: true, lastValueVisible: true });
      macdSeries.setData(macdData as any);
      
      const signalSeries = chart.addSeries(LineSeries, { color: settings.signalColor, lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      signalSeries.setData(signalData as any);
      
    } else if (type === 'ATR') {
      const atrCalc = new ATRCalculator(settings.length, settings.smoothingLine);
      const atrValues = atrCalc.calculate(data);
      const atrData = data.map((c, i) => {
        if (atrValues[i] !== undefined) {
          timeToValue.set(c.time as number, atrValues[i] as number);
          lastValue = atrValues[i] as number;
          return { time: c.time, value: atrValues[i] as number };
        }
        return { time: c.time };
      });
      
      const series = chart.addSeries(LineSeries, { color: settings.plotColor, lineWidth: settings.plotLineWidth, priceLineVisible: true, lastValueVisible: true });
      activeSeries = series;
      series.setData(atrData as any);
    } else if (type === 'MOMENTUM') {
      const sourceData = data.map(d => d[settings.source || 'close']);
      const momCalc = new MomCalculator(settings.length);
      const momValues = momCalc.calculate(sourceData);
      
      const momData = data.map((c, i) => {
        if (momValues[i] !== undefined) {
          timeToValue.set(c.time as number, momValues[i] as number);
          lastValue = momValues[i] as number;
          return { time: c.time, value: momValues[i] as number };
        }
        return { time: c.time };
      });

      if (settings.momPlot) {
        const series = chart.addSeries(LineSeries, {
          color: settings.momColor,
          lineWidth: settings.momLineWidth,
          lineStyle: settings.momLineStyle || 0,
          priceLineVisible: settings.labelsOnPriceScale,
          lastValueVisible: settings.labelsOnPriceScale,
          priceFormat: {
            type: 'price',
            precision: settings.precision,
            minMove: 1 / Math.pow(10, settings.precision),
          },
        });
        activeSeries = series;
        series.setData(momData as any);

        if (settings.zeroLine) {
          series.createPriceLine({
            price: 0,
            color: settings.zeroLineColor,
            lineWidth: settings.zeroLineWidth,
            lineStyle: settings.zeroLineStyle || 2,
          });
        }
      }
    }

    if (onValueChange && lastValue !== undefined) {
      onValueChange(lastValue);
    }

    // Immediately sync the logical range after data is loaded so the new chart matches the main chart's current zoom/scroll
    syncMainToOsc();

    // Now it is safe to subscribe, so initialization doesn't reset the main chart
    mainTimeScale.subscribeVisibleLogicalRangeChange(syncMainToOsc);
    timeScale.subscribeVisibleLogicalRangeChange(syncOscToMain);

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== containerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      mainTimeScale.unsubscribeVisibleLogicalRangeChange(syncMainToOsc);
      timeScale.unsubscribeVisibleLogicalRangeChange(syncOscToMain);
      mainChart.unsubscribeCrosshairMove(handleMainCrosshair);
      chart.remove();
    };
  }, [id, type, data, settings, mainChart]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({ visible: false });
      // Update watermarks visibility
      if (containerRef.current) {
        const rows = containerRef.current.querySelectorAll('table tr');
        if (rows.length > 1) {
          (rows[1] as HTMLElement).style.display = isBottomPane ? '' : 'none';
        }
      }
    }
  }, [isBottomPane]);

  return (
    <div className="oscillator-pane" style={{ position: 'relative', width: '100%', borderTop: '1px solid #E2E8F0', overflow: 'hidden', ...flexStyle }}>
      {children}
      <div style={{ width: '100%', height: '100%', visibility: isMinimized ? 'hidden' : 'visible', display: isMinimized ? 'none' : 'block' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
