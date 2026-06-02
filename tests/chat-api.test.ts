import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/chat/route';
import { auth } from '../auth';

// Mock dependencies
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));



const { mockStreamText } = vi.hoisted(() => {
  return { mockStreamText: vi.fn() };
});
vi.mock('ai', () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args)
}));

vi.mock('@/lib/ai/provider', () => ({
  getAIConfig: vi.fn().mockResolvedValue({
    provider: { chat: vi.fn() },
    modelId: 'test-model'
  })
}));

vi.mock('@/lib/repositories/sales', () => ({
  salesRepository: {
    getAllSales: vi.fn().mockResolvedValue([])
  }
}));

describe('Chat API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 Unauthorized if user is not authenticated', async () => {
      // Setup mock to return no session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] })
      });

      const response = await POST(request);
      
      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Unauthorized');
    });
  });



  describe('Error Handling', () => {
    it('should return specific error message if AI provider throws an error', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user', email: 'test@example.com' }, expires: '1' });
      
      const aiError = new Error('Invalid Responses API request');
      aiError.name = 'AI_APICallError';
      (aiError as Error & { statusCode?: number }).statusCode = 400;
      
      mockStreamText.mockImplementationOnce(() => {
        throw aiError;
      });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain('Invalid Responses API request');
    });

    it('should return 500 for generic internal errors', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: 'test-user', email: 'test@example.com' }, expires: '1' });
      
      mockStreamText.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('An error occurred during chat processing.');
    });
  });
});
