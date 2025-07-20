import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue'
import FileExplorer from './components/FileExplorer.vue'
import FileEditor from './components/FileEditor.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/home', component: HomePage },
  { path: '/files/:owner/:repo/:branch', component: FileExplorer, props: true },
  { path: '/editor/:owner/:repo/:path+', component: FileEditor, props: true }
]

const basePath = import.meta.env.VITE_BASE_PATH || '/';
const router = createRouter({
  history: createWebHistory(basePath),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
