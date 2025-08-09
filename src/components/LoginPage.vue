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
                <div class="form-text">
                  <small>
                    <a href="https://github.com/settings/tokens" target="_blank" class="text-decoration-none">
                      <i class="bi bi-box-arrow-up-right"></i>
                      Generate a new token
                    </a>
                    with repo permissions
                  </small>
                  –
                  <small>
                    <a href="https://blockchainbird.github.io/spec-up-t-website/docs/getting-started/github-token/#get-the-token"
                      target="_blank" class="text-decoration-none">
                      <i class="bi bi-box-arrow-up-right"></i>
                      Instructions
                    </a>
                  </small>
                </div>
              </div>

              <div class="d-grid">
                <button type="submit" class="btn btn-dark" :disabled="!token">
                  <i class="bi bi-box-arrow-in-right"></i>
                  Login with GitHub
                </button>
              </div>
            </form>

            <!-- <div class="mt-4">
              <h6>Required Token Permissions:</h6>
              <ul class="text-muted small">
                <li>repo (Full control of private repositories)</li>
                <li>Contents (Read and write repository contents)</li>
              </ul>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container-fluid mt-5 mb-5">
    <div class="container">
      <h2 class="text-center mb-5">
        <i class="bi bi-shield-lock"></i>
        How To Create a GitHub Token
      </h2>
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

export default {
  name: 'LoginPage',
  emits: ['login'],
  setup(props, { emit }) {
    const router = useRouter()
    const { trackLogin, trackEvent } = useGoogleAnalytics()
    const token = ref('')
    const loading = ref(false)
    const error = ref('')

    const handleLogin = async () => {
      if (!token.value.trim()) {
        error.value = 'Please enter your GitHub token'
        return
      }

      loading.value = true
      error.value = ''

      try {
        // Configure axios with the token
        const config = {
          headers: {
            'Authorization': `token ${token.value}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Test the token by getting user info
        const response = await axios.get('https://api.github.com/user', config)

        const userData = {
          ...response.data,
          token: token.value
        }

        emit('login', userData)

        // Track successful login
        trackLogin('github')

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

        // Track login failure
        trackEvent('login_error', {
          error_type: err.response?.status === 401 ? 'invalid_token' : 'unknown'
        })

        if (err.response?.status === 401) {
          error.value = 'Invalid token. Please check your GitHub Personal Access Token.'
        } else {
          error.value = 'Failed to authenticate. Please try again.'
        }
      } finally {
        loading.value = false
      }
    }

    return {
      token,
      loading,
      error,
      handleLogin

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