import React from 'react';
import type { AdvancedStats } from '../../utils/calculations';
import { formatINR } from '../../utils/formatters';

interface AdvancedStatsViewProps {
  stats: AdvancedStats;
}

export function AdvancedStatsView({ stats }: AdvancedStatsViewProps) {
  const renderStat = (label: string, value: React.ReactNode, valueColor: string = '#0B0F19') => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderBottom: '1px solid #E2E8F0',
    }}>
      <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{label}</span>
      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: valueColor }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* General Stats */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: 13, color: '#0B0F19' }}>
          GENERAL
        </div>
        {renderStat('Total No. of Trades', stats.totalTrades)}
        {renderStat('Net P&L', formatINR(stats.netPnl), stats.netPnl > 0 ? '#10B981' : stats.netPnl < 0 ? '#EF4444' : '#0B0F19')}
        {renderStat('Gross Profit', formatINR(stats.grossProfit), '#10B981')}
        {renderStat('Gross Loss', formatINR(stats.grossLoss), '#EF4444')}
        {renderStat('Success Rate', `${stats.successRate.toFixed(1)}%`)}
      </section>

      {/* Averages & Extremes */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: 13, color: '#0B0F19' }}>
          PERFORMANCE
        </div>
        {renderStat('Biggest Profit', formatINR(stats.biggestProfit), '#10B981')}
        {renderStat('Biggest Loss', formatINR(stats.biggestLoss), '#EF4444')}
        {renderStat('Consecutive Wins', stats.consecutiveWins, '#10B981')}
        {renderStat('Consecutive Losses', stats.consecutiveLosses, '#EF4444')}
      </section>

      {/* Long/Short Analysis */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: 13, color: '#0B0F19' }}>
          LONG / SHORT
        </div>
        {renderStat('Long (Win %)', `${stats.longWinPct.toFixed(1)}%`)}
        {renderStat('Short (Win %)', `${stats.shortWinPct.toFixed(1)}%`)}
        {renderStat('Avg Long Profit', formatINR(stats.avgLongProfit), '#10B981')}
        {renderStat('Avg Long Loss', formatINR(stats.avgLongLoss), '#EF4444')}
        {renderStat('Avg Short Profit', formatINR(stats.avgShortProfit), '#10B981')}
        {renderStat('Avg Short Loss', formatINR(stats.avgShortLoss), '#EF4444')}
      </section>
    </div>
  );
}
