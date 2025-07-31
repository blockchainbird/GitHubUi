<template>
  <div class="container mt-4">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-wrench-adjustable"></i>
              Version Notification Demo
            </h5>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <i class="bi bi-info-circle"></i>
              <strong>Demo Instructions:</strong>
              This panel allows you to test the version notification system. 
              Use the controls below to simulate version updates and see how the notification behaves.
            </div>

            <!-- Current Version Info -->
            <div class="mb-4">
              <h6>Current Version Information</h6>
              <div class="bg-light p-3 rounded">
                <div><strong>Build Date:</strong> {{ currentVersion?.buildDate || 'Loading...' }}</div>
                <div><strong>Timestamp:</strong> {{ currentVersion?.timestamp || 'Loading...' }}</div>
                <div><strong>Has New Version:</strong> 
                  <span :class="hasNewVersion ? 'text-success' : 'text-muted'">
                    {{ hasNewVersion ? 'Yes' : 'No' }}
                  </span>
                </div>
                <div><strong>Last Seen Version:</strong> {{ lastSeenVersion || 'None' }}</div>
              </div>
            </div>

            <!-- Usage Instructions -->
            <div class="mb-4">
              <h6>How to Test</h6>
              <ol class="list-group list-group-numbered">
                <li class="list-group-item">Click "Simulate New Version" to create a fake newer version</li>
                <li class="list-group-item">Look for a notification toast in the top-right corner</li>
                <li class="list-group-item">Test the update behavior:
                  <ul class="mt-2">
                    <li><strong>Simple Mode:</strong> "Update Now" button reloads the page immediately</li>
                    <li><strong>Enhanced Mode:</strong> Shows options to update now or later</li>
                  </ul>
                </li>
                <li class="list-group-item">Use "Clear Version History" to reset and test again</li>
                <li class="list-group-item">Run "Tests" to verify system functionality</li>
              </ol>
            </div>

            <!-- Notification Type Selection -->
            <div class="mb-4">
              <h6>Notification Mode</h6>
              <div class="alert alert-info">
                <strong>Current:</strong> Simple mode - "Update Now" reloads the page immediately.
                <br>
                <small>You can also create an enhanced mode with more options (see EnhancedVersionNotification.vue)</small>
              </div>
            </div>

            <!-- Controls -->
            <div class="mb-4">
              <h6>Demo Controls</h6>
              <div class="d-flex gap-2 flex-wrap">
                <button 
                  @click="simulateNewVersion" 
                  class="btn btn-primary"
                  :disabled="checkingVersion"
                >
                  <i class="bi bi-arrow-clockwise"></i>
                  Simulate New Version
                </button>
                
                <button 
                  @click="clearVersionHistory" 
                  class="btn btn-warning"
                >
                  <i class="bi bi-trash"></i>
                  Clear Version History
                </button>
                
                <button 
                  @click="checkForUpdates" 
                  class="btn btn-info"
                  :disabled="checkingVersion"
                >
                  <i class="bi bi-search"></i>
                  Check for Updates
                </button>
                
                <button 
                  @click="markCurrentAsSeen" 
                  class="btn btn-success"
                >
                  <i class="bi bi-check2"></i>
                  Mark Current as Seen
                </button>
                
                <button 
                  @click="runTests" 
                  class="btn btn-secondary"
                >
                  <i class="bi bi-bug"></i>
                  Run Tests
                </button>
                
                <button 
                  @click="forceShowNotification" 
                  class="btn btn-warning"
                >
                  <i class="bi bi-exclamation-triangle"></i>
                  Force Show Notification
                </button>
                
                <button 
                  @click="hideNotification" 
                  class="btn btn-outline-warning"
                >
                  <i class="bi bi-eye-slash"></i>
                  Hide Notification
                </button>
              </div>
            </div>

            <!-- Status -->
            <div v-if="hasNewVersion" class="alert alert-success">
              <i class="bi bi-bell"></i>
              <strong>Notification Active:</strong> 
              A version notification should be visible in the top-right corner of the screen.
            </div>

            <!-- Debug Info -->
            <div class="mt-4">
              <h6>Debug Information</h6>
              <details class="bg-light p-3 rounded">
                <summary class="fw-bold">View Raw Data</summary>
                <pre class="mt-2 mb-0"><code>{{ debugInfo }}</code></pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useVersionCheck } from '../composables/useVersionCheck.js'
import { versionTestUtils } from '../utils/versionTestUtils.js'

export default {
  name: 'VersionDemo',
  setup() {
    const {
      hasNewVersion,
      currentVersion,
      newVersion,
      checkingVersion,
      checkForUpdates,
      dismissNotification,
      acknowledgeUpdate,
      markVersionAsSeen
    } = useVersionCheck()

    const lastSeenVersion = computed(() => {
      return localStorage.getItem('last_seen_version') || null
    })

    const debugInfo = computed(() => {
      return JSON.stringify({
        hasNewVersion: hasNewVersion.value,
        currentVersion: currentVersion.value,
        newVersion: newVersion.value,
        checkingVersion: checkingVersion.value,
        lastSeenVersion: lastSeenVersion.value,
        localStorage: {
          last_seen_version: localStorage.getItem('last_seen_version')
        }
      }, null, 2)
    })

    const simulateNewVersion = () => {
      console.log('🎭 Starting version simulation...')
      
      // Create a simulated newer version by adding 1 hour to current timestamp
      const now = new Date()
      now.setHours(now.getHours() + 1)
      
      const simulatedVersion = {
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

      console.log('🎭 Current build info:', window.__BUILD_INFO__)
      console.log('🎭 Simulated version:', simulatedVersion)
      console.log('🎭 Last seen version:', localStorage.getItem('last_seen_version'))

      // Temporarily override the build info
      window.__BUILD_INFO__ = simulatedVersion
      
      // Force a fresh check for updates
      setTimeout(() => {
        console.log('🎭 Triggering version check...')
        checkForUpdates()
      }, 100)
    }

    const clearVersionHistory = () => {
      console.log('🧹 Clearing version history...')
      localStorage.removeItem('last_seen_version')
      console.log('🧹 localStorage cleared, forcing version check...')
      setTimeout(() => {
        checkForUpdates()
      }, 100)
    }

    const markCurrentAsSeen = () => {
      markVersionAsSeen()
    }

    const runTests = () => {
      // Open console and run tests
      console.clear()
      versionTestUtils.runAllTests()
      alert('Tests completed! Check the browser console for results.')
    }

    const forceShowNotification = () => {
      console.log('🚨 Forcing notification display...')
      
      // Create a fake new version
      const fakeVersion = {
        timestamp: new Date().toISOString(),
        buildDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      }
      
      // Send event to VersionNotification component
      const event = new CustomEvent('force-show-version-notification', {
        detail: fakeVersion
      })
      window.dispatchEvent(event)
      
      console.log('🚨 Notification event dispatched:', fakeVersion)
    }

    const hideNotification = () => {
      console.log('👻 Hiding notification...')
      const event = new CustomEvent('hide-version-notification')
      window.dispatchEvent(event)
    }

    return {
      hasNewVersion,
      currentVersion,
      newVersion,
      checkingVersion,
      lastSeenVersion,
      debugInfo,
      simulateNewVersion,
      clearVersionHistory,
      checkForUpdates,
      markCurrentAsSeen,
      runTests,
      forceShowNotification,
      hideNotification
    }
  }
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

pre {
  font-size: 0.8rem;
  max-height: 200px;
  overflow-y: auto;
}

details summary {
  cursor: pointer;
  user-select: none;
}

details summary:hover {
  color: #0d6efd;
}
</style>
