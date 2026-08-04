// src/utils/constants.ts
// Single source of truth for CTA copy and app-wide constants.
// Any string that appears on more than one screen must live here.

// CTA Strings — never retype these inline
export const CTA = {
  EXPLORE_STOCKS: 'Explore Stocks',
  BUY: 'Buy',
  SELL: 'Sell',
  PLACE_ORDER: 'Place Order',
  ADD_TO_WATCHLIST: 'Add to Watchlist',
  REMOVE_FROM_WATCHLIST: 'Remove from Watchlist',
  SET_ALERT: 'Set Alert',
  VIEW_PORTFOLIO: 'View Portfolio',
  VIEW_ORDERS: 'View Orders',
  START_TRADING: 'Start Trading',
  UPGRADE_TO_PREMIUM: 'Upgrade to Premium',
  SIGN_IN: 'Sign In',
  SIGN_UP: 'Create Account',
  SIGN_OUT: 'Sign Out',
  RESET_PORTFOLIO: 'Reset Portfolio',
  CONFIRM: 'Confirm',
  CANCEL: 'Cancel',
} as const;

// Market hours (IST = UTC+5:30)
export const MARKET_HOURS = {
  OPEN_HOUR_IST: 9,
  OPEN_MINUTE_IST: 15,
  CLOSE_HOUR_IST: 15,
  CLOSE_MINUTE_IST: 30,
  // Market is open Mon–Fri
  OPEN_DAYS: [1, 2, 3, 4, 5], // 0=Sun, 1=Mon, ..., 5=Fri
} as const;

// Initial paper trading balance
export const INITIAL_BALANCE = 1000000; // ₹10,00,000

// Polling intervals (ms)
export const POLLING = {
  MARKET_OPEN: 5000,   // 5s during market hours
  MARKET_CLOSED: 60000, // 60s when closed
  NEWS: 300000,         // 5 minutes
} as const;

// Free tier watchlist limit
export const FREE_WATCHLIST_LIMIT = 3;

// Max watchlist items per list
export const MAX_WATCHLIST_ITEMS = 50;

// Exchange codes
export const EXCHANGES = ['NSE', 'BSE'] as const;
export type Exchange = typeof EXCHANGES[number];

// Popular NSE stocks for search suggestions
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', exchange: 'NSE', companyName: 'Reliance Industries Ltd', sector: 'Energy', isin: 'INE002A01018' },
  { symbol: 'TCS', exchange: 'NSE', companyName: 'Tata Consultancy Services Ltd', sector: 'IT', isin: 'INE467B01029' },
  { symbol: 'INFY', exchange: 'NSE', companyName: 'Infosys Ltd', sector: 'IT', isin: 'INE009A01021' },
  { symbol: 'HDFCBANK', exchange: 'NSE', companyName: 'HDFC Bank Ltd', sector: 'Banking', isin: 'INE040A01034' },
  { symbol: 'ICICIBANK', exchange: 'NSE', companyName: 'ICICI Bank Ltd', sector: 'Banking', isin: 'INE090A01021' },
  { symbol: 'HINDUNILVR', exchange: 'NSE', companyName: 'Hindustan Unilever Ltd', sector: 'FMCG', isin: 'INE030A01027' },
  { symbol: 'SBIN', exchange: 'NSE', companyName: 'State Bank of India', sector: 'Banking', isin: 'INE062A01020' },
  { symbol: 'BHARTIARTL', exchange: 'NSE', companyName: 'Bharti Airtel Ltd', sector: 'Telecom', isin: 'INE397D01024' },
  { symbol: 'WIPRO', exchange: 'NSE', companyName: 'Wipro Ltd', sector: 'IT', isin: 'INE075A01022' },
  { symbol: 'HCLTECH', exchange: 'NSE', companyName: 'HCL Technologies Ltd', sector: 'IT', isin: 'INE860A01027' },
  { symbol: 'ASIANPAINT', exchange: 'NSE', companyName: 'Asian Paints Ltd', sector: 'Chemicals', isin: 'INE021A01026' },
  { symbol: 'MARUTI', exchange: 'NSE', companyName: 'Maruti Suzuki India Ltd', sector: 'Auto', isin: 'INE585B01010' },
  { symbol: 'BAJFINANCE', exchange: 'NSE', companyName: 'Bajaj Finance Ltd', sector: 'NBFC', isin: 'INE296A01024' },
  { symbol: 'ADANIENT', exchange: 'NSE', companyName: 'Adani Enterprises Ltd', sector: 'Infrastructure', isin: 'INE423A01024' },
  { symbol: 'TATASTEEL', exchange: 'NSE', companyName: 'Tata Steel Ltd', sector: 'Metals', isin: 'INE081A01020' },
  { symbol: 'SUNPHARMA', exchange: 'NSE', companyName: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharma', isin: 'INE044A01036' },
  { symbol: 'NTPC', exchange: 'NSE', companyName: 'NTPC Ltd', sector: 'Power', isin: 'INE733E01010' },
  { symbol: 'POWERGRID', exchange: 'NSE', companyName: 'Power Grid Corporation of India Ltd', sector: 'Power', isin: 'INE752E01010' },
  { symbol: 'ONGC', exchange: 'NSE', companyName: 'Oil and Natural Gas Corporation Ltd', sector: 'Energy', isin: 'INE213A01029' },
  { symbol: 'ULTRACEMCO', exchange: 'NSE', companyName: 'UltraTech Cement Ltd', sector: 'Cement', isin: 'INE481G01011' },
] as const;
