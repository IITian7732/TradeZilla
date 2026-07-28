// src/utils/formatters.ts
// All display formatting for financial data.
// formatINR must use en-IN locale — ₹1,23,456.78 not ₹123,456.78

/**
 * Format a number as Indian Rupee (en-IN locale).
 * e.g. 123456.78 → "₹1,23,456.78"
 */
export function formatINR(value: number | undefined | null, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '₹—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage with sign and arrow glyph.
 * Always pairs color with a ▲/▼ glyph — never color alone.
 * e.g. 2.34 → "+2.34% ▲", -1.5 → "-1.50% ▼", 0 → "0.00% —"
 */
export function formatPct(value: number | undefined | null, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '—%';
  const abs = Math.abs(value).toFixed(decimals);
  if (value > 0) return `+${abs}% ▲`;
  if (value < 0) return `-${abs}% ▼`;
  return `${abs}% —`;
}

/**
 * Format a number with sign for P&L display.
 * e.g. 1234.5 → "+₹1,234.50", -500 → "-₹500.00"
 */
export function formatPnL(value: number | undefined | null): string {
  if (value === null || value === undefined || isNaN(value)) return '₹—';
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format volume (e.g. 1234567 → "12.35L", 12345678 → "1.23Cr")
 */
export function formatVolume(value: number | undefined | null): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toString();
}

/**
 * Format a date/timestamp in IST.
 * Always convert from UTC to IST at render time.
 */
export function formatDate(isoString: string | undefined | null, options?: Intl.DateTimeFormatOptions): string {
  if (!isoString) return '—';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  return new Intl.DateTimeFormat('en-IN', options ?? defaultOptions).format(new Date(isoString));
}

/**
 * Format date only (no time).
 */
export function formatDateOnly(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString));
}

/**
 * Format time only in IST.
 */
export function formatTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

/**
 * Format a large INR number compactly for display.
 * e.g. 1500000 → "₹15L"
 */
export function formatINRCompact(value: number | undefined | null): string {
  if (value === null || value === undefined || isNaN(value)) return '₹—';
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
  return formatINR(value);
}

/**
 * Relative time (e.g. "2 minutes ago", "just now").
 */
export function formatRelativeTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatDateOnly(isoString);
}
