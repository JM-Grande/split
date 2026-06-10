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
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
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
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');
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
    it('should create user and return success', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');
      (prisma.user.findUnique as Mock).mockResolvedValueOnce(null);
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedPassword123');
      (prisma.user.create as Mock).mockResolvedValueOnce({ id: '1' });
      const result = await registerAction(null, formData);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Registration successful.' });
    });
  });

  describe('changePasswordAction', () => {
    it('should update password and return success on correct credentials', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'oldPass123');
      formData.append('newPassword', 'newPass1234');
      formData.append('confirmPassword', 'newPass1234');
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedOldPass' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedNewPass');
      const result = await changePasswordAction(null, formData);
      expect(result).toEqual({ success: true, message: 'Password updated successfully.' });
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should return error if current password is incorrect', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'wrongPass');
      formData.append('newPassword', 'newPass1234');
      formData.append('confirmPassword', 'newPass1234');
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedOldPass' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(false);
      const result = await changePasswordAction(null, formData);
      expect(result).toEqual({ success: false, error: 'Incorrect current password.' });
    });

    it('should catch errors and return a generic error message', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'oldPass123');
      formData.append('newPassword', 'newPass1234');
      formData.append('confirmPassword', 'newPass1234');
      (auth as Mock).mockRejectedValueOnce(new Error('Test error'));
      const result = await changePasswordAction(null, formData);
      expect(result).toEqual({ success: false, error: 'Something went wrong.' });
    });
  });

  describe('deleteAccountAction', () => {
    it('should delete user and sign out when password is correct', async () => {
      const formData = new FormData();
      formData.append('password', 'correctPassword');
      formData.append('confirmPassword', 'correctPassword');
      
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedPassword' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(true);
      (prisma.user.delete as Mock).mockResolvedValueOnce({ id: 'user-1' });
      
      await deleteAccountAction(null, formData);
      
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('should return error when password is incorrect', async () => {
      const formData = new FormData();
      formData.append('password', 'wrongPassword');
      formData.append('confirmPassword', 'wrongPassword');
      
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', password: 'hashedPassword' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(false);
      
      const result = await deleteAccountAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Incorrect password.' });
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it('should return validation error when passwords do not match', async () => {
      const formData = new FormData();
      formData.append('password', 'correctPassword');
      formData.append('confirmPassword', 'differentPassword');

      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });

      const result = await deleteAccountAction(null, formData);

      expect(result).toMatchObject({ error: 'Invalid fields.', details: { confirmPassword: expect.any(Array) } });
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it('should return validation error when password is empty', async () => {
      const formData = new FormData();
      formData.append('password', '');
      formData.append('confirmPassword', '');

      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });

      const result = await deleteAccountAction(null, formData);

      expect(result).toMatchObject({ error: 'Invalid fields.' });
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should return error when user is not authenticated', async () => {
      const formData = new FormData();
      formData.append('password', 'somePassword');
      formData.append('confirmPassword', 'somePassword');

      (auth as Mock).mockResolvedValueOnce(null);

      const result = await deleteAccountAction(null, formData);

      expect(result).toEqual({ success: false, error: 'Something went wrong.' });
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should return error when user is not found', async () => {
      const formData = new FormData();
      formData.append('password', 'correctPassword');
      formData.append('confirmPassword', 'correctPassword');

      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce(null);

      const result = await deleteAccountAction(null, formData);

      expect(result).toEqual({ success: false, error: 'User not found.' });
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should rethrow AuthError from catch block', async () => {
      const formData = new FormData();
      formData.append('password', 'correctPassword');
      formData.append('confirmPassword', 'correctPassword');

      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (prisma.user.findUnique as Mock).mockImplementationOnce(() => {
        throw new MockAuthError('Auth failed');
      });

      await expect(deleteAccountAction(null, formData)).rejects.toThrow('Auth failed');
    });
  });

  describe('forgotPasswordAction', () => {
    it('should return error if validation fails', async () => {
      const formData = new FormData();
      formData.append('email', 'not-an-email');
      formData.append('recoveryKey', '');
      
      const result = await forgotPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Invalid email or recovery key.' });
    });

    it('should return error if user does not exist or recovery key is wrong', async () => {
      const formData = new FormData();
      formData.append('email', 'nonexistent@example.com');
      formData.append('recoveryKey', 'SPLT-AAAA-BBBB-CCCC');
      
      (prisma.user.findUnique as Mock).mockResolvedValueOnce(null);
      
      const result = await forgotPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Invalid email or recovery key.' });
    });

    it('should return error if recovery key does not match', async () => {
      const formData = new FormData();
      formData.append('email', 'existing@example.com');
      formData.append('recoveryKey', 'wrong-key');
      
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', email: 'existing@example.com', recoveryKey: 'hashedKey' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(false);
      
      const result = await forgotPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Invalid email or recovery key.' });
    });

    it('should create a token and return resetLink if recovery key matches', async () => {
      const formData = new FormData();
      formData.append('email', 'existing@example.com');
      formData.append('recoveryKey', 'SPLT-AAAA-BBBB-CCCC');
      
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', email: 'existing@example.com', recoveryKey: 'hashedKey' });
      (bcrypt.compare as Mock).mockResolvedValueOnce(true);
      (prisma.passwordResetToken.deleteMany as Mock).mockResolvedValueOnce(undefined);
      (prisma.passwordResetToken.create as Mock).mockResolvedValueOnce({ id: 'token-1' });
      
      // We mock crypto.randomUUID to predict the token in tests if needed, but since we don't mock crypto here,
      // we just expect result.success to be true.
      const result = await forgotPasswordAction(null, formData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Recovery key verified.');
      expect(result.resetLink).toMatch(/^\/reset-password\?token=/);
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe('resetPasswordAction', () => {
    it('should update password and return success on valid token', async () => {
      const formData = new FormData();
      formData.append('token', 'valid-token');
      formData.append('newPassword', 'newPassword123');
      formData.append('confirmPassword', 'newPassword123');
      
      const futureDate = new Date(Date.now() + 100000);
      (prisma.passwordResetToken.findUnique as Mock).mockResolvedValueOnce({ 
        id: 'token-1', 
        email: 'user@example.com', 
        token: 'valid-token', 
        expires: futureDate 
      });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({ id: 'user-1', email: 'user@example.com' });
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedNewPassword');
      (prisma.user.update as Mock).mockResolvedValueOnce({ id: 'user-1' });
      (prisma.passwordResetToken.delete as Mock).mockResolvedValueOnce({ id: 'token-1' });
      
      const result = await resetPasswordAction(null, formData);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Password reset successfully.' });
    });

    it('should return error if token is expired', async () => {
      const formData = new FormData();
      formData.append('token', 'expired-token');
      formData.append('newPassword', 'newPassword123');
      formData.append('confirmPassword', 'newPassword123');
      
      const pastDate = new Date(Date.now() - 100000);
      (prisma.passwordResetToken.findUnique as Mock).mockResolvedValueOnce({ 
        id: 'token-1', 
        email: 'user@example.com', 
        token: 'expired-token', 
        expires: pastDate 
      });
      
      const result = await resetPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'Token has expired.' });
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: 'token-1' } });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return validation error if passwords do not match', async () => {
      const formData = new FormData();
      formData.append('token', 'valid-token');
      formData.append('newPassword', 'newPassword123');
      formData.append('confirmPassword', 'differentPassword123');
      
      const result = await resetPasswordAction(null, formData);
      
      expect(result).toMatchObject({ error: 'Invalid fields.', details: { confirmPassword: expect.any(Array) } });
      expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
    });
    it('should return error if token is invalid (not found)', async () => {
      const formData = new FormData();
      formData.append('token', 'invalid-token');
      formData.append('newPassword', 'newPassword123');
      formData.append('confirmPassword', 'newPassword123');

      (prisma.passwordResetToken.findUnique as Mock).mockResolvedValueOnce(null);

      const result = await resetPasswordAction(null, formData);

      expect(result).toEqual({ success: false, error: 'Invalid token.' });
    });

    it('should return error if user is not found during reset', async () => {
      const formData = new FormData();
      formData.append('token', 'valid-token');
      formData.append('newPassword', 'newPassword123');
      formData.append('confirmPassword', 'newPassword123');
      
      const futureDate = new Date(Date.now() + 100000);
      (prisma.passwordResetToken.findUnique as Mock).mockResolvedValueOnce({ 
        id: 'token-1', 
        email: 'nonexistent@example.com', 
        token: 'valid-token', 
        expires: futureDate 
      });
      (prisma.user.findUnique as Mock).mockResolvedValueOnce(null);
      
      const result = await resetPasswordAction(null, formData);
      
      expect(result).toEqual({ success: false, error: 'User not found.' });
    });
  });

  describe('generateRecoveryKeyAction', () => {
    it('should successfully generate and update a recovery key', async () => {
      (auth as Mock).mockResolvedValueOnce({ user: { id: 'user-1' } });
      (bcrypt.hash as Mock).mockResolvedValueOnce('hashedKey123');
      (prisma.user.update as Mock).mockResolvedValueOnce({ id: 'user-1' });

      // We need to dynamic import so we can mock crypto if we want, but since crypto is native 
      // we just expect the result.success.
      const { generateRecoveryKeyAction } = await import('@/lib/actions/auth');
      const result = await generateRecoveryKeyAction();

      expect(result.success).toBe(true);
      expect(typeof result.recoveryKey).toBe('string');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should return error if an exception occurs', async () => {
      (auth as Mock).mockRejectedValueOnce(new Error('Auth failed'));

      const { generateRecoveryKeyAction } = await import('@/lib/actions/auth');
      const result = await generateRecoveryKeyAction();

      expect(result).toEqual({ success: false, error: 'Something went wrong.' });
    });
  });
});
