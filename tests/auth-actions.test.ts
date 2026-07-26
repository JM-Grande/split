import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { loginAction, logoutAction, registerAction, changePasswordAction, deleteAccountAction, forgotPasswordAction, resetPasswordAction } from '@/lib/actions/auth';
import { signIn, signOut, auth } from '@/auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const { MockAuthError } = vi.hoisted(() => {
  class MockAuthError extends Error {
    type: string;
    constructor(message: string, type: string = 'AuthError') {
      super(message);
      this.name = 'AuthError';
      this.type = type;
    }
  }
  return { MockAuthError };
});

vi.mock('next-auth', () => ({
  default: vi.fn(),
  AuthError: MockAuthError,
}));

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginAction', () => {
    it('should call signIn with credentials and form data', async () => {
      const formData = new FormData();
      formData.append('pin', '1234');
      (signIn as Mock).mockResolvedValueOnce(undefined);
      await loginAction(null, formData);
      expect(signIn).toHaveBeenCalledWith('credentials', formData);
    });
  });

  describe('logoutAction', () => {
    it('should call signOut', async () => {
      await logoutAction();
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerAction', () => {
    it('should create user and return success on valid 4-digit PIN', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('pin', '1234');
      formData.append('confirmPin', '1234');
      (prisma.user.findUnique as Mock).mockResolvedValueOnce(null);
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedPin1234');
      (prisma.user.create as Mock).mockResolvedValueOnce({ id: '1' });
      const result = await registerAction(null, formData);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Registration successful.' });
    });

    it('should return error if name already exists', async () => {
      const formData = new FormData();
      formData.append('name', 'Existing User');
      formData.append('pin', '1234');
      formData.append('confirmPin', '1234');
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: '1' });

      const result = await registerAction(null, formData);
      expect(result).toEqual({ success: false, error: 'User already exists with this name.' });
    });

    it('should return validation error if PIN is not 4 digits', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('pin', '123');
      formData.append('confirmPin', '123');

      const result = await registerAction(null, formData);
      expect(result).toMatchObject({ error: 'Invalid fields.' });
    });

    it('should return validation error if PINs do not match', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('pin', '1234');
      formData.append('confirmPin', '5678');

      const result = await registerAction(null, formData);
      expect(result).toMatchObject({ error: 'Invalid fields.', details: { confirmPin: expect.any(Array) } });
    });
  });

  describe('changePasswordAction', () => {
    it('should update PIN and return success on correct credentials', async () => {
      const formData = new FormData();
      formData.append('currentPin', '1234');
      formData.append('newPin', '5678');
      formData.append('confirmPin', '5678');
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedOldPin' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedNewPin');
      const result = await changePasswordAction(null, formData);
      expect(result).toEqual({ success: true, message: 'PIN updated successfully.' });
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should return error if current PIN is incorrect', async () => {
      const formData = new FormData();
      formData.append('currentPin', '0000');
      formData.append('newPin', '5678');
      formData.append('confirmPin', '5678');
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedOldPin' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(false);
      const result = await changePasswordAction(null, formData);
      expect(result).toEqual({ success: false, error: 'Incorrect current PIN.' });
    });

    it('should catch errors and return a generic error message', async () => {
      const formData = new FormData();
      formData.append('currentPin', '1234');
      formData.append('newPin', '5678');
      formData.append('confirmPin', '5678');
      (auth as Mock).mockRejectedValueOnce(new Error('Test error'));
      const result = await changePasswordAction(null, formData);
      expect(result).toEqual({ success: false, error: 'Something went wrong.' });
    });
  });

  describe('deleteAccountAction', () => {
    it('should delete user and sign out when PIN is correct', async () => {
      const formData = new FormData();
      formData.append('pin', '1234');
      formData.append('confirmPin', '1234');
      
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedPassword' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(true);
      (prisma.user.delete as Mock).mockResolvedValueOnce({ id: 'user-1' });
      
      await deleteAccountAction(null, formData);
      
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashedPassword');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('should return error when PIN is incorrect', async () => {
      const formData = new FormData();
      formData.append('pin', '0000');
      formData.append('confirmPin', '0000');
      
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedPassword' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(false);
      
      const result = await deleteAccountAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Incorrect PIN.' });
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it('should return validation error when PINs do not match', async () => {
      const formData = new FormData();
      formData.append('pin', '1234');
      formData.append('confirmPin', '5678');

      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });

      const result = await deleteAccountAction(null, formData);

      expect(result).toMatchObject({ error: 'Invalid fields.', details: { confirmPin: expect.any(Array) } });
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('forgotPasswordAction', () => {
    it('should return error if validation fails', async () => {
      const formData = new FormData();
      formData.append('recoveryKey', '');
      
      const result = await forgotPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Invalid recovery key.' });
    });

    it('should return error if user does not exist or recovery key is wrong', async () => {
      const formData = new FormData();
      formData.append('recoveryKey', 'SPLT-AAAA-BBBB-CCCC');
      
      (prisma.user.findMany as Mock).mockResolvedValueOnce([]);
      
      const result = await forgotPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Invalid recovery key.' });
    });

    it('should create a token and return resetLink if recovery key matches', async () => {
      const formData = new FormData();
      formData.append('recoveryKey', 'SPLT-AAAA-BBBB-CCCC');
      
      (prisma.user.findMany as Mock).mockResolvedValueOnce([{ id: 'user-1', name: 'existingUser', recoveryKey: 'hashedKey' }]);
      (bcrypt.compare as Mock).mockResolvedValueOnce(true);
      (prisma.passwordResetToken.deleteMany as Mock).mockResolvedValueOnce(undefined);
      (prisma.passwordResetToken.create as Mock).mockResolvedValueOnce({ id: 'token-1' });
      
      const result = await forgotPasswordAction(null, formData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Recovery key verified.');
      expect(result.resetLink).toMatch(/^\/reset-password\?token=/);
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { name: 'existingUser' } });
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe('resetPasswordAction', () => {
    it('should update PIN and return success on valid token', async () => {
      const formData = new FormData();
      formData.append('token', 'valid-token');
      formData.append('newPin', '5678');
      formData.append('confirmPin', '5678');
      
      const futureDate = new Date(Date.now() + 100000);
      (prisma.passwordResetToken.findUnique as Mock).mockResolvedValueOnce({ 
        id: 'token-1', 
        name: 'user1', 
        token: 'valid-token', 
        expires: futureDate 
      });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', name: 'user1' });
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedNewPin');
      (prisma.user.update as Mock).mockResolvedValueOnce({ id: 'user-1' });
      (prisma.passwordResetToken.delete as Mock).mockResolvedValueOnce({ id: 'token-1' });
      
      const result = await resetPasswordAction(null, formData);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('5678', 12);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'PIN reset successfully.' });
    });

    it('should return error if token is expired', async () => {
      const formData = new FormData();
      formData.append('token', 'expired-token');
      formData.append('newPin', '5678');
      formData.append('confirmPin', '5678');
      
      const pastDate = new Date(Date.now() - 100000);
      (prisma.passwordResetToken.findUnique as Mock).mockResolvedValueOnce({ 
        id: 'token-1', 
        name: 'user1', 
        token: 'expired-token', 
        expires: pastDate 
      });
      
      const result = await resetPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Token has expired.' });
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: 'token-1' } });
    });
  });

  describe('generateRecoveryKeyAction', () => {
    it('should successfully generate and update a recovery key', async () => {
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedKey123');
      (prisma.user.update as Mock).mockResolvedValueOnce({ id: 'user-1' });

      const { generateRecoveryKeyAction } = await import('@/lib/actions/auth');
      const result = await generateRecoveryKeyAction();

      expect(result.success).toBe(true);
      expect(typeof result.recoveryKey).toBe('string');
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
