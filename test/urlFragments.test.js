/**
 * Tests for urlFragments.js
 *
 * createTermsPreviewUrl is a pure string function.
 * generateTermsPreviewShareUrl and setupFragmentHandling access window.location,
 * so we provide a minimal stub via globalThis.window before each test.
 */
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createTermsPreviewUrl,
  generateTermsPreviewShareUrl,
  setupFragmentHandling,
} from '../src/utils/urlFragments.js';

// ---------------------------------------------------------------------------
// window stub
// ---------------------------------------------------------------------------
function makeWindowStub({ origin = 'https://example.com', pathname = '/app/', hash = '' } = {}) {
  return {
    location: { origin, pathname, hash },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

beforeEach(() => {
  globalThis.window = makeWindowStub();
});

afterEach(() => {
  delete globalThis.window;
});

// ---------------------------------------------------------------------------
// createTermsPreviewUrl
// ---------------------------------------------------------------------------
describe('createTermsPreviewUrl', () => {
  test('appends the default fragment "terms" to a plain URL', () => {
    expect(createTermsPreviewUrl('https://example.com/app')).toBe(
      'https://example.com/app#terms'
    );
  });

  test('appends a custom fragment type', () => {
    expect(createTermsPreviewUrl('https://example.com/app', 'definitions')).toBe(
      'https://example.com/app#definitions'
    );
  });

  test('strips an existing fragment before appending the new one', () => {
    expect(createTermsPreviewUrl('https://example.com/app#old-hash', 'terms')).toBe(
      'https://example.com/app#terms'
    );
  });

  test('works with an empty baseUrl (edge case)', () => {
    expect(createTermsPreviewUrl('', 'terms')).toBe('#terms');
  });
});

// ---------------------------------------------------------------------------
// generateTermsPreviewShareUrl
// ---------------------------------------------------------------------------
describe('generateTermsPreviewShareUrl', () => {
  test('returns a modal URL (default) with terms-preview fragment', () => {
    const url = generateTermsPreviewShareUrl('owner', 'repo', 'main');
    expect(url).toContain('#terms-preview');
    expect(url).toContain('https://example.com');
  });

  test('strips any existing hash from the window pathname before adding the fragment', () => {
    globalThis.window = makeWindowStub({ pathname: '/app/#old' });
    const url = generateTermsPreviewShareUrl('owner', 'repo', 'main', true);
    // Should not have double hash
    expect(url.split('#').length).toBe(2);
  });

  test('returns a standalone URL when modal is false', () => {
    const url = generateTermsPreviewShareUrl('owner', 'repo', 'main', false);
    expect(url).toContain('/terms-preview/owner/repo/main');
    expect(url).not.toContain('#');
  });

  test('includes owner and repo in the standalone URL', () => {
    const url = generateTermsPreviewShareUrl('myowner', 'myrepo', 'develop', false);
    expect(url).toContain('myowner');
    expect(url).toContain('myrepo');
  });
});

// ---------------------------------------------------------------------------
// setupFragmentHandling
// ---------------------------------------------------------------------------
describe('setupFragmentHandling', () => {
  test('calls handleFragment immediately when the current hash is non-empty', () => {
    globalThis.window = makeWindowStub({ hash: '#terms' });
    const handler = jest.fn();
    setupFragmentHandling(handler);
    expect(handler).toHaveBeenCalledWith('#terms');
  });

  test('does not call handleFragment when there is no current hash', () => {
    globalThis.window = makeWindowStub({ hash: '' });
    const handler = jest.fn();
    setupFragmentHandling(handler);
    expect(handler).not.toHaveBeenCalled();
  });

  test('registers a hashchange listener on window', () => {
    globalThis.window = makeWindowStub({ hash: '' });
    const handler = jest.fn();
    setupFragmentHandling(handler);
    expect(globalThis.window.addEventListener).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    );
  });

  test('returned cleanup function removes the hashchange listener', () => {
    globalThis.window = makeWindowStub({ hash: '' });
    const cleanup = setupFragmentHandling(jest.fn());
    cleanup();
    expect(globalThis.window.removeEventListener).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    );
  });
});
