// src/lib/constants.js

/**
 * Trade Types
 */
export const TRADE_TYPES = {
  LONG: 'Long',
  SHORT: 'Short',
};

/**
 * Confidence Levels
 */
export const CONFIDENCE_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

/**
 * Timeframes
 */
export const TIMEFRAMES = {
  INTRADAY: 'Intraday',
  SWING: 'Swing',
  POSITION: 'Position',
  LONG_TERM: 'Long Term',
};

/**
 * Risk Levels
 */
export const RISK_LEVELS = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
};

/**
 * Strategy Categories
 */
export const STRATEGY_CATEGORIES = {
  MOMENTUM: 'Momentum Trading',
  SWING: 'Swing Trading',
  SCALPING: 'Scalping',
  MEAN_REVERSION: 'Mean Reversion',
  BREAKOUT: 'Breakout',
};

/**
 * Dropdown Options for Forms
 */
export const TRADE_TYPE_OPTIONS = [
  { value: TRADE_TYPES.LONG, label: 'Long' },
  { value: TRADE_TYPES.SHORT, label: 'Short' },
];

export const CONFIDENCE_OPTIONS = [
  { value: CONFIDENCE_LEVELS.HIGH, label: 'High' },
  { value: CONFIDENCE_LEVELS.MEDIUM, label: 'Medium' },
  { value: CONFIDENCE_LEVELS.LOW, label: 'Low' },
];

export const TIMEFRAME_OPTIONS = [
  { value: 'Intraday (1 day)', label: 'Intraday (1 day)' },
  { value: 'Swing (days-weeks)', label: 'Swing (days-weeks)' },
  { value: 'Position (weeks-months)', label: 'Position (weeks-months)' },
  { value: 'Long Term (months-years)', label: 'Long Term (months-years)' },
];

export const RISK_LEVEL_OPTIONS = [
  { value: RISK_LEVELS.LOW, label: 'Low Risk' },
  { value: RISK_LEVELS.MEDIUM, label: 'Medium Risk' },
  { value: RISK_LEVELS.HIGH, label: 'High Risk' },
];

export const CATEGORY_OPTIONS = [
  { value: STRATEGY_CATEGORIES.MOMENTUM, label: 'Momentum Trading' },
  { value: STRATEGY_CATEGORIES.SWING, label: 'Swing Trading' },
  { value: STRATEGY_CATEGORIES.SCALPING, label: 'Scalping' },
  { value: STRATEGY_CATEGORIES.MEAN_REVERSION, label: 'Mean Reversion' },
  { value: STRATEGY_CATEGORIES.BREAKOUT, label: 'Breakout' },
];

/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

/**
 * Pagination Defaults
 */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
