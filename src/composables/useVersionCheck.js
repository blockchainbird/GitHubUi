import { ref, onMounted } from 'vue'

/**
 * Version check composable that monitors for new application versions
 * by comparing build timestamps and notifying users when updates are available
 */
export function useVersionCheck(options = {}) {
  const {
    autoReloadOnAcknowledge = true, // Whether to reload page when user acknowledges update
    reloadDelay = 500, // Delay before reloading (for better UX)
    enableNotifications = true // Whether to show notifications at all
  } = options

  const hasNewVersion = ref(false)
  const currentVersion = ref(null)
  const newVersion = ref(null)
  const checkingVersion = ref(false)
  const lastCheckedVersion = ref(null)

  // Storage keys
  const LAST_SEEN_VERSION_KEY = 'last_seen_version'
  const VERSION_CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes

  /**
   * Get current build info from Vite's define
   */
  const getCurrentVersion = () => {
    try {
      return __BUILD_INFO__
    } catch (error) {
      console.warn('Could not get build info:', error)
      return {
        timestamp: new Date().toISOString(),
        buildDate: 'Development Mode'
      }
    }
  }

  /**
   * Check if user has already seen this version
   */
  const hasUserSeenVersion = (version) => {
    const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY)
    return lastSeen === version.timestamp
  }

  /**
   * Mark current version as seen by user
   */
  const markVersionAsSeen = (version = null) => {
    const versionToMark = version || currentVersion.value
    if (versionToMark?.timestamp) {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, versionToMark.timestamp)
      hasNewVersion.value = false
      lastCheckedVersion.value = versionToMark.timestamp
      console.log('✅ Version marked as seen:', versionToMark.buildDate)
    }
  }

  /**
   * Check for version updates by comparing build timestamps
   * In a real deployment, this could check against a remote endpoint
   */
  const checkForUpdates = async () => {
    if (checkingVersion.value) return

    checkingVersion.value = true
    
    try {
      // Get current version info
      const current = getCurrentVersion()
      currentVersion.value = current

      console.log('🔍 Version check:', {
        current: current.buildDate,
        timestamp: current.timestamp,
        lastSeenVersion: localStorage.getItem(LAST_SEEN_VERSION_KEY),
        enableNotifications: enableNotifications
      })

      // Skip notifications if disabled
      if (!enableNotifications) {
        console.log('📝 Notifications disabled')
        hasNewVersion.value = false
        return
      }

      // In development mode, still allow testing via demo
      if (current.buildDate === 'Development Mode') {
        console.log('📝 Development mode - checking for simulated versions')
        // Allow simulated versions to work in development
        const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY)
        if (!lastSeen) {
          // First time in development - don't show notification
          console.log('📝 First time in development mode - no notification')
          hasNewVersion.value = false
          return
        }
      }

      // Check if user has seen this version
      if (!hasUserSeenVersion(current)) {
        // This is a new version the user hasn't acknowledged
        console.log('🆕 New version detected!')
        hasNewVersion.value = true
        newVersion.value = current
      } else {
        console.log('✅ User has already seen this version')
        hasNewVersion.value = false
      }

    } catch (error) {
      console.warn('⚠️ Error checking for version updates:', error)
    } finally {
      checkingVersion.value = false
    }
  }

  /**
   * Dismiss the version notification
   */
  const dismissNotification = () => {
    console.log('❌ Version notification dismissed')
    markVersionAsSeen()
  }

  /**
   * Handle version update acknowledgment
   */
  const acknowledgeUpdate = () => {
    console.log('👍 Version update acknowledged')
    markVersionAsSeen()
    
    if (autoReloadOnAcknowledge) {
      // Reload page to get the latest version
      setTimeout(() => {
        console.log('🔄 Reloading page to fetch latest version...')
        window.location.reload()
      }, reloadDelay)
    }
  }

  /**
   * Initialize version checking on component mount
   */
  const initVersionCheck = () => {
    // Initial check
    checkForUpdates()

    // Set up periodic checks (every 30 minutes)
    const interval = setInterval(checkForUpdates, VERSION_CHECK_INTERVAL)

    // Return cleanup function
    return () => clearInterval(interval)
  }

  // Auto-initialize when composable is used
  let cleanup = null
  onMounted(() => {
    cleanup = initVersionCheck()
  })

  return {
    // State
    hasNewVersion,
    currentVersion,
    newVersion,
    checkingVersion,
    lastCheckedVersion,
    
    // Methods
    checkForUpdates,
    dismissNotification,
    acknowledgeUpdate,
    markVersionAsSeen,
    initVersionCheck,
    
    // Cleanup
    cleanup: () => cleanup?.()
  }
}
