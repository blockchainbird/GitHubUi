import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue'
import FileExplorer from './components/FileExplorer.vue'
import FileEditor from './components/FileEditor.vue'
import ExternalSpecsManager from './components/ExternalSpecsManager.vue'
import HealthCheck from './components/HealthCheck.vue'

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
  history: createWebHistory(basePath),
  routes
})
// Global navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const publicPages = ['/login'];
  const authRequired = !publicPages.includes(to.path);
  const user = localStorage.getItem('github_user');
  if (authRequired && !user) {
    next('/login');
  } else {
    next();
  }
});

const app = createApp(App)
app.use(router)
app.mount('#app')
