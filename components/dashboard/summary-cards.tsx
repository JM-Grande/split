import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Library } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface SummaryCardsProps {
  totalGross: number;
  netRevenue: number;
  partnerShare: number;
  totalExpenses: number;
  grossGrowth: number;
}

export function SummaryCards({ totalGross, netRevenue, partnerShare, totalExpenses, grossGrowth }: SummaryCardsProps) {
  const isPositive = grossGrowth >= 0;
  const totalNetAndPartner = netRevenue + partnerShare;
  const blendedNetPercent = totalNetAndPartner > 0 ? (netRevenue / totalNetAndPartner) * 100 : 0;
  const blendedPartnerPercent = totalNetAndPartner > 0 ? (partnerShare / totalNetAndPartner) * 100 : 0;

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Gross Sales
          </CardTitle>
          <div className="h-8 w-8 rounded-md bg-accent/50 flex items-center justify-center text-primary border border-border" aria-hidden="true">
            <Library className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 min-w-0">
          <div 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono tracking-tight text-foreground tabular-nums truncate" 
            title={formatCurrency(totalGross)}
          >
            {formatCurrency(totalGross)}
          </div>
          <div className="mt-4 sm:mt-6 flex items-center text-sm flex-wrap gap-2">
            <Badge 
              variant="secondary" 
              className={`${
                isPositive 
                  ? "bg-secondary/20 text-secondary hover:bg-secondary/30" 
                  : "bg-destructive/20 text-destructive hover:bg-destructive/30"
              } rounded-sm px-1.5 py-0.5 font-mono text-[10px] flex items-center`}
            >
              {isPositive ? (
                <TrendingUp className="mr-1 size-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="mr-1 size-3" aria-hidden="true" />
              )}
              {isPositive ? "+" : ""}{grossGrowth.toFixed(1)}%
            </Badge>
            <span className="text-muted-foreground text-[11px] whitespace-nowrap">vs last period</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-none flex flex-col justify-between">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 min-w-0 flex-1 flex flex-col justify-between">
          <div 
            className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-chart-2 tabular-nums truncate" 
            title={formatCurrency(totalExpenses)}
          >
            {formatCurrency(totalExpenses)}
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
               <div className="h-full bg-chart-2 w-full rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-none flex flex-col justify-between">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Owner Net Revenue {totalNetAndPartner > 0 && <Badge variant="outline" className="bg-accent/50 text-muted-foreground border-border text-[10px] px-1 py-0 rounded-sm font-normal">Avg {Math.round(blendedNetPercent)}%</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 min-w-0 flex-1 flex flex-col justify-between">
          <div 
            className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-chart-1 tabular-nums truncate" 
            title={formatCurrency(netRevenue)}
          >
            {formatCurrency(netRevenue)}
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
               <div className="h-full bg-chart-1 rounded-full transition-all" style={{ width: `${blendedNetPercent}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-none flex flex-col justify-between">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Partner Share {totalNetAndPartner > 0 && <Badge variant="outline" className="bg-accent/50 text-muted-foreground border-border text-[10px] px-1 py-0 rounded-sm font-normal">Avg {Math.round(blendedPartnerPercent)}%</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 min-w-0 flex-1 flex flex-col justify-between">
          <div 
            className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-chart-2 tabular-nums truncate" 
            title={formatCurrency(partnerShare)}
          >
            {formatCurrency(partnerShare)}
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
               <div className="h-full bg-chart-2 rounded-full transition-all" style={{ width: `${blendedPartnerPercent}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
