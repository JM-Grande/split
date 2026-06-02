import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '../lib/utils/encryption';

describe('Encryption Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = 'test-secret-key-that-is-long-enough-for-tests';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encrypt and decrypt', () => {
    it('should properly encrypt and decrypt a standard string', () => {
      const plaintext = 'sk-or-v1-my-secret-api-key-123456';
      
      const encrypted = encrypt(plaintext);
      
      // The result should not contain the original string
      expect(encrypted).not.toContain(plaintext);
      // It should follow our format iv:tag:encrypted
      expect(encrypted.split(':')).toHaveLength(3);
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should return the original string if decrypting an unencrypted or legacy string', () => {
      const legacyKey = 'sk-or-v1-legacy-key';
      
      const decrypted = decrypt(legacyKey);
      
      // Since it doesn't match the format (no colons), it should return the original string
      expect(decrypted).toBe(legacyKey);
    });

    it('should handle falsy values gracefully', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
      
      // @ts-expect-error testing null behavior at runtime just in case
      expect(encrypt(null)).toBe(null);
      // @ts-expect-error testing null behavior at runtime just in case
      expect(decrypt(null)).toBe(null);
    });

    it('should fallback to returning the original string if decryption fails with a valid format but wrong key', () => {
      const plaintext = 'my-secret';
      const encrypted = encrypt(plaintext);
      
      // Change the AUTH_SECRET to simulate key rotation or wrong key
      process.env.AUTH_SECRET = 'different-secret-key';
      
      const decrypted = decrypt(encrypted);
      
      // It should catch the error and return the encrypted text as fallback
      expect(decrypted).toBe(encrypted);
    });

    it('should throw an error if AUTH_SECRET is not set', () => {
      delete process.env.AUTH_SECRET;
      
      expect(() => encrypt('test')).toThrow('AUTH_SECRET is not set');
      expect(() => decrypt('iv:tag:encrypted')).toThrow('AUTH_SECRET is not set');
    });
  });
});
