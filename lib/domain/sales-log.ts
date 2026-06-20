import { WeeklySale } from "@/lib/domain/sales";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export interface DashboardMetrics {
  totalGross: number;
  netRevenue: number;
  partnerShare: number;
  totalExpenses: number;
  grossGrowth: number;
  monthlyDataByYear: Record<string, { month: string; net: number; partner: number; expenses: number; gross: number }[]>;
  yearlyData: { year: string; net: number; partner: number; expenses: number; gross: number }[];
  availableYears: string[];
}

export type InsightType = 'trend' | 'anomaly' | 'milestone' | 'comparison' | 'health';

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * Calculates dashboard metrics from raw weekly sales data.
 * Adheres to the codebase's "Deep Module" architecture and Vercel's "Server Serialization" best practice.
 * 
 * @param sales - Array of WeeklySale records from the database
 * @param selectedYearStr - Optional year string to filter YTD totals. Defaults to current year.
 * @returns Aggregated metrics for display
 */
export function getDashboardMetrics(
  sales: WeeklySale[],
  selectedYearStr?: string,
  filterType: 'all' | 'solo' | 'split' = 'all'
): DashboardMetrics {
  const currentYearStr = new Date().getFullYear().toString();
  const targetYearStr = selectedYearStr || currentYearStr;

  if (sales.length === 0) {
    const emptyMonthlyData = MONTHS.map((month) => ({ month, net: 0, partner: 0, expenses: 0, gross: 0 }));
    return {
      totalGross: 0,
      netRevenue: 0,
      partnerShare: 0,
      totalExpenses: 0,
      grossGrowth: 0,
      monthlyDataByYear: { [currentYearStr]: emptyMonthlyData },
      yearlyData: [],
      availableYears: [currentYearStr],
    };
  }

  // Determine available years early to ensure targetYear is valid
  const availableYearsSet = new Set<string>();
  availableYearsSet.add(currentYearStr);
  sales.forEach(s => availableYearsSet.add(s.date.getFullYear().toString()));
  const availableYears = Array.from(availableYearsSet).sort((a, b) => b.localeCompare(a));
  
  // Validate target year, fallback to current if not in data and not current
  const finalTargetYear = availableYears.includes(targetYearStr) ? targetYearStr : currentYearStr;

  // Apply type filter
  let filteredSales = sales;
  if (filterType === 'solo') {
    filteredSales = sales.filter(s => s.secondaryShare === 0);
  } else if (filterType === 'split') {
    filteredSales = sales.filter(s => s.secondaryShare > 0);
  }
  sales = filteredSales;

  // 1. Calculate Totals (Filtered by selected Year to Date)
  const ytdSales = sales.filter(s => s.date.getFullYear().toString() === finalTargetYear);
  const { totalGross, netRevenue, partnerShare, totalExpenses } = ytdSales.reduce(
    (acc, s) => {
      acc.totalGross += s.grossSales;
      acc.netRevenue += s.primaryNetRevenue;
      acc.partnerShare += s.secondaryShare;
      acc.totalExpenses += s.primaryExpenses;
      return acc;
    },
    { totalGross: 0, netRevenue: 0, partnerShare: 0, totalExpenses: 0 }
  );

  // 2. Yearly Aggregation (All Time)
  const yearlyMap = new Map<string, { net: number; partner: number; expenses: number; gross: number }>();
  sales.forEach((s) => {
    const year = s.date.getFullYear().toString();
    const current = yearlyMap.get(year) || { net: 0, partner: 0, expenses: 0, gross: 0 };
    yearlyMap.set(year, {
      net: current.net + s.primaryNetRevenue,
      partner: current.partner + s.secondaryShare,
      expenses: current.expenses + s.primaryExpenses,
      gross: current.gross + s.grossSales,
    });
  });

  const yearlyData = Array.from(yearlyMap.entries())
    .map(([year, data]) => ({
      year,
      net: Math.round(data.net),
      partner: Math.round(data.partner),
      expenses: Math.round(data.expenses),
      gross: Math.round(data.gross),
    }))
    .sort((a, b) => a.year.localeCompare(b.year));


  // 3. Monthly Aggregation (All Years, All 12 Months)
  const monthlyDataByYear: Record<string, { month: string; net: number; partner: number; expenses: number; gross: number }[]> = {};
  
  availableYears.forEach(year => {
    const monthlyMap = new Map<number, { net: number; partner: number; expenses: number; gross: number }>();
    
    sales
      .filter((s) => s.date.getFullYear().toString() === year)
      .forEach((s) => {
        const month = s.date.getMonth();
        const current = monthlyMap.get(month) || { net: 0, partner: 0, expenses: 0, gross: 0 };
        monthlyMap.set(month, {
          net: current.net + s.primaryNetRevenue,
          partner: current.partner + s.secondaryShare,
          expenses: current.expenses + s.primaryExpenses,
          gross: current.gross + s.grossSales,
        });
      });

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const data = monthlyMap.get(i) || { net: 0, partner: 0, expenses: 0, gross: 0 };
      monthlyData.push({
        month: MONTHS[i],
        net: Math.round(data.net),
        partner: Math.round(data.partner),
        expenses: Math.round(data.expenses),
        gross: Math.round(data.gross),
      });
    }
    monthlyDataByYear[year] = monthlyData;
  });

  // 4. Growth Calculation (Current Month vs Previous Month for the selected Year)
  // We'll look at the latest two months present in the selected YTD data
  const monthYearMap = new Map<string, number>();
  ytdSales.forEach(s => {
    const key = `${s.date.getFullYear()}-${s.date.getMonth()}`;
    monthYearMap.set(key, (monthYearMap.get(key) || 0) + s.grossSales);
  });

  const sortedMonthKeys = Array.from(monthYearMap.keys()).sort((a, b) => {
    const [, monthA] = a.split('-').map(Number);
    const [, monthB] = b.split('-').map(Number);
    return monthB - monthA;
  });

  let grossGrowth = 0;
  if (sortedMonthKeys.length >= 2) {
    const currentMonthGross = monthYearMap.get(sortedMonthKeys[0]) || 0;
    const lastMonthGross = monthYearMap.get(sortedMonthKeys[1]) || 0;
    if (lastMonthGross > 0) {
      grossGrowth = ((currentMonthGross - lastMonthGross) / lastMonthGross) * 100;
    }
  } else if (sortedMonthKeys.length === 1 && finalTargetYear !== currentYearStr) {
     // If only one month of data exists for a past year, it's hard to define "growth"
     // We'll leave it at 0 to avoid misleading 100% or Infinity metrics.
     grossGrowth = 0;
  }

  return {
    totalGross,
    netRevenue,
    partnerShare,
    totalExpenses,
    grossGrowth,
    monthlyDataByYear,
    yearlyData,
    availableYears,
  };
}

