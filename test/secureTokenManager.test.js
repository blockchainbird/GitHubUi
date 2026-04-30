/**
 * Tests for secureTokenManager.js
 *
 * The SecureTokenManager constructor calls generateEncryptionKey(), which reads
 * navigator.userAgent, navigator.language, screen.width/height, and
 * location.hostname. These are provided by test/setup.js before any module is
 * imported.
 *
 * Methods tested here:
 *   - validateToken   — pure logic, no external I/O
 *   - xorEncrypt / xorDecrypt — pure XOR + btoa/atob, testable as a round-trip
 *   - hasToken        — reads sessionStorage (stubbed in setup.js)
 *
 * Methods NOT tested here:
 *   - storeToken / clearToken / logSecurityEvent — call import.meta.env.DEV
 *     which is a Vite-specific extension unavailable in Node.js.
 */
import { SecureTokenManager } from '../src/utils/secureTokenManager.js';

// Create a fresh instance per test so sessionStorage state does not leak.
let manager;
beforeEach(() => {
  globalThis.sessionStorage.clear();
  manager = new SecureTokenManager();
});

// ---------------------------------------------------------------------------
// validateToken
// ---------------------------------------------------------------------------
describe('validateToken', () => {
  describe('rejects falsy and non-string inputs', () => {
    test('returns isValid=false for null', () => {
      expect(manager.validateToken(null).isValid).toBe(false);
    });

    test('returns isValid=false for undefined', () => {
      expect(manager.validateToken(undefined).isValid).toBe(false);
    });

    test('returns isValid=false for an empty string', () => {
      expect(manager.validateToken('').isValid).toBe(false);
    });

    test('includes a descriptive error for missing token', () => {
      expect(manager.validateToken(null).errors).toContain('Token is required');
    });
  });

  describe('rejects tokens that are too short', () => {
    test('returns isValid=false for a 19-character token', () => {
      expect(manager.validateToken('ghp_short12345678').isValid).toBe(false);
    });

    test('includes an error about token length', () => {
      const result = manager.validateToken('ghp_short12345678');
      expect(result.errors.some(e => e.toLowerCase().includes('short'))).toBe(true);
    });
  });

  describe('rejects tokens with invalid characters', () => {
    test('returns isValid=false when the token contains a space', () => {
      const token = 'ghp_valid token with space1234';
      expect(manager.validateToken(token).isValid).toBe(false);
    });

    test('returns isValid=false when the token contains a hyphen', () => {
      // Hyphens are not in [a-zA-Z0-9_]
      const token = 'ghp_abc-def-ghi-jkl-mno-pqr';
      expect(manager.validateToken(token).isValid).toBe(false);
    });

    test('includes an error about invalid characters', () => {
      const result = manager.validateToken('ghp_abc-def-ghi-jkl-mno-pqr');
      expect(result.errors.some(e => e.toLowerCase().includes('invalid'))).toBe(true);
    });
  });

  describe('accepts valid tokens and detects type', () => {
    // Each token must be ≥20 chars and match [a-zA-Z0-9_]+
    test('recognises ghp_ tokens as personal_access_token', () => {
      const result = manager.validateToken('ghp_abcdefghijklmnopqrstuvwxyz');
      expect(result.isValid).toBe(true);
      expect(result.tokenType).toBe('personal_access_token');
    });

    test('recognises github_pat_ tokens as fine_grained_token', () => {
      const result = manager.validateToken('github_pat_abcdefghijklmnopqrs');
      expect(result.isValid).toBe(true);
      expect(result.tokenType).toBe('fine_grained_token');
    });

    test('recognises gho_ tokens as oauth_token', () => {
      const result = manager.validateToken('gho_abcdefghijklmnopqrstuvwxy');
      expect(result.isValid).toBe(true);
      expect(result.tokenType).toBe('oauth_token');
    });

    test('classifies unknown prefixes as legacy_or_unknown', () => {
      const result = manager.validateToken('abcdefghijklmnopqrstuvwxyz1234');
      expect(result.isValid).toBe(true);
      expect(result.tokenType).toBe('legacy_or_unknown');
    });

    test('returns an empty errors array for a valid token', () => {
      const result = manager.validateToken('ghp_abcdefghijklmnopqrstuvwxyz');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('trims surrounding whitespace before validating', () => {
    test('accepts a token with leading/trailing whitespace', () => {
      // The function does token = token.trim() before checking length/chars
      const result = manager.validateToken('  ghp_abcdefghijklmnopqrstuvwxyz  ');
      expect(result.isValid).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// xorEncrypt / xorDecrypt — round-trip
// ---------------------------------------------------------------------------
describe('xorEncrypt / xorDecrypt', () => {
  test('decrypting an encrypted value returns the original string', () => {
    const original = 'ghp_abcdefghijklmnopqrstuvwxyz';
    const key = 'testkey';
    const encrypted = manager.xorEncrypt(original, key);
    expect(manager.xorDecrypt(encrypted, key)).toBe(original);
  });

  test('encrypting the same value twice yields the same ciphertext', () => {
    const text = 'ghp_abcdefghijklmnopqrstuvwxyz';
    const key = 'samekey';
    expect(manager.xorEncrypt(text, key)).toBe(manager.xorEncrypt(text, key));
  });

  test('encrypted value is different from the original plaintext', () => {
    const text = 'ghp_abcdefghijklmnopqrstuvwxyz';
    const key = 'somekey';
    expect(manager.xorEncrypt(text, key)).not.toBe(text);
  });

  test('different keys produce different ciphertext', () => {
    const text = 'ghp_abcdefghijklmnopqrstuvwxyz';
    const enc1 = manager.xorEncrypt(text, 'keyA');
    const enc2 = manager.xorEncrypt(text, 'keyB');
    expect(enc1).not.toBe(enc2);
  });

  test('xorEncrypt returns the input unchanged when text is falsy', () => {
    expect(manager.xorEncrypt('', 'key')).toBe('');
    expect(manager.xorEncrypt(null, 'key')).toBeNull();
  });

  test('xorDecrypt returns the input unchanged when encryptedText is falsy', () => {
    expect(manager.xorDecrypt('', 'key')).toBe('');
    expect(manager.xorDecrypt(null, 'key')).toBeNull();
  });

  test('xorDecrypt returns null for a value that is not valid base64', () => {
    // The function uses atob internally; invalid base64 is caught and returns null
    expect(manager.xorDecrypt('not-valid-base64!!!', 'key')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hasToken
// ---------------------------------------------------------------------------
describe('hasToken', () => {
  test('returns false when sessionStorage has no token entry', () => {
    expect(manager.hasToken()).toBe(false);
  });

  test('returns true after manually placing an entry in sessionStorage', () => {
    globalThis.sessionStorage.setItem(manager.storageKey, 'some-encrypted-value');
    expect(manager.hasToken()).toBe(true);
  });
});
