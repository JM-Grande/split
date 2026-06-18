"use client";

import { useState, useMemo } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";

interface PerformanceChartsProps {
  monthlyDataByYear: Record<string, { month: string; net: number; partner: number; expenses: number; gross: number }[]>;
  yearlyData: { year: string; net: number; partner: number; expenses: number; gross: number }[];
  availableYears: string[];
}

const chartConfig = {
  net: {
    label: "Owner Net",
    color: "var(--color-chart-1)",
  },
  partner: {
    label: "Partner Share",
    color: "var(--color-chart-2)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--color-chart-4)",
  },
  gross: {
    label: "Gross Sales",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    payload: {
      gross?: number;
      net?: number;
      partner?: number;
      expenses?: number;
    };
  }[];
  label?: string;
  activeSeries?: Record<string, boolean>;
}

function InteractiveLegend({ activeSeries, toggleSeries }: { activeSeries: Record<string, boolean>; toggleSeries: (key: string) => void }) {
  const seriesKeys = ["expenses", "gross", "net", "partner"] as const;
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 pb-6 pt-2">
      {seriesKeys.map((key) => {
        const itemConfig = chartConfig[key];
        const isActive = activeSeries[key] !== false;

        return (
          <button
            key={key}
            onClick={() => toggleSeries(key)}
            className={cn(
              "flex items-center gap-2 cursor-pointer transition-all text-xs sm:text-sm hover:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              isActive ? "opacity-100" : "opacity-40"
            )}
            type="button"
            aria-pressed={isActive}
            aria-label={`Toggle ${itemConfig.label}`}
          >
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: isActive ? itemConfig.color : "var(--muted-foreground)" }}
            />
            <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground line-through decoration-muted-foreground/50"}>
              {itemConfig.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CustomChartTooltip({ active, payload, label, activeSeries }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  if (!data) return null;
  const gross = data.gross ?? 0;
  const net = data.net ?? 0;
  const partner = data.partner ?? 0;
  const expenses = data.expenses ?? 0;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5 font-mono">
        {gross > 0 && activeSeries?.gross !== false && (
          <div className="flex items-center justify-between gap-8 text-[11px] border-b border-border pb-1 mb-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-sans">
              <div className="size-2 rounded-full" style={{ backgroundColor: "var(--color-gross)" }} />
              <span>Gross Sales</span>
            </div>
            <span className="text-foreground font-semibold">{formatCurrency(gross)}</span>
          </div>
        )}
        {net > 0 && activeSeries?.net !== false && (
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-1.5 text-muted-foreground font-sans">
              <div className="size-2 rounded-full" style={{ backgroundColor: "var(--color-net)" }} />
              <span>Owner Net</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-foreground">{formatCurrency(net)}</span>
              {gross > 0 && (
                <span className="text-[10px] text-muted-foreground">({((net / gross) * 100).toFixed(0)}%)</span>
              )}
            </div>
          </div>
        )}
        {partner > 0 && activeSeries?.partner !== false && (
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-1.5 text-muted-foreground font-sans">
              <div className="size-2 rounded-full" style={{ backgroundColor: "var(--color-partner)" }} />
              <span>Partner Share</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-foreground">{formatCurrency(partner)}</span>
              {gross > 0 && (
                <span className="text-[10px] text-muted-foreground">({((partner / gross) * 100).toFixed(0)}%)</span>
              )}
            </div>
          </div>
        )}
        {expenses > 0 && activeSeries?.expenses !== false && (
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-1.5 text-muted-foreground font-sans">
              <div className="size-2 rounded-full" style={{ backgroundColor: "var(--color-expenses)" }} />
              <span>Expenses</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-foreground">{formatCurrency(expenses)}</span>
              {gross > 0 && (
                <span className="text-[10px] text-muted-foreground">({((expenses / gross) * 100).toFixed(0)}%)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PerformanceCharts({ monthlyDataByYear, yearlyData, availableYears }: PerformanceChartsProps) {
  const currentYearStr = new Date().getFullYear().toString();
  const defaultYear = availableYears.includes(currentYearStr) ? currentYearStr : (availableYears[0] || currentYearStr);
  
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(defaultYear);
  
  const defaultTo = availableYears.length > 0 ? availableYears[0] : currentYearStr;
  const oldestAvailable = availableYears.length > 0 ? availableYears[availableYears.length - 1] : currentYearStr;
  const defaultFrom = Math.max(parseInt(oldestAvailable), parseInt(defaultTo) - 11).toString();

  const [fromYear, setFromYear] = useState<string>(defaultFrom);
  const [toYear, setToYear] = useState<string>(defaultTo);

  const monthlyDataToDisplay = monthlyDataByYear[selectedMonthYear] || [];

  const allYearsOptions = useMemo(() => {
    if (availableYears.length === 0) return [currentYearStr];
    const latest = parseInt(availableYears[0]);
    const oldest = parseInt(availableYears[availableYears.length - 1]);
    const years = [];
    for (let y = latest; y >= oldest; y--) {
      years.push(y.toString());
    }
    return years;
  }, [availableYears, currentYearStr]);

  const yearlyDataToDisplay = useMemo(() => {
    const from = parseInt(fromYear);
    const to = parseInt(toYear);
    const dataMap = new Map(yearlyData.map(d => [d.year, d]));
    
    const result = [];
    for (let y = from; y <= to; y++) {
      const yearStr = y.toString();
      if (dataMap.has(yearStr)) {
        result.push(dataMap.get(yearStr)!);
      } else {
        result.push({
          year: yearStr,
          net: 0,
          partner: 0,
          expenses: 0,
          gross: 0,
        });
      }
    }
    return result;
  }, [yearlyData, fromYear, toYear]);

  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    net: true,
    partner: true,
    expenses: true,
    gross: true,
  });

  const toggleSeries = (key: string) => {
    setActiveSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFromYearChange = (year: string) => {
    setFromYear(year);
    if (toYear < year) {
      setToYear(year);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-card border-border shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground text-balance">Monthly Performance</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Revenue distribution for {selectedMonthYear}</CardDescription>
          </div>
          <Select 
            value={selectedMonthYear} 
            onValueChange={setSelectedMonthYear}
          >
            <SelectTrigger className="w-[140px] bg-background/50 border-border" aria-label="Select monthly performance year">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Select Year" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <InteractiveLegend activeSeries={activeSeries} toggleSeries={toggleSeries} />
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ComposedChart 
              accessibilityLayer 
              data={monthlyDataToDisplay} 
              margin={{ top: 20, right: 0, bottom: 0, left: 0 }} 
              maxBarSize={16}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                content={<CustomChartTooltip activeSeries={activeSeries} />}
              />
              <Bar hide={!activeSeries.net} dataKey="net" stackId="a" fill="var(--color-net)" />
              <Bar hide={!activeSeries.partner} dataKey="partner" stackId="a" fill="var(--color-partner)" />
              <Bar hide={!activeSeries.expenses} dataKey="expenses" stackId="a" fill="var(--color-expenses)" radius={[2, 2, 0, 0]} />
              <Line 
                hide={!activeSeries.gross}
                type="monotone" 
                dataKey="gross" 
                stroke="var(--color-gross)" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground text-balance">Yearly Performance</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Annual revenue distribution over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From</span>
            <Select 
              value={fromYear} 
              onValueChange={handleFromYearChange}
            >
              <SelectTrigger className="w-[110px] bg-background/50 border-border" aria-label="Select start year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {allYearsOptions.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">To</span>
            <Select 
              value={toYear} 
              onValueChange={setToYear}
            >
              <SelectTrigger className="w-[110px] bg-background/50 border-border" aria-label="Select end year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {allYearsOptions.map(year => (
                  <SelectItem 
                    key={year} 
                    value={year}
                    disabled={year < fromYear}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <InteractiveLegend activeSeries={activeSeries} toggleSeries={toggleSeries} />
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ComposedChart 
              accessibilityLayer 
              data={yearlyDataToDisplay} 
              margin={{ top: 20, right: 0, bottom: 0, left: 0 }} 
              maxBarSize={32}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                content={<CustomChartTooltip activeSeries={activeSeries} />}
              />
              <Bar hide={!activeSeries.net} dataKey="net" stackId="a" fill="var(--color-net)" />
              <Bar hide={!activeSeries.partner} dataKey="partner" stackId="a" fill="var(--color-partner)" />
              <Bar hide={!activeSeries.expenses} dataKey="expenses" stackId="a" fill="var(--color-expenses)" radius={[2, 2, 0, 0]} />
              <Line 
                hide={!activeSeries.gross}
                type="monotone" 
                dataKey="gross" 
                stroke="var(--color-gross)" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
