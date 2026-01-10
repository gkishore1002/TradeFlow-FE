// src/lib/utils/format.js

/**
 * Format a number as currency
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value || 0);
}

/**
 * Format a date string
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options,
    };
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'N/A';
  }
}

/**
 * Format a date and time string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format a number with commas
 * @param {number} value - Value to format
 * @returns {string} Formatted number string
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

/**
 * Format percentage
 * @param {number} value - Value to format (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  return `${(value || 0).toFixed(decimals)}%`;
}
