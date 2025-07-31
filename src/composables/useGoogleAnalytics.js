/**
 * Vue composable for Google Analytics
 * Provides reactive analytics functionality for Vue components
 */

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import googleAnalytics from '../utils/googleAnalytics.js'

export function useGoogleAnalytics() {
  const router = useRouter()

  /**
   * Initialize Google Analytics with automatic page tracking
   */
  const initAnalytics = () => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

    if (measurementId) {
      googleAnalytics.init(measurementId)

      // Track initial page view
      googleAnalytics.trackPageView(router.currentRoute.value.fullPath)

      // Set up route tracking
      const unwatch = router.afterEach((to) => {
        googleAnalytics.trackPageView(to.fullPath, to.meta.title || document.title)
      })

      return unwatch
    }

    return null
  }

  /**
   * Track a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} parameters - Event parameters
   */
  const trackEvent = (eventName, parameters = {}) => {
    googleAnalytics.trackEvent(eventName, parameters)
  }

  /**
   * Track user login
   * @param {string} method - Login method
   */
  const trackLogin = (method = 'github') => {
    googleAnalytics.trackLogin(method)
  }

  /**
   * Track file operations
   * @param {string} action - Action performed
   * @param {string} fileType - Type of file
   */
  const trackFileOperation = (action, fileType = 'unknown') => {
    googleAnalytics.trackFileOperation(action, fileType)
  }

  /**
   * Track page view manually
   * @param {string} pagePath - The page path
   * @param {string} pageTitle - The page title
   */
  const trackPageView = (pagePath, pageTitle) => {
    googleAnalytics.trackPageView(pagePath, pageTitle)
  }

  /**
   * Check if analytics is enabled
   * @returns {boolean}
   */
  const isAnalyticsEnabled = () => {
    return googleAnalytics.isEnabled()
  }

  return {
    initAnalytics,
    trackEvent,
    trackLogin,
    trackFileOperation,
    trackPageView,
    isAnalyticsEnabled
  }
}
