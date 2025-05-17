/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format a date string
 * @param {string|Date} dateString - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

/**
 * Format a date as a relative time from now
 * @param {string|Date} dateString - The date to format
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format a percentage
 * @param {number} value - The percentage value (0-1)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a transaction status for display
 * @param {string} status - The status to format
 * @returns {string} Formatted status
 */
export const formatStatus = (status) => {
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
  
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get status color class for a transaction status
 * @param {string} status - The status to format
 * @returns {string} Tailwind CSS class for status
 */
export const getStatusColorClass = (status) => {
  const colorMap = {
    'initiated': 'bg-blue-100 text-blue-800',
    'processing': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'refunded': 'bg-purple-100 text-purple-800',
    'partially_refunded': 'bg-indigo-100 text-indigo-800',
    'canceled': 'bg-gray-100 text-gray-800',
    'disputed': 'bg-orange-100 text-orange-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Truncate long text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 30) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};