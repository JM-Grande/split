"use server";

import { requireAuth } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWeeklySale, WeeklySale } from "@/lib/domain/sales";
import { salesRepository } from "@/lib/repositories/sales";

const weeklySaleImportSchema = z.object({
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  weekly_sales: z.number().min(0),
  primary_split_percentage: z.number().min(1).max(100).default(60),
  primary_expenses: z.number().min(0).default(0),
  expense_type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const importSchema = z.array(weeklySaleImportSchema);

export async function exportDataAction() {
  try {
    const userId = await requireAuth();

    const sales = await salesRepository.getAllSales(userId);

    // Map Domain models back to export format for CSV
    const exportData = sales.map(s => ({
      date: s.date.toISOString(),
      weekly_sales: s.grossSales,
      primary_split_percentage: s.primarySplitPercentage,
      primary_share: s.primaryShare,
      secondary_share: s.secondaryShare,
      primary_expenses: s.primaryExpenses,
      expense_type: s.expenseType,
      primary_net_revenue: s.primaryNetRevenue,
      notes: s.notes,
    }));

    return { success: true, message: "Data exported successfully.", data: exportData };
  } catch (error) {
    console.error("Export data error:", error);
    return { success: false, error: "Failed to export data." };
  }
}

export async function importDataAction(rawImportData: unknown[], clearExisting: boolean = false) {
  try {
    const userId = await requireAuth();

    // 1. Validate raw data shape
    const validated = importSchema.safeParse(rawImportData);
    if (!validated.success) {
      return { 
        success: false, 
        error: "Invalid file format or corrupted data.",
        details: validated.error.issues.map(err => err.message)
      };
    }

    const records = validated.data;

    if (records.length === 0) {
      return { success: false, error: "No records found in the import file." };
    }

    // 2. Map through deep domain module to enforce invariants and recalculate splits
    const validSales: WeeklySale[] = [];
    const errors: string[] = [];

    records.forEach((record, index) => {
      const saleResult = createWeeklySale({
        date: record.date,
        grossSales: record.weekly_sales,
        primarySplitPercentage: record.primary_split_percentage,
        primaryExpenses: record.primary_expenses,
        expenseType: record.expense_type,
        notes: record.notes,
        ownerId: userId,
      });

      if (saleResult.success) {
        validSales.push(saleResult.data);
      } else {
        errors.push(`Row ${index + 1}: ${saleResult.error}`);
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        error: `Failed to import due to ${errors.length} invalid records.`,
        details: errors.slice(0, 5) // Return first 5 errors to avoid massive payloads
      };
    }

    // 3. Persist via repository
    const insertedCount = await salesRepository.bulkInsertSales(userId, validSales, clearExisting);

    revalidatePath("/profile");
    revalidatePath("/sales");
    revalidatePath("/");

    return { success: true, message: `Successfully imported ${insertedCount} records.`, count: insertedCount };
  } catch (error) {
    console.error("Import data error:", error);
    return { success: false, error: "Failed to import data. Please check your file." };
  }
}
