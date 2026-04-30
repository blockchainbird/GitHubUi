/**
 * Tests for branchUtils.js
 *
 * These functions encode/decode Git branch names for safe URL use.
 * All functions are pure (no side effects, no DOM, no Vue) so they
 * are straightforward to unit-test.
 */
import {
  encodeBranchName,
  decodeBranchName,
  buildRoutePath,
} from '../src/utils/branchUtils.js';

describe('encodeBranchName', () => {
  test('encodes forward slashes in hierarchical branch names', () => {
    expect(encodeBranchName('feature/new-feature')).toBe('feature%2Fnew-feature');
  });

  test('encodes plus signs', () => {
    expect(encodeBranchName('fix+patch')).toBe('fix%2Bpatch');
  });

  test('encodes percent signs', () => {
    expect(encodeBranchName('release%20')).toBe('release%2520');
  });

  test('leaves simple branch names unchanged', () => {
    expect(encodeBranchName('main')).toBe('main');
    expect(encodeBranchName('develop')).toBe('develop');
  });

  test('returns the input unchanged when it is falsy', () => {
    expect(encodeBranchName('')).toBe('');
    expect(encodeBranchName(null)).toBeNull();
    expect(encodeBranchName(undefined)).toBeUndefined();
  });
});

describe('decodeBranchName', () => {
  test('decodes a percent-encoded slash back to /', () => {
    expect(decodeBranchName('feature%2Fnew-feature')).toBe('feature/new-feature');
  });

  test('decodes a percent-encoded plus sign', () => {
    expect(decodeBranchName('fix%2Bpatch')).toBe('fix+patch');
  });

  test('leaves plain branch names unchanged', () => {
    expect(decodeBranchName('main')).toBe('main');
  });

  test('returns the input unchanged when it is falsy', () => {
    expect(decodeBranchName('')).toBe('');
    expect(decodeBranchName(null)).toBeNull();
    expect(decodeBranchName(undefined)).toBeUndefined();
  });

  test('is the inverse of encodeBranchName for arbitrary names', () => {
    const names = ['main', 'feature/login', 'fix+bug', 'release-1.0'];
    for (const name of names) {
      expect(decodeBranchName(encodeBranchName(name))).toBe(name);
    }
  });
});

describe('buildRoutePath', () => {
  test('builds a path with an encoded branch name', () => {
    expect(buildRoutePath('/files', 'owner', 'repo', 'main')).toBe(
      '/files/owner/repo/main'
    );
  });

  test('encodes slashes in the branch segment', () => {
    expect(buildRoutePath('/editor', 'owner', 'repo', 'feature/login')).toBe(
      '/editor/owner/repo/feature%2Flogin'
    );
  });

  test('appends an optional additional path segment', () => {
    expect(
      buildRoutePath('/editor', 'owner', 'repo', 'main', 'spec/terms.md')
    ).toBe('/editor/owner/repo/main/spec/terms.md');
  });

  test('does not add a trailing slash when additionalPath is empty', () => {
    const result = buildRoutePath('/files', 'o', 'r', 'main', '');
    expect(result).toBe('/files/o/r/main');
  });
});
