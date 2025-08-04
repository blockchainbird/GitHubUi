/**
 * Utility functions for API requests with cache-busting
 * Addresses GitHub API caching issues that cause delays in seeing changes
 * 
 * Note: GitHub API blocks custom cache-control headers due to CORS policy,
 * so we rely primarily on URL-based cache busting with timestamp parameters.
 */

import axios from 'axios'

/**
 * Get headers for GitHub API requests (without CORS-blocked cache headers)
 * @param {string} token - GitHub API token
 * @returns {Object} Headers object for GitHub API
 */
export const getGitHubHeaders = (token) => {
  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  }
}

/**
 * Add cache-busting timestamp to URL
 * This is the primary method for cache-busting since GitHub API blocks cache-control headers
 * @param {string} url - The URL to add cache-busting to
 * @returns {string} URL with timestamp parameter
 */
export const addCacheBusting = (url) => {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}cb=${Date.now()}`
}

/**
 * Make a cache-busted GitHub API request
 * @param {string} url - The GitHub API URL
 * @param {Object} options - Axios request options
 * @returns {Promise} Axios response promise
 */
export const cacheBustedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('github_token')
  const config = {
    ...options,
    headers: {
      ...getGitHubHeaders(token),
      ...options.headers
    }
  }
  
  const cacheBustedUrl = addCacheBusting(url)
  return axios.get(cacheBustedUrl, config)
}

/**
 * Make a cache-busted PUT request for file operations
 * @param {string} url - The GitHub API URL
 * @param {Object} data - Request data
 * @param {Object} options - Axios request options
 * @returns {Promise} Axios response promise
 */
export const cacheBustedPutRequest = async (url, data, options = {}) => {
  const token = localStorage.getItem('github_token')
  const config = {
    ...options,
    headers: {
      ...getGitHubHeaders(token),
      ...options.headers
    }
  }
  
  return axios.put(url, data, config)
}
