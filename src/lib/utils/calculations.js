// src/lib/utils/calculations.js

/**
 * Calculate potential profit/loss and risk-reward ratio for a trade
 * @param {object} trade - Trade object with entry, target, stop, quantity, and type
 * @returns {object} Calculated metrics
 */
export function calculateTradeMetrics(trade) {
  const entry = Number(trade.entry_price || trade.entryprice || 0);
  const target = Number(trade.target_price || trade.targetprice || 0);
  const stop = Number(trade.stop_loss || trade.stoploss || 0);
  const qty = Number(trade.quantity || 0);
  const tradeType = trade.trade_type || trade.tradetype || 'Long';

  let potentialProfit = 0;
  let potentialLoss = 0;
  let riskRewardRatio = 0;

  if (tradeType === 'Long') {
    potentialProfit = (target - entry) * qty;
    potentialLoss = (entry - stop) * qty;
  } else {
    potentialProfit = (entry - target) * qty;
    potentialLoss = (stop - entry) * qty;
  }

  if (Math.abs(potentialLoss) > 0) {
    riskRewardRatio = potentialProfit / Math.abs(potentialLoss);
  }

  return {
    potentialProfit: potentialProfit.toFixed(2),
    potentialLoss: Math.abs(potentialLoss).toFixed(2),
    riskRewardRatio: riskRewardRatio.toFixed(2),
  };
}

/**
 * Calculate win rate percentage
 * @param {number} wins - Number of winning trades
 * @param {number} total - Total number of trades
 * @returns {number} Win rate percentage
 */
export function calculateWinRate(wins, total) {
  if (total === 0) return 0;
  return ((wins / total) * 100).toFixed(1);
}

/**
 * Calculate average profit/loss
 * @param {number} totalPnl - Total profit/loss
 * @param {number} totalTrades - Total number of trades
 * @returns {number} Average P&L
 */
export function calculateAveragePnL(totalPnl, totalTrades) {
  if (totalTrades === 0) return 0;
  return (totalPnl / totalTrades).toFixed(2);
}

/**
 * Calculate profit/loss for a single trade
 * @param {number} entryPrice - Entry price
 * @param {number} exitPrice - Exit price
 * @param {number} quantity - Quantity traded
 * @returns {number} Profit or loss amount
 */
export function calculateProfitLoss(entryPrice, exitPrice, quantity) {
  return (exitPrice - entryPrice) * quantity;
}

/**
 * Calculate success ratio percentage
 * @param {number} successCount - Number of successful trades
 * @param {number} totalCount - Total number of trades
 * @returns {string} Success ratio as percentage string
 */
export function calculateSuccessRatio(successCount, totalCount) {
  if (totalCount === 0) return '0.0';
  return ((successCount / totalCount) * 100).toFixed(1);
}

