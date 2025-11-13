<template>
  <div class="row justify-content-center login-bg mb-5">
    <div class="mt-3 col-md-6 col-lg-4">
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-3">
            <img src="/assets/logo.svg" alt="Logo"
              style="max-width: 120px; width: 60%; height: auto; margin-bottom: 0.5rem;" />
          </div>
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="card-title text-center flex-grow-1 mb-0">
              <i class="bi bi-github"></i>
              Login to GitHub
            </h2>
          </div>

          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            {{ successMessage }}
            <button type="button" class="btn-close" @click="successMessage = ''" aria-label="Close"></button>
          </div>

          <div v-if="loading" class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Authenticating with GitHub...</p>
          </div>

          <div v-else>
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="token" class="form-label">Authenticate with GitHub to access and edit repository
                  files.</label>

                <input type="password" id="token" v-model="token" class="form-control mt-3"
                  placeholder="Enter your GitHub token" required>
              </div>

              <div class="d-flex gap-2">
                <button @click="openTokenHelp" class="btn btn-sm btn-outline-secondary" title="Open token help"
                  aria-label="Open token help" style="flex-shrink: 0;">
                  <i class="bi bi-question-circle"></i>
                </button>

                <button type="submit" class="btn btn-dark flex-grow-1" :disabled="!token">
                  <i class="bi bi-box-arrow-in-right"></i>
                  Login with GitHub token
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics.js'
import { useSoundSystem } from '../composables/useSoundSystem.js'
import { secureTokenManager } from '../utils/secureTokenManager.js'
import { tokenPermissionChecker } from '../utils/tokenPermissionChecker.js'

export default {
  name: 'LoginPage',
  emits: ['login'],
  setup(props, { emit }) {
    const router = useRouter()
    const { trackLogin, trackEvent } = useGoogleAnalytics()
    const token = ref('')
    const loading = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const { playSuccessSound } = useSoundSystem()
    const videoElement = ref(null)

    /**
     * Toggles fullscreen mode for the video element.
     * Uses the Fullscreen API to request or exit fullscreen.
     */
    const toggleFullscreen = () => {
      if (!videoElement.value) return

      if (!document.fullscreenElement) {
        // Request fullscreen
        videoElement.value.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err)
        })
      } else {
        // Exit fullscreen
        document.exitFullscreen()
      }
    }

    /**
     * Opens the token help page in a new tab.
     * Provides users with detailed instructions on creating a GitHub token.
     */
    const openTokenHelp = () => {
      window.open('/token-instructions.html', 'token_help', 'width=900,height=1000,resizable=yes,scrollbars=yes')
    }

    const handleLogin = async () => {
      if (!token.value.trim()) {
        error.value = 'Please enter your GitHub token'
        return
      }

      loading.value = true
      error.value = ''

      try {
        // Validate token format first using secure token manager
        const validation = secureTokenManager.validateToken(token.value)
        if (!validation.isValid) {
          error.value = `Invalid token format: ${validation.errors.join(', ')}`
          loading.value = false
          return
        }

        // Configure axios with the token
        const config = {
          headers: {
            'Authorization': `token ${token.value.trim()}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Test the token by getting user info
        const response = await axios.get('https://api.github.com/user', config)

        // VALIDATE TOKEN PERMISSIONS - Check for required scopes
        // Clear cache before checking new token permissions to avoid stale data
        tokenPermissionChecker.clearCache()

        console.log('🔍 Checking token permissions...')
        const permissions = await tokenPermissionChecker.validateTokenPermissions(token.value.trim())

        // Debug: Log what scopes were detected
        console.log('📋 Detected scopes:', permissions.scopes)
        console.log('📋 Permission details:', {
          valid: permissions.valid,
          fullAccess: permissions.fullAccess,
          operations: permissions.operations,
          missingScopes: permissions.missingScopes
        })

        // Check if token has ALL required scopes (repo, workflow)
        if (!permissions.valid) {
          console.error('❌ Token has insufficient permissions:', permissions)

          // Build detailed error message
          const missingScopes = permissions.missingScopes.join(', ')
          error.value = `Token has insufficient permissions. 

REQUIRED SCOPES: Personal Access Token (classic) must have:
✅ "repo" scope
✅ "workflow" scope

Your token is missing: ${missingScopes}

Please create a new token with all required scopes checked.`

          // Log the recommendations
          const recommendations = tokenPermissionChecker.generateRecommendations(permissions)
          recommendations.forEach(rec => console.warn(rec))

          // Track permission failure
          trackEvent('login_permission_error', {
            missing_scopes: missingScopes,
            user_id: response.data.id
          })

          loading.value = false
          return
        }

        console.log('✅ Token has all required permissions')

        const userData = {
          ...response.data,
          token: token.value.trim(),
          tokenType: validation.tokenType,
          loginTimestamp: new Date().toISOString(),
          permissions: permissions.scopes // Store scopes for later reference
        }

        emit('login', userData)

        // Play success sound
        playSuccessSound()

        // Show temporary success message
        successMessage.value = `✅ Successfully logged in as ${response.data.login}!`

        // Track successful login with token type
        trackLogin('github')
        trackEvent('secure_login_success', {
          token_type: validation.tokenType,
          user_id: response.data.id,
          has_required_permissions: true
        })

        // Redirect after a short delay to allow user to see the success message
        setTimeout(() => {
          // Check if there's an intended redirect URL
          const intendedRedirect = localStorage.getItem('intended_redirect')
          if (intendedRedirect) {
            localStorage.removeItem('intended_redirect')
            router.push(intendedRedirect)
          } else {
            router.push('/home')
          }
        }, 1500)

      } catch (err) {
        console.error('Login error:', err)

        // Track login failure with more detail
        trackEvent('login_error', {
          error_type: err.response?.status === 401 ? 'invalid_token' : 'unknown',
          error_code: err.response?.status || 'network_error'
        })

        // Log security event
        secureTokenManager.logSecurityEvent('login_failed', {
          error: err.message,
          status: err.response?.status
        })

        if (err.response?.status === 401) {
          error.value = 'Invalid token. Please check your GitHub Personal Access Token and ensure it has the required permissions.'
        } else if (err.response?.status === 403) {
          error.value = 'Access forbidden. Your token may lack required permissions or have expired.'
        } else {
          error.value = 'Failed to authenticate. Please check your internet connection and try again.'
        }
      } finally {
        loading.value = false
      }
    }

    return {
      token,
      loading,
      error,
      successMessage,
      handleLogin,
      videoElement,
      toggleFullscreen,
      openTokenHelp
    }
  }
}
</script>

<style scoped>
.instructions {
  filter: brightness(0.7) contrast(1.2);
  transition: filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.instructions:hover {
  filter: brightness(1) contrast(1.2);
}
</style>