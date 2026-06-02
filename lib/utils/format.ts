/**
 * Financial and Date Formatting Module
 * 
 * Centralizes display logic to ensure consistency across the UI.
 * Provides leverage by abstracting standard formatting patterns.
 */

/**
 * Formats a number as Philippine Peso (PHP).
 * Handles the "plus sign" display anomaly in some Intl configurations.
 * 
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., ₱1,234.56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    signDisplay: "always",
  }).format(value).replace("+", "");
}

/**
 * Formats a date into a standard short representation.
 * 
 * @param date - The Date object or date string
 * @returns Formatted date string (e.g., May 12, 2026)
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

/**
 * Utility for comma-separated number formatting (used in inputs).
 * 
 * @param value - The number or string to format
 * @returns String with commas
 */
export function formatNumberWithCommas(value: number | string): string {
  if (value === 0 || value === "" || value === undefined || value === null) return "";
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
