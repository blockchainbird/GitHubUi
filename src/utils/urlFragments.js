/**
 * URL Fragment Utilities
 * Provides functionality to handle URL fragments for opening modals and navigating to specific content
 */

/**
 * Opens the terms preview modal if the URL fragment indicates it should be opened
 * @param {string} hash - The current window.location.hash
 * @param {object} router - Vue router instance (optional, for navigation fallback)
 * @param {object} route - Current route object (optional, for navigation fallback)
 */
export function handleTermsPreviewFragment(hash, router = null, route = null) {
  // Check for terms preview fragments
  const termsFragments = ['#terms-preview', '#terms', '#definitions', '#glossary']
  
  if (termsFragments.includes(hash.toLowerCase())) {
    // Try to open the modal first
    const modalElement = document.getElementById('termsPreviewModal')
    if (modalElement && window.bootstrap) {
      try {
        const modal = new window.bootstrap.Modal(modalElement)
        modal.show()
        
        // Clean up the hash after opening modal
        history.replaceState(null, null, window.location.pathname + window.location.search)
        return true
      } catch (error) {
        console.warn('Could not open terms preview modal:', error)
      }
    }
    
    // Fallback: Navigate to standalone terms preview if modal is not available and we have routing context
    if (router && route && route.params.owner && route.params.repo && route.params.branch) {
      const termsUrl = `/terms-preview/${route.params.owner}/${route.params.repo}/${route.params.branch}`
      router.push(termsUrl)
      return true
    }
  }
  
  return false
}

/**
 * Creates a URL with a terms preview fragment
 * @param {string} baseUrl - The base URL to append the fragment to
 * @param {string} fragmentType - Type of fragment ('terms', 'definitions', etc.) - defaults to 'terms'
 * @returns {string} URL with the appropriate fragment
 */
export function createTermsPreviewUrl(baseUrl, fragmentType = 'terms') {
  const cleanUrl = baseUrl.split('#')[0] // Remove any existing fragment
  return `${cleanUrl}#${fragmentType}`
}

/**
 * Generates a shareable URL for terms preview
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name  
 * @param {string} branch - Repository branch
 * @param {boolean} modal - Whether to open as modal (true) or standalone page (false)
 * @returns {string} Shareable URL
 */
export function generateTermsPreviewShareUrl(owner, repo, branch, modal = true) {
  const baseUrl = window.location.origin + window.location.pathname.split('#')[0]
  
  if (modal) {
    // For modal, add fragment to current page
    return createTermsPreviewUrl(baseUrl, 'terms-preview')
  } else {
    // For standalone, create direct route
    return `${window.location.origin}/terms-preview/${owner}/${repo}/${branch}`
  }
}

/**
 * Sets up automatic fragment handling for a component
 * @param {function} handleFragment - Function to call when a relevant fragment is detected
 * @returns {function} Cleanup function to remove event listeners
 */
export function setupFragmentHandling(handleFragment) {
  // Handle initial fragment on mount
  if (window.location.hash) {
    handleFragment(window.location.hash)
  }
  
  // Handle hash changes
  const hashChangeHandler = () => {
    if (window.location.hash) {
      handleFragment(window.location.hash)
    }
  }
  
  window.addEventListener('hashchange', hashChangeHandler)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('hashchange', hashChangeHandler)
  }
}
