/**
 * Utility functions for managing visited repositories in localStorage
 */

const STORAGE_KEY = 'visited_repositories'
const MAX_REPOS = 12

/**
 * Load visited repositories from localStorage
 * @returns {Array} Array of visited repository objects
 */
export const loadVisitedRepos = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const repos = JSON.parse(stored)
      // Sort by last visited (most recent first)
      return repos.sort((a, b) => new Date(b.lastVisited) - new Date(a.lastVisited))
    }
    return []
  } catch (error) {
    console.error('Error loading visited repositories:', error)
    return []
  }
}

/**
 * Add repository to visited list
 * @param {string} owner - Repository owner
 * @param {string} name - Repository name
 * @param {string} branch - Repository branch
 */
export const addToVisitedRepos = (owner, name, branch) => {
  const repos = loadVisitedRepos()
  const repoKey = `${owner}/${name}/${branch}`
  
  // Remove existing entry if it exists
  const filteredRepos = repos.filter(
    repo => `${repo.owner}/${repo.name}/${repo.branch}` !== repoKey
  )
  
  // Add new entry at the beginning
  const newRepo = {
    owner,
    name,
    branch,
    lastVisited: new Date().toISOString()
  }
  
  filteredRepos.unshift(newRepo)
  
  // Keep only the most recent repositories
  const limitedRepos = filteredRepos.slice(0, MAX_REPOS)
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedRepos))
  
  return limitedRepos
}

/**
 * Remove repository from visited list
 * @param {string} owner - Repository owner
 * @param {string} name - Repository name
 * @param {string} branch - Repository branch
 */
export const removeFromVisitedRepos = (owner, name, branch) => {
  const repos = loadVisitedRepos()
  const filteredRepos = repos.filter(
    repo => !(repo.owner === owner && repo.name === name && repo.branch === branch)
  )
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRepos))
  return filteredRepos
}

/**
 * Clear all visited repositories
 */
export const clearAllVisitedRepos = () => {
  localStorage.removeItem(STORAGE_KEY)
  return []
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatVisitedDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Today'
  } else if (diffDays === 2) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString()
  }
}
