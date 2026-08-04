// src/styles/tokens.ts
// Design tokens — SINGLE source of truth for all colors and fonts.
// Every component references these tokens. Never use raw hex in className strings.

export const colors = {
  // Backgrounds (layered depth — dark teal theme)
  bgPrimary: '#0D1117',   // App background — deep charcoal
  bgSurface: '#161B22',   // Card / panel background
  bgElevated: '#1E2530',  // Modals, dropdowns, tooltips
  bgOverlay: '#252D3A',   // Hover states, selected rows
  border: '#1E2A38',      // Subtle borders
  borderBright: '#2D3F52',// Active/focused borders

  // Brand — Teal (#00C2A8) — uniquely TradeZilla, unclaimed by any Indian competitor
  brandPrimary: '#00C2A8',
  brandPrimaryHover: '#00A896',
  brandAccent: '#F0B429',       // Reserved ONLY for premium/achievement/trophy (gold)
  brandGlow: 'rgba(0,194,168,0.15)', // Teal glow for highlights

  // Semantic — SINGLE canonical set. Gains/losses/status always resolve to exactly these.
  positive: '#26A65B',              // Gains, BUY, success states — mature green
  positiveMuted: 'rgba(38,166,91,0.12)',
  negative: '#E84040',              // Losses, SELL, error states — warm red
  negativeMuted: 'rgba(232,64,64,0.12)',
  neutral: '#8B95A2',               // Flat / 0.00% / unknown-but-not-an-error
  warning: '#F0B429',

  // Text
  textPrimary: '#E8EDF3',
  textSecondary: '#8B95A2',
  textMuted: '#4A5568',
} as const;

export const fonts = {
  display: '"Inter", "Roboto", sans-serif',     // Headings
  body: '"system-ui", "Segoe UI", sans-serif',  // Body text
  mono: '"JetBrains Mono", "Fira Code", monospace', // ALL numbers
} as const;

export type ColorToken = keyof typeof colors;
export type FontToken = keyof typeof fonts;
