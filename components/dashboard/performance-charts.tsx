"use client";

import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
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
  monthlyDataByYear: Record<string, { month: string; net: number; partner: number }[]>;
  yearlyData: { year: string; net: number; partner: number }[];
  availableYears: string[];
}

const chartConfig = {
  net: {
    label: "Owner Net",
    color: "hsl(var(--chart-1))",
  },
  partner: {
    label: "Partner Share",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function PerformanceCharts({ monthlyDataByYear, yearlyData, availableYears }: PerformanceChartsProps) {
  const currentYearStr = new Date().getFullYear().toString();
  const defaultYear = availableYears.includes(currentYearStr) ? currentYearStr : (availableYears[0] || currentYearStr);
  
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(defaultYear);
  const [selectedYearRange, setSelectedYearRange] = useState<string>("all");

  const monthlyDataToDisplay = monthlyDataByYear[selectedMonthYear] || [];

  const yearlyDataToDisplay = useMemo(() => {
    if (selectedYearRange === "last3") {
      return yearlyData.slice(-3);
    } else if (selectedYearRange === "last5") {
      return yearlyData.slice(-5);
    }
    return yearlyData;
  }, [yearlyData, selectedYearRange]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-card border-border shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">Monthly Performance</CardTitle>
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
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart 
              accessibilityLayer 
              data={monthlyDataToDisplay} 
              margin={{ top: 20, right: 0, bottom: 0, left: 0 }} 
              barGap={2}
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
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend 
                content={<ChartLegendContent />} 
                verticalAlign="bottom" 
                height={36} 
              />
              <Bar dataKey="net" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="partner" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">Yearly Performance</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Annual revenue distribution over time</CardDescription>
          </div>
          <Select 
            value={selectedYearRange} 
            onValueChange={setSelectedYearRange}
          >
            <SelectTrigger className="w-[160px] bg-background/50 border-border" aria-label="Select yearly range">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Select Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last3">Last 3 Years</SelectItem>
              <SelectItem value="last5">Last 5 Years</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart 
              accessibilityLayer 
              data={yearlyDataToDisplay} 
              margin={{ top: 20, right: 0, bottom: 0, left: 0 }} 
              barGap={2}
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
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend 
                content={<ChartLegendContent />} 
                verticalAlign="bottom" 
                height={36} 
              />
              <Bar dataKey="net" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="partner" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
