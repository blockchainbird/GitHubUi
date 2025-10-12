/**
 * @fileoverview GitHub Provider for spec-up-t-healthcheck
 * 
 * This module provides a GitHub API provider that implements the provider interface
 * required by spec-up-t-healthcheck. It enables health checks to run against
 * repositories hosted on GitHub without needing local filesystem access.
 * 
 * Key features:
 * - Uses GitHub REST API for file operations
 * - Caches API responses to minimize rate limit impact
 * - Handles authentication via token
 * - Provides browser-compatible interface
 * 
 * Cognitive complexity: ~12 (kept below 15 as per project guidelines)
 * 
 * @author GitHubUi
 */

import axios from 'axios';

/**
 * Creates a simple cache for API responses to reduce rate limit usage.
 * This is a functional approach without using classes.
 * 
 * @returns {Object} Cache object with get, set, and clear methods
 */
function createCache() {
  const cache = new Map();
  const TTL = 5 * 60 * 1000; // 5 minutes
  
  return {
    /**
     * Retrieves a cached value if it exists and hasn't expired
     * 
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
      const entry = cache.get(key);
      if (!entry) return undefined;
      
      if (Date.now() - entry.timestamp > TTL) {
        cache.delete(key);
        return undefined;
      }
      
      return entry.value;
    },
    
    /**
     * Stores a value in the cache
     * 
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set(key, value) {
      cache.set(key, {
        value,
        timestamp: Date.now()
      });
    },
    
    /**
     * Clears all cached entries
     */
    clear() {
      cache.clear();
    }
  };
}

/**
 * Creates a GitHub provider for accessing repository files via the GitHub API.
 * 
 * This provider enables spec-up-t-healthcheck to validate GitHub repositories
 * directly without requiring local clones. It implements the standard provider
 * interface expected by the healthcheck tool.
 * 
 * @param {Object} config - Provider configuration
 * @param {string} config.token - GitHub personal access token
 * @param {string} config.owner - Repository owner (username or organization)
 * @param {string} config.repo - Repository name
 * @param {string} [config.branch='main'] - Branch to check (defaults to 'main')
 * @param {string} [config.baseURL='https://api.github.com'] - GitHub API base URL
 * @returns {Object} Provider object compatible with spec-up-t-healthcheck
 * 
 * @example
 * ```javascript
 * const provider = createGitHubProvider({
 *   token: 'ghp_...',
 *   owner: 'trustoverip',
 *   repo: 'spec-up-t',
 *   branch: 'main'
 * });
 * 
 * const content = await provider.readFile('package.json');
 * const exists = await provider.fileExists('spec/example.md');
 * ```
 */
export function createGitHubProvider(config) {
  const { token, owner, repo, branch = 'main', baseURL = 'https://api.github.com' } = config;
  
  if (!token || !owner || !repo) {
    throw new Error('GitHub provider requires token, owner, and repo');
  }
  
  // Create axios instance with authentication
  const api = axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  // Initialize cache
  const cache = createCache();
  
  /**
   * Makes a cached API request to GitHub
   * Reduces API calls and respects rate limits
   * 
   * @param {string} url - API endpoint URL
   * @returns {Promise<Object>} API response data
   */
  async function cachedRequest(url) {
    const cached = cache.get(url);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await api.get(url);
      cache.set(url, response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, url);
    }
  }
  
  /**
   * Handles GitHub API errors with user-friendly messages
   * 
   * @param {Error} error - Axios error object
   * @param {string} context - Context information (e.g., file path)
   * @throws {Error} Formatted error message
   */
  function handleApiError(error, context) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error(`Not found: ${context}`);
      }
      if (status === 403) {
        throw new Error('GitHub API rate limit exceeded or insufficient permissions');
      }
      throw new Error(`GitHub API error (${status}): ${error.message}`);
    }
    throw new Error(`Network error: ${error.message}`);
  }
  
  // Return provider object with standard interface
  return {
    type: 'github',
    repoPath: `${owner}/${repo}`,
    branch,
    
    /**
     * Returns the repository identifier
     * 
     * @returns {string} Repository path (owner/repo)
     */
    getBasePath() {
      return `${owner}/${repo}`;
    },
    
    /**
     * Reads file content from GitHub repository
     * 
     * Uses GitHub Contents API to fetch file content.
     * Content is automatically decoded from base64.
     * 
     * @param {string} filePath - File path relative to repository root
     * @returns {Promise<string>} File content as UTF-8 string
     * @throws {Error} If file not found or API error occurs
     * 
     * @example
     * ```javascript
     * const json = await provider.readFile('package.json');
     * const markdown = await provider.readFile('spec/intro.md');
     * ```
     */
    async readFile(filePath) {
      // Remove leading slash if present
      const cleanPath = filePath.replace(/^\//, '');
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;
      
      try {
        const data = await cachedRequest(url);
        
        // GitHub returns base64-encoded content
        if (data.content) {
          return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        
        throw new Error(`File content not available: ${filePath}`);
      } catch (error) {
        throw new Error(`Error reading file ${filePath}: ${error.message}`);
      }
    },
    
    /**
     * Checks if a file exists in the repository
     * 
     * Makes a lightweight API call to verify file existence
     * without downloading the full content.
     * 
     * @param {string} filePath - File path relative to repository root
     * @returns {Promise<boolean>} True if file exists, false otherwise
     * 
     * @example
     * ```javascript
     * if (await provider.fileExists('specs.json')) {
     *   // Process specs.json
     * }
     * ```
     */
    async fileExists(filePath) {
      const cleanPath = filePath.replace(/^\//, '');
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;
      
      try {
        await cachedRequest(url);
        return true;
      } catch (error) {
        if (error.message.includes('Not found')) {
          return false;
        }
        throw error;
      }
    },
    
    /**
     * Lists files in a directory
     * 
     * Returns an array of file entries with name, path, and type information.
     * This method is used by healthcheck to discover spec files.
     * 
     * @param {string} dirPath - Directory path relative to repository root
     * @returns {Promise<Array<Object>>} Array of file entries
     * 
     * @example
     * ```javascript
     * const files = await provider.listFiles('spec');
     * files.forEach(file => {
     *   console.log(file.name, file.isFile ? '[FILE]' : '[DIR]');
     * });
     * ```
     */
    async listFiles(dirPath) {
      const cleanPath = dirPath.replace(/^\//, '');
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;
      
      try {
        const data = await cachedRequest(url);
        
        if (!Array.isArray(data)) {
          throw new Error(`Expected directory but got file: ${dirPath}`);
        }
        
        // Transform GitHub API response to provider format
        return data.map(item => ({
          name: item.name,
          path: item.path,
          isDirectory: item.type === 'dir',
          isFile: item.type === 'file'
        }));
      } catch (error) {
        throw new Error(`Error listing files in ${dirPath}: ${error.message}`);
      }
    },
    
    /**
     * Clears the internal cache
     * Useful when you need fresh data from GitHub
     * 
     * @example
     * ```javascript
     * provider.clearCache();
     * const freshContent = await provider.readFile('package.json');
     * ```
     */
    clearCache() {
      cache.clear();
    }
  };
}

/**
 * Default export for convenience
 */
export default {
  createGitHubProvider
};
