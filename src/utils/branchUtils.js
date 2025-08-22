/**
 * Utility functions for handling Git branch names in URLs
 * 
 * Git branch names can contain special characters that need URL encoding:
 * - Forward slashes (/) for hierarchical branch names like "feature/new-feature"
 * - Plus signs (+), percent signs (%), question marks (?), hash (#), ampersands (&)
 */

/**
 * Encode a branch name for safe use in URLs
 * @param {string} branchName - The branch name to encode
 * @returns {string} URL-encoded branch name
 */
export function encodeBranchName(branchName) {
    if (!branchName) return branchName
    return encodeURIComponent(branchName)
}

/**
 * Decode a branch name from URL encoding
 * @param {string} encodedBranchName - The URL-encoded branch name
 * @returns {string} Decoded branch name
 */
export function decodeBranchName(encodedBranchName) {
    if (!encodedBranchName) return encodedBranchName
    return decodeURIComponent(encodedBranchName)
}

/**
 * Build a route path with properly encoded branch name
 * @param {string} basePath - The base path (e.g., '/files', '/editor')
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name (will be encoded)
 * @param {string} additionalPath - Additional path segments (optional)
 * @returns {string} Complete route path with encoded branch
 */
export function buildRoutePath(basePath, owner, repo, branch, additionalPath = '') {
    const encodedBranch = encodeBranchName(branch)
    const path = `${basePath}/${owner}/${repo}/${encodedBranch}`
    return additionalPath ? `${path}/${additionalPath}` : path
}
