import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSalesEntry, updateSalesEntry, deleteSalesEntry } from '@/app/sales/actions';
import { salesRepository } from '@/lib/repositories/sales';
import { revalidatePath } from 'next/cache';
import { WeeklySale } from "@/lib/domain/sales";
import { SalesEntryFormValues } from '@/lib/schemas/sales';

// Mock the repository
vi.mock('@/lib/repositories/sales', () => ({
  salesRepository: {
    createSale: vi.fn(),
    updateSale: vi.fn(),
    deleteSale: vi.fn(),
  },
}));

// Mock auth helpers
vi.mock('@/lib/actions/auth', () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from '@/lib/actions/auth';

describe('createSalesEntry', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(userId);
  });

  it('should successfully create a sales entry and calculate correct values', async () => {
    const inputData = {
      date: new Date('2026-05-13'),
      weekly_sales: 1000,
      split_percentage: 60,
      primary_expenses: 100,
      expense_type: 'Electricity',
      notes: 'Test note',
    };

    // Setup mocks
    vi.mocked(salesRepository.createSale).mockResolvedValue({} as WeeklySale);

    const result = await createSalesEntry(inputData);

    expect(result.success).toBe(true);
    expect(requireAuth).toHaveBeenCalled();
    expect(salesRepository.createSale).toHaveBeenCalledWith({
      ownerId: userId,
      date: inputData.date,
      grossSales: 1000,
      primarySplitPercentage: 60,
      primaryShare: 600,
      secondaryShare: 400,
      primaryExpenses: 100,
      expenseType: 'Electricity',
      primaryNetRevenue: 500,
      notes: 'Test note',
      id: undefined,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/sales');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('should successfully create a 100% solo mode entry and calculate 0 partner share', async () => {
    const inputData = {
      date: new Date('2026-06-01'),
      weekly_sales: 5000,
      split_percentage: 100, // Solo mode
      primary_expenses: 500,
      expense_type: 'Supplies',
      notes: 'Solo mode test',
    };

    // Setup mocks
    vi.mocked(salesRepository.createSale).mockResolvedValue({} as WeeklySale);

    const result = await createSalesEntry(inputData);

    expect(result.success).toBe(true);
    expect(requireAuth).toHaveBeenCalled();
    
    // In Solo Mode, primaryShare is 100% of gross, secondary is 0
    expect(salesRepository.createSale).toHaveBeenCalledWith({
      ownerId: userId,
      date: inputData.date,
      grossSales: 5000,
      primarySplitPercentage: 100,
      primaryShare: 5000,
      secondaryShare: 0,
      primaryExpenses: 500,
      expenseType: 'Supplies',
      primaryNetRevenue: 4500,
      notes: 'Solo mode test',
      id: undefined,
    });
  });

  it('should return error if validation fails', async () => {
    const inputData = {
      date: 'invalid-date' as unknown as Date,
      weekly_sales: -10, // Invalid: must be positive
      primary_expenses: 100,
    };

    const result = await createSalesEntry(inputData as unknown as SalesEntryFormValues);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create entry');
  });

  it('should handle unauthorized access', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));
    const inputData = {
      date: new Date(),
      weekly_sales: 1000,
      split_percentage: 60,
      primary_expenses: 100,
    };

    const result = await createSalesEntry(inputData);

    expect(result.success).toBe(false);
    expect(salesRepository.createSale).not.toHaveBeenCalled();
  });
});

describe('updateSalesEntry', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(userId);
  });

  it('should successfully update a sales entry and recalculate values', async () => {
    const inputData = {
      date: new Date('2026-05-20'),
      weekly_sales: 2000,
      split_percentage: 60,
      primary_expenses: 200,
      expense_type: 'Water',
      notes: 'Updated note',
    };

    vi.mocked(salesRepository.updateSale).mockResolvedValue({} as WeeklySale);

    const result = await updateSalesEntry('record-123', inputData);

    expect(result.success).toBe(true);
    expect(requireAuth).toHaveBeenCalled();
    expect(salesRepository.updateSale).toHaveBeenCalledWith('record-123', userId, {
      ownerId: userId,
      date: inputData.date,
      grossSales: 2000,
      primarySplitPercentage: 60,
      primaryShare: 1200,
      secondaryShare: 800,
      primaryExpenses: 200,
      expenseType: 'Water',
      primaryNetRevenue: 1000,
      notes: 'Updated note',
      id: undefined,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/sales');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('should return error if update validation fails', async () => {
    const inputData = {
      date: new Date('2026-05-20'),
      weekly_sales: -500, // Invalid
      primary_expenses: 200,
    };

    const result = await updateSalesEntry('record-123', inputData as unknown as SalesEntryFormValues);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to update entry');
    expect(salesRepository.updateSale).not.toHaveBeenCalled();
  });
});

describe('deleteSalesEntry', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(userId);
  });

  it('should successfully delete a sales entry', async () => {
    vi.mocked(salesRepository.deleteSale).mockResolvedValue({} as WeeklySale);

    const result = await deleteSalesEntry('record-123');

    expect(result.success).toBe(true);
    expect(requireAuth).toHaveBeenCalled();
    expect(salesRepository.deleteSale).toHaveBeenCalledWith('record-123', userId);
    expect(revalidatePath).toHaveBeenCalledWith('/sales');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('should handle deletion errors', async () => {
    vi.mocked(salesRepository.deleteSale).mockRejectedValue(new Error('DB Error'));

    const result = await deleteSalesEntry('record-123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to delete entry');
  });
});
