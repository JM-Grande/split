import { vi } from 'vitest';

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Add any global mocks here
