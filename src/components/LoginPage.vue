<template>
  <div class="row justify-content-center login-bg">
    <div class="col-md-6 col-lg-4">
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
                  placeholder="Enter your GitHub token" required>
                <div class="form-text">
                  <small>
                    <a href="https://github.com/settings/tokens" target="_blank" class="text-decoration-none">
                      <i class="bi bi-box-arrow-up-right"></i>
                      Generate a new token
                    </a>
                    with repo permissions
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

            <div class="mt-4">
              <h6>Required Token Permissions:</h6>
              <ul class="text-muted small">
                <li>repo (Full control of private repositories)</li>
                <li>Contents (Read and write repository contents)</li>
              </ul>
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
.login-bg {
  min-height: 100vh;
  background-image: url('/assets/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>