"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { WeeklySale } from "@/lib/domain/sales";
import { formatDate } from "@/lib/utils/format";
import { toast } from "sonner";

interface ExportCsvButtonProps {
  data: WeeklySale[];
}

export function ExportCsvButton({ data }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Define headers
      const headers = [
        "Date",
        "Weekly Sales",
        "Owner Split (%)",
        "Owner Share",
        "Partner Share",
        "Owner Expenses",
        "Expense Type",
        "Owner Net Revenue",
        "Notes"
      ];

      // Format rows
      const rows = data.map((sale) => [
        formatDate(sale.date),
        sale.grossSales.toFixed(2),
        sale.primarySplitPercentage.toString(),
        sale.primaryShare.toFixed(2),
        sale.secondaryShare.toFixed(2),
        sale.primaryExpenses.toFixed(2),
        sale.expenseType ? `"${sale.expenseType}"` : "",
        sale.primaryNetRevenue.toFixed(2),
        sale.notes ? `"${sale.notes.replace(/"/g, '""')}"` : ""// Escape quotes
      ]);

      // Combine into CSV string
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(","))
      ].join("\n");

      // Create Blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `split-sales-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export CSV");
    }
  };

  return (
    <Button 
      variant="outline" 
      className="bg-transparent border-outline-variant text-foreground hover:bg-surface-bright shadow-none"
      onClick={handleExport}
    >
      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
      Export CSV
    </Button>
  );
}
