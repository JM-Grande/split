import { WeeklySale } from "@/lib/domain/sales";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export type InsightType = 'trend' | 'anomaly' | 'milestone' | 'comparison' | 'health';

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

export function generateInsights(sales: WeeklySale[]): Insight[] {
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
