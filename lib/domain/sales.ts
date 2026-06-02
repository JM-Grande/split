/**
 * Sales Domain Module
 * 
 * Encapsulates the core financial rules for the 60/40 profit split
 * and net revenue calculations.
 * 
 * Vocabulary (from CONTEXT.md):
 * - Weekly Sale
 * - Gross Sales
 * - 60% Share
 * - 40% Share
 * - 60% Expense
 * - Net Revenue (Owner)
 */

export interface WeeklySale {
  readonly id?: string;
  readonly ownerId?: string;
  readonly date: Date;
  readonly grossSales: number;
  readonly primarySplitPercentage: number;
  readonly primaryShare: number;
  readonly secondaryShare: number;
  readonly primaryExpenses: number;
  readonly expenseType: string | null;
  readonly primaryNetRevenue: number;
  readonly notes: string | null;
}

export type WeeklySaleResult = 
  | { success: true; data: WeeklySale }
  | { success: false; error: string };

export function createWeeklySale(input: {
  date?: Date;
  grossSales: number;
  primarySplitPercentage?: number;
  primaryExpenses?: number;
  expenseType?: string | null;
  notes?: string | null;
  ownerId?: string;
  id?: string;
}): WeeklySaleResult {
  const {
    date = new Date(),
    grossSales,
    primarySplitPercentage = 60,
    primaryExpenses = 0,
    expenseType = null,
    notes = null,
    ownerId,
    id
  } = input;

  if (grossSales < 0) {
    return { success: false, error: "Gross sales cannot be negative." };
  }
  if (primaryExpenses < 0) {
    return { success: false, error: "Expenses cannot be negative." };
  }
  if (primarySplitPercentage < 0 || primarySplitPercentage > 100) {
    return { success: false, error: "Split percentage must be between 0 and 100." };
  }

  const primaryShare = grossSales * (primarySplitPercentage / 100);
  const secondaryShare = grossSales * ((100 - primarySplitPercentage) / 100);
  const primaryNetRevenue = primaryShare - primaryExpenses;

  return {
    success: true,
    data: {
      id,
      ownerId,
      date,
      grossSales,
      primarySplitPercentage,
      primaryShare,
      secondaryShare,
      primaryExpenses,
      expenseType,
      primaryNetRevenue,
      notes,
    }
  };
}
