/**
 * Simple test utilities for the version notification system
 * These can be run in the browser console or integrated into a test framework
 */

export const versionTestUtils = {
  /**
   * Test basic version comparison logic
   */
  testVersionComparison() {
    console.group('🧪 Version Comparison Tests')
    
    const tests = [
      {
        name: 'New version detected',
        lastSeen: '2024-01-01T10:00:00.000Z',
        current: '2024-01-01T11:00:00.000Z',
        expected: true
      },
      {
        name: 'Same version (no update)',
        lastSeen: '2024-01-01T10:00:00.000Z',
        current: '2024-01-01T10:00:00.000Z',
        expected: false
      },
      {
        name: 'No previous version (first time)',
        lastSeen: null,
        current: '2024-01-01T10:00:00.000Z',
        expected: true
      }
    ]

    tests.forEach(test => {
      const hasUpdate = test.lastSeen !== test.current && test.current !== null
      const result = hasUpdate === test.expected ? '✅ PASS' : '❌ FAIL'
      console.log(`${result} ${test.name}`)
    })
    
    console.groupEnd()
  },

  /**
   * Test localStorage functionality
   */
  testLocalStorage() {
    console.group('🗂️ LocalStorage Tests')
    
    const testKey = 'test_version_key'
    const testValue = '2024-01-01T10:00:00.000Z'
    
    try {
      // Test write
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      
      if (retrieved === testValue) {
        console.log('✅ PASS localStorage write/read')
      } else {
        console.log('❌ FAIL localStorage write/read')
      }
      
      // Test removal
      localStorage.removeItem(testKey)
      const afterRemoval = localStorage.getItem(testKey)
      
      if (afterRemoval === null) {
        console.log('✅ PASS localStorage removal')
      } else {
        console.log('❌ FAIL localStorage removal')
      }
      
    } catch (error) {
      console.log('❌ FAIL localStorage not available:', error.message)
    }
    
    console.groupEnd()
  },

  /**
   * Test build info availability
   */
  testBuildInfo() {
    console.group('🏗️ Build Info Tests')
    
    try {
      const buildInfo = window.__BUILD_INFO__
      
      if (buildInfo) {
        console.log('✅ PASS Build info available')
        console.log('📅 Build Date:', buildInfo.buildDate)
        console.log('⏰ Timestamp:', buildInfo.timestamp)
        
        if (buildInfo.timestamp && buildInfo.buildDate) {
          console.log('✅ PASS Build info has required fields')
        } else {
          console.log('❌ FAIL Build info missing required fields')
        }
      } else {
        console.log('❌ FAIL Build info not available')
      }
    } catch (error) {
      console.log('❌ FAIL Error accessing build info:', error.message)
    }
    
    console.groupEnd()
  },

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🚀 Running Version Notification System Tests...')
    console.log('=' .repeat(50))
    
    this.testVersionComparison()
    this.testLocalStorage()
    this.testBuildInfo()
    
    console.log('=' .repeat(50))
    console.log('✅ Test suite completed!')
  },

  /**
   * Helper to simulate a version update for testing
   */
  simulateVersionUpdate() {
    console.group('🎭 Simulating Version Update')
    
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30) // 30 minutes in the future
    
    const fakeVersion = {
      timestamp: now.toISOString(),
      buildDate: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    }
    
    // Temporarily override build info
    const originalBuildInfo = window.__BUILD_INFO__
    window.__BUILD_INFO__ = fakeVersion
    
    console.log('📦 Simulated new version:', fakeVersion)
    console.log('🔄 You can now test the version notification system')
    console.log('⚠️ Remember to refresh the page to restore original build info')
    
    // Provide a way to restore
    window.restoreOriginalBuildInfo = () => {
      window.__BUILD_INFO__ = originalBuildInfo
      console.log('🔙 Original build info restored')
    }
    
    console.groupEnd()
  },

  /**
   * Clear all version-related localStorage data
   */
  clearVersionData() {
    console.group('🧹 Clearing Version Data')
    
    const keysToRemove = [
      'last_seen_version',
      'test_version_key'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ Removed: ${key}`)
    })
    
    console.log('✅ Version data cleared')
    console.groupEnd()
  }
}

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  window.versionTestUtils = versionTestUtils
}

// Export for module usage
export default versionTestUtils
