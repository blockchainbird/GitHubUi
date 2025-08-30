/**
 * Security Implementation Test Suite
 * Tests the security enhancements for PAT storage and management
 */

// Test the secure token manager
import { SecureTokenManager } from '../src/utils/secureTokenManager.js'

class SecurityTests {
  constructor() {
    this.testResults = []
    this.tokenManager = new SecureTokenManager()
  }

  log(test, result, details = '') {
    this.testResults.push({
      test,
      result,
      details,
      timestamp: new Date().toISOString()
    })
    console.log(`${result ? '✅' : '❌'} ${test}${details ? ': ' + details : ''}`)
  }

  async runAllTests() {
    console.log('🔐 Starting Security Implementation Tests...\n')
    
    await this.testTokenValidation()
    await this.testTokenEncryption()
    await this.testTokenStorage()
    await this.testSecurityLogging()
    await this.testMigration()
    
    this.displayResults()
  }

  testTokenValidation() {
    console.log('📋 Testing Token Validation...')
    
    // Test valid PAT
    const validPAT = 'ghp_1234567890abcdef1234567890abcdef12345678'
    const validation1 = this.tokenManager.validateToken(validPAT)
    this.log('Valid PAT validation', validation1.isValid && validation1.tokenType === 'personal_access_token')
    
    // Test invalid token
    const invalidToken = 'invalid-token'
    const validation2 = this.tokenManager.validateToken(invalidToken)
    this.log('Invalid token rejection', !validation2.isValid)
    
    // Test empty token
    const validation3 = this.tokenManager.validateToken('')
    this.log('Empty token rejection', !validation3.isValid)
    
    // Test OAuth token
    const oauthToken = 'gho_1234567890abcdef1234567890abcdef12345678'
    const validation4 = this.tokenManager.validateToken(oauthToken)
    this.log('OAuth token detection', validation4.isValid && validation4.tokenType === 'oauth_token')
    
    console.log('')
  }

  testTokenEncryption() {
    console.log('🔒 Testing Token Encryption...')
    
    const testToken = 'ghp_test1234567890abcdef1234567890abcdef123'
    const testKey = 'testKey123'
    
    // Test encryption
    const encrypted = this.tokenManager.xorEncrypt(testToken, testKey)
    this.log('Token encryption', encrypted !== testToken && encrypted.length > 0)
    
    // Test decryption
    const decrypted = this.tokenManager.xorDecrypt(encrypted, testKey)
    this.log('Token decryption', decrypted === testToken)
    
    // Test wrong key
    const wrongDecryption = this.tokenManager.xorDecrypt(encrypted, 'wrongKey')
    this.log('Wrong key protection', wrongDecryption !== testToken)
    
    console.log('')
  }

  testTokenStorage() {
    console.log('💾 Testing Token Storage...')
    
    const testToken = 'ghp_test1234567890abcdef1234567890abcdef123'
    const testUserData = { id: 123, login: 'testuser' }
    
    // Clear any existing data
    this.tokenManager.clearToken()
    
    // Test storage
    const stored = this.tokenManager.storeToken(testToken, testUserData)
    this.log('Token storage', stored)
    
    // Test retrieval
    const retrieved = this.tokenManager.getToken()
    this.log('Token retrieval', retrieved === testToken)
    
    // Test user data retrieval
    const userData = this.tokenManager.getUserData()
    this.log('User data retrieval', userData && userData.id === 123)
    
    // Test hasToken
    const hasToken = this.tokenManager.hasToken()
    this.log('Token existence check', hasToken)
    
    // Test clearing
    this.tokenManager.clearToken()
    const clearedToken = this.tokenManager.getToken()
    const hasTokenAfterClear = this.tokenManager.hasToken()
    this.log('Token clearing', !clearedToken && !hasTokenAfterClear)
    
    console.log('')
  }

  testSecurityLogging() {
    console.log('📊 Testing Security Logging...')
    
    // Clear existing log
    this.tokenManager.clearSecurityLog()
    
    // Test event logging
    this.tokenManager.logSecurityEvent('test_event', { detail: 'test' })
    const log = this.tokenManager.getSecurityLog()
    this.log('Security event logging', log.length === 1 && log[0].event === 'test_event')
    
    // Test multiple events
    this.tokenManager.logSecurityEvent('test_event_2', { detail: 'test2' })
    const log2 = this.tokenManager.getSecurityLog()
    this.log('Multiple events logging', log2.length === 2)
    
    // Test log clearing
    this.tokenManager.clearSecurityLog()
    const clearedLog = this.tokenManager.getSecurityLog()
    this.log('Security log clearing', clearedLog.length === 0)
    
    console.log('')
  }

  testMigration() {
    console.log('🔄 Testing Migration...')
    
    const testToken = 'ghp_migration1234567890abcdef1234567890abcdef'
    const testUserData = { id: 456, login: 'migrationuser' }
    
    // Simulate old localStorage data
    localStorage.setItem('github_token', testToken)
    localStorage.setItem('github_user', JSON.stringify(testUserData))
    
    // Clear new storage
    this.tokenManager.clearToken()
    
    // Test migration
    const migrated = this.tokenManager.migrateFromLocalStorage()
    this.log('Migration success', migrated)
    
    // Verify migration
    const migratedToken = this.tokenManager.getToken()
    const migratedUserData = this.tokenManager.getUserData()
    this.log('Migrated token verification', migratedToken === testToken)
    this.log('Migrated user data verification', migratedUserData && migratedUserData.id === 456)
    
    // Verify old data is cleared
    const oldToken = localStorage.getItem('github_token')
    const oldUserData = localStorage.getItem('github_user')
    this.log('Old data cleanup', !oldToken && !oldUserData)
    
    console.log('')
  }

  displayResults() {
    console.log('📊 Test Results Summary:')
    console.log('========================')
    
    const passed = this.testResults.filter(r => r.result).length
    const total = this.testResults.length
    const failed = total - passed
    
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(r => !r.result)
        .forEach(r => console.log(`   - ${r.test}${r.details ? ': ' + r.details : ''}`))
    }
    
    console.log('\n🔐 Security Implementation Tests Complete!')
    
    // Export results for reporting
    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.testResults
    }
  }
}

// Export for use in browser console or testing environment
if (typeof window !== 'undefined') {
  window.SecurityTests = SecurityTests
  window.runSecurityTests = () => {
    const tests = new SecurityTests()
    return tests.runAllTests()
  }
}

export { SecurityTests }
