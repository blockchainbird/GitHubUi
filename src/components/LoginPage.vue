<template>
  <div class="row justify-content-center login-bg">
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
                  <small>F
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
  background: linear-gradient(135deg, 
    #1e3c72 0%,     /* Deep blue - professional standards */
    #2a5298 25%,    /* ISO blue - standardization */
    #3d6db0 50%,    /* Collaboration blue */
    #4a7bc8 75%,    /* Author workflow blue */
    #5b8ce0 100%    /* Editor interface blue */
  );
  position: relative;
  overflow: hidden;
}

.login-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    /* Subtle grid pattern representing structured documents */
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px, 80px 80px, 100px 100px;
  opacity: 0.6;
}

.login-bg::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    /* Flowing lines representing collaboration and workflow */
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 200px,
      rgba(255, 255, 255, 0.1) 201px,
      rgba(255, 255, 255, 0.1) 202px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 150px,
      rgba(255, 255, 255, 0.2) 151px,
      rgba(255, 255, 255, 0.2) 152px
    );
  animation: flow 20s linear infinite;
  pointer-events: none;
}

@keyframes flow {
  0% {
    transform: translateX(-100px) translateY(-100px);
  }
  100% {
    transform: translateX(100px) translateY(100px);
  }
}

/* Ensure card stays on top of background effects */
.card {
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
</style>