"use client";

import { useState, forwardRef, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { salesEntrySchema, SalesEntryFormValues } from "@/lib/schemas/sales";
import { formatNumberWithCommas } from "@/lib/utils/format";

const NON_DIGIT_DECIMAL_REGEX = /[^0-9.]/g;
const COMMA_FORMAT_REGEX = /\B(?=(\d{3})+(?!\d))/g;
const COMMA_REMOVE_REGEX = /,/g;

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [inputValue, setInputValue] = useState(() => {
      if (value === 0 || value === undefined || Number.isNaN(value)) return "";
      return formatNumberWithCommas(value);
    });
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
      setPrevValue(value);
      const parsedInput = parseFloat(inputValue.replace(COMMA_REMOVE_REGEX, '')) || 0;
      if (parsedInput !== value) {
        if (value === 0 || value === undefined || Number.isNaN(value)) {
          setInputValue("");
        } else {
          setInputValue(formatNumberWithCommas(value));
        }
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      
      // Remove non-digits and non-decimals
      val = val.replace(NON_DIGIT_DECIMAL_REGEX, '');
      
      // Prevent multiple decimals
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Format with commas using utility
      let formatted = val;
      if (val) {
        const newParts = val.split('.');
        if (newParts[0] !== '') {
          // Remove leading zeros unless it's just "0"
          newParts[0] = parseInt(newParts[0], 10).toString();
          // Add commas using logic from utility or calling it
          newParts[0] = newParts[0].replace(COMMA_FORMAT_REGEX, ',');
        }
        formatted = newParts.join('.');
      }
      
      setInputValue(formatted);
      const parsed = parseFloat(val.replace(COMMA_REMOVE_REGEX, ''));
      onChange(isNaN(parsed) ? 0 : parsed);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

interface SalesEntryFormProps {
  initialValues?: SalesEntryFormValues;
  onSubmit: (data: SalesEntryFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function SalesEntryForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save Entry"
}: SalesEntryFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesEntryFormValues>({
    resolver: standardSchemaResolver(salesEntrySchema),
    defaultValues: initialValues || {
      date: new Date(),
      weekly_sales: 0,
      split_percentage: 60,
      primary_expenses: 0,
      expense_type: "",
      notes: "",
    },
  });

  const currentSplit = useWatch({
    control,
    name: "split_percentage",
  });

  // Effect to reset form if initialValues change (useful for edit modals)
  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4">
      
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Date</Label>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <Input 
              id="date"
              type="date"
              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                field.onChange(isNaN(newDate.getTime()) ? undefined : newDate);
              }}
              disabled={isSubmitting}
              aria-invalid={!!errors.date}
              style={{ colorScheme: "dark" }}
              autoComplete="off"
            />
          )}
        />
        {errors.date ? (
          <span className="text-xs text-destructive">{errors.date.message}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="weekly_sales">Weekly Sales (₱)</Label>
        <Controller
          control={control}
          name="weekly_sales"
          render={({ field }) => (
            <CurrencyInput 
              id="weekly_sales" 
              placeholder="0.00"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              aria-invalid={!!errors.weekly_sales}
              autoComplete="off"
            />
          )}
        />
        {errors.weekly_sales ? (
          <span className="text-xs text-destructive">{errors.weekly_sales.message}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="split_percentage">Owner Split (%)</Label>
        <Controller
          control={control}
          name="split_percentage"
          render={({ field }) => (
            <Input 
              id="split_percentage" 
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 60"
              value={field.value || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                field.onChange(isNaN(val) ? undefined : val);
              }}
              disabled={isSubmitting}
              aria-invalid={!!errors.split_percentage}
              autoComplete="off"
            />
          )}
        />
        {errors.split_percentage ? (
          <span className="text-xs text-destructive">{errors.split_percentage.message}</span>
        ) : (
          <span className="text-xs text-muted-foreground mt-1">
            {currentSplit === 100 ? (
              <span className="text-primary font-medium">Solo Mode active. 100% to Owner.</span>
            ) : (
              `Partner will receive the remaining ${100 - (currentSplit || 0)}%.`
            )}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="primary_expenses">{currentSplit === 100 ? "Expenses (₱)" : "Owner Expenses (₱)"}</Label>
        <Controller
          control={control}
          name="primary_expenses"
          render={({ field }) => (
            <CurrencyInput 
              id="primary_expenses" 
              placeholder="0.00"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              aria-invalid={!!errors.primary_expenses}
              autoComplete="off"
            />
          )}
        />
        {errors.primary_expenses ? (
          <span className="text-xs text-destructive">{errors.primary_expenses.message}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expense_type">Expense Type (Optional)</Label>
        <Controller
          control={control}
          name="expense_type"
          render={({ field }) => (
            <Input 
              id="expense_type" 
              placeholder="e.g. Electricity, Repairs"
              {...field}
              disabled={isSubmitting}
              aria-invalid={!!errors.expense_type}
              autoComplete="off"
            />
          )}
        />
        {errors.expense_type ? (
          <span className="text-xs text-destructive">{errors.expense_type.message}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Textarea 
              id="notes" 
              placeholder="Any additional notes for this week"
              className="resize-none"
              {...field}
              disabled={isSubmitting}
              aria-invalid={!!errors.notes}
              autoComplete="off"
            />
          )}
        />
        {errors.notes ? (
          <span className="text-xs text-destructive">{errors.notes.message}</span>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
