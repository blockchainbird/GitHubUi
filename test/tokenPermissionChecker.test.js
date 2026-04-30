/**
 * Tests for tokenPermissionChecker.js
 *
 * TokenPermissionChecker.hasScope and .checkOperationPermissions are pure
 * methods — no network calls, no browser APIs. They can be tested by
 * instantiating the class and passing in synthetic scope arrays.
 *
 * SCOPE_DESCRIPTIONS and REQUIRED_SCOPES are module-level constants whose
 * structure is verified here to catch accidental regressions.
 *
 * validateTokenPermissions and testTokenOperations make live GitHub API calls
 * and are therefore not tested here.
 */
import {
  TokenPermissionChecker,
  SCOPE_DESCRIPTIONS,
  REQUIRED_SCOPES,
} from '../src/utils/tokenPermissionChecker.js';

const checker = new TokenPermissionChecker();

// ---------------------------------------------------------------------------
// hasScope
// ---------------------------------------------------------------------------
describe('hasScope', () => {
  test('returns true for a direct scope match', () => {
    expect(checker.hasScope(['repo', 'workflow'], 'repo')).toBe(true);
    expect(checker.hasScope(['workflow'], 'workflow')).toBe(true);
  });

  test('returns false when the scope is not in the list', () => {
    expect(checker.hasScope(['workflow'], 'repo')).toBe(false);
    expect(checker.hasScope([], 'repo')).toBe(false);
  });

  test('"repo" scope covers any "repo:*" sub-scope', () => {
    expect(checker.hasScope(['repo'], 'repo:status')).toBe(true);
    expect(checker.hasScope(['repo'], 'repo:deployment')).toBe(true);
    expect(checker.hasScope(['repo'], 'repo:invite')).toBe(true);
  });

  test('"workflow" alone does NOT cover "repo:*" sub-scopes', () => {
    expect(checker.hasScope(['workflow'], 'repo:status')).toBe(false);
  });

  test('"repo" scope covers "public_repo"', () => {
    expect(checker.hasScope(['repo'], 'public_repo')).toBe(true);
  });

  test('"public_repo" alone does NOT cover "repo"', () => {
    expect(checker.hasScope(['public_repo'], 'repo')).toBe(false);
  });

  test('returns true when the scope appears among several other scopes', () => {
    expect(checker.hasScope(['read:user', 'workflow', 'repo'], 'workflow')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkOperationPermissions
// ---------------------------------------------------------------------------
describe('checkOperationPermissions', () => {
  describe('unknown operation', () => {
    test('returns allowed=false with an error message', () => {
      const result = checker.checkOperationPermissions(['repo'], 'nonExistentOp');
      expect(result.allowed).toBe(false);
      expect(result.error).toMatch(/Unknown operation/);
    });
  });

  describe('authentication', () => {
    test('allowed when "repo" scope is present', () => {
      const result = checker.checkOperationPermissions(['repo', 'workflow'], 'authentication');
      expect(result.allowed).toBe(true);
      expect(result.missingScopes).toHaveLength(0);
    });

    test('not allowed when "repo" scope is absent', () => {
      const result = checker.checkOperationPermissions(['workflow'], 'authentication');
      expect(result.allowed).toBe(false);
      expect(result.missingScopes).toContain('repo');
    });
  });

  describe('readRepository (special case: repo OR public_repo)', () => {
    test('allowed with "repo"', () => {
      expect(checker.checkOperationPermissions(['repo'], 'readRepository').allowed).toBe(true);
    });

    test('allowed with "public_repo"', () => {
      expect(checker.checkOperationPermissions(['public_repo'], 'readRepository').allowed).toBe(true);
    });

    test('not allowed with neither', () => {
      const result = checker.checkOperationPermissions(['workflow'], 'readRepository');
      expect(result.allowed).toBe(false);
      expect(result.missingScopes).toContain('repo');
    });
  });

  describe('writeRepository', () => {
    test('allowed with "repo"', () => {
      expect(checker.checkOperationPermissions(['repo'], 'writeRepository').allowed).toBe(true);
    });

    test('not allowed without "repo"', () => {
      const result = checker.checkOperationPermissions(['workflow'], 'writeRepository');
      expect(result.allowed).toBe(false);
    });
  });

  describe('manageWorkflows', () => {
    test('allowed with both "repo" and "workflow"', () => {
      const result = checker.checkOperationPermissions(['repo', 'workflow'], 'manageWorkflows');
      expect(result.allowed).toBe(true);
      expect(result.missingScopes).toHaveLength(0);
    });

    test('not allowed when "workflow" is missing', () => {
      const result = checker.checkOperationPermissions(['repo'], 'manageWorkflows');
      expect(result.allowed).toBe(false);
      expect(result.missingScopes).toContain('workflow');
    });

    test('not allowed when "repo" is missing', () => {
      const result = checker.checkOperationPermissions(['workflow'], 'manageWorkflows');
      expect(result.allowed).toBe(false);
      expect(result.missingScopes).toContain('repo');
    });

    test('not allowed with an empty scope list', () => {
      const result = checker.checkOperationPermissions([], 'manageWorkflows');
      expect(result.allowed).toBe(false);
      expect(result.missingScopes).toContain('repo');
      expect(result.missingScopes).toContain('workflow');
    });
  });

  describe('fullAccess', () => {
    test('allowed with ["repo", "workflow"]', () => {
      const result = checker.checkOperationPermissions(['repo', 'workflow'], 'fullAccess');
      expect(result.allowed).toBe(true);
    });

    test('not allowed with only "repo"', () => {
      expect(checker.checkOperationPermissions(['repo'], 'fullAccess').allowed).toBe(false);
    });

    test('not allowed with only "workflow"', () => {
      expect(checker.checkOperationPermissions(['workflow'], 'fullAccess').allowed).toBe(false);
    });
  });

  describe('result shape', () => {
    test('includes operation and required fields', () => {
      const result = checker.checkOperationPermissions(['repo', 'workflow'], 'fullAccess');
      expect(result).toHaveProperty('operation', 'fullAccess');
      expect(result).toHaveProperty('required');
      expect(Array.isArray(result.required)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE_DESCRIPTIONS — structural check
// ---------------------------------------------------------------------------
describe('SCOPE_DESCRIPTIONS', () => {
  test('is a plain object', () => {
    expect(typeof SCOPE_DESCRIPTIONS).toBe('object');
  });

  test('contains a description for "repo"', () => {
    expect(typeof SCOPE_DESCRIPTIONS['repo']).toBe('string');
    expect(SCOPE_DESCRIPTIONS['repo'].length).toBeGreaterThan(0);
  });

  test('contains a description for "workflow"', () => {
    expect(typeof SCOPE_DESCRIPTIONS['workflow']).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// REQUIRED_SCOPES — structural check
// ---------------------------------------------------------------------------
describe('REQUIRED_SCOPES', () => {
  const EXPECTED_OPERATIONS = [
    'authentication',
    'readRepository',
    'writeRepository',
    'manageWorkflows',
    'fullAccess',
  ];

  test.each(EXPECTED_OPERATIONS)(
    'defines scope list for operation "%s"',
    (op) => {
      expect(Array.isArray(REQUIRED_SCOPES[op])).toBe(true);
      expect(REQUIRED_SCOPES[op].length).toBeGreaterThan(0);
    }
  );

  test('"fullAccess" requires both "repo" and "workflow"', () => {
    expect(REQUIRED_SCOPES.fullAccess).toContain('repo');
    expect(REQUIRED_SCOPES.fullAccess).toContain('workflow');
  });
});
