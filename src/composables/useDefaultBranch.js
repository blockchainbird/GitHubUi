/**
 * Default Branch Composable
 * 
 * Provides functionality to fetch and manage the default branch for a repository.
 * This is useful for displaying a "default" badge next to branch names throughout the UI.
 * 
 * @module composables/useDefaultBranch
 */

import { ref, watch, unref } from 'vue'
import axios from 'axios'
import { secureTokenManager } from '../utils/secureTokenManager.js'

/**
 * Creates a default branch manager
 * 
 * Fetches the default branch from GitHub API and provides reactive state.
 * Automatically refetches when owner or repo changes.
 * 
 * @param {Object} props - Component props containing owner and repo
 * @param {Object} options - Optional configuration
 * @param {boolean} options.immediate - Whether to fetch immediately (default: true)
 * 
 * @returns {Object} - { defaultBranch: Ref<string>, loading: Ref<boolean>, error: Ref<string>, fetchDefaultBranch: Function }
 * 
 * @example
 * // In a component's setup function:
 * import { useDefaultBranch } from '../composables/useDefaultBranch.js'
 * 
 * setup(props) {
 *   const { defaultBranch, loading } = useDefaultBranch(props)
 *   
 *   return {
 *     defaultBranch
 *   }
 * }
 */
export function useDefaultBranch(props, options = {}) {
  const { immediate = true } = options

  const defaultBranch = ref('')
  const loading = ref(false)
  const error = ref('')

  /**
   * Fetches the default branch from GitHub API
   * Uses authentication token if available for higher rate limits
   */
  const fetchDefaultBranch = async () => {
    const owner = unref(props.owner)
    const repo = unref(props.repo)

    if (!owner || !repo) {
      defaultBranch.value = ''
      return
    }

    loading.value = true
    error.value = ''

    try {
      const token = secureTokenManager.getToken()
      const config = token ? {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      } : { 
        headers: { 
          'Accept': 'application/vnd.github.v3+json' 
        } 
      }

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        config
      )

      defaultBranch.value = response.data.default_branch
    } catch (err) {
      console.error('Error fetching default branch:', err)
      error.value = err.message || 'Failed to fetch default branch'
      // Don't throw - default branch is not critical
      defaultBranch.value = ''
    } finally {
      loading.value = false
    }
  }

  /**
   * Watch for owner/repo changes and refetch
   */
  watch(
    () => [unref(props.owner), unref(props.repo)],
    ([ownerVal, repoVal]) => {
      if (ownerVal && repoVal) {
        fetchDefaultBranch()
      } else {
        defaultBranch.value = ''
      }
    },
    { immediate }
  )

  return {
    defaultBranch,
    loading,
    error,
    fetchDefaultBranch
  }
}