export function getInsights(sales: WeeklySale[]): Insight[] {
  if (!sales || sales.length === 0) return [];

  const sortedSales = [...sales].sort((a, b) => a.date.getTime() - b.date.getTime());
  const insights: Insight[] = [];

  // 1. Milestone: Best week ever
  let bestWeek = sortedSales[0];
  for (const sale of sortedSales) {
    if (sale.grossSales > bestWeek.grossSales) {
      bestWeek = sale;
    }
  }
  
  if (sortedSales.length > 1) {
    insights.push({
      id: `best-week-${bestWeek.id}`,
      type: 'milestone',
      message: `Your best week ever was ${formatDate(bestWeek.date)} at ${formatCurrency(bestWeek.grossSales)} gross.`,
      severity: 'success',
    });
  }

  // 2. Trend: Streak tracking
  let currentStreak = 0;
  for (let i = 1; i < sortedSales.length; i++) {
    if (sortedSales[i].grossSales > sortedSales[i - 1].grossSales) {
      currentStreak++;
    } else {
      currentStreak = 0;
    }
  }

  if (currentStreak >= 2) {
    insights.push({
      id: `growth-streak-${currentStreak}`,
      type: 'trend',
      message: `You had ${currentStreak + 1} consecutive weeks of growth. Current streak: ${currentStreak} weeks.`,
      severity: 'success',
    });
  }

  // 3. Anomaly: Expense Spikes
  if (sortedSales.length >= 4) {
    const expenses = sortedSales.map(s => s.primaryExpenses);
    const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    
    if (avgExpenses > 0) {
      const stdDev = Math.sqrt(expenses.reduce((sq, n) => sq + Math.pow(n - avgExpenses, 2), 0) / expenses.length);
      const latestSale = sortedSales[sortedSales.length - 1];
      
      // Threshold: 1.5 std devs above mean
      if (latestSale.primaryExpenses > avgExpenses + 1.5 * stdDev && latestSale.primaryExpenses > 0) {
        const percentage = Math.round(((latestSale.primaryExpenses - avgExpenses) / avgExpenses) * 100);
        const expenseDesc = latestSale.expenseType ? `'${latestSale.expenseType}'` : 'unspecified expenses';
        insights.push({
          id: `expense-spike-${latestSale.id}`,
          type: 'anomaly',
          message: `Recent expenses spiked ${percentage}% above normal — this was due to ${expenseDesc}.`,
          severity: 'warning',
        });
      }
    }
  }

  // 4. Comparison: Moving Average Drop
  if (sortedSales.length >= 6) {
    const recentCount = Math.min(4, Math.floor(sortedSales.length / 2));
    const recentSales = sortedSales.slice(-recentCount);
    const recentAvg = recentSales.reduce((sum, s) => sum + s.grossSales, 0) / recentCount;
    
    const historicalSales = sortedSales.slice(0, -recentCount);
    const historicalAvg = historicalSales.reduce((sum, s) => sum + s.grossSales, 0) / historicalSales.length;

    if (historicalAvg > 0 && recentAvg < historicalAvg * 0.85) {
      const dropPct = Math.round((1 - recentAvg / historicalAvg) * 100);
      insights.push({
        id: 'sales-drop-recent',
        type: 'comparison',
        message: `Your recent average (${formatCurrency(recentAvg)}) is ${dropPct}% below your historical average — investigate.`,
        severity: 'warning',
      });
    }
  }

  // 5. Expense Health Ratio (Always-On)
  if (sortedSales.length > 0) {
    const recent4 = sortedSales.slice(-4);
    const totalGross = recent4.reduce((sum, s) => sum + s.grossSales, 0);
    const totalExp = recent4.reduce((sum, s) => sum + s.primaryExpenses, 0);
    if (totalGross > 0) {
      const ratio = Math.round((totalExp / totalGross) * 100);
      // In a dynamic split, owner expenses reduce net revenue.
      // If expenses > 30% of gross, that's a significant chunk gone.
      const isHigh = ratio >= 30;
      
      insights.push({
        id: 'expense-health-ratio',
        type: 'health',
        message: `Over the last few weeks, expenses have accounted for ${ratio}% of your gross sales.`,
        severity: isHigh ? 'warning' : 'success',
      });
    }
  }

  // Sort by severity (warning > success > info) and limit to top 4
  const severityScore = { 'warning': 3, 'success': 2, 'info': 1 };
  insights.sort((a, b) => {
    if (severityScore[b.severity] !== severityScore[a.severity]) {
      return severityScore[b.severity] - severityScore[a.severity];
    }
    // Secondary sort: prefer anomalies and comparisons over milestones, trends, and health
    const typeScore = { 'anomaly': 5, 'comparison': 4, 'trend': 3, 'milestone': 2, 'health': 1 };
    return typeScore[b.type] - typeScore[a.type];
  });

  return insights.slice(0, 4);
}

export function getNotesForPeriod(sales: WeeklySale[]): WeeklySale[] {
  return sales.filter((s) => s.notes && s.notes.trim().length > 0);
}
