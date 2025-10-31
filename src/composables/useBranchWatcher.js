/**
 * Branch Watcher Composable
 * 
 * Provides functionality to watch for branch prop changes and trigger reload callbacks.
 * This is useful for components that need to reload their data when the user switches branches
 * via the branch selector in RepoInfo component.
 * 
 * @module composables/useBranchWatcher
 */

import { watch } from 'vue'

/**
 * Creates a watcher for branch prop changes
 * 
 * When the branch prop changes (e.g., user selects a different branch via BranchSelector),
 * this watcher triggers the provided callback to reload component data.
 * 
 * @param {Object} props - Component props containing the branch
 * @param {Function} onBranchChange - Callback function to execute when branch changes
 * @param {Object} options - Optional configuration
 * @param {boolean} options.immediate - Whether to run callback immediately (default: false)
 * 
 * @returns {Function} Cleanup function to stop watching
 * 
 * @example
 * // In a component's setup function:
 * import { useBranchWatcher } from '../composables/useBranchWatcher.js'
 * 
 * setup(props) {
 *   const reloadData = () => {
 *     loading.value = true
 *     error.value = ''
 *     loadYourData()
 *   }
 *   
 *   // Watch for branch changes and reload data
 *   useBranchWatcher(props, reloadData)
 * }
 */
export function useBranchWatcher(props, onBranchChange, options = {}) {
  const { immediate = false } = options

  const stopWatch = watch(
    () => props.branch,
    (newBranch, oldBranch) => {
      // Only trigger if both values exist and they're different
      // This prevents triggering on initial mount
      if (newBranch && oldBranch && newBranch !== oldBranch) {
        console.log(`Branch changed from "${oldBranch}" to "${newBranch}" - triggering reload`)
        onBranchChange(newBranch, oldBranch)
      }
    },
    { immediate }
  )

  return stopWatch
}

/**
 * Extended branch watcher with additional state management
 * 
 * This version automatically manages common loading and error states
 * in addition to calling the reload callback.
 * 
 * @param {Object} props - Component props containing the branch
 * @param {Function} reloadCallback - Callback function to reload data
 * @param {Object} refs - Reactive refs for state management
 * @param {Ref} refs.loading - Loading state ref
 * @param {Ref} refs.error - Error state ref
 * @param {Ref} refs.success - Success message ref (optional)
 * 
 * @returns {Function} Cleanup function to stop watching
 * 
 * @example
 * import { useBranchWatcherWithState } from '../composables/useBranchWatcher.js'
 * 
 * setup(props) {
 *   const loading = ref(false)
 *   const error = ref('')
 *   const success = ref('')
 *   
 *   useBranchWatcherWithState(
 *     props,
 *     () => loadFileContent(),
 *     { loading, error, success }
 *   )
 * }
 */
export function useBranchWatcherWithState(props, reloadCallback, refs) {
  const { loading, error, success } = refs

  return useBranchWatcher(props, (newBranch, oldBranch) => {
    // Reset states
    if (loading) loading.value = true
    if (error) error.value = ''
    if (success) success.value = ''

    // Call the reload callback
    reloadCallback(newBranch, oldBranch)
  })
}
