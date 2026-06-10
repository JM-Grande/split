import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Prisma Client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should not set globalThis.prismaGlobal in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    
    // Clear the global
    delete globalThis.prismaGlobal;

    await import('@/lib/prisma');

    expect(globalThis.prismaGlobal).toBeUndefined();
  });

  it('should set globalThis.prismaGlobal in development/test', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    
    // Clear the global
    delete globalThis.prismaGlobal;

    const { default: prisma } = await import('@/lib/prisma');

    expect(globalThis.prismaGlobal).toBe(prisma);
  });
});
