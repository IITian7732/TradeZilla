import React from 'react';
import { useAdvancedStats } from '../hooks/useTradingStats';
import { FullPageSpinner } from '../components/ui/Spinner';
import { AdvancedStatsView } from '../components/ui/AdvancedStatsView';

export default function Statistics() {
  const { data: stats, isLoading, error } = useAdvancedStats();

  if (isLoading) return <FullPageSpinner />;
  if (error || !stats) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ color: '#EF4444' }}>Failed to load statistics.</p>
      </div>
    );
  }



  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 className="section-title">Advanced Statistics</h1>
      
      <AdvancedStatsView stats={stats} />
    </div>
  );
}
