import prisma from "@/lib/prisma";
import { WeeklySale as PrismaWeeklySale } from "@prisma/client";
import { WeeklySale } from "@/lib/domain/sales";

/**
 * Sales Repository Interface
 * 
 * Defines the contract for sales data persistence.
 * This is a deep SEAM that accepts the WeeklySale domain entity directly,
 * keeping the domain decoupled from Prisma's database schema.
 */

export interface SalesRepository {
  /**
   * Fetches sales records for a specific user within a date range.
   */
  getSalesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WeeklySale[]>;

  /**
   * Fetches all weekly sales records for a specific user, ordered by date descending.
   */
  getAllSales(userId: string): Promise<WeeklySale[]>;

  /**
   * Fetches the most recent weekly sales records for a specific user, ordered by date descending.
   */
  getRecentSales(userId: string, limit: number): Promise<WeeklySale[]>;

  /**
   * Persists a new weekly sale record.
   * @param sale - The domain WeeklySale entity (must have ownerId)
   */
  createSale(sale: WeeklySale): Promise<WeeklySale>;

  /**
   * Updates an existing weekly sale record owned by a specific user.
   */
  updateSale(id: string, userId: string, sale: WeeklySale): Promise<WeeklySale>;

  /**
   * Deletes a weekly sale record owned by a specific user.
   */
  deleteSale(id: string, userId: string): Promise<WeeklySale>;

  /**
   * Bulk inserts multiple sales. Optionally clears existing sales for the user first.
   * Runs in a transaction.
   */
  bulkInsertSales(userId: string, sales: WeeklySale[], clearExistingYear?: number): Promise<number>;
}

function mapToDomain(dbSale: PrismaWeeklySale): WeeklySale {
  return {
    id: dbSale.record_id,
    ownerId: dbSale.user_id,
    date: dbSale.date,
    grossSales: dbSale.weekly_sales,
    primarySplitPercentage: dbSale.primary_split_percentage,
    primaryShare: dbSale.primary_share,
    secondaryShare: dbSale.secondary_share,
    primaryExpenses: dbSale.primary_expenses,
    expenseType: dbSale.expense_type,
    primaryNetRevenue: dbSale.primary_net_revenue,
    notes: dbSale.notes,
  };
}

/**
 * Prisma implementation of the SalesRepository.
 * This is the primary ADAPTER used in production.
 */
export class PrismaSalesRepository implements SalesRepository {
  async getSalesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WeeklySale[]> {
    const records = await prisma.weeklySale.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    });
    return records.map(mapToDomain);
  }

  async getAllSales(userId: string): Promise<WeeklySale[]> {
    const records = await prisma.weeklySale.findMany({
      where: { user_id: userId },
      orderBy: { date: "desc" },
    });
    return records.map(mapToDomain);
  }

  async getRecentSales(userId: string, limit: number): Promise<WeeklySale[]> {
    const records = await prisma.weeklySale.findMany({
      where: { user_id: userId },
      orderBy: { date: "desc" },
      take: limit,
    });
    return records.map(mapToDomain);
  }

  async createSale(sale: WeeklySale): Promise<WeeklySale> {
    if (!sale.ownerId) {
      throw new Error("WeeklySale must have an ownerId to be persisted.");
    }
    const created = await prisma.weeklySale.create({
      data: {
        user_id: sale.ownerId,
        date: sale.date,
        weekly_sales: sale.grossSales,
        primary_split_percentage: sale.primarySplitPercentage,
        primary_share: sale.primaryShare,
        secondary_share: sale.secondaryShare,
        primary_expenses: sale.primaryExpenses,
        expense_type: sale.expenseType,
        primary_net_revenue: sale.primaryNetRevenue,
        notes: sale.notes,
      },
    });
    return mapToDomain(created);
  }

  async updateSale(id: string, userId: string, sale: WeeklySale): Promise<WeeklySale> {
    const updated = await prisma.weeklySale.update({
      where: { 
        record_id: id,
        user_id: userId
      },
      data: {
        date: sale.date,
        weekly_sales: sale.grossSales,
        primary_split_percentage: sale.primarySplitPercentage,
        primary_share: sale.primaryShare,
        secondary_share: sale.secondaryShare,
        primary_expenses: sale.primaryExpenses,
        expense_type: sale.expenseType,
        primary_net_revenue: sale.primaryNetRevenue,
        notes: sale.notes,
      },
    });
    return mapToDomain(updated);
  }

  async deleteSale(id: string, userId: string): Promise<WeeklySale> {
    const deleted = await prisma.weeklySale.delete({
      where: { 
        record_id: id,
        user_id: userId
      },
    });
    return mapToDomain(deleted);
  }

  async bulkInsertSales(userId: string, sales: WeeklySale[], clearExistingYear?: number): Promise<number> {
    let count = 0;
    await prisma.$transaction(async (tx) => {
      if (clearExistingYear !== undefined) {
        const startOfYear = new Date(clearExistingYear, 0, 1);
        const endOfYear = new Date(clearExistingYear, 11, 31, 23, 59, 59, 999);
        await tx.weeklySale.deleteMany({
          where: {
            user_id: userId,
            date: {
              gte: startOfYear,
              lte: endOfYear
            }
          }
        });
      }

      const dataToInsert = sales.map((sale) => ({
        user_id: userId,
        date: sale.date,
        weekly_sales: sale.grossSales,
        primary_split_percentage: sale.primarySplitPercentage,
        primary_share: sale.primaryShare,
        secondary_share: sale.secondaryShare,
        primary_expenses: sale.primaryExpenses,
        expense_type: sale.expenseType,
        primary_net_revenue: sale.primaryNetRevenue,
        notes: sale.notes,
      }));

      const result = await tx.weeklySale.createMany({
        data: dataToInsert
      });
      count = result.count;
    });
    return count;
  }
}

// Export a singleton instance for standard use
export const salesRepository: SalesRepository = new PrismaSalesRepository();
