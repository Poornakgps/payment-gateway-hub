/**
 * Utility for formatting report data
 */

/**
 * Format a number as currency (USD)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a number as a percentage
 * @param {number} value - The value to format (0-1)
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

/**
 * Format transaction status for display
 * @param {string} status - The status to format
 * @returns {string} Formatted status
 */
function formatStatus(status) {
  const statusMap = {
    'initiated': 'Initiated',
    'processing': 'Processing',
    'completed': 'Completed',
    'failed': 'Failed',
    'refunded': 'Refunded',
    'partially_refunded': 'Partially Refunded',
    'canceled': 'Canceled',
    'disputed': 'Disputed'
  };
  
  return statusMap[status] || status;
}

/**
 * Format provider name for display
 * @param {string} provider - The provider to format
 * @returns {string} Formatted provider name
 */
function formatProvider(provider) {
  const providerMap = {
    'stripe': 'Stripe',
    'paypal': 'PayPal'
  };
  
  return providerMap[provider] || provider;
}

module.exports = {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatStatus,
  formatProvider
};