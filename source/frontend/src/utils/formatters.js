/**
 * formatters.js — Utility functions for formatting values in the dashboard.
 */

/**
 * Format a numeric value to a fixed number of decimal places.
 * @param {number} value - The value to format.
 * @param {number} [decimals=2] - Number of decimal places.
 * @returns {string} Formatted value string.
 */
export function formatValue(value, decimals = 2) {
  if (typeof value !== 'number') return '—';
  return value.toFixed(decimals);
}

/**
 * Format an ISO timestamp to a human-readable local time string.
 * @param {string} isoTimestamp - ISO 8601 timestamp.
 * @returns {string} Formatted time string (e.g., "14:30:25").
 */
export function formatTime(isoTimestamp) {
  if (!isoTimestamp) return '';
  return new Date(isoTimestamp).toLocaleTimeString();
}

/**
 * Convert a snake_case sensor_id to a human-readable label.
 * @param {string} sensorId - e.g., "greenhouse_temperature"
 * @returns {string} e.g., "Greenhouse Temperature"
 */
export function sensorIdToLabel(sensorId) {
  return sensorId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
