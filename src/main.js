import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue'
import FileExplorer from './components/FileExplorer.vue'
import FileEditor from './components/FileEditor.vue'
import ExternalSpecsManager from './components/ExternalSpecsManager.vue'
import HealthCheck from './components/HealthCheck.vue'

import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/custom-bootstrap.scss'

// Import Google Analytics
import googleAnalytics from './utils/googleAnalytics.js'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/home', component: HomePage },
  { path: '/files/:owner/:repo/:branch', component: FileExplorer, props: true },
  { path: '/editor/:owner/:repo/:branch/:path+', component: FileEditor, props: true },
  { path: '/external-specs/:owner/:repo/:branch', component: ExternalSpecsManager, props: true },
  { path: '/health-check/:owner/:repo/:branch', component: HealthCheck, props: true }
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

// Add response interceptor to handle authentication errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
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
app.mount('#app')

// Track initial page view after the app is mounted
if (measurementId && googleAnalytics.isEnabled()) {
  // Use setTimeout to ensure the router is ready
  setTimeout(() => {
    googleAnalytics.trackPageView(router.currentRoute.value.fullPath, document.title)
  }, 100)
}
