/**
 * Centralized formatting utilities for currency, numbers, and dates.
 */

/**
 * Formats a numeric value into a localized currency string.
 * @param {number|string} value - The numeric value to format
 * @param {string} currencyCode - INR, USD, EUR, or GBP
 * @param {string} language - en or hi
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (value, currencyCode = 'INR', language = 'en') => {
  const num = Number(value || 0);
  const code = (currencyCode || 'INR').toUpperCase();
  
  // Determine standard locale mapping for target currency and language
  let locale = 'en-IN';
  if (language === 'hi') {
    locale = 'hi-IN';
  } else {
    if (code === 'USD') locale = 'en-US';
    else if (code === 'EUR') locale = 'de-DE'; // German standard for Euros
    else if (code === 'GBP') locale = 'en-GB';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  } catch (err) {
    console.error(`Error formatting currency (${code}, ${locale}):`, err.message);
    // Generic fallback
    return `${code} ${num.toFixed(2)}`;
  }
};

/**
 * Formats a date string (YYYY-MM-DD) into a localized string.
 * @param {string|Date} dateVal - Date to format
 * @param {string} language - en or hi
 * @returns {string} The formatted date string
 */
export const formatDate = (dateVal, language = 'en') => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const locale = language === 'hi' ? 'hi-IN' : 'en-US';
  try {
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (err) {
    return d.toDateString();
  }
};

/**
 * Formats a generic numeric value into a localized string.
 * @param {number|string} value - Number to format
 * @param {string} language - en or hi
 * @returns {string} Localized number string
 */
export const formatNumber = (value, language = 'en') => {
  const num = Number(value || 0);
  const locale = language === 'hi' ? 'hi-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch (err) {
    return String(num);
  }
};
