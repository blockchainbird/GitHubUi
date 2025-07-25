<template>
  <div id="app">
    <MainNav />
    <nav class="navbar navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <i class="bi bi-github"></i>
          Spec-Up-T Editor
        </a>
        <div v-if="isAuthenticated" class="d-flex">
          <span class="navbar-text me-3">{{ user.login }}</span>
          <button @click="logout" class="btn btn-outline-light btn-sm">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    </nav>
    <main class="container-fluid mt-3">
      <router-view @login="handleLogin" @logout="handleLogout"></router-view>
    </main>
    <BackToTop />
  </div>
</template>

<script>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainNav from './components/MainNav.vue'
import BackToTop from './components/BackToTop.vue'

export default {
  name: 'App',
  components: { MainNav, BackToTop },
  setup() {
    const router = useRouter()
    const isAuthenticated = ref(false)
    const user = ref({})
    
    const handleLogin = (userData) => {
      isAuthenticated.value = true
      user.value = userData
      localStorage.setItem('github_token', userData.token)
      localStorage.setItem('github_user', JSON.stringify(userData))
    }
    
    const handleLogout = () => {
      isAuthenticated.value = false
      user.value = {}
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      router.push('/login')
    }
    
    const logout = () => {
      handleLogout()
    }
    
    onMounted(() => {
      // Check if user is already logged in
      const token = localStorage.getItem('github_token')
      const userData = localStorage.getItem('github_user')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          handleLogin({ ...parsedUser, token })
          if (router.currentRoute.value.path === '/login') {
            // Check if there's an intended redirect URL
            const intendedRedirect = localStorage.getItem('intended_redirect')
            if (intendedRedirect) {
              localStorage.removeItem('intended_redirect')
              router.push(intendedRedirect)
            } else {
              router.push('/home')
            }
          }
        } catch (error) {
          localStorage.removeItem('github_token')
          localStorage.removeItem('github_user')
        }
      }
    })
    
    return {
      isAuthenticated,
      user,
      handleLogin,
      handleLogout,
      logout
    }
  }
}
</script>

<style>
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.navbar-brand {
  font-weight: 600;
}

.btn {
  border-radius: 6px;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style>
