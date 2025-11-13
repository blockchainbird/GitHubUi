/**
 * Token Permission Checker
 * 
 * Validates that a GitHub Personal Access Token has the necessary scopes/permissions
 * to perform all required operations in the Spec-Up-T Editor.
 * 
 * This component checks token permissions by:
 * 1. Examining the X-OAuth-Scopes header from GitHub API responses
 * 2. Testing actual API operations to verify permissions
 * 3. Providing detailed feedback on missing or insufficient permissions
 * 
 * Required Scopes:
 * - repo: Full control of private repositories (read/write) - also grants /user endpoint access
 * - workflow: Update GitHub Action workflows
 */

import axios from 'axios'

/**
 * Maps GitHub API scopes to human-readable descriptions
 * This helps users understand what each scope enables
 */
const SCOPE_DESCRIPTIONS = {
  repo: 'Full control of repositories (read, write, delete files)',
  'repo:status': 'Access commit status',
  'repo:deployment': 'Access deployment status',
  'repo:invite': 'Access repository invitations',
  'public_repo': 'Access public repositories only',
  'read:repo_hook': 'Read repository webhooks',
  'write:repo_hook': 'Write repository webhooks',
  'admin:repo_hook': 'Admin repository webhooks',
  'read:user': 'Read user profile data',
  'user:email': 'Access user email addresses',
  workflow: 'Update GitHub Action workflow files',
  'read:org': 'Read organization data',
  'write:org': 'Write organization data'
}

/**
 * Defines the minimum required scopes for different operations
 * Each operation type maps to the scopes it needs
 * 
 * IMPORTANT: For Spec-Up-T Editor to work properly, tokens MUST have:
 * - repo (full repository access)
 * - workflow (GitHub Actions management)
 * 
 * Note: read:user is NOT required because the 'repo' scope already grants
 * access to the /user endpoint when working with repositories.
 */
const REQUIRED_SCOPES = {
  // Basic authentication and user info (covered by 'repo' scope)
  authentication: ['repo'],
  
  // Reading repository data (branches, files, content)
  readRepository: ['repo', 'public_repo'],
  
  // Writing to repositories (create, update, delete files)
  writeRepository: ['repo'],
  
  // Managing GitHub Actions workflows (REQUIRED for Spec-Up-T Editor)
  manageWorkflows: ['repo', 'workflow'],
  
  // All operations combined - MINIMUM REQUIRED FOR SPEC-UP-T EDITOR
  fullAccess: ['repo', 'workflow']
}

/**
 * Main class for checking token permissions
 * Provides both scope-based and operation-based validation
 */
class TokenPermissionChecker {
  constructor() {
    this.cachedScopes = null
    this.cachedTimestamp = null
    this.cacheDuration = 5 * 60 * 1000 // Cache for 5 minutes
  }

