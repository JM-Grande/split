import { describe, it, expect } from "vitest";
import { getDashboardMetrics, getInsights, getNotesForPeriod } from "@/lib/domain/sales-log";
import { WeeklySale } from "@/lib/domain/sales";

describe("SalesLog Module", () => {
  const createMockSale = (overrides: Partial<WeeklySale>): WeeklySale => ({
    id: `rec-${Math.random()}`,
    ownerId: "user-1",
    date: new Date(),
    grossSales: 5000,
    primarySplitPercentage: 60,
    primaryShare: 3000,
    secondaryShare: 2000,
    primaryExpenses: 0,
    expenseType: null,
    primaryNetRevenue: 3000,
    notes: null,
    ...overrides,
  });

  const mockSalesForMetrics: WeeklySale[] = [
    {
      id: "1", ownerId: "user1", date: new Date("2024-01-01"),
      grossSales: 10000, primarySplitPercentage: 60, primaryShare: 6000, secondaryShare: 4000,
      primaryExpenses: 1000, expenseType: "Electricity", primaryNetRevenue: 5000, notes: "Test 1"
    },
    {
      id: "2", ownerId: "user1", date: new Date("2024-02-01"),
      grossSales: 20000, primarySplitPercentage: 60, primaryShare: 12000, secondaryShare: 8000,
      primaryExpenses: 2000, expenseType: "Rent", primaryNetRevenue: 10000, notes: "Test 2"
    },
    {
      id: "3", ownerId: "user1", date: new Date("2023-12-01"),
      grossSales: 5000, primarySplitPercentage: 60, primaryShare: 3000, secondaryShare: 2000,
      primaryExpenses: 500, expenseType: "Water", primaryNetRevenue: 2500, notes: "Test 3"
    },
  ];

  describe("getDashboardMetrics", () => {
    it("should calculate total metrics filtered by selected year correctly", () => {
      const metrics2024 = getDashboardMetrics(mockSalesForMetrics, "2024");
      expect(metrics2024.totalGross).toBe(30000);
      expect(metrics2024.netRevenue).toBe(15000);
      expect(metrics2024.partnerShare).toBe(12000);
      expect(metrics2024.totalExpenses).toBe(3000);
      
      const metrics2023 = getDashboardMetrics(mockSalesForMetrics, "2023");
      expect(metrics2023.totalGross).toBe(5000);
      expect(metrics2023.netRevenue).toBe(2500);
      expect(metrics2023.partnerShare).toBe(2000);
      expect(metrics2023.totalExpenses).toBe(500);
    });

    it("should calculate yearly performance correctly across all years", () => {
      const metrics = getDashboardMetrics(mockSalesForMetrics, "2024");
      expect(metrics.yearlyData).toHaveLength(2);
      expect(metrics.yearlyData).toContainEqual({ year: "2023", net: 2500, partner: 2000, expenses: 500, gross: 5000 });
      expect(metrics.yearlyData).toContainEqual({ year: "2024", net: 15000, partner: 12000, expenses: 3000, gross: 30000 });
    });

    it("should calculate monthly performance correctly", () => {
      const metrics = getDashboardMetrics(mockSalesForMetrics, "2024");
      expect(metrics.monthlyDataByYear["2024"]).toHaveLength(12);
      expect(metrics.monthlyDataByYear["2024"][0].month).toBe("JAN");
      expect(metrics.monthlyDataByYear["2024"][1].month).toBe("FEB");
    });

    it("should calculate gross growth between latest two months correctly for the selected year", () => {
      const metrics = getDashboardMetrics(mockSalesForMetrics, "2024");
      expect(metrics.grossGrowth).toBe(100);
    });

    it("should handle empty sales array", () => {
      const metrics = getDashboardMetrics([]);
      expect(metrics.totalGross).toBe(0);
      expect(metrics.totalExpenses).toBe(0);
      expect(metrics.yearlyData).toEqual([]);
      expect(metrics.availableYears).toHaveLength(1);
      expect(metrics.monthlyDataByYear[metrics.availableYears[0]]).toHaveLength(12);
    });

    it("should fallback to current year if target year is not in available years", () => {
      const metrics = getDashboardMetrics(mockSalesForMetrics, "2099");
      const currentYearStr = new Date().getFullYear().toString();
      const isCurrentYearInMock = mockSalesForMetrics.some(s => s.date.getFullYear().toString() === currentYearStr);
      expect(metrics.totalGross).toBe(isCurrentYearInMock ? metrics.totalGross : 0);
    });

    it("should set grossGrowth to 0 if only one month exists and it is a past year", () => {
      const metrics = getDashboardMetrics(mockSalesForMetrics, "2023");
      expect(metrics.grossGrowth).toBe(0);
    });

    it("should handle grossGrowth when last month gross is 0", () => {
      const salesWithZero: WeeklySale[] = [
        ...mockSalesForMetrics,
        createMockSale({ date: new Date("2024-03-01"), grossSales: 5000 }),
        createMockSale({ date: new Date("2024-04-01"), grossSales: 0 }),
        createMockSale({ date: new Date("2024-05-01"), grossSales: 1000 })
      ];
      const metrics = getDashboardMetrics(salesWithZero, "2024");
      expect(metrics.grossGrowth).toBe(0);
    });

    it("should filter metrics by type correctly", () => {
      const soloSales: WeeklySale[] = [
        createMockSale({ id: "10", date: new Date("2024-01-01"), grossSales: 10000, primarySplitPercentage: 100, primaryShare: 10000, secondaryShare: 0, primaryExpenses: 1000, primaryNetRevenue: 9000, notes: "Solo Sale" }),
        createMockSale({ id: "11", date: new Date("2024-02-01"), grossSales: 20000, primarySplitPercentage: 60, primaryShare: 12000, secondaryShare: 8000, primaryExpenses: 2000, primaryNetRevenue: 10000, notes: "Split Sale" })
      ];

      const metricsSolo = getDashboardMetrics(soloSales, "2024", "solo");
      expect(metricsSolo.totalGross).toBe(10000);
      expect(metricsSolo.netRevenue).toBe(9000);
      expect(metricsSolo.partnerShare).toBe(0);
      expect(metricsSolo.totalExpenses).toBe(1000);

      const metricsSplit = getDashboardMetrics(soloSales, "2024", "split");
      expect(metricsSplit.totalGross).toBe(20000);
      expect(metricsSplit.netRevenue).toBe(10000);
      expect(metricsSplit.partnerShare).toBe(8000);
      expect(metricsSplit.totalExpenses).toBe(2000);
    });

    it("should not drop available years when filtering by type", () => {
      const mixedSales: WeeklySale[] = [
        createMockSale({ date: new Date("2023-01-01"), grossSales: 10000, secondaryShare: 0 }),
        createMockSale({ date: new Date("2024-02-01"), grossSales: 20000, secondaryShare: 8000 })
      ];
      const metrics = getDashboardMetrics(mixedSales, "2024", "split");
      expect(metrics.availableYears).toContain("2023");
      expect(metrics.availableYears).toContain("2024");
    });
  });

  describe("getInsights", () => {
    it("should return empty array for no sales", () => {
      expect(getInsights([])).toEqual([]);
    });

    it("should identify the best week ever (milestone)", () => {
      const sales = [
        createMockSale({ date: new Date("2026-01-01"), grossSales: 4000 }),
        createMockSale({ date: new Date("2026-01-08"), grossSales: 6000 }),
        createMockSale({ date: new Date("2026-01-15"), grossSales: 5000 }),
      ];
      const insights = getInsights(sales);
      const milestone = insights.find(i => i.type === "milestone");
      expect(milestone).toBeDefined();
      expect(milestone?.severity).toBe("success");
      expect(milestone?.message).toContain("6,000");
    });

    it("should identify a growth streak (trend)", () => {
      const sales = [
        createMockSale({ date: new Date("2026-01-01"), grossSales: 3000 }),
        createMockSale({ date: new Date("2026-01-08"), grossSales: 4000 }),
        createMockSale({ date: new Date("2026-01-15"), grossSales: 5000 }),
        createMockSale({ date: new Date("2026-01-22"), grossSales: 6000 }),
      ];
      const insights = getInsights(sales);
      const streak = insights.find(i => i.type === "trend");
      expect(streak).toBeDefined();
      expect(streak?.severity).toBe("success");
      expect(streak?.message).toContain("4 consecutive weeks");
    });

    it("should detect an expense spike (anomaly)", () => {
      const sales = [
        createMockSale({ date: new Date("2026-01-01"), primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-01-08"), primaryExpenses: 600 }),
        createMockSale({ date: new Date("2026-01-15"), primaryExpenses: 550 }),
        createMockSale({ date: new Date("2026-01-22"), primaryExpenses: 2500, expenseType: "Router repair" }),
      ];
      const insights = getInsights(sales);
      const anomaly = insights.find(i => i.type === "anomaly");
      expect(anomaly).toBeDefined();
      expect(anomaly?.severity).toBe("warning");
      expect(anomaly?.message).toContain("Router repair");
    });

    it("should detect a significant sales drop (comparison)", () => {
      const sales = Array.from({ length: 8 }).map((_, i) => createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 10000 }));
      const recentSales = Array.from({ length: 4 }).map((_, i) => createMockSale({ date: new Date(`2026-03-${i + 1}`), grossSales: 5000 }));
      const insights = getInsights([...sales, ...recentSales]);
      const drop = insights.find(i => i.type === "comparison");
      expect(drop).toBeDefined();
      expect(drop?.severity).toBe("warning");
      expect(drop?.message).toContain("investigate");
    });

    it("should not detect a drop if recentAvg is not significantly lower", () => {
      const sales = Array.from({ length: 8 }).map((_, i) => createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 10000 }));
      const recentSales = Array.from({ length: 4 }).map((_, i) => createMockSale({ date: new Date(`2026-03-${i + 1}`), grossSales: 9000 }));
      const insights = getInsights([...sales, ...recentSales]);
      expect(insights.find(i => i.type === "comparison")).toBeUndefined();
    });

    it("should not detect a drop if historicalAvg is 0", () => {
      const sales = Array.from({ length: 8 }).map((_, i) => createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 0 }));
      const recentSales = Array.from({ length: 4 }).map((_, i) => createMockSale({ date: new Date(`2026-03-${i + 1}`), grossSales: 5000 }));
      const insights = getInsights([...sales, ...recentSales]);
      expect(insights.find(i => i.type === "comparison")).toBeUndefined();
    });

    it("should limit the output to top 4 most severe insights", () => {
      const sales = [
        createMockSale({ date: new Date("2026-01-01"), grossSales: 10000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-01-08"), grossSales: 11000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-01-15"), grossSales: 12000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-01-22"), grossSales: 13000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-02-01"), grossSales: 5000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-02-08"), grossSales: 5000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-02-15"), grossSales: 5000, primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-02-22"), grossSales: 4000, primaryExpenses: 4000, expenseType: "Major Repair" }),
      ];
      const insights = getInsights(sales);
      expect(insights.length).toBeLessThanOrEqual(4);
      expect(insights.filter(i => i.severity === "warning").length).toBeGreaterThanOrEqual(1);
    });

    it("should calculate and include the expense health metric", () => {
      const sales = Array.from({ length: 4 }).map((_, i) => createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 1000, primaryExpenses: 100 }));
      const insights = getInsights(sales);
      const health = insights.find(i => i.type === "health");
      expect(health).toBeDefined();
      expect(health?.severity).toBe("success");
      expect(health?.message).toContain("10%");
    });

    it("should not generate milestone insight if there is only 1 sale", () => {
      const sales = [createMockSale({ date: new Date("2026-01-01"), grossSales: 4000 })];
      const insights = getInsights(sales);
      expect(insights.find(i => i.type === "milestone")).toBeUndefined();
    });

    it("should format unspecified expenses correctly in anomaly insight", () => {
      const sales = [
        createMockSale({ date: new Date("2026-01-01"), primaryExpenses: 500 }),
        createMockSale({ date: new Date("2026-01-08"), primaryExpenses: 600 }),
        createMockSale({ date: new Date("2026-01-15"), primaryExpenses: 550 }),
        createMockSale({ date: new Date("2026-01-22"), primaryExpenses: 2500, expenseType: null }),
      ];
      const insights = getInsights(sales);
      const anomaly = insights.find(i => i.type === "anomaly");
      expect(anomaly).toBeDefined();
      expect(anomaly?.message).toContain("unspecified expenses");
    });

    it("should flag health insight as warning if expense ratio is >= 30%", () => {
      const sales = [createMockSale({ date: new Date("2026-01-01"), grossSales: 1000, primaryExpenses: 400 })];
      const insights = getInsights(sales);
      const health = insights.find(i => i.type === "health");
      expect(health).toBeDefined();
      expect(health?.severity).toBe("warning");
      expect(health?.message).toContain("40%");
    });
  });

  describe("getNotesForPeriod", () => {
    it("should return only sales with non-empty notes", () => {
      const sales = [
        createMockSale({ notes: "Important note" }),
        createMockSale({ notes: null }),
        createMockSale({ notes: "" }),
        createMockSale({ notes: "   " }),
        createMockSale({ notes: "Another note" }),
      ];
      const result = getNotesForPeriod(sales);
      expect(result).toHaveLength(2);
      expect(result[0].notes).toBe("Important note");
      expect(result[1].notes).toBe("Another note");
    });
  });
});
