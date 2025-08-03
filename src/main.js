import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue'
import FileExplorer from './components/FileExplorer.vue'
import FileEditor from './components/FileEditor.vue'
import ExternalSpecsManager from './components/ExternalSpecsManager.vue'
import HealthCheck from './components/HealthCheck.vue'
import AdminScreen from './components/AdminScreen.vue'
import CreateSpecUpProject from './components/CreateSpecUpProject.vue'
import Settings from './components/Settings.vue'
import GitHubActions from './components/GitHubActions.vue'
import { autoEnhanceTooltips } from './directives/tooltip.js'

import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/custom-bootstrap.scss'

// Make Bootstrap available globally
window.bootstrap = bootstrap

// Import Google Analytics
import googleAnalytics from './utils/googleAnalytics.js'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/home', component: HomePage },
  { path: '/create-project', component: CreateSpecUpProject },
  { path: '/settings', component: Settings },

  { path: '/admin/:owner/:repo/:branch', component: AdminScreen, props: true },
  { path: '/files/:owner/:repo/:branch', component: FileExplorer, props: true },
  { path: '/editor/:owner/:repo/:branch/:path+', component: FileEditor, props: true },
  { path: '/external-specs/:owner/:repo/:branch', component: ExternalSpecsManager, props: true },
  { path: '/health-check/:owner/:repo/:branch', component: HealthCheck, props: true },
  { path: '/actions/:owner/:repo/:branch', component: GitHubActions, props: true },
  { 
    path: '/terms-preview/:owner/:repo/:branch', 
    name: 'terms-preview',
    component: () => import('./components/TermsPreview.vue'), 
    props: true 
  }
]

const basePath = import.meta.env.VITE_BASE_PATH || '/';

const router = createRouter({
  history: createWebHashHistory(basePath),
  routes
})

// Initialize Google Analytics
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
if (measurementId) {
  googleAnalytics.init(measurementId)
}

// Global navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/color-demo'];
  const authRequired = !publicPages.includes(to.path);
  const user = localStorage.getItem('github_user');
  const token = localStorage.getItem('github_token');

  // Allow authenticated users to access all routes
  if (authRequired && (!user || !token)) {
    // Store the intended destination before redirecting to login
    if (to.path !== '/login') {
      localStorage.setItem('intended_redirect', to.fullPath);
    }
    next('/login');
  } else {
    next();
  }
});

// Track page views after navigation
router.afterEach((to) => {
  if (googleAnalytics.isEnabled()) {
    googleAnalytics.trackPageView(to.fullPath, to.meta.title || document.title)
  }
});

// Global error handler for axios
import axios from 'axios'
import { useRateLimit } from './composables/useRateLimit'

// Initialize rate limit composable
const { updateRateLimit } = useRateLimit()

// Add response interceptor to handle authentication errors and rate limits globally
axios.interceptors.response.use(
  (response) => {
    // Update rate limit info from GitHub API responses
    if (response.config.url && response.config.url.includes('api.github.com')) {
      updateRateLimit(response.headers)
    }
    return response
  },
  (error) => {
    // Update rate limit info even on errors if headers are present
    if (error.response && error.response.config.url &&
      error.response.config.url.includes('api.github.com')) {
      updateRateLimit(error.response.headers)
    }

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token is invalid or expired, clear it and redirect to login
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      // Store the current path as intended redirect before redirecting to login
      if (router.currentRoute.value.path !== '/login') {
        localStorage.setItem('intended_redirect', router.currentRoute.value.fullPath);
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(router)

// Register tooltip directive
const enhanceTooltips = autoEnhanceTooltips(app)

app.mount('#app')

// Enhanced tooltips after DOM is fully ready
const initTooltips = () => {
  console.log('Initializing tooltips...');
  enhanceTooltips();

  // Also run after Vue's nextTick to ensure all components are rendered
  setTimeout(() => {
    console.log('Running secondary tooltip enhancement...');
    enhanceTooltips();
  }, 500);
};

// Multiple ways to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTooltips);
} else {
  setTimeout(initTooltips, 100);
}

// Track initial page view after the app is mounted
if (measurementId && googleAnalytics.isEnabled()) {
  // Use setTimeout to ensure the router is ready
  setTimeout(() => {
    googleAnalytics.trackPageView(router.currentRoute.value.fullPath, document.title)
  }, 100)
}
