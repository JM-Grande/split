"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";

interface DashboardYearFilterProps {
  availableYears: string[];
  defaultYear: string;
}

export function DashboardYearFilter({ availableYears, defaultYear }: DashboardYearFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSelectedYear = searchParams.get("year") || defaultYear;

  const [isPending, startTransition] = useTransition();

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  if (availableYears.length === 0) return null;

  return (
    <Select 
      value={currentSelectedYear} 
      onValueChange={handleYearChange}
      disabled={isPending}
    >
      <SelectTrigger 
        className={`w-[180px] bg-transparent border-border text-foreground hover:bg-accent/50 shadow-none ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Filter dashboard metrics by year"
      >
        <div className="flex items-center">
          <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <SelectValue placeholder="Year to Date" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableYears.map(year => (
          <SelectItem key={year} value={year}>
            Year to Date ({year})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
