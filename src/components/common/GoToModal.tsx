import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface GoToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDate: (date: Date) => void;
  onGoToRange: (from: Date, to: Date) => void;
}

type ViewMode = 'days' | 'months' | 'years';

export const GoToModal: React.FC<GoToModalProps> = ({ isOpen, onClose, onGoToDate, onGoToRange }) => {
  const [tab, setTab] = useState<'Date' | 'Custom range'>('Date');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState<string>('09:15');
  
  const [rangeFrom, setRangeFrom] = useState<string>(new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]);
  const [rangeFromTime, setRangeFromTime] = useState<string>('09:15');
  const [rangeTo, setRangeTo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeToTime, setRangeToTime] = useState<string>('15:30');

  // Calendar state
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('days');

  if (!isOpen) return null;

  const handleGoTo = () => {
    if (tab === 'Date') {
      const targetDate = new Date(`${dateStr}T${timeStr}:00`);
      onGoToDate(targetDate);
    } else {
      const from = new Date(`${rangeFrom}T${rangeFromTime}:00`);
      const to = new Date(`${rangeTo}T${rangeToTime}:00`);
      onGoToRange(from, to);
    }
    onClose();
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Adjust first day to start on Monday (1) instead of Sunday (0) like TradingView
    let startDayOffset = firstDay - 1;
    if (startDayOffset < 0) startDayOffset = 6;

    const days = [];
    for (let i = 0; i < startDayOffset; i++) {
      days.push(<div key={`empty-${i}`} style={{ width: 32, height: 32 }} />);
    }

    const selectedDateObj = new Date(dateStr);
    const isSelectedMonth = selectedDateObj.getFullYear() === year && selectedDateObj.getMonth() === month;

    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = isSelectedMonth && selectedDateObj.getDate() === i;
      days.push(
        <button
          key={`day-${i}`}
          onClick={() => {
            setDateStr(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
          }}
          style={{
            width: 32, height: 32,
            border: 'none', background: isSelected ? '#2563eb' : 'transparent',
            color: isSelected ? '#fff' : '#0f172a',
            borderRadius: 4, cursor: 'pointer',
            fontSize: 13, fontWeight: isSelected ? 600 : 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div style={{ padding: '0 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
            <div key={d} style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {days}
        </div>
      </div>
    );
  };

  const renderMonths = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {months.map((m, i) => (
          <button
            key={m}
            onClick={() => {
              const newD = new Date(viewDate);
              newD.setMonth(i);
              setViewDate(newD);
              setViewMode('days');
            }}
            style={{
              padding: '8px', border: 'none', background: viewDate.getMonth() === i ? '#f1f5f9' : 'transparent',
              borderRadius: 4, cursor: 'pointer', color: viewDate.getMonth() === i ? '#2563eb' : '#0f172a',
              fontSize: 14, fontWeight: viewDate.getMonth() === i ? 500 : 400
            }}
          >
            {m}
          </button>
        ))}
      </div>
    );
  };

  const renderYears = () => {
    const currentYear = viewDate.getFullYear();
    const startYear = Math.floor(currentYear / 20) * 20;
    const years = Array.from({ length: 20 }, (_, i) => startYear + i);
    
    return (
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {years.map(y => (
          <button
            key={y}
            onClick={() => {
              const newD = new Date(viewDate);
              newD.setFullYear(y);
              setViewDate(newD);
              setViewMode('months');
            }}
            style={{
              padding: '8px', border: 'none', background: currentYear === y ? '#f1f5f9' : 'transparent',
              borderRadius: 4, cursor: 'pointer', color: currentYear === y ? '#2563eb' : '#0f172a',
              fontSize: 14, fontWeight: currentYear === y ? 600 : 400
            }}
          >
            {y}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 100 }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', width: 340, background: '#fff', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 16px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Go to</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '16px 16px 8px 16px', display: 'flex', gap: 16, borderBottom: '1px solid #e2e8f0' }}>
          <button onClick={() => setTab('Date')} style={{ background: 'none', border: 'none', padding: '0 0 8px 0', fontSize: 14, fontWeight: tab === 'Date' ? 600 : 500, color: tab === 'Date' ? '#0f172a' : '#64748b', borderBottom: tab === 'Date' ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer' }}>Date</button>
          <button onClick={() => setTab('Custom range')} style={{ background: 'none', border: 'none', padding: '0 0 8px 0', fontSize: 14, fontWeight: tab === 'Custom range' ? 600 : 500, color: tab === 'Custom range' ? '#0f172a' : '#64748b', borderBottom: tab === 'Custom range' ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer' }}>Custom range</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px' }}>
          {tab === 'Date' ? (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #2563eb', borderRadius: 4, padding: '6px 12px' }}>
                <input type="text" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }} />
                <CalendarIcon size={16} color="#94a3b8" />
              </div>
              <div style={{ width: 100, position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 12px' }}>
                <input type="text" value={timeStr} onChange={e => setTimeStr(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }} />
                <Clock size={16} color="#94a3b8" />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 12px' }}>
                  <input type="text" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }} />
                  <CalendarIcon size={16} color="#94a3b8" />
                </div>
                <div style={{ width: 100, position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 12px' }}>
                  <input type="text" value={rangeFromTime} onChange={e => setRangeFromTime(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }} />
                  <Clock size={16} color="#94a3b8" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #2563eb', borderRadius: 4, padding: '6px 12px' }}>
                  <input type="text" value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }} />
                  <CalendarIcon size={16} color="#94a3b8" />
                </div>
                <div style={{ width: 100, position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 12px' }}>
                  <input type="text" value={rangeToTime} onChange={e => setRangeToTime(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }} />
                  <Clock size={16} color="#94a3b8" />
                </div>
              </div>
            </div>
          )}

          {/* Calendar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 8px' }}>
            <button
              onClick={() => {
                const newD = new Date(viewDate);
                if (viewMode === 'days') newD.setMonth(newD.getMonth() - 1);
                else if (viewMode === 'months') newD.setFullYear(newD.getFullYear() - 1);
                else newD.setFullYear(newD.getFullYear() - 20);
                setViewDate(newD);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                if (viewMode === 'days') setViewMode('months');
                else if (viewMode === 'months') setViewMode('years');
              }}
              style={{ background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#0f172a', padding: '4px 12px', border: '1px solid transparent', borderRadius: 4, _hover: { border: '1px solid #e2e8f0' } } as any}
            >
              {viewMode === 'days' && viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              {viewMode === 'months' && viewDate.getFullYear()}
              {viewMode === 'years' && `${Math.floor(viewDate.getFullYear() / 20) * 20} - ${Math.floor(viewDate.getFullYear() / 20) * 20 + 19}`}
            </button>
            <button
              onClick={() => {
                const newD = new Date(viewDate);
                if (viewMode === 'days') newD.setMonth(newD.getMonth() + 1);
                else if (viewMode === 'months') newD.setFullYear(newD.getFullYear() + 1);
                else newD.setFullYear(newD.getFullYear() + 20);
                setViewDate(newD);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ height: 220 }}>
            {viewMode === 'days' && renderDays()}
            {viewMode === 'months' && renderMonths()}
            {viewMode === 'years' && renderYears()}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={{ padding: '6px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 4, color: '#2563eb', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleGoTo} style={{ padding: '6px 16px', border: 'none', background: '#2563eb', borderRadius: 4, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Go to</button>
        </div>
      </div>
    </div>
  );
};
