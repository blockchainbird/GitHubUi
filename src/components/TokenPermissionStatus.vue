<template>
  <div class="token-permission-status">
    <!-- Loading State -->
    <div v-if="loading" class="alert alert-info">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Checking permissions...</span>
      </div>
      Checking token permissions...
    </div>

    <!-- Error State -->
    <div v-if="error && !loading" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Permission Check Failed:</strong> {{ error }}
    </div>

    <!-- Results Display -->
    <div v-if="validationResult && !loading" class="permission-results">
      <!-- Overall Status Banner -->
      <div 
        class="alert mb-3"
        :class="{
          'alert-success': validationResult.fullAccess,
          'alert-warning': validationResult.valid && !validationResult.fullAccess,
          'alert-danger': !validationResult.valid
        }"
      >
        <div class="d-flex align-items-center">
          <i 
            class="me-2"
            :class="{
              'bi bi-check-circle-fill': validationResult.fullAccess,
              'bi bi-exclamation-circle-fill': validationResult.valid && !validationResult.fullAccess,
              'bi bi-x-circle-fill': !validationResult.valid
            }"
          ></i>
          <div class="flex-grow-1">
            <strong v-if="validationResult.fullAccess">
              ✅ Token has full access
            </strong>
            <strong v-else-if="validationResult.valid">
              ⚠️ Token has limited access
            </strong>
            <strong v-else>
              ❌ Token has insufficient permissions
            </strong>
            <div class="small mt-1" v-if="validationResult.user">
              Authenticated as: <strong>{{ validationResult.user.login }}</strong>
            </div>
          </div>
          <button 
            v-if="!showDetails"
            @click="showDetails = true"
            class="btn btn-sm btn-outline-secondary"
          >
            <i class="bi bi-info-circle"></i> Details
          </button>
          <button 
            v-else
            @click="showDetails = false"
            class="btn btn-sm btn-outline-secondary"
          >
            <i class="bi bi-chevron-up"></i> Hide
          </button>
        </div>
      </div>

      <!-- Detailed Information (Collapsible) -->
      <div v-if="showDetails" class="details-section">
        <!-- Permissions Breakdown -->
        <div class="card mb-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-shield-check"></i> Permission Breakdown
            </h6>
          </div>
          <div class="card-body">
            <div class="permission-item mb-2" v-for="(op, key) in validationResult.operations" :key="key">
              <div class="d-flex align-items-center">
                <i 
                  class="me-2"
                  :class="{
                    'bi bi-check-circle text-success': op.allowed,
                    'bi bi-x-circle text-danger': !op.allowed
                  }"
                ></i>
                <strong>{{ formatOperationName(key) }}</strong>
                <span 
                  v-if="!op.allowed"
                  class="badge bg-danger ms-auto"
                >
                  Missing
                </span>
                <span 
                  v-else
                  class="badge bg-success ms-auto"
                >
                  Available
                </span>
              </div>
              <div v-if="!op.allowed && op.missingScopes.length > 0" class="small text-muted ms-4">
                Required: {{ op.missingScopes.join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Available Scopes -->
        <div class="card mb-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-key"></i> Token Scopes
            </h6>
          </div>
          <div class="card-body">
            <div v-if="validationResult.scopes.length > 0">
              <span 
                v-for="scope in validationResult.scopes" 
                :key="scope"
                class="badge bg-primary me-2 mb-2"
              >
                {{ scope }}
              </span>
            </div>
            <div v-else class="text-muted">
              No scopes detected
            </div>
          </div>
        </div>

        <!-- Missing Scopes -->
        <div 
          v-if="validationResult.missingScopes.length > 0"
          class="card mb-3 border-warning"
        >
          <div class="card-header bg-warning text-dark">
            <h6 class="mb-0">
              <i class="bi bi-exclamation-triangle"></i> Missing Scopes
            </h6>
          </div>
          <div class="card-body">
            <ul class="mb-0">
              <li v-for="scope in validationResult.missingScopes" :key="scope">
                <strong>{{ scope }}</strong>
                <span v-if="scopeDescriptions[scope]" class="text-muted">
                  - {{ scopeDescriptions[scope] }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Recommendations -->
        <div v-if="recommendations.length > 0" class="card mb-3">
          <div class="card-header bg-info text-white">
            <h6 class="mb-0">
              <i class="bi bi-lightbulb"></i> Recommendations
            </h6>
          </div>
          <div class="card-body">
            <div 
              v-for="(rec, index) in recommendations" 
              :key="index"
              class="mb-2"
            >
              {{ rec }}
            </div>
          </div>
        </div>

        <!-- Rate Limit Info -->
        <div v-if="validationResult.rateLimit" class="card mb-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-speedometer2"></i> API Rate Limit
            </h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <span>Remaining Requests:</span>
              <strong 
                :class="{
                  'text-danger': parseInt(validationResult.rateLimit.remaining) < 100,
                  'text-warning': parseInt(validationResult.rateLimit.remaining) >= 100 && parseInt(validationResult.rateLimit.remaining) < 500
                }"
              >
                {{ validationResult.rateLimit.remaining }} / {{ validationResult.rateLimit.limit }}
              </strong>
            </div>
            <div class="progress mt-2" style="height: 8px;">
              <div 
                class="progress-bar"
                :class="{
                  'bg-danger': parseInt(validationResult.rateLimit.remaining) < 100,
                  'bg-warning': parseInt(validationResult.rateLimit.remaining) >= 100 && parseInt(validationResult.rateLimit.remaining) < 500,
                  'bg-success': parseInt(validationResult.rateLimit.remaining) >= 500
                }"
                :style="{ width: rateLimitPercentage + '%' }"
              ></div>
            </div>
            <div class="small text-muted mt-1">
              Resets at: {{ formatResetTime(validationResult.rateLimit.reset) }}
            </div>
          </div>
        </div>

        <!-- Test Repository Access (if owner and repo provided) -->
        <div v-if="owner && repo && testResults" class="card mb-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-folder"></i> Repository Access Test
              <span class="small text-muted">({{ owner }}/{{ repo }})</span>
            </h6>
          </div>
          <div class="card-body">
            <div class="test-result mb-2">
              <i :class="testResults.canReadRepo ? 'bi bi-check-circle text-success' : 'bi bi-x-circle text-danger'"></i>
              Read repository metadata
            </div>
            <div class="test-result mb-2">
              <i :class="testResults.canReadBranches ? 'bi bi-check-circle text-success' : 'bi bi-x-circle text-danger'"></i>
              Read branches
            </div>
            <div class="test-result mb-2">
              <i :class="testResults.canReadFiles ? 'bi bi-check-circle text-success' : 'bi bi-x-circle text-danger'"></i>
              Read files
            </div>
            <div class="test-result mb-2">
              <i :class="testResults.canWriteFiles ? 'bi bi-check-circle text-success' : 'bi bi-x-circle text-danger'"></i>
              Write files
            </div>
            <div v-if="testResults.errors.length > 0" class="alert alert-warning mt-2 mb-0">
              <small>
                <strong>Issues found:</strong>
                <ul class="mb-0 mt-1">
                  <li v-for="(err, idx) in testResults.errors" :key="idx">{{ err }}</li>
                </ul>
              </small>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="d-flex gap-2">
          <button 
            @click="recheckPermissions"
            class="btn btn-primary"
            :disabled="loading"
          >
            <i class="bi bi-arrow-clockwise"></i> Recheck Permissions
          </button>
          <button 
            v-if="owner && repo && !testResults"
            @click="testRepositoryAccess"
            class="btn btn-outline-primary"
            :disabled="loading"
          >
            <i class="bi bi-folder-check"></i> Test Repository Access
          </button>
        </div>
      </div>

      <!-- Compact View Warnings/Errors -->
      <div v-if="!showDetails">
        <div 
          v-for="(err, idx) in validationResult.errors" 
          :key="`error-${idx}`"
          class="alert alert-danger mb-2"
        >
          {{ err }}
        </div>
        <div 
          v-for="(warn, idx) in validationResult.warnings" 
          :key="`warning-${idx}`"
          class="alert alert-warning mb-2"
        >
          {{ warn }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { tokenPermissionChecker, SCOPE_DESCRIPTIONS } from '../utils/tokenPermissionChecker.js'
import { secureTokenManager } from '../utils/secureTokenManager.js'

export default {
  name: 'TokenPermissionStatus',
  props: {
    // Optional: automatically check on mount
    autoCheck: {
      type: Boolean,
      default: true
    },
    // Optional: show compact or expanded view by default
    defaultExpanded: {
      type: Boolean,
      default: false
    },
    // Optional: test access to a specific repository
    owner: {
      type: String,
      default: null
    },
    repo: {
      type: String,
      default: null
    }
  },
  emits: ['permissions-checked', 'permissions-valid', 'permissions-invalid'],
  setup(props, { emit }) {
    // Reactive state
    const loading = ref(false)
    const error = ref(null)
    const validationResult = ref(null)
    const testResults = ref(null)
    const showDetails = ref(props.defaultExpanded)
    const scopeDescriptions = SCOPE_DESCRIPTIONS

    /**
     * Calculate rate limit percentage for progress bar
     */
    const rateLimitPercentage = computed(() => {
      if (!validationResult.value?.rateLimit) return 0
      const remaining = parseInt(validationResult.value.rateLimit.remaining)
      const limit = parseInt(validationResult.value.rateLimit.limit)
      return (remaining / limit) * 100
    })

    /**
     * Generate recommendations based on validation results
     */
    const recommendations = computed(() => {
      if (!validationResult.value) return []
      return tokenPermissionChecker.generateRecommendations(validationResult.value)
    })

    /**
     * Formats operation key to human-readable name
     * @param {string} key - Operation key (e.g., 'readRepository')
     * @returns {string} Formatted name
     */
    const formatOperationName = (key) => {
      const names = {
        authentication: 'User Authentication',
        readRepository: 'Read Repository',
        writeRepository: 'Write Repository',
        manageWorkflows: 'Manage GitHub Actions',
        fullAccess: 'Full Access'
      }
      return names[key] || key
    }

    /**
     * Formats Unix timestamp to readable time
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted time
     */
    const formatResetTime = (timestamp) => {
      if (!timestamp) return 'Unknown'
      const date = new Date(parseInt(timestamp) * 1000)
      return date.toLocaleTimeString()
    }

    /**
     * Main function to check token permissions
     */
    const checkPermissions = async () => {
      loading.value = true
      error.value = null
      validationResult.value = null
      testResults.value = null

      try {
        // Get token from secure storage
        const token = secureTokenManager.getToken()
        
        if (!token) {
          throw new Error('No authentication token found. Please log in.')
        }

        // Validate permissions
        const result = await tokenPermissionChecker.validateTokenPermissions(token)
        validationResult.value = result

        // Emit events based on results
        emit('permissions-checked', result)
        
        if (result.valid) {
          emit('permissions-valid', result)
        } else {
          emit('permissions-invalid', result)
        }

      } catch (err) {
        error.value = err.message
        console.error('Permission check error:', err)
      } finally {
        loading.value = false
      }
    }

    /**
     * Tests actual repository access
     */
    const testRepositoryAccess = async () => {
      if (!props.owner || !props.repo) {
        error.value = 'Repository owner and name required for testing'
        return
      }

      loading.value = true
      error.value = null

      try {
        const token = secureTokenManager.getToken()
        if (!token) {
          throw new Error('No authentication token found')
        }

        const results = await tokenPermissionChecker.testTokenOperations(
          token,
          props.owner,
          props.repo
        )
        testResults.value = results

      } catch (err) {
        error.value = `Repository access test failed: ${err.message}`
        console.error('Repository test error:', err)
      } finally {
        loading.value = false
      }
    }

    /**
     * Triggers a recheck of permissions
     */
    const recheckPermissions = () => {
      tokenPermissionChecker.clearCache()
      checkPermissions()
    }

    // Auto-check on mount if enabled
    onMounted(() => {
      if (props.autoCheck) {
        checkPermissions()
      }
    })

    // Watch for owner/repo changes
    watch([() => props.owner, () => props.repo], () => {
      if (testResults.value) {
        testResults.value = null
      }
    })

    return {
      loading,
      error,
      validationResult,
      testResults,
      showDetails,
      scopeDescriptions,
      rateLimitPercentage,
      recommendations,
      formatOperationName,
      formatResetTime,
      checkPermissions,
      testRepositoryAccess,
      recheckPermissions
    }
  }
}
</script>

<style scoped>
.token-permission-status {
  margin-bottom: 1rem;
}

.details-section {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.permission-item {
  padding: 0.5rem;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.permission-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
  border-left-color: var(--bs-primary);
}

.test-result {
  padding: 0.25rem 0;
}

.badge {
  font-size: 0.75rem;
}

.card-header h6 {
  font-weight: 600;
}

.progress {
  border-radius: 4px;
}
</style>
