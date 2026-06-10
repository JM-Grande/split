import { WeeklySale } from "@/lib/domain/sales";

export interface DashboardMetrics {
  totalGross: number;
  netRevenue: number;
  partnerShare: number;
  totalExpenses: number;
  grossGrowth: number;
  monthlyDataByYear: Record<string, { month: string; net: number; partner: number }[]>;
  yearlyData: { year: string; net: number; partner: number }[];
  availableYears: string[];
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
export function calculateDashboardMetrics(sales: WeeklySale[], selectedYearStr?: string): DashboardMetrics {
  const currentYearStr = new Date().getFullYear().toString();
  const targetYearStr = selectedYearStr || currentYearStr;

  if (sales.length === 0) {
    const emptyMonthlyData = MONTHS.map((month) => ({ month, net: 0, partner: 0 }));
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
  const yearlyMap = new Map<string, { net: number; partner: number }>();
  sales.forEach((s) => {
    const year = s.date.getFullYear().toString();
    const current = yearlyMap.get(year) || { net: 0, partner: 0 };
    yearlyMap.set(year, {
      net: current.net + s.primaryNetRevenue,
      partner: current.partner + s.secondaryShare,
    });
  });

  const yearlyData = Array.from(yearlyMap.entries())
    .map(([year, data]) => ({
      year,
      net: Math.round(data.net),
      partner: Math.round(data.partner),
    }))
    .sort((a, b) => a.year.localeCompare(b.year));


  // 3. Monthly Aggregation (All Years, All 12 Months)
  const monthlyDataByYear: Record<string, { month: string; net: number; partner: number }[]> = {};
  
  availableYears.forEach(year => {
    const monthlyMap = new Map<number, { net: number; partner: number }>();
    
    sales
      .filter((s) => s.date.getFullYear().toString() === year)
      .forEach((s) => {
        const month = s.date.getMonth();
        const current = monthlyMap.get(month) || { net: 0, partner: 0 };
        monthlyMap.set(month, {
          net: current.net + s.primaryNetRevenue,
          partner: current.partner + s.secondaryShare,
        });
      });

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const data = monthlyMap.get(i) || { net: 0, partner: 0 };
      monthlyData.push({
        month: MONTHS[i],
        net: Math.round(data.net),
        partner: Math.round(data.partner),
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
