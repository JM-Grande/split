import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDataAction, importDataAction } from '@/lib/actions/data-management';
import { salesRepository } from '@/lib/repositories/sales';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { WeeklySale } from '@/lib/domain/sales';
import { User } from '@prisma/client';

// Mock the repository
vi.mock('@/lib/repositories/sales', () => ({
  salesRepository: {
    getSalesByDateRange: vi.fn(),
    bulkInsertSales: vi.fn(),
  },
}));

// Mock auth helpers
vi.mock('@/lib/actions/auth', () => ({
  requireAuth: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { requireAuth } from '@/lib/actions/auth';

describe('Data Management Actions', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(userId);
  });

  describe('exportDataAction', () => {
    it('should fetch sales for a specific year and return data with metadata', async () => {
      const mockSales: WeeklySale[] = [
        {
          id: '1',
          ownerId: userId,
          date: new Date('2026-05-01'),
          grossSales: 1000,
          primarySplitPercentage: 60,
          primaryShare: 600,
          secondaryShare: 400,
          primaryExpenses: 100,
          expenseType: null,
          primaryNetRevenue: 500,
          notes: 'Test sale',
        },
      ];

      vi.mocked(salesRepository.getSalesByDateRange).mockResolvedValue(mockSales);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ default_split_percentage: 60, aiModel: 'test-model' } as unknown as User);

      const result = await exportDataAction(2026);

      expect(result.success).toBe(true);
      expect(salesRepository.getSalesByDateRange).toHaveBeenCalledWith(
        userId,
        expect.any(Date), // Start of year 2026
        expect.any(Date)  // End of year 2026
      );
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Export failed');
      }
      const exported = result.data;
      expect(exported.metadata.year).toBe("2026");
      expect(exported.sales).toHaveLength(1);
      expect(exported.sales[0].weekly_sales).toBe(1000);
      expect(exported.settings.default_split_percentage).toBe(60);
      expect(exported.settings.aiModel).toBe('test-model');
    });
  });

  describe('importDataAction', () => {
    it('should successfully import data and call bulkInsertSales with target year for smart clearing', async () => {
      const importData = {
        metadata: { year: "2026" },
        settings: { default_split_percentage: 60, aiModel: 'test-model' },
        sales: [
          {
            date: '2026-06-15T00:00:00.000Z',
            weekly_sales: 1500,
            primary_split_percentage: 60,
            primary_expenses: 50,
            notes: 'June sale',
          },
        ],
      };

      vi.mocked(salesRepository.bulkInsertSales).mockResolvedValue(1);

      const result = await importDataAction(importData, true);

      expect(result.success).toBe(true);
      expect(salesRepository.bulkInsertSales).toHaveBeenCalledWith(
        userId,
        expect.any(Array),
        2026 // targetYear passed down for smart clearing
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          default_split_percentage: 60,
          aiModel: 'test-model',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/profile');
    });

    it('should infer year from the first sales record if metadata is missing', async () => {
      const importData = {
        sales: [
          {
            date: '2025-06-15T00:00:00.000Z',
            weekly_sales: 1500,
            primary_split_percentage: 60,
            primary_expenses: 50,
          },
        ],
      };

      vi.mocked(salesRepository.bulkInsertSales).mockResolvedValue(1);

      const result = await importDataAction(importData, true);

      expect(result.success).toBe(true);
      expect(salesRepository.bulkInsertSales).toHaveBeenCalledWith(
        userId,
        expect.any(Array),
        2025 // Inferred year from '2025-06-15'
      );
    });

    it('should fail if any sales record is from a different year than the target year', async () => {
      const importData = {
        metadata: { year: 2026 },
        sales: [
          {
            date: '2026-06-15T00:00:00.000Z',
            weekly_sales: 1500,
            primary_split_percentage: 60,
            primary_expenses: 50,
          },
          {
            date: '2025-12-31T00:00:00.000Z', // Different year!
            weekly_sales: 1000,
            primary_split_percentage: 60,
            primary_expenses: 0,
          },
        ],
      };

      const result = await importDataAction(importData, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('contains data for years other than the target year');
      expect(salesRepository.bulkInsertSales).not.toHaveBeenCalled();
    });

    it('should fail validation if sales contains invalid formats', async () => {
      const importData = {
        metadata: { year: 2026 },
        sales: [
          {
            date: '2026-06-15T00:00:00.000Z',
            weekly_sales: -500, // Invalid!
          },
        ],
      };

      const result = await importDataAction(importData, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file format or corrupted data');
    });
  });
});
