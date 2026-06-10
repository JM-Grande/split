import { describe, it, expect } from 'vitest';
import { createWeeklySale } from '@/lib/domain/sales';

describe('Sales Domain Module', () => {
  it('correctly calculates 60/40 split and net revenue', () => {
    const grossSales = 10000;
    const expenses60 = 1000;

    const result = createWeeklySale({ grossSales, primaryExpenses: expenses60, primarySplitPercentage: 60 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primaryShare).toBe(6000);
      expect(result.data.secondaryShare).toBe(4000);
      expect(result.data.primaryNetRevenue).toBe(5000);
    }
  });

  it('handles zero sales and zero expenses', () => {
    const result = createWeeklySale({ grossSales: 0, primaryExpenses: 0, primarySplitPercentage: 60 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primaryShare).toBe(0);
      expect(result.data.secondaryShare).toBe(0);
      expect(result.data.primaryNetRevenue).toBe(0);
    }
  });

  it('handles expenses exceeding the 60% share (negative net revenue)', () => {
    const grossSales = 1000;
    const expenses60 = 700;

    const result = createWeeklySale({ grossSales, primaryExpenses: expenses60, primarySplitPercentage: 60 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primaryShare).toBe(600);
      expect(result.data.secondaryShare).toBe(400);
      expect(result.data.primaryNetRevenue).toBe(-100);
    }
  });

  it('returns an error for negative gross sales', () => {
    const result = createWeeklySale({ grossSales: -100, primaryExpenses: 0, primarySplitPercentage: 60 });
    expect(result.success).toBe(false);
  });

  it('returns an error for negative expenses', () => {
    const result = createWeeklySale({ grossSales: 100, primaryExpenses: -50, primarySplitPercentage: 60 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Expenses cannot be negative.');
    }
  });

  it('returns an error for invalid split percentage', () => {
    const result = createWeeklySale({ grossSales: 100, primaryExpenses: 0, primarySplitPercentage: 150 });
    expect(result.success).toBe(false);
  });
});
