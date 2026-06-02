"use server";

import { revalidatePath } from "next/cache";
import { salesEntrySchema, SalesEntryFormValues } from "@/lib/schemas/sales";
import { createWeeklySale } from "@/lib/domain/sales";
import { salesRepository } from "@/lib/repositories/sales";
import { requireAuth } from "@/lib/actions/auth";

export async function createSalesEntry(data: SalesEntryFormValues) {
  try {
    const userId = await requireAuth();
    const validatedData = salesEntrySchema.parse(data);

    // Calculate derived values using the Deep Domain Module
    const saleResult = createWeeklySale({
      date: validatedData.date,
      grossSales: validatedData.weekly_sales,
      primarySplitPercentage: validatedData.split_percentage,
      primaryExpenses: validatedData.primary_expenses,
      expenseType: validatedData.expense_type,
      notes: validatedData.notes,
      ownerId: userId,
    });

    if (!saleResult.success) {
      return { success: false, error: saleResult.error };
    }

    // Insert into database using the deep repository seam
    await salesRepository.createSale(saleResult.data);

    revalidatePath("/sales");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create sales entry:", error);
    return { success: false, error: "Failed to create entry. Please check your inputs." };
  }
}

export async function updateSalesEntry(id: string, data: SalesEntryFormValues) {
  try {
    const userId = await requireAuth();
    const validatedData = salesEntrySchema.parse(data);

    // Calculate derived values using the Deep Domain Module
    const saleResult = createWeeklySale({
      date: validatedData.date,
      grossSales: validatedData.weekly_sales,
      primarySplitPercentage: validatedData.split_percentage,
      primaryExpenses: validatedData.primary_expenses,
      expenseType: validatedData.expense_type,
      notes: validatedData.notes,
      ownerId: userId,
    });

    if (!saleResult.success) {
      return { success: false, error: saleResult.error };
    }

    // Update in database using the deep repository seam
    await salesRepository.updateSale(id, userId, saleResult.data);

    revalidatePath("/sales");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update sales entry:", error);
    return { success: false, error: "Failed to update entry. Please check your inputs." };
  }
}

export async function deleteSalesEntry(id: string) {
  try {
    const userId = await requireAuth();
    await salesRepository.deleteSale(id, userId);

    revalidatePath("/sales");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete sales entry:", error);
    return { success: false, error: "Failed to delete entry." };
  }
}
