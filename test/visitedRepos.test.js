/**
 * Tests for visitedRepos.js
 *
 * All functions rely on localStorage. Jest runs in Node (no DOM), so we
 * provide a minimal localStorage stub via globalThis before each test and
 * reset it afterwards to prevent cross-test leakage.
 *
 * formatVisitedDate uses the current date, so we control it with
 * jest.useFakeTimers / jest.setSystemTime.
 */
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  loadVisitedRepos,
  addToVisitedRepos,
  removeFromVisitedRepos,
  clearAllVisitedRepos,
  formatVisitedDate,
} from '../src/utils/visitedRepos.js';

// ---------------------------------------------------------------------------
// localStorage stub
// ---------------------------------------------------------------------------
function makeLocalStorageStub() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

beforeEach(() => {
  globalThis.localStorage = makeLocalStorageStub();
});

afterEach(() => {
  delete globalThis.localStorage;
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// loadVisitedRepos
// ---------------------------------------------------------------------------
describe('loadVisitedRepos', () => {
  test('returns an empty array when localStorage has no entry', () => {
    expect(loadVisitedRepos()).toEqual([]);
  });

  test('returns parsed repos sorted by lastVisited (most recent first)', () => {
    const repos = [
      { owner: 'a', name: 'r1', branch: 'main', lastVisited: '2024-01-01T00:00:00.000Z' },
      { owner: 'b', name: 'r2', branch: 'main', lastVisited: '2024-06-01T00:00:00.000Z' },
    ];
    localStorage.setItem('visited_repositories', JSON.stringify(repos));

    const result = loadVisitedRepos();
    expect(result[0].name).toBe('r2');
    expect(result[1].name).toBe('r1');
  });

  test('returns an empty array when localStorage value is invalid JSON', () => {
    localStorage.setItem('visited_repositories', 'not-json{{{');
    expect(loadVisitedRepos()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// addToVisitedRepos
// ---------------------------------------------------------------------------
describe('addToVisitedRepos', () => {
  test('adds a new repo and persists it', () => {
    const result = addToVisitedRepos('owner', 'repo', 'main');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ owner: 'owner', name: 'repo', branch: 'main' });
    expect(result[0].lastVisited).toBeDefined();
  });

  test('places the newly added repo at the beginning', () => {
    addToVisitedRepos('owner', 'first', 'main');
    const result = addToVisitedRepos('owner', 'second', 'main');
    expect(result[0].name).toBe('second');
    expect(result[1].name).toBe('first');
  });

  test('removes the existing entry before re-adding (no duplicates)', () => {
    addToVisitedRepos('owner', 'repo', 'main');
    const result = addToVisitedRepos('owner', 'repo', 'main');
    expect(result.filter(r => r.name === 'repo')).toHaveLength(1);
  });

  test('stores defaultBranch when supplied', () => {
    const result = addToVisitedRepos('owner', 'repo', 'feature', 'main');
    expect(result[0].defaultBranch).toBe('main');
  });

  test('distinguishes repos by owner/name/branch triple', () => {
    addToVisitedRepos('owner', 'repo', 'main');
    addToVisitedRepos('owner', 'repo', 'develop');
    const result = loadVisitedRepos();
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// removeFromVisitedRepos
// ---------------------------------------------------------------------------
describe('removeFromVisitedRepos', () => {
  test('removes the matching repo from the list', () => {
    addToVisitedRepos('owner', 'repo', 'main');
    const result = removeFromVisitedRepos('owner', 'repo', 'main');
    expect(result).toHaveLength(0);
  });

  test('leaves other repos intact', () => {
    addToVisitedRepos('owner', 'keep', 'main');
    addToVisitedRepos('owner', 'remove', 'main');
    const result = removeFromVisitedRepos('owner', 'remove', 'main');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('keep');
  });

  test('returns the current list unchanged when repo is not found', () => {
    addToVisitedRepos('owner', 'repo', 'main');
    const result = removeFromVisitedRepos('owner', 'other', 'main');
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// clearAllVisitedRepos
// ---------------------------------------------------------------------------
describe('clearAllVisitedRepos', () => {
  test('removes all repos and returns an empty array', () => {
    addToVisitedRepos('owner', 'repo', 'main');
    const result = clearAllVisitedRepos();
    expect(result).toEqual([]);
    expect(loadVisitedRepos()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// formatVisitedDate
// ---------------------------------------------------------------------------
describe('formatVisitedDate', () => {
  // Fix "now" to a known point so diffDays is deterministic.
  const NOW = new Date('2024-06-15T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  test('returns "Today" for a timestamp a few hours ago', () => {
    // diffDays = ceil(diffTime / ms_per_day). Any time in the range (0, 24h]
    // gives diffDays = 1 → "Today".
    const oneHourAgo = new Date(NOW - 60 * 60 * 1000);
    expect(formatVisitedDate(oneHourAgo.toISOString())).toBe('Today');
  });

  test('returns "Yesterday" for a timestamp roughly 25 hours ago', () => {
    // diffDays = ceil(25h / 24h) = 2 → "Yesterday"
    const twentyFiveHoursAgo = new Date(NOW - 25 * 60 * 60 * 1000);
    expect(formatVisitedDate(twentyFiveHoursAgo.toISOString())).toBe('Yesterday');
  });

  test('returns "N days ago" for timestamps within the last week', () => {
    // 3 days + 1 ms ago → diffDays = 4 → "3 days ago"
    const threeDaysAgo = new Date(NOW - 3 * 24 * 60 * 60 * 1000 - 1);
    const result = formatVisitedDate(threeDaysAgo.toISOString());
    expect(result).toMatch(/days ago/);
  });

  test('returns a locale date string for timestamps older than a week', () => {
    const twoWeeksAgo = new Date(NOW - 14 * 24 * 60 * 60 * 1000);
    const result = formatVisitedDate(twoWeeksAgo.toISOString());
    // Should not be a relative label
    expect(result).not.toMatch(/Today|Yesterday|days ago/);
    // Should be a non-empty string (locale-formatted date)
    expect(result.length).toBeGreaterThan(0);
  });
});
