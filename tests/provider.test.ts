import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAIConfig } from '../lib/ai/provider';
import prisma from '../lib/prisma';
import { createOpenAI } from '@ai-sdk/openai';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/utils/encryption', () => ({
  decrypt: vi.fn((val) => val.replace('encrypted-', '')),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockImplementation((config) => {
    return {
      chat: vi.fn().mockReturnValue('mocked-chat-model'),
      __config: config, // Store config for testing
    };
  }),
}));

global.fetch = vi.fn();

describe('AI Provider Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    await expect(getAIConfig('user-1')).rejects.toThrow('Missing OpenRouter API Key. Please configure it in Settings.');
  });

  it('should throw an error if openrouterKey is missing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1', openrouterKey: null } as never);

    await expect(getAIConfig('user-1')).rejects.toThrow('Missing OpenRouter API Key. Please configure it in Settings.');
  });

  it('should configure and return provider with default model', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      openrouterKey: 'encrypted-test-key',
      aiModel: null,
    } as never);

    const result = await getAIConfig('user-1');

    expect(result.modelId).toBe('deepseek/deepseek-v4-flash');
    expect(createOpenAI).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: 'test-key',
    }));
  });

  it('should configure and return provider with user specified model', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      openrouterKey: 'encrypted-test-key',
      aiModel: 'custom-model',
    } as never);

    const result = await getAIConfig('user-1');

    expect(result.modelId).toBe('custom-model');
  });

  it('should intercept fetch and inject reasoning', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      openrouterKey: 'encrypted-test-key',
    } as never);

    await getAIConfig('user-1');
    
    // We can get the fetch function from the mock implementation
    const callConfig = vi.mocked(createOpenAI).mock.calls[0][0];
    const customFetch = callConfig?.fetch;
    
    expect(customFetch).toBeDefined();

    vi.mocked(global.fetch).mockResolvedValueOnce(new Response());

    await customFetch!('https://api.test', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
    });

    expect(global.fetch).toHaveBeenCalledWith('https://api.test', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello', reasoning: { enabled: true } }),
    });
  });

  it('should gracefully handle fetch interception errors if body is invalid JSON', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      openrouterKey: 'encrypted-test-key',
    } as never);

    await getAIConfig('user-1');
    const callConfig = vi.mocked(createOpenAI).mock.calls[0][0];
    const customFetch = callConfig?.fetch;
    
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response());

    // Pass invalid JSON string to trigger the catch block
    await customFetch!('https://api.test', {
      method: 'POST',
      body: 'invalid-json',
    });

    // It should still call fetch but print an error
    expect(global.fetch).toHaveBeenCalledWith('https://api.test', {
      method: 'POST',
      body: 'invalid-json',
    });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to inject reasoning:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should call fetch without options or body', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      openrouterKey: 'encrypted-test-key',
    } as never);

    await getAIConfig('user-1');
    const callConfig = vi.mocked(createOpenAI).mock.calls[0][0];
    const customFetch = callConfig?.fetch;
    
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response());

    await customFetch!('https://api.test'); // no options

    expect(global.fetch).toHaveBeenCalledWith('https://api.test', undefined);

    await customFetch!('https://api.test', { method: 'GET' }); // no body

    expect(global.fetch).toHaveBeenCalledWith('https://api.test', { method: 'GET' });
  });
});
