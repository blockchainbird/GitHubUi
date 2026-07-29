/**
 * Secure Token Manager
 * Handles secure storage and management of GitHub Personal Access Tokens
 * Implements encryption and uses sessionStorage for enhanced security
 */

/**
 * Simple encryption/decryption using built-in Web Crypto API
 * Note: This provides obfuscation rather than true security since the key is client-side
 * For true security, tokens should be handled server-side with proper key management
 */
class SecureTokenManager {
  constructor() {
    this.storageKey = 'secure_github_token'
    this.userDataKey = 'secure_github_user'
    this.encryptionKey = this.generateEncryptionKey()
  }

  /**
   * Generate a basic encryption key from browser fingerprint
   * This provides minimal security - better than plain text but not cryptographically secure
   */
  generateEncryptionKey() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      location.hostname
    ].join('|')
    
    // Simple hash function for key generation
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Simple XOR encryption/decryption
   * @param {string} text - Text to encrypt/decrypt
   * @param {string} key - Encryption key
   * @returns {string} Encrypted/decrypted text
   */
  /**
   * Encode a UTF-8 string to base64-safe binary string
   */
  utf8ToBinary(text) {
    const bytes = new TextEncoder().encode(text)
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return binary
  }

  /**
   * Decode a binary string produced by utf8ToBinary back to UTF-8 text
   */
  binaryToUtf8(binary) {
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }

  /**
   * Simple XOR encryption/decryption
   * @param {string} text - Text to encrypt/decrypt
   * @param {string} key - Encryption key
   * @returns {string} Encrypted/decrypted text
   */
  xorEncrypt(text, key) {
    if (!text || !key) return text
    
    // UTF-8 safe: encode first so btoa never sees code points > 255
    // (GitHub user profiles often contain non-Latin1 characters)
    const utf8Text = this.utf8ToBinary(text)
    let result = ''
    for (let i = 0; i < utf8Text.length; i++) {
      result += String.fromCharCode(
        utf8Text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    return btoa(result)
  }

  /**
   * Decrypt XOR encrypted text
   * @param {string} encryptedText - Encrypted text
   * @param {string} key - Encryption key
   * @returns {string} Decrypted text
   */
  xorDecrypt(encryptedText, key) {
    if (!encryptedText || !key) return encryptedText
    
    try {
      const decoded = atob(encryptedText)
      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return this.binaryToUtf8(result)
    } catch (error) {
      console.error('Token decryption failed:', error)
      return null
    }
  }

  /**
   * Validate token format and basic security
   * @param {string} token - Token to validate
   * @returns {object} Validation result
   */
  validateToken(token) {
    const validation = {
      isValid: false,
      errors: [],
      tokenType: 'unknown'
    }

    if (!token || typeof token !== 'string') {
      validation.errors.push('Token is required')
      return validation
    }

    // Trim whitespace
    token = token.trim()

    // Check minimum length
    if (token.length < 20) {
      validation.errors.push('Token appears too short')
      return validation
    }

    // Check for suspicious characters
    if (!/^[a-zA-Z0-9_]+$/.test(token)) {
      validation.errors.push('Token contains invalid characters')
      return validation
    }

    // Detect token type
    if (token.startsWith('ghp_')) {
      validation.tokenType = 'personal_access_token'
    } else if (token.startsWith('github_pat_')) {
      validation.tokenType = 'fine_grained_token'
    } else if (token.startsWith('gho_')) {
      validation.tokenType = 'oauth_token'
    } else {
      validation.tokenType = 'legacy_or_unknown'
    }

    validation.isValid = validation.errors.length === 0
    return validation
  }

  /**
   * Store token securely using sessionStorage and encryption
   * @param {string} token - GitHub token to store
   * @param {object} userData - User data to store
   * @returns {boolean} Success status
   */
  storeToken(token, userData = null) {
    try {
      // Validate token first
      const validation = this.validateToken(token)
      if (!validation.isValid) {
        console.error('Token validation failed:', validation.errors)
        return false
      }

      // Encrypt token
      const encryptedToken = this.xorEncrypt(token, this.encryptionKey)

      let encryptedUserData = null
      if (userData) {
        const safeUserData = {
          login: userData.login,
          id: userData.id,
          avatar_url: userData.avatar_url,
          name: userData.name,
          html_url: userData.html_url,
          tokenType: userData.tokenType,
          loginTimestamp: userData.loginTimestamp,
          permissions: userData.permissions
        }
        encryptedUserData = this.xorEncrypt(JSON.stringify(safeUserData), this.encryptionKey)
      }

      // Write only after both payloads encrypt successfully (atomic-ish)
      localStorage.setItem(this.storageKey, encryptedToken)
      if (encryptedUserData) {
        localStorage.setItem(this.userDataKey, encryptedUserData)
      }

      this.logSecurityEvent('token_stored', {
        tokenType: validation.tokenType,
        timestamp: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('Failed to store token securely:', error)
      this.clearToken()
      this.logSecurityEvent('token_store_failed', { error: error.message })
      return false
    }
  }

  /**
   * Retrieve and decrypt stored token
   * @returns {string|null} Decrypted token or null if not found
   */
  getToken() {
    try {
      const encryptedToken = localStorage.getItem(this.storageKey)
      if (!encryptedToken) {
        return null
      }

      const decryptedToken = this.xorDecrypt(encryptedToken, this.encryptionKey)
      
      // Validate decrypted token
      if (decryptedToken && this.validateToken(decryptedToken).isValid) {
        return decryptedToken
      }

      // If validation fails, remove corrupted token
      this.clearToken()
      return null
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      this.clearToken()
      return null
    }
  }

  /**
   * Retrieve and decrypt stored user data
   * @returns {object|null} Decrypted user data or null if not found
   */
  getUserData() {
    try {
      const encryptedUserData = localStorage.getItem(this.userDataKey)
      if (!encryptedUserData) {
        return null
      }

      const decryptedUserData = this.xorDecrypt(encryptedUserData, this.encryptionKey)
      return decryptedUserData ? JSON.parse(decryptedUserData) : null
    } catch (error) {
      console.error('Failed to retrieve user data:', error)
      sessionStorage.removeItem(this.userDataKey)
      return null
    }
  }

  /**
   * Clear stored token and user data
   */
  clearToken() {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.userDataKey)
      // Also clear legacy sessionStorage entries from before this change
      sessionStorage.removeItem(this.storageKey)
      sessionStorage.removeItem(this.userDataKey)
      
      this.logSecurityEvent('token_cleared', {
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to clear token:', error)
    }
  }

  /**
   * Check if token exists
   * @returns {boolean} True if token exists
   */
  hasToken() {
    return localStorage.getItem(this.storageKey) !== null
  }

  /**
   * Migrate from old localStorage to new secure storage
   * This helps with backwards compatibility
   */
  migrateFromLocalStorage() {
    try {
      // Migrate from sessionStorage (old default) to localStorage (new default)
      const sessionToken = sessionStorage.getItem(this.storageKey)
      if (sessionToken && !localStorage.getItem(this.storageKey)) {
        localStorage.setItem(this.storageKey, sessionToken)
        const sessionUser = sessionStorage.getItem(this.userDataKey)
        if (sessionUser) localStorage.setItem(this.userDataKey, sessionUser)
        sessionStorage.removeItem(this.storageKey)
        sessionStorage.removeItem(this.userDataKey)
      }

      // Check if there's an old token in localStorage
      const oldToken = localStorage.getItem('github_token')
      const oldUserData = localStorage.getItem('github_user')

      if (oldToken) {
        // Validate and migrate the old token
        const validation = this.validateToken(oldToken)
        if (validation.isValid) {
          let userData = null
          if (oldUserData) {
            try {
              userData = JSON.parse(oldUserData)
            } catch (e) {
              console.warn('Failed to parse old user data')
            }
          }

          // Store using new secure method
          if (this.storeToken(oldToken, userData)) {
            // Clear old storage
            localStorage.removeItem('github_token')
            localStorage.removeItem('github_user')
            
            this.logSecurityEvent('token_migrated', {
              from: 'localStorage',
              to: 'sessionStorage_encrypted',
              tokenType: validation.tokenType
            })
            
            return true
          }
        }
      }
    } catch (error) {
      console.error('Migration failed:', error)
    }
    return false
  }

  /**
   * Log security events for monitoring
   * @param {string} event - Event type
   * @param {object} details - Event details
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
      ...details
    }

    // Store in sessionStorage for security monitoring
    const securityLog = JSON.parse(localStorage.getItem('security_log') || '[]')
    securityLog.push(logEntry)
    
    // Keep only last 50 entries to prevent storage bloat
    if (securityLog.length > 50) {
      securityLog.splice(0, securityLog.length - 50)
    }
    
    localStorage.setItem('security_log', JSON.stringify(securityLog))
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('Security Event:', logEntry)
    }
  }

  /**
   * Get security log for monitoring
   * @returns {array} Security log entries
   */
  getSecurityLog() {
    try {
      return JSON.parse(localStorage.getItem('security_log') || '[]')
    } catch (error) {
      console.error('Failed to retrieve security log:', error)
      return []
    }
  }

  /**
   * Clear security log
   */
  clearSecurityLog() {
    localStorage.removeItem('security_log')
  }
}

// Export singleton instance
export const secureTokenManager = new SecureTokenManager()

// Export class for testing
export { SecureTokenManager }
