/**
 * Google Analytics 4 (GA4) utility
 * Provides a clean interface for Google Analytics tracking
 */

class GoogleAnalytics {
  constructor() {
    this.isInitialized = false
    this.measurementId = null
    this.debug = import.meta.env.DEV
  }

  /**
   * Initialize Google Analytics with the provided measurement ID
   * @param {string} measurementId - GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
   */
  init(measurementId) {
    if (!measurementId || this.isInitialized) {
      return
    }

    this.measurementId = measurementId
    
    // Load gtag script
    this.loadGtagScript()
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }
    
    // Configure GA4
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      debug_mode: this.debug
    })
    
    this.isInitialized = true
    
    if (this.debug) {
      console.log(`Google Analytics initialized with ID: ${measurementId}`)
    }
  }

  /**
   * Load the Google Analytics script
   */
  loadGtagScript() {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`
    document.head.appendChild(script)
  }

  /**
   * Track a page view
   * @param {string} pagePath - The page path to track
   * @param {string} pageTitle - The page title
   */
  trackPageView(pagePath, pageTitle = document.title) {
    if (!this.isInitialized) return

    window.gtag('config', this.measurementId, {
      page_path: pagePath,
      page_title: pageTitle
    })

    if (this.debug) {
      console.log(`GA4 Page view tracked: ${pagePath} - ${pageTitle}`)
    }
  }

  /**
   * Track a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} parameters - Event parameters
   */
  trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized) return

    window.gtag('event', eventName, parameters)

    if (this.debug) {
      console.log(`GA4 Event tracked: ${eventName}`, parameters)
    }
  }

  /**
   * Track user login
   * @param {string} method - Login method (e.g., 'github')
   */
  trackLogin(method = 'github') {
    this.trackEvent('login', {
      method: method
    })
  }

  /**
   * Track file operations
   * @param {string} action - Action performed (view, edit, save, delete)
   * @param {string} fileType - Type of file (e.g., 'markdown', 'json')
   */
  trackFileOperation(action, fileType = 'unknown') {
    this.trackEvent('file_operation', {
      action: action,
      file_type: fileType
    })
  }

  /**
   * Check if Google Analytics is enabled and initialized
   * @returns {boolean}
   */
  isEnabled() {
    return this.isInitialized && !!this.measurementId
  }
}

// Create singleton instance
const googleAnalytics = new GoogleAnalytics()

export default googleAnalytics