  /**
   * Fetches the scopes associated with a token from GitHub API
   * Uses the /user endpoint which is lightweight and returns scope info
   * 
   * @param {string} token - GitHub Personal Access Token
   * @returns {Promise<Object>} Object containing scopes array and user info
   */
  async fetchTokenScopes(token) {
    // Check cache first to avoid unnecessary API calls
    if (this.cachedScopes && this.cachedTimestamp) {
      const age = Date.now() - this.cachedTimestamp
      if (age < this.cacheDuration) {
        return this.cachedScopes
      }
    }

    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      // GitHub returns scopes in the X-OAuth-Scopes header
      const scopesHeader = response.headers['x-oauth-scopes'] || ''
      const scopes = scopesHeader
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const result = {
        scopes,
        user: response.data,
        rateLimit: {
          limit: response.headers['x-ratelimit-limit'],
          remaining: response.headers['x-ratelimit-remaining'],
          reset: response.headers['x-ratelimit-reset']
        }
      }

      // Cache the results
      this.cachedScopes = result
      this.cachedTimestamp = Date.now()

      return result
    } catch (error) {
      throw new Error(`Failed to fetch token scopes: ${error.message}`)
    }
  }

  /**
   * Checks if a token has a specific scope
   * Handles scope hierarchies (e.g., 'repo' includes 'repo:status')
   * 
   * @param {Array<string>} tokenScopes - Scopes the token has
   * @param {string} requiredScope - Scope to check for
   * @returns {boolean} True if the token has the required scope
   */
  hasScope(tokenScopes, requiredScope) {
    // Direct match
    if (tokenScopes.includes(requiredScope)) {
      return true
    }

    // Check for parent scopes that include the required scope
    // For example, 'repo' includes 'repo:status', 'public_repo', etc.
    if (requiredScope.startsWith('repo:') && tokenScopes.includes('repo')) {
      return true
    }

    // 'repo' scope is sufficient for 'public_repo'
    if (requiredScope === 'public_repo' && tokenScopes.includes('repo')) {
      return true
    }

    return false
  }

  /**
   * Checks if a token has all required scopes for a specific operation
   * 
   * @param {Array<string>} tokenScopes - Scopes the token has
   * @param {string} operation - Operation type (e.g., 'readRepository', 'writeRepository')
   * @returns {Object} Validation result with missing scopes
   */
  checkOperationPermissions(tokenScopes, operation) {
    const required = REQUIRED_SCOPES[operation]
    if (!required) {
      return {
        allowed: false,
        error: `Unknown operation: ${operation}`
      }
    }

    // For most operations, we need ALL required scopes
    // Exception: readRepository accepts either 'repo' OR 'public_repo'
    const missingScopes = []
    
    if (operation === 'readRepository') {
      // Special case: accept either 'repo' or 'public_repo'
      const hasRepoAccess = tokenScopes.some(s => s === 'repo' || s === 'public_repo')
      if (!hasRepoAccess) {
        missingScopes.push('repo')
      }
      
      return {
        allowed: hasRepoAccess,
        missingScopes,
        operation,
        required
      }
    }
    
    // For all other operations, check each required scope individually
    for (const scope of required) {
      if (!this.hasScope(tokenScopes, scope)) {
        missingScopes.push(scope)
      }
    }

    return {
      allowed: missingScopes.length === 0,
      missingScopes,
      operation,
      required
    }
  }

  /**
   * Performs comprehensive permission validation for the token
   * Checks all required operations and provides detailed feedback
   * 
   * @param {string} token - GitHub Personal Access Token
   * @returns {Promise<Object>} Detailed validation results
   */
  async validateTokenPermissions(token) {
    try {
      // Fetch token scopes from GitHub
      const { scopes, user, rateLimit } = await this.fetchTokenScopes(token)

      // Check each operation type
      const operations = {
        authentication: this.checkOperationPermissions(scopes, 'authentication'),
        readRepository: this.checkOperationPermissions(scopes, 'readRepository'),
        writeRepository: this.checkOperationPermissions(scopes, 'writeRepository'),
        manageWorkflows: this.checkOperationPermissions(scopes, 'manageWorkflows'),
        fullAccess: this.checkOperationPermissions(scopes, 'fullAccess')
      }

      // Determine overall status
      // For Spec-Up-T Editor, we need ALL of: repo and workflow
      const canRead = operations.readRepository.allowed
      const canWrite = operations.writeRepository.allowed
      const canAuthenticate = operations.authentication.allowed
      const canManageWorkflows = operations.manageWorkflows.allowed

      // Collect all missing scopes
      const allMissingScopes = new Set()
      Object.values(operations).forEach(op => {
        op.missingScopes.forEach(scope => allMissingScopes.add(scope))
      })

      // Generate user-friendly messages
      const warnings = []
      const errors = []

      // Authentication is covered by 'repo' scope, so no separate check needed

      if (!canRead) {
        errors.push('Cannot read repository data - missing repo scope')
      }

      if (!canWrite) {
        errors.push('Cannot modify files - missing repo scope')
      }

      if (!canManageWorkflows) {
        errors.push('Cannot manage GitHub Actions - missing workflow scope (REQUIRED)')
      }

      return {
        valid: canAuthenticate && canRead && canWrite && canManageWorkflows,
        fullAccess: canAuthenticate && canRead && canWrite && canManageWorkflows,
        scopes,
        operations,
        missingScopes: Array.from(allMissingScopes),
        warnings,
        errors,
        user: {
          login: user.login,
          id: user.id,
          type: user.type
        },
        rateLimit
      }
    } catch (error) {
      return {
        valid: false,
        fullAccess: false,
        error: error.message,
        scopes: [],
        operations: {},
        missingScopes: [],
        warnings: [],
        errors: [error.message]
      }
    }
  }

  /**
   * Tests if the token can actually perform a specific operation
   * This goes beyond scope checking to verify real-world access
   * 
   * @param {string} token - GitHub Personal Access Token
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Test results for various operations
   */
  async testTokenOperations(token, owner, repo) {
    const results = {
      canReadRepo: false,
      canReadBranches: false,
      canReadFiles: false,
      canWriteFiles: false,
      errors: []
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }

    // Test 1: Can read repository metadata
    try {
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      )
      results.canReadRepo = true
    } catch (error) {
      results.errors.push(`Cannot read repository: ${error.response?.status || error.message}`)
    }

    // Test 2: Can read branches
    try {
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/branches`,
        { headers }
      )
      results.canReadBranches = true
    } catch (error) {
      results.errors.push(`Cannot read branches: ${error.response?.status || error.message}`)
    }

    // Test 3: Can read files (try to get README or root contents)
    try {
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/`,
        { headers }
      )
      results.canReadFiles = true
    } catch (error) {
      results.errors.push(`Cannot read files: ${error.response?.status || error.message}`)
    }

    // Test 4: Check if we can get file details (needed for updates)
    // We don't actually test writing to avoid creating commits
    // Instead, we check if we have the minimum permissions
    if (results.canReadFiles && results.canReadRepo) {
      // If we can read, check the scopes to see if we can write
      try {
        const response = await axios.get('https://api.github.com/user', { headers })
        const scopesHeader = response.headers['x-oauth-scopes'] || ''
        const scopes = scopesHeader.split(',').map(s => s.trim())
        results.canWriteFiles = scopes.includes('repo')
      } catch (error) {
        results.errors.push(`Cannot verify write permissions: ${error.message}`)
      }
    }

    return results
  }

  /**
   * Generates user-friendly recommendations for fixing permission issues
   * 
   * @param {Object} validationResult - Result from validateTokenPermissions
   * @returns {Array<string>} Array of actionable recommendations
   */
  generateRecommendations(validationResult) {
    const recommendations = []

    if (!validationResult.valid) {
      recommendations.push(
        '❌ Your token does not have sufficient permissions to use this application'
      )
      recommendations.push(
        '🔑 REQUIRED: Personal Access Token (classic) must have BOTH "repo" AND "workflow" scopes checked'
      )
    }

    if (validationResult.missingScopes.includes('repo')) {
      recommendations.push(
        '📚 Add "repo" scope - REQUIRED for Spec-Up-T Editor to function'
      )
    }

    if (validationResult.missingScopes.includes('workflow')) {
      recommendations.push(
        '⚙️ Add "workflow" scope - REQUIRED for Spec-Up-T Editor to manage GitHub Actions'
      )
    }

    if (validationResult.fullAccess) {
      recommendations.push(
        '✅ Your token has all required permissions!'
      )
    }

    // Rate limit warnings
    if (validationResult.rateLimit) {
      const remaining = parseInt(validationResult.rateLimit.remaining)
      const limit = parseInt(validationResult.rateLimit.limit)
      
      if (remaining < limit * 0.1) {
        recommendations.push(
          `⚠️ API rate limit is low: ${remaining}/${limit} requests remaining`
        )
      }
    }

    return recommendations
  }

  /**
   * Clears the cached scope data
   * Call this when the token changes or after logout
   */
  clearCache() {
    this.cachedScopes = null
    this.cachedTimestamp = null
  }
}

// Export singleton instance for convenience
export const tokenPermissionChecker = new TokenPermissionChecker()

// Export class for testing and customization
export { TokenPermissionChecker, SCOPE_DESCRIPTIONS, REQUIRED_SCOPES }
