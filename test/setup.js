/**
 * Jest global setup — browser API stubs
 *
 * Several source modules (secureTokenManager, apiUtils) are designed for a
 * browser environment and access browser globals at module-evaluation time
 * (e.g. navigator, screen, location inside SecureTokenManager's constructor).
 *
 * Jest runs in Node.js, so this file is loaded via `setupFiles` in
 * jest.config.js before any test module (and its ESM imports) are evaluated.
 * The stubs defined here make those modules importable without crashing.
 *
 * Only minimal stubs are provided — just enough to satisfy constructor code.
 * Tests that need richer behaviour can override individual properties inside
 * their own beforeEach blocks.
 */

function makeStorageStub() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

globalThis.navigator = {
  userAgent: 'Jest/Node',
  language: 'en',
};

globalThis.screen = {
  width: 1920,
  height: 1080,
};

globalThis.location = {
  hostname: 'localhost',
  origin: 'http://localhost',
  pathname: '/',
  hash: '',
};

// Fresh sessionStorage and localStorage stubs per-process.
// Individual test files may replace these in beforeEach for isolation.
globalThis.sessionStorage = makeStorageStub();
globalThis.localStorage = makeStorageStub();
