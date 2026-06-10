import { describe, it, expect } from "vitest";
import { generateInsights } from "../lib/domain/insights";
import { WeeklySale } from "@/lib/domain/sales";

const createMockSale = (
  overrides: Partial<WeeklySale>
): WeeklySale => ({
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

describe("generateInsights", () => {
  it("should return empty array for no sales", () => {
    expect(generateInsights([])).toEqual([]);
  });

  it("should identify the best week ever (milestone)", () => {
    const sales = [
      createMockSale({ date: new Date("2026-01-01"), grossSales: 4000 }),
      createMockSale({ date: new Date("2026-01-08"), grossSales: 6000 }),
      createMockSale({ date: new Date("2026-01-15"), grossSales: 5000 }),
    ];
    
    const insights = generateInsights(sales);
    const milestone = insights.find(i => i.type === "milestone");
    
    expect(milestone).toBeDefined();
    expect(milestone?.severity).toBe("success");
    expect(milestone?.message).toContain("6,000"); // Should contain the formatted currency value
  });

  it("should identify a growth streak (trend)", () => {
    const sales = [
      createMockSale({ date: new Date("2026-01-01"), grossSales: 3000 }),
      createMockSale({ date: new Date("2026-01-08"), grossSales: 4000 }),
      createMockSale({ date: new Date("2026-01-15"), grossSales: 5000 }),
      createMockSale({ date: new Date("2026-01-22"), grossSales: 6000 }),
    ];
    
    const insights = generateInsights(sales);
    const streak = insights.find(i => i.type === "trend");
    
    expect(streak).toBeDefined();
    expect(streak?.severity).toBe("success");
    expect(streak?.message).toContain("4 consecutive weeks"); // 1st to 2nd to 3rd to 4th (3 increments = streak of 3, meaning 4 weeks total)
  });

  it("should detect an expense spike (anomaly)", () => {
    const sales = [
      createMockSale({ date: new Date("2026-01-01"), primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-01-08"), primaryExpenses: 600 }),
      createMockSale({ date: new Date("2026-01-15"), primaryExpenses: 550 }),
      createMockSale({ date: new Date("2026-01-22"), primaryExpenses: 2500, expenseType: "Router repair" }),
    ];
    
    const insights = generateInsights(sales);
    const anomaly = insights.find(i => i.type === "anomaly");
    
    expect(anomaly).toBeDefined();
    expect(anomaly?.severity).toBe("warning");
    expect(anomaly?.message).toContain("Router repair");
  });

  it("should detect a significant sales drop (comparison)", () => {
    const sales = Array.from({ length: 8 }).map((_, i) => 
      createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 10000 })
    );
    // Recent 4 weeks drop to 5000
    const recentSales = Array.from({ length: 4 }).map((_, i) => 
      createMockSale({ date: new Date(`2026-03-${i + 1}`), grossSales: 5000 })
    );
    
    const allSales = [...sales, ...recentSales];
    const insights = generateInsights(allSales);
    const drop = insights.find(i => i.type === "comparison");
    
    expect(drop).toBeDefined();
    expect(drop?.severity).toBe("warning");
    expect(drop?.message).toContain("investigate");
  });

  it("should not detect a drop if recentAvg is not significantly lower", () => {
    const sales = Array.from({ length: 8 }).map((_, i) => 
      createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 10000 })
    );
    const recentSales = Array.from({ length: 4 }).map((_, i) => 
      createMockSale({ date: new Date(`2026-03-${i + 1}`), grossSales: 9000 })
    ); // Only 10% drop, not 15%+
    
    const allSales = [...sales, ...recentSales];
    const insights = generateInsights(allSales);
    expect(insights.find(i => i.type === "comparison")).toBeUndefined();
  });

  it("should not detect a drop if historicalAvg is 0", () => {
    const sales = Array.from({ length: 8 }).map((_, i) => 
      createMockSale({ date: new Date(`2026-01-${i + 1}`), grossSales: 0 })
    );
    const recentSales = Array.from({ length: 4 }).map((_, i) => 
      createMockSale({ date: new Date(`2026-03-${i + 1}`), grossSales: 5000 })
    );
    
    const allSales = [...sales, ...recentSales];
    const insights = generateInsights(allSales);
    expect(insights.find(i => i.type === "comparison")).toBeUndefined();
  });

  it("should limit the output to top 4 most severe insights", () => {
    // We construct a scenario with 1 drop (warning), 1 spike (warning), 1 streak (success), 1 milestone (success), plus health
    const sales = [
      createMockSale({ date: new Date("2026-01-01"), grossSales: 10000, primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-01-08"), grossSales: 11000, primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-01-15"), grossSales: 12000, primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-01-22"), grossSales: 13000, primaryExpenses: 500 }), // Growth streak + Best Week + Health
      createMockSale({ date: new Date("2026-02-01"), grossSales: 5000, primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-02-08"), grossSales: 5000, primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-02-15"), grossSales: 5000, primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-02-22"), grossSales: 4000, primaryExpenses: 4000, expenseType: "Major Repair" }), // Sales drop + Expense spike
    ];

    const insights = generateInsights(sales);
    expect(insights.length).toBeLessThanOrEqual(4);
    
    // Warnings should be prioritized
    const warnings = insights.filter(i => i.severity === "warning");
    expect(warnings.length).toBeGreaterThanOrEqual(1);
  });

  it("should calculate and include the expense health metric", () => {
    const sales = [
      createMockSale({ date: new Date("2026-01-01"), grossSales: 1000, primaryExpenses: 100 }),
      createMockSale({ date: new Date("2026-01-08"), grossSales: 1000, primaryExpenses: 100 }),
      createMockSale({ date: new Date("2026-01-15"), grossSales: 1000, primaryExpenses: 100 }),
      createMockSale({ date: new Date("2026-01-22"), grossSales: 1000, primaryExpenses: 100 }),
    ];
    
    const insights = generateInsights(sales);
    const health = insights.find(i => i.type === "health");
    
    expect(health).toBeDefined();
    expect(health?.severity).toBe("success");
    expect(health?.message).toContain("10%");
  });

  it("should not generate milestone insight if there is only 1 sale", () => {
    const sales = [createMockSale({ date: new Date("2026-01-01"), grossSales: 4000 })];
    const insights = generateInsights(sales);
    const milestone = insights.find(i => i.type === "milestone");
    expect(milestone).toBeUndefined();
  });

  it("should format unspecified expenses correctly in anomaly insight", () => {
    const sales = [
      createMockSale({ date: new Date("2026-01-01"), primaryExpenses: 500 }),
      createMockSale({ date: new Date("2026-01-08"), primaryExpenses: 600 }),
      createMockSale({ date: new Date("2026-01-15"), primaryExpenses: 550 }),
      // High expense with no expenseType
      createMockSale({ date: new Date("2026-01-22"), primaryExpenses: 2500, expenseType: null }),
    ];
    
    const insights = generateInsights(sales);
    const anomaly = insights.find(i => i.type === "anomaly");
    
    expect(anomaly).toBeDefined();
    expect(anomaly?.message).toContain("unspecified expenses");
  });

  it("should flag health insight as warning if expense ratio is >= 30%", () => {
    const sales = [
      // Ratio will be 400 / 1000 = 40%
      createMockSale({ date: new Date("2026-01-01"), grossSales: 1000, primaryExpenses: 400 }),
    ];
    
    const insights = generateInsights(sales);
    const health = insights.find(i => i.type === "health");
    
    expect(health).toBeDefined();
    expect(health?.severity).toBe("warning");
    expect(health?.message).toContain("40%");
  });
});
