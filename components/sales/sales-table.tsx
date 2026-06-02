"use client";

import { useState, useDeferredValue, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Eye, FileText, Trash2, Loader2, Pencil, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeeklySale } from "@/lib/domain/sales";

import { formatCurrency, formatDate } from "@/lib/utils/format";
import { deleteSalesEntry } from "@/app/sales/actions";
import { EditEntryModal } from "./edit-entry-modal";

interface SalesTableProps {
  data: WeeklySale[];
}

interface SalesTableRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function SalesTableRowActions({ onView, onEdit, onDelete, isDeleting }: SalesTableRowActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={onView}
      >
        <Eye className="size-4" />
        <span className="sr-only">View</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={onEdit}
      >
        <Pencil className="size-4" />
        <span className="sr-only">Edit</span>
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="size-8 text-muted-foreground hover:text-destructive transition-colors"
        onClick={onDelete}
      >
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
}

export function SalesTable({ data }: SalesTableProps) {
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Year Filter State
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  // Split Filter State
  const [splitFilter, setSplitFilter] = useState<"all" | "solo" | "split">("all");

  const availableYears = useMemo(() => {
    return Array.from(new Set([
      currentYear,
      ...data.map(sale => new Date(sale.date).getFullYear().toString())
    ])).sort((a, b) => parseInt(b) - parseInt(a));
  }, [data, currentYear]);

  // Filter logic
  const preparedData = useMemo(() => {
    return data.map(sale => ({
      ...sale,
      _year: new Date(sale.date).getFullYear().toString(),
      _formattedDate: formatDate(sale.date).toLowerCase(),
      _expenseType: (sale.expenseType || "").toLowerCase(),
      _notes: (sale.notes || "").toLowerCase(),
      _recordId: (sale.id || "").toLowerCase(),
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    return preparedData.filter((sale) => {
      if (selectedYear !== "all" && sale._year !== selectedYear) return false;

      if (splitFilter === "solo" && sale.primarySplitPercentage < 100) return false;
      if (splitFilter === "split" && sale.primarySplitPercentage === 100) return false;

      if (!deferredQuery) return true;
      
      const query = deferredQuery.toLowerCase();

      return (
        sale._formattedDate.includes(query) ||
        sale._expenseType.includes(query) ||
        sale._notes.includes(query) ||
        sale._recordId.includes(query)
      );
    });
  }, [preparedData, selectedYear, splitFilter, deferredQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  const [viewSale, setViewSale] = useState<WeeklySale | null>(null);
  const [editSale, setEditSale] = useState<WeeklySale | null>(null);
  const [deleteSale, setDeleteSale] = useState<WeeklySale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine if we are in "Solo View" (either explicitly selected or all visible records are 100%)
  const isSoloView = splitFilter === "solo" || (currentData.length > 0 && currentData.every(sale => sale.primarySplitPercentage === 100));

  const handleDelete = async () => {
    if (!deleteSale?.id) return;
    setIsDeleting(true);
    try {
      const result = await deleteSalesEntry(deleteSale.id);
      if (result.success) {
        toast.success("Sales entry deleted successfully");
        setDeleteSale(null);
      } else {
        toast.error(result.error || "Failed to delete entry");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-accent/20">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search by date, notes, or expense type..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-background/50 border-border focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            value={splitFilter} 
            onValueChange={(val) => {
              if (val) {
                setSplitFilter(val as "all" | "solo" | "split");
                setCurrentPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[140px] bg-background/50 border-border">
              <div className="flex items-center">
                <Filter className="mr-2 size-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="View Mode" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">View All</SelectItem>
              <SelectItem value="solo">Solo Only</SelectItem>
              <SelectItem value="split">Split Only</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={selectedYear} 
            onValueChange={(val) => {
              if (val) {
                setSelectedYear(val);
                setCurrentPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[140px] bg-background/50 border-border">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select Year" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-accent/40">
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="font-semibold text-xs tracking-widest text-muted-foreground h-12">DATE</TableHead>
            <TableHead className="font-semibold text-xs tracking-widest text-muted-foreground h-12 text-center">{isSoloView ? "GROSS SALES" : "WEEKLY SALES"}</TableHead>
            {!isSoloView && <TableHead className="font-semibold text-xs tracking-widest text-muted-foreground h-12 text-center">OWNER SHARE</TableHead>}
            <TableHead className="font-semibold text-xs tracking-widest text-muted-foreground h-12 text-center">{isSoloView ? "EXPENSES" : "OWNER EXPENSES"}</TableHead>
            <TableHead className="font-semibold text-xs tracking-widest text-muted-foreground h-12 text-right">{isSoloView ? "NET REVENUE" : "OWNER REVENUE"}</TableHead>
            <TableHead className="font-semibold text-xs tracking-widest text-muted-foreground h-12 text-center w-[100px]">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((row) => (
            <TableRow key={row.id} className="border-border hover:bg-accent/30 transition-colors">
              <TableCell className="font-medium h-16">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {formatDate(row.date)}
                </div>
              </TableCell>
              <TableCell className="font-mono text-[14px] text-center tabular-nums">{formatCurrency(row.grossSales)}</TableCell>
              {!isSoloView && (
                <TableCell className="font-mono text-[14px] text-center tabular-nums">
                  {formatCurrency(row.primaryShare)}
                  <span className="ml-2 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm">
                    {row.primarySplitPercentage}/{100 - row.primarySplitPercentage}
                  </span>
                </TableCell>
              )}
              <TableCell className="font-mono text-[14px] text-center text-chart-2 tabular-nums">
                {formatCurrency(row.primaryExpenses)}
              </TableCell>
              <TableCell className={cn("font-mono text-[14px] text-right tabular-nums", row.primaryNetRevenue < 0 ? "text-destructive" : "text-chart-1")}>
                {formatCurrency(row.primaryNetRevenue)}
              </TableCell>
              <TableCell className="text-center">
                <SalesTableRowActions 
                  onView={() => setViewSale(row)}
                  onEdit={() => setEditSale(row)}
                  onDelete={() => setDeleteSale(row)}
                  isDeleting={isDeleting && deleteSale?.id === row.id}
                />
              </TableCell>
            </TableRow>
          ))}
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isSoloView ? 5 : 6} className="h-24 text-center text-muted-foreground">
                {searchQuery ? "No matching records found." : "No sales records found."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-accent/20">
        <div>Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{endIndex} of {filteredData.length} weeks</div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="size-8 bg-background/50 border-border text-foreground hover:bg-accent disabled:opacity-50" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="size-8 bg-background/50 border-border text-foreground hover:bg-accent disabled:opacity-50" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>

      {/* Hoisted Modals */}
      <Dialog open={!!viewSale} onOpenChange={(open) => !open && setViewSale(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Week ending on {viewSale ? formatDate(viewSale.date) : ''}
            </DialogDescription>
          </DialogHeader>
          {viewSale ? (
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Gross Sales</span>
                <span className="font-mono">{formatCurrency(viewSale.grossSales)}</span>
              </div>
              {viewSale.primarySplitPercentage < 100 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Owner Share ({viewSale.primarySplitPercentage}%)</span>
                    <span className="font-mono text-muted-foreground">{formatCurrency(viewSale.primaryShare)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Partner Share ({100 - viewSale.primarySplitPercentage}%)</span>
                    <span className="font-mono text-muted-foreground">{formatCurrency(viewSale.secondaryShare)}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium text-chart-2">{viewSale.primarySplitPercentage === 100 ? "Expenses" : "Owner Expenses"}</span>
                <span className="font-mono text-chart-2 font-medium">{formatCurrency(viewSale.primaryExpenses)}</span>
              </div>
              <div className="flex justify-between items-start pl-4 border-l-2 border-border mt-1">
                <span className="text-sm text-muted-foreground shrink-0 mr-4">Breakdown</span>
                {viewSale.expenseType ? (
                  <span className="text-sm text-right text-muted-foreground leading-snug break-words max-w-[200px] sm:max-w-[250px]">
                    {viewSale.expenseType}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic">
                    Uncategorized
                  </span>
                )}
              </div>
              
              <div className="border-t border-border my-2"></div>
              
              <div className="flex justify-between items-center">
                <span className={cn("font-bold text-lg", viewSale.primaryNetRevenue < 0 ? "text-destructive" : "text-chart-1")}>{viewSale.primarySplitPercentage === 100 ? "Net Revenue" : "Owner Net Revenue"}</span>
                <span className={cn("font-mono font-bold text-lg", viewSale.primaryNetRevenue < 0 ? "text-destructive" : "text-chart-1")}>{formatCurrency(viewSale.primaryNetRevenue)}</span>
              </div>
              
              <div className="mt-4 p-4 bg-muted/30 border border-border rounded-lg relative overflow-hidden">
                <div className={cn("absolute left-0 top-0 bottom-0 w-1", viewSale.notes ? "bg-primary" : "bg-muted-foreground/30")}></div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={cn("size-4", viewSale.notes ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Notes</p>
                </div>
                {viewSale.notes ? (
                  <p className="text-sm text-foreground leading-relaxed">{viewSale.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes recorded for this week.</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <EditEntryModal 
        sale={editSale} 
        open={!!editSale} 
        onOpenChange={(open) => !open && setEditSale(null)} 
      />

      <AlertDialog open={!!deleteSale} onOpenChange={(open) => !open && !isDeleting && setDeleteSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sales record for the week ending on {deleteSale ? formatDate(deleteSale.date) : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Prevent modal from closing immediately
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
