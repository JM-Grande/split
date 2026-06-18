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
import { Filter as FilterIcon } from "lucide-react";

export function DashboardTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSelectedType = searchParams.get("type") || "all";

  const [isPending, startTransition] = useTransition();

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  return (
    <Select 
      value={currentSelectedType} 
      onValueChange={handleTypeChange}
      disabled={isPending}
    >
      <SelectTrigger 
        className={`w-[140px] bg-transparent border-border text-foreground hover:bg-accent/50 shadow-none ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Filter dashboard metrics by type"
      >
        <div className="flex items-center">
          <FilterIcon className="mr-2 size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <SelectValue placeholder="All Sales" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Sales</SelectItem>
        <SelectItem value="solo">Solo Sales</SelectItem>
        <SelectItem value="split">Split Sales</SelectItem>
      </SelectContent>
    </Select>
  );
}
