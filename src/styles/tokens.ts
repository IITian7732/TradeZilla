// src/styles/tokens.ts
// Design tokens — SINGLE source of truth for all colors and fonts.
// Every component references these tokens. Never use raw hex in className strings.

export const colors = {
  // Backgrounds (layered depth)
  bgPrimary: '#F4F6F9',   // App background
  bgSurface: '#FFFFFF',   // Card / panel background
  bgElevated: '#F8FAFC',  // Hover state, modals, dropdowns
  border: '#E2E8F0',      // Dividers, card borders

  // Brand
  brandPrimary: '#0E7490',      // Primary actions, active nav/tab, links
  brandPrimaryHover: '#0891B2',
  brandAccent: '#F59E0B',       // Reserved ONLY for premium/achievement/trophy

  // Semantic — SINGLE canonical set. Gains/losses/status always resolve to exactly these.
  positive: '#10B981',              // Gains, BUY, success states
  positiveMuted: 'rgba(16, 185, 129,0.12)',
  negative: '#EF4444',              // Losses, SELL, error states
  negativeMuted: 'rgba(239, 68, 68,0.12)',
  neutral: '#94A3B8',               // Flat / 0.00% / unknown-but-not-an-error
  warning: '#F59E0B',

  // Text
  textPrimary: '#0B0F19',
  textSecondary: '#475569',
  textMuted: '#64748B',
} as const;

export const fonts = {
  display: '"Inter", "Roboto", sans-serif',     // Headings
  body: '"system-ui", "Segoe UI", sans-serif',  // Body text
  mono: '"JetBrains Mono", "Fira Code", monospace', // ALL numbers
} as const;

export type ColorToken = keyof typeof colors;
export type FontToken = keyof typeof fonts;
