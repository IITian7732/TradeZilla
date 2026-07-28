import React, { useState, useEffect } from 'react';

export const RealTimeClock: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} (UTC+5:30)`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      fontSize: 13,
      fontWeight: 500,
      color: '#334155',
      fontFamily: 'monospace',
      ...style
    }}>
      {timeStr}
    </div>
  );
};
