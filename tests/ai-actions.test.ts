import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseEntryAction, testAiConnectionAction } from '../lib/actions/ai';
import { auth } from '../auth';
import prisma from '../lib/prisma';

// Mock dependencies
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));



// Mock entry agent parsing logic
const { mockParseEntry } = vi.hoisted(() => {
  return { mockParseEntry: vi.fn() };
});
vi.mock('@/lib/ai/entry-agent', () => ({
  parseEntryFromText: (...args: unknown[]) => mockParseEntry(...args)
}));

// Mock sales repository
vi.mock('@/lib/repositories/sales', () => ({
  salesRepository: {
    getRecentSales: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() }
  }
}));

vi.mock('@/lib/utils/encryption', () => ({
  decrypt: vi.fn((val) => val.replace('encrypted-', ''))
}));

global.fetch = vi.fn();

describe('AI Server Actions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 Unauthorized if user is not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      const response = await parseEntryAction("Sales 5000");
      
      expect(response.error).toBe('Unauthorized');
    });
  });



  describe('Validation', () => {
    it('should return 400 Bad Request if text input is missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' }, expires: '1' });

      const response = await parseEntryAction(""); // Empty text
      
      expect(response.error).toMatch(/Missing or invalid text input/);
    });

    it('should return 400 Bad Request if text input is empty', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' }, expires: '1' });

      const response = await parseEntryAction("   "); // Empty text
      
      expect(response.error).toMatch(/Missing or invalid text input/);
    });
  });

  describe('Success Path', () => {
    it('should return parsed entry on success', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' }, expires: '1' });
      
      const mockResult = {
        grossSales: 5000,
        expenses: 100,
        expenseType: null,
        date: null,
        notes: null,
        warnings: [],
        isComplete: true
      };
      
      mockParseEntry.mockResolvedValueOnce(mockResult);

      const response = await parseEntryAction("Sales 5000");
      
      expect(response.data).toEqual(mockResult);
      expect(mockParseEntry).toHaveBeenCalledWith("test-user", "Sales 5000", expect.any(Array), 60, undefined, undefined);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if an internal error occurs', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' }, expires: '1' });
      
      mockParseEntry.mockImplementationOnce(() => {
        throw new Error("Parsing failed");
      });

      const response = await parseEntryAction("Sales 5000");
      
      expect(response.error).toMatch(/An error occurred while parsing your entry/);
    });
  });

  describe('testAiConnectionAction', () => {
    it('should test connection with provided raw key', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ data: { label: 'Valid Key' } }) });

      const res = await testAiConnectionAction('raw-test-key');

      expect(res.success).toBe(true);
      expect(res.data).toBe('Valid Key');
      expect(global.fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/auth/key",
        expect.objectContaining({
          headers: { Authorization: "Bearer raw-test-key" }
        })
      );
    });

    it('should fallback to "Active" if label is missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });

      const res = await testAiConnectionAction('raw-test-key');

      expect(res.success).toBe(true);
      expect(res.data).toBe('Active');
    });

    it('should return error if unauthorized in testAiConnectionAction', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      const res = await testAiConnectionAction('raw-test-key');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Unauthorized');
    });

    it('should fetch and decrypt from DB if masked key is provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.user.findUnique as any).mockResolvedValueOnce({ openrouterKey: 'encrypted-db-key' });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ data: { label: 'DB Key' } }) });

      const res = await testAiConnectionAction('sk-or-v1-••••••••');

      expect(res.success).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'test-user' }, select: { openrouterKey: true } });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/auth/key",
        expect.objectContaining({
          headers: { Authorization: "Bearer db-key" }
        })
      );
    });

    it('should return error if masked key is provided but no key in DB', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.user.findUnique as any).mockResolvedValueOnce({ openrouterKey: null });

      const res = await testAiConnectionAction('sk-or-v1-••••••••');

      expect(res.success).toBe(false);
      expect(res.error).toBe('No API key found to test.');
    });

    it('should fail if fetch fails', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue({ ok: false });

      const res = await testAiConnectionAction('invalid-key');

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Invalid API key/);
    });

    it('should return network error if fetch throws an exception', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const res = await testAiConnectionAction('raw-test-key');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Connection failed. Check your network.');
    });
  });
});
