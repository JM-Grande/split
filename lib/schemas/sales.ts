import { z } from 'zod';

export const salesEntrySchema = z.object({
  date: z.date({
    message: "Date is required and must be valid",
  }),
  weekly_sales: z.number({
    message: "Weekly sales amount is required and must be a number",
  }).min(0, "Amount must be positive"),
  split_percentage: z.number({
    message: "Split percentage is required",
  }).min(1, "Must be at least 1%").max(100, "Cannot exceed 100%"),
  primary_expenses: z.number({
    message: "Expenses amount is required and must be a number",
  }).min(0, "Amount cannot be negative"),
  expense_type: z.string().optional(),
  notes: z.string().optional(),
});

export type SalesEntryFormValues = z.infer<typeof salesEntrySchema>;
