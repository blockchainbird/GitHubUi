<template>
  <div class="row justify-content-center login-bg mb-5">
    <div class="mt-3 col-md-6 col-lg-4">
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-3">
            <img src="/assets/logo.svg" alt="Logo"
              style="max-width: 120px; width: 60%; height: auto; margin-bottom: 0.5rem;" />
          </div>
          <h2 class="card-title text-center mb-4">
            <i class="bi bi-github"></i>
            Login to GitHub
          </h2>

          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <div v-if="loading" class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Authenticating with GitHub...</p>
          </div>

          <div v-else>
            <div class="mb-4 text-center">
              <p class="text-muted">
                Authenticate with GitHub to access and edit repository files.
              </p>
            </div>

            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="token" class="form-label">GitHub Personal Access Token</label>
                <input type="password" id="token" v-model="token" class="form-control"
                  placeholder="Enter your GitHub token" required autocomplete="new-password">
              </div>

              <div class="d-grid">
                <button type="submit" class="btn btn-dark" :disabled="!token">
                  <i class="bi bi-box-arrow-in-right"></i>
                  Login with GitHub
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container mt-5 mb-5">
    <div class="container">
      <h2 class="text-center mb-5">
        <i class="bi bi-shield-lock"></i>
        How To Create a GitHub Token
      </h2>
      <div class="row g-4 mb-5 video-container-wrapper">
        <div class="col-12">
          <div class="card d-flex flex-column h-100">
            <div
              class="card-header bg-primary text-white text-center d-flex justify-content-between align-items-center">
              <div class="flex-grow-1">
                <p class="card-text text-info bg-dark p-3 rounded mt-3 mb-0"><a
                    href="https://github.com/settings/tokens" target="_blank" class="text-white text-decoration-none">
                    Go to GitHub.com <i class="bi bi-box-arrow-up-right"></i>, log in</a> and then do the following:
                  <button @click="toggleFullscreen" class="btn btn-sm btn-outline-light ms-3" title="Toggle Fullscreen"
                    aria-label="Toggle video fullscreen">
                    <i class="bi bi-arrows-fullscreen"></i>
                  </button>
                </p>
              </div>
            </div>
            <div class="card-body p-0 flex-grow-1 d-flex justify-content-center align-items-center">
              <video ref="videoElement" muted autoplay loop controls class="video-player">
                <source src="/create-token.mp4" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>

      <p>The same, but in images:</p>

      <div class="row g-4 instructions">
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 1</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Go to GitHub and log in.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-1.jpg" class="card-img-top" alt="Step 1">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 2</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Choose “Settings”.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-2.jpg" class="card-img-top" alt="Step 2">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 3</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Choose “Developer settings”.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-3.jpg" class="card-img-top" alt="Step 3">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 4</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Choose “Personal access tokens”.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-4.jpg" class="card-img-top" alt="Step 4">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 5</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Choose “Tokens (classic)”.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-5.jpg" class="card-img-top" alt="Step 5">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 6</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Choose “Tokens (classic)”.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-6.jpg" class="card-img-top" alt="Step 6">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 7</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Choose “Generate new token (classic)”.</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-7.jpg" class="card-img-top" alt="Step 7">
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white text-center">
              <h5 class="card-title mb-0">Step 8</h5>
              <p class="card-text text-info bg-dark p-3 rounded mt-3">Check “repo”</p>
            </div>
            <div class="card-body">
              <img src="/assets/token-creation/create-token-instructions-8.jpg" class="card-img-top" alt="Step 8">
            </div>
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

export default {
  name: 'LoginPage',
  emits: ['login'],
  setup(props, { emit }) {
    const router = useRouter()
    const { trackLogin, trackEvent } = useGoogleAnalytics()
    const token = ref('')
    const loading = ref(false)
    const error = ref('')
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

        const userData = {
          ...response.data,
          token: token.value.trim(),
          tokenType: validation.tokenType,
          loginTimestamp: new Date().toISOString()
        }

        emit('login', userData)

        // Play success sound
        playSuccessSound()

        // Track successful login with token type
        trackLogin('github')
        trackEvent('secure_login_success', {
          token_type: validation.tokenType,
          user_id: response.data.id
        })

        // Check if there's an intended redirect URL
        const intendedRedirect = localStorage.getItem('intended_redirect')
        if (intendedRedirect) {
          localStorage.removeItem('intended_redirect')
          router.push(intendedRedirect)
        } else {
          router.push('/home')
        }

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
      handleLogin,
      videoElement,
      toggleFullscreen
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