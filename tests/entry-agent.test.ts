import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseEntryFromText } from "@/lib/ai/entry-agent";
import { WeeklySale } from "@/lib/domain/sales";

// Mock the AI provider so tests never make real network calls
vi.mock("@/lib/ai/provider", () => ({
  getAIConfig: vi.fn().mockResolvedValue({
    provider: { chat: vi.fn().mockReturnValue("mocked-model") },
    modelId: "mocked-model"
  })
}));

// Mock generateText from the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

import { generateText } from "ai";

const mockGenerateText = vi.mocked(generateText);

// Helper to build a minimal WeeklySale record for test fixtures
function makeSale(overrides: Partial<WeeklySale> = {}): WeeklySale {
  return {
    id: "test-id",
    ownerId: "user-1",
    date: new Date("2026-05-12"),
    grossSales: 5000,
    primarySplitPercentage: 60,
    primaryShare: 3000,
    secondaryShare: 2000,
    primaryExpenses: 300,
    expenseType: "Electricity",
    primaryNetRevenue: 2700,
    notes: null,
    ...overrides,
  };
}

const recentSales: WeeklySale[] = [
  makeSale({ date: new Date("2026-05-12"), grossSales: 5000 }),
  makeSale({ date: new Date("2026-05-05"), grossSales: 5200 }),
  makeSale({ date: new Date("2026-04-28"), grossSales: 4800 }),
  makeSale({ date: new Date("2026-04-21"), grossSales: 5100 }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseEntryFromText", () => {
  it("happy path: parses a complete natural language entry", async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        grossSales: 5200,
        expenses: 800,
        expenseType: "Router Repair",
        date: null,
        notes: null,
      }),
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText(
      "user-1",
      "Sales this week 5200, spent 800 on router repair",
      recentSales
    );

    expect(result.grossSales).toBe(5200);
    expect(result.expenses).toBe(800);
    expect(result.expenseType).toBe("Router Repair");
    expect(result.isComplete).toBe(true);
    expect(result.warnings).toHaveLength(0);

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("<user_input>\nSales this week 5200, spent 800 on router repair\n</user_input>")
          })
        ])
      })
    );
  });

  it("missing expenses: defaults expenses to 0 and isComplete remains true", async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        grossSales: 4500,
        expenses: 0,
        expenseType: null,
        date: null,
        notes: null,
      }),
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText("user-1", "Sales 4500", recentSales);

    expect(result.grossSales).toBe(4500);
    expect(result.expenses).toBe(0);
    expect(result.isComplete).toBe(true);
  });

  it("anomaly: sales well below average triggers a warning", async () => {
    // Average of recentSales is ~5025. 300 is <50% of that.
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        grossSales: 300,
        expenses: 0,
        expenseType: null,
        date: null,
        notes: null,
      }),
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText("user-1", "Sales 300", recentSales);

    expect(result.grossSales).toBe(300);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/below.*average/i);
  });

  it("anomaly: expenses exceeding 60% share triggers a warning", async () => {
    // grossSales 2000 → 60% = 1200. expenses 1500 > 1200.
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        grossSales: 2000,
        expenses: 1500,
        expenseType: "Equipment",
        date: null,
        notes: null,
      }),
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText(
      "user-1",
      "Sales 2000, equipment 1500",
      recentSales
    );

    expect(result.warnings.some((w) => /exceed.*60%|60%.*share/i.test(w))).toBe(true);
  });

  it("malformed LLM response: returns isComplete false with a user-friendly warning", async () => {
    mockGenerateText.mockResolvedValue({
      text: "sorry, I cannot help with that",
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText("user-1", "hello world", recentSales);

    expect(result.isComplete).toBe(false);
    expect(result.grossSales).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/could not understand/i);
  });

  it("LLM wraps JSON in markdown code fences: still parses correctly", async () => {
    mockGenerateText.mockResolvedValue({
      text: "```json\n{\"grossSales\":4000,\"expenses\":200,\"expenseType\":\"Supplies\",\"date\":null,\"notes\":null}\n```",
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText("user-1", "Sales 4000, supplies 200", recentSales);

    expect(result.grossSales).toBe(4000);
    expect(result.isComplete).toBe(true);
  });

  it("includes notes when provided", async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        grossSales: 4500,
        expenses: 350,
        expenseType: "Electricity",
        date: null,
        notes: "2 machines were down on Tuesday",
      }),
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await parseEntryFromText(
      "user-1",
      "4500 gross, electricity 350, 2 machines were down tuesday",
      recentSales
    );

    expect(result.notes).toBe("2 machines were down on Tuesday");
  });
});
