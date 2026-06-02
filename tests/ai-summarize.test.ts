import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { summarizeNotesAction } from '../lib/actions/ai';
import { auth } from '../auth';

// Mock dependencies
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));



const { mockGenerateText } = vi.hoisted(() => ({ mockGenerateText: vi.fn() }));

vi.mock('ai', () => ({
  generateText: mockGenerateText
}));

vi.mock('@/lib/ai/provider', () => ({
  getAIConfig: vi.fn().mockResolvedValue({
    provider: { chat: vi.fn() },
    modelId: 'test-model'
  })
}));

const { mockGetSales } = vi.hoisted(() => ({ mockGetSales: vi.fn() }));

vi.mock('@/lib/repositories/sales', () => ({
  salesRepository: {
    getAllSales: mockGetSales,
    getSalesByDateRange: mockGetSales
  }
}));

describe('summarizeNotesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unauthorized if user not logged in', async () => {
    (auth as Mock).mockResolvedValue(null);
    const res = await summarizeNotesAction("2026", "0");
    expect(res.error).toBe('Unauthorized');
  });



  it('should return default message if no notes for period', async () => {
    (auth as Mock).mockResolvedValue({ user: { id: 'test-user' } });
    mockGetSales.mockResolvedValue([
      { date: new Date('2026-01-10T00:00:00Z'), notes: null },
      { date: new Date('2026-01-15T00:00:00Z'), notes: '' }
    ]);
    
    const res = await summarizeNotesAction("2026", "0");
    expect(res.data).toBe("No notable events or notes were recorded for this period.");
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('should call LLM and return result on success', async () => {
    (auth as Mock).mockResolvedValue({ user: { id: 'test-user' } });
    mockGetSales.mockResolvedValue([
      { date: new Date('2026-01-10T00:00:00Z'), notes: 'Good day' },
      { date: new Date('2026-01-17T00:00:00Z'), notes: 'Bad day' }
    ]);
    mockGenerateText.mockResolvedValue({ text: "Generated AI summary" });
    
    const res = await summarizeNotesAction("2026", "0");
    expect(res.data).toBe("Generated AI summary");
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it('should return error if an exception is thrown', async () => {
    (auth as Mock).mockResolvedValue({ user: { id: 'test-user' } });
    mockGetSales.mockRejectedValue(new Error("Database error"));
    
    const res = await summarizeNotesAction("2026", "0");
    expect(res.error).toBe("An error occurred while generating the summary.");
  });
});
