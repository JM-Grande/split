import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatNumberWithCommas } from '@/lib/utils/format';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('formats numbers as PHP currency', () => {
      // Note: Intl formatting might vary slightly by environment, 
      // but the core parts should be consistent.
      const result = formatCurrency(1234.56);
      expect(result).toContain('₱');
      expect(result).toContain('1,234.56');
    });

    it('handles negative numbers', () => {
      const result = formatCurrency(-500);
      expect(result).toContain('₱');
      expect(result).toContain('500.00');
      // Should handle signDisplay correctly (removing + but keeping -)
      expect(result).toContain('-');
    });
  });

  describe('formatDate', () => {
    it('formats Date objects correctly', () => {
      const date = new Date('2026-05-15');
      const result = formatDate(date);
      expect(result).toBe('May 15, 2026');
    });

    it('formats date strings correctly', () => {
      const result = formatDate('2026-05-15');
      expect(result).toBe('May 15, 2026');
    });
  });

  describe('formatNumberWithCommas', () => {
    it('adds commas to large numbers', () => {
      expect(formatNumberWithCommas(1234567.89)).toBe('1,234,567.89');
    });

    it('handles zero', () => {
      expect(formatNumberWithCommas(0)).toBe('');
    });

    it('handles empty strings and nulls', () => {
      expect(formatNumberWithCommas('')).toBe('');
      expect(formatNumberWithCommas(null as unknown as number)).toBe('');
    });
  });
});
