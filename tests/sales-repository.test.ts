import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaSalesRepository } from '@/lib/repositories/sales';
import prisma from '@/lib/prisma';
import { WeeklySale as PrismaWeeklySale } from "@prisma/client";
import { WeeklySale } from "@/lib/domain/sales";


// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: vi.fn(),
    user: {
      findFirst: vi.fn(),
    },
    weeklySale: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('PrismaSalesRepository', () => {
  let repository: PrismaSalesRepository;
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaSalesRepository();
  });

  it('getAllSales calls prisma.weeklySale.findMany with correct userId and order', async () => {
    const mockSales = [{ record_id: '1' }] as PrismaWeeklySale[];
    vi.mocked(prisma.weeklySale.findMany).mockResolvedValue(mockSales);

    const result = await repository.getAllSales(userId);

    expect(result[0].id).toBe('1');
    expect(prisma.weeklySale.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
    });
  });

  it('createSale calls prisma.weeklySale.create with correct data', async () => {
    const input: WeeklySale = {
      ownerId: userId,
      date: new Date(),
      grossSales: 100,
      primarySplitPercentage: 60,
      primaryShare: 60,
      secondaryShare: 40,
      primaryExpenses: 10,
      expenseType: null,
      primaryNetRevenue: 50,
      notes: null,
    };
    
    const mockCreated = { 
      record_id: 'new-1', 
      user_id: input.ownerId,
      date: input.date,
      weekly_sales: input.grossSales,
      primary_split_percentage: input.primarySplitPercentage,
      primary_share: input.primaryShare,
      secondary_share: input.secondaryShare,
      primary_expenses: input.primaryExpenses,
      expense_type: input.expenseType,
      primary_net_revenue: input.primaryNetRevenue,
      notes: input.notes
    } as PrismaWeeklySale;
    vi.mocked(prisma.weeklySale.create).mockResolvedValue(mockCreated);

    const result = await repository.createSale(input);

    expect(result.id).toBe('new-1');
    expect(prisma.weeklySale.create).toHaveBeenCalledWith({
      data: {
        user_id: input.ownerId,
        date: input.date,
        weekly_sales: input.grossSales,
        primary_split_percentage: input.primarySplitPercentage,
        primary_share: input.primaryShare,
        secondary_share: input.secondaryShare,
        primary_expenses: input.primaryExpenses,
        expense_type: input.expenseType,
        primary_net_revenue: input.primaryNetRevenue,
        notes: input.notes,
      }
    });
  });

  it('updateSale calls prisma.weeklySale.update with correct userId filter', async () => {
    const id = 'record-1';
    const input: WeeklySale = {
      ownerId: userId,
      date: new Date(),
      grossSales: 200,
      primarySplitPercentage: 60,
      primaryShare: 120,
      secondaryShare: 80,
      primaryExpenses: 20,
      expenseType: null,
      primaryNetRevenue: 100,
      notes: null,
    };

    vi.mocked(prisma.weeklySale.update).mockResolvedValue({ record_id: id } as PrismaWeeklySale);

    await repository.updateSale(id, userId, input);

    expect(prisma.weeklySale.update).toHaveBeenCalledWith({
      where: { 
        record_id: id,
        user_id: userId
      },
      data: {
        date: input.date,
        weekly_sales: input.grossSales,
        primary_split_percentage: input.primarySplitPercentage,
        primary_share: input.primaryShare,
        secondary_share: input.secondaryShare,
        primary_expenses: input.primaryExpenses,
        expense_type: input.expenseType,
        primary_net_revenue: input.primaryNetRevenue,
        notes: input.notes,
      },
    });
  });

  it('deleteSale calls prisma.weeklySale.delete with correct userId filter', async () => {
    const id = 'record-1';
    vi.mocked(prisma.weeklySale.delete).mockResolvedValue({ record_id: id } as PrismaWeeklySale);

    const result = await repository.deleteSale(id, userId);

    expect(result.id).toBe(id);
    expect(prisma.weeklySale.delete).toHaveBeenCalledWith({
      where: { 
        record_id: id,
        user_id: userId
      },
    });
  });

  it('getSalesByDateRange calls prisma.weeklySale.findMany with correct date filters', async () => {
    const mockSales = [{ record_id: '1' }] as PrismaWeeklySale[];
    vi.mocked(prisma.weeklySale.findMany).mockResolvedValue(mockSales);

    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');
    const result = await repository.getSalesByDateRange(userId, startDate, endDate);

    expect(result[0].id).toBe('1');
    expect(prisma.weeklySale.findMany).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  });

  it('getRecentSales calls prisma.weeklySale.findMany with correct limit', async () => {
    const mockSales = [{ record_id: '1' }] as PrismaWeeklySale[];
    vi.mocked(prisma.weeklySale.findMany).mockResolvedValue(mockSales);

    const result = await repository.getRecentSales(userId, 5);

    expect(result[0].id).toBe('1');
    expect(prisma.weeklySale.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      take: 5,
    });
  });

  it('createSale throws error if ownerId is missing', async () => {
    const input: WeeklySale = {
      // ownerId intentionally omitted or undefined
      date: new Date(),
      grossSales: 100,
      primarySplitPercentage: 60,
      primaryShare: 60,
      secondaryShare: 40,
      primaryExpenses: 10,
      expenseType: null,
      primaryNetRevenue: 50,
      notes: null,
    };

    await expect(repository.createSale(input)).rejects.toThrow("WeeklySale must have an ownerId to be persisted.");
  });

    it('bulkInsertSales calls transaction and createMany with correct data', async () => {
      const input: WeeklySale[] = [{
        ownerId: userId,
        date: new Date(),
        grossSales: 100,
        primarySplitPercentage: 60,
        primaryShare: 60,
        secondaryShare: 40,
        primaryExpenses: 10,
        expenseType: null,
        primaryNetRevenue: 50,
        notes: null,
      }];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
        const txMock = {
          weeklySale: {
            deleteMany: vi.fn(),
            createMany: vi.fn().mockResolvedValue({ count: 1 })
          }
        };
        await cb(txMock);
      });
  
      const count = await repository.bulkInsertSales(userId, input, 2026);
  
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(count).toBe(1);
    });

    it('bulkInsertSales does not call deleteMany when clearExistingYear is undefined', async () => {
      const input: WeeklySale[] = [];
      let deleteManyMock!: ReturnType<typeof vi.fn>;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
        deleteManyMock = vi.fn();
        const txMock = {
          weeklySale: {
            deleteMany: deleteManyMock,
            createMany: vi.fn().mockResolvedValue({ count: 0 })
          }
        };
        await cb(txMock);
      });
  
      await repository.bulkInsertSales(userId, input, undefined);
      expect(deleteManyMock).not.toHaveBeenCalled();
    });
  });
