import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateDefaultSplitAction, updateAiSettingsAction } from '@/lib/actions/user';
import { requireAuth } from '@/lib/actions/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/lib/actions/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/utils/encryption', () => ({
  encrypt: vi.fn((val) => `encrypted-${val}`),
}));

describe('user actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateDefaultSplitAction', () => {
    it('should successfully update the default split percentage and revalidate paths', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      const result = await updateDefaultSplitAction(75);

      expect(result.success).toBe(true);
      expect(requireAuth).toHaveBeenCalledOnce();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { default_split_percentage: 75 },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/profile');
      expect(revalidatePath).toHaveBeenCalledWith('/sales');
    });

    it('should return an error if the user is not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

      const result = await updateDefaultSplitAction(50);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save settings.');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return an error if the percentage is less than 1', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');

      const result = await updateDefaultSplitAction(0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Percentage must be between 1 and 100.');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return an error if the percentage is greater than 100', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');

      const result = await updateDefaultSplitAction(101);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Percentage must be between 1 and 100.');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return a generic error if the database update fails', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));

      const result = await updateDefaultSplitAction(50);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save settings.');
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('updateAiSettingsAction', () => {
    it('should encrypt the API key and update settings', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      const result = await updateAiSettingsAction('my-secret-key', 'my-model');

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { 
          aiModel: 'my-model',
          openrouterKey: 'encrypted-my-secret-key'
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/profile');
    });

    it('should not overwrite the API key if the masked placeholder is submitted', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      const result = await updateAiSettingsAction('sk-or-v1-••••••••••••', 'my-model');

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { 
          aiModel: 'my-model'
          // openrouterKey should NOT be included
        },
      });
    });

    it('should set the API key to null if empty string is passed', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      const result = await updateAiSettingsAction(null, 'my-model');

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { 
          aiModel: 'my-model',
          openrouterKey: null
        },
      });
    });

    it('should default aiModel to deepseek/deepseek-v4-flash if aiModel is empty', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      const result = await updateAiSettingsAction('key', '');

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { 
          aiModel: 'deepseek/deepseek-v4-flash',
          openrouterKey: 'encrypted-key'
        },
      });
    });

    it('should return error if database update fails', async () => {
      vi.mocked(requireAuth).mockResolvedValue('test-user-id');
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('DB Error'));

      const result = await updateAiSettingsAction('key', 'model');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save AI settings.');
    });
  });
});
