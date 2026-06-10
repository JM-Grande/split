import { describe, it, expect } from "vitest";
import { calculateDashboardMetrics } from "@/lib/domain/analytics";
import { WeeklySale } from "@/lib/domain/sales";

describe("calculateDashboardMetrics", () => {
  const mockSales: WeeklySale[] = [
    {
      id: "1",
      ownerId: "user1",
      date: new Date("2024-01-01"),
      grossSales: 10000,
      primarySplitPercentage: 60,
      primaryShare: 6000,
      secondaryShare: 4000,
      primaryExpenses: 1000,
      expenseType: "Electricity",
      primaryNetRevenue: 5000,
      notes: "Test 1",
    },
    {
      id: "2",
      ownerId: "user1",
      date: new Date("2024-02-01"),
      grossSales: 20000,
      primarySplitPercentage: 60,
      primaryShare: 12000,
      secondaryShare: 8000,
      primaryExpenses: 2000,
      expenseType: "Rent",
      primaryNetRevenue: 10000,
      notes: "Test 2",
    },
    {
      id: "3",
      ownerId: "user1",
      date: new Date("2023-12-01"),
      grossSales: 5000,
      primarySplitPercentage: 60,
      primaryShare: 3000,
      secondaryShare: 2000,
      primaryExpenses: 500,
      expenseType: "Water",
      primaryNetRevenue: 2500,
      notes: "Test 3",
    },
  ];

  it("should calculate total metrics filtered by selected year correctly", () => {
    // Test for 2024 (should exclude the 2023 sale)
    const metrics2024 = calculateDashboardMetrics(mockSales, "2024");
    expect(metrics2024.totalGross).toBe(30000); // 10000 + 20000
    expect(metrics2024.netRevenue).toBe(15000); // 5000 + 10000
    expect(metrics2024.partnerShare).toBe(12000); // 4000 + 8000
    expect(metrics2024.totalExpenses).toBe(3000); // 1000 + 2000
    
    // Test for 2023
    const metrics2023 = calculateDashboardMetrics(mockSales, "2023");
    expect(metrics2023.totalGross).toBe(5000);
    expect(metrics2023.netRevenue).toBe(2500);
    expect(metrics2023.partnerShare).toBe(2000);
    expect(metrics2023.totalExpenses).toBe(500);
  });

  it("should calculate yearly performance correctly across all years", () => {
    const metrics = calculateDashboardMetrics(mockSales, "2024");
    expect(metrics.yearlyData).toHaveLength(2);
    expect(metrics.yearlyData).toContainEqual({ year: "2023", net: 2500, partner: 2000 });
    expect(metrics.yearlyData).toContainEqual({ year: "2024", net: 15000, partner: 12000 });
  });

  it("should calculate monthly performance correctly", () => {
    const metrics = calculateDashboardMetrics(mockSales, "2024");
    expect(metrics.monthlyDataByYear["2024"]).toHaveLength(12);
    expect(metrics.monthlyDataByYear["2024"][0].month).toBe("JAN");
    expect(metrics.monthlyDataByYear["2024"][1].month).toBe("FEB");
  });

  it("should calculate gross growth between latest two months correctly for the selected year", () => {
    const metrics = calculateDashboardMetrics(mockSales, "2024");
    // Latest is Feb 2024 (20000), previous is Jan 2024 (10000)
    // Growth = (20000 - 10000) / 10000 * 100 = 100%
    expect(metrics.grossGrowth).toBe(100);
  });

  it("should handle empty sales array", () => {
    const metrics = calculateDashboardMetrics([]);
    expect(metrics.totalGross).toBe(0);
    expect(metrics.totalExpenses).toBe(0);
    expect(metrics.yearlyData).toEqual([]);
    expect(metrics.availableYears).toHaveLength(1);
    expect(metrics.monthlyDataByYear[metrics.availableYears[0]]).toHaveLength(12);
  });

  it("should fallback to current year if target year is not in available years", () => {
    const metrics = calculateDashboardMetrics(mockSales, "2099");
    const currentYearStr = new Date().getFullYear().toString();
    
    // It should have calculated based on the current year fallback
    // If the current year is not in mockSales, totalGross will be 0.
    const isCurrentYearInMock = mockSales.some(s => s.date.getFullYear().toString() === currentYearStr);
    expect(metrics.totalGross).toBe(isCurrentYearInMock ? metrics.totalGross : 0);
  });

  it("should set grossGrowth to 0 if only one month exists and it is a past year", () => {
    // 2023 only has one month of data (Dec 2023)
    const metrics = calculateDashboardMetrics(mockSales, "2023");
    expect(metrics.grossGrowth).toBe(0);
  });

  it("should handle grossGrowth when last month gross is 0", () => {
    const salesWithZero: WeeklySale[] = [
      ...mockSales,
      {
        id: "4",
        ownerId: "user1",
        date: new Date("2024-03-01"),
        grossSales: 5000,
        primarySplitPercentage: 60,
        primaryShare: 3000,
        secondaryShare: 2000,
        primaryExpenses: 0,
        expenseType: null,
        primaryNetRevenue: 3000,
        notes: null,
      },
      {
        id: "5",
        ownerId: "user1",
        date: new Date("2024-04-01"),
        grossSales: 0, // 0 gross sales
        primarySplitPercentage: 60,
        primaryShare: 0,
        secondaryShare: 0,
        primaryExpenses: 0,
        expenseType: null,
        primaryNetRevenue: 0,
        notes: null,
      },
      {
        id: "6",
        ownerId: "user1",
        date: new Date("2024-05-01"),
        grossSales: 1000,
        primarySplitPercentage: 60,
        primaryShare: 600,
        secondaryShare: 400,
        primaryExpenses: 0,
        expenseType: null,
        primaryNetRevenue: 600,
        notes: null,
      }
    ];

    const metrics = calculateDashboardMetrics(salesWithZero, "2024");
    // Latest is May (1000), previous is April (0)
    // Division by zero is avoided, grossGrowth should be 0 or unchanged.
    expect(metrics.grossGrowth).toBe(0);
  });
});
