/**
 * Tests for apiUtils.js
 *
 * getGitHubHeaders — pure function, no external deps.
 * addCacheBusting  — pure except for Date.now(), which we control via a spy.
 *
 * cacheBustedRequest / cacheBustedPutRequest make real HTTP calls and depend
 * on the secureTokenManager singleton, so they are not tested here.
 */
import { jest, describe, test, expect, afterEach } from '@jest/globals';
import { getGitHubHeaders, addCacheBusting } from '../src/utils/apiUtils.js';

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getGitHubHeaders
// ---------------------------------------------------------------------------
describe('getGitHubHeaders', () => {
  test('returns an Authorization header with the token', () => {
    const headers = getGitHubHeaders('my-token-123');
    expect(headers['Authorization']).toBe('token my-token-123');
  });

  test('returns the correct GitHub API Accept header', () => {
    const headers = getGitHubHeaders('tok');
    expect(headers['Accept']).toBe('application/vnd.github.v3+json');
  });

  test('returns exactly two header keys', () => {
    const headers = getGitHubHeaders('tok');
    expect(Object.keys(headers)).toHaveLength(2);
  });

  test('includes the token verbatim (including special chars)', () => {
    const token = 'ghp_abcDEF123!@#';
    expect(getGitHubHeaders(token)['Authorization']).toBe(`token ${token}`);
  });
});

// ---------------------------------------------------------------------------
// addCacheBusting
// ---------------------------------------------------------------------------
describe('addCacheBusting', () => {
  test('appends ?cb=<timestamp> to a URL with no query string', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const result = addCacheBusting('https://api.github.com/repos/owner/repo');
    expect(result).toBe('https://api.github.com/repos/owner/repo?cb=1700000000000');
  });

  test('appends &cb=<timestamp> to a URL that already has a query string', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const result = addCacheBusting('https://api.github.com/repos?per_page=100');
    expect(result).toBe('https://api.github.com/repos?per_page=100&cb=1700000000000');
  });

  test('uses the current timestamp (different calls give different values)', () => {
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1111)
      .mockReturnValueOnce(2222);

    const first = addCacheBusting('https://example.com/api');
    const second = addCacheBusting('https://example.com/api');

    expect(first).toContain('cb=1111');
    expect(second).toContain('cb=2222');
  });

  test('does not modify the base URL before the separator', () => {
    jest.spyOn(Date, 'now').mockReturnValue(999);
    const base = 'https://api.github.com/repos/owner/repo/contents/file.md';
    const result = addCacheBusting(base);
    expect(result.startsWith(base)).toBe(true);
  });
});
