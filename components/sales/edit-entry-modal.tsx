"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WeeklySale } from "@/lib/domain/sales";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SalesEntryFormValues } from "@/lib/schemas/sales";
import { updateSalesEntry } from "@/app/sales/actions";
import { SalesEntryForm } from "./sales-form";

interface EditEntryModalProps {
  sale: WeeklySale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntryModal({ sale, open, onOpenChange }: EditEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If there's no sale to edit, don't render the modal contents
  if (!sale) return null;

  // Map database model to form values
  const initialValues: SalesEntryFormValues = {
    date: sale.date,
    weekly_sales: sale.grossSales,
    split_percentage: sale.primarySplitPercentage,
    primary_expenses: sale.primaryExpenses,
    expense_type: sale.expenseType || undefined,
    notes: sale.notes || undefined,
  };

  const onSubmit = async (data: SalesEntryFormValues) => {
    if (!sale?.id) return;
    setIsSubmitting(true);
    try {
      const result = await updateSalesEntry(sale.id, data);
      if (result.success) {
        toast.success("Sales entry updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update entry");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Sales Entry</DialogTitle>
          <DialogDescription>
            Modify the details for this weekly sales log.
          </DialogDescription>
        </DialogHeader>
        <SalesEntryForm 
          initialValues={initialValues}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          submitLabel="Update Entry"
        />
      </DialogContent>
    </Dialog>
  );
}
