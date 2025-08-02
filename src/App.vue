<template>
  <div>
    <MainNav :isAuthenticated="isAuthenticated" :user="user" @logout="handleLogout" />
    <main class="container-fluid mt-3">
      <router-view @login="handleLogin" @logout="handleLogout"></router-view>
    </main>
    <BackToTop />
    <VersionNotification />
  </div>
</template>

<script>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainNav from './components/MainNav.vue'
import BackToTop from './components/BackToTop.vue'
// Choose one of these notification components:
import VersionNotification from './components/VersionNotification.vue'           // Simple: Auto-reload
// import EnhancedVersionNotification from './components/EnhancedVersionNotification.vue'  // Enhanced: User choice

export default {
  name: 'App',
  components: { MainNav, BackToTop, VersionNotification },
  // If switching to enhanced, change to: components: { MainNav, BackToTop, EnhancedVersionNotification },
  setup() {
    const router = useRouter()
    const isAuthenticated = ref(false)
    const user = ref({})

    const handleLogin = (userData) => {
      console.log('App: handleLogin called with:', userData);
      isAuthenticated.value = true
      user.value = userData
      localStorage.setItem('github_token', userData.token)
      localStorage.setItem('github_user', JSON.stringify(userData))
      console.log('App: Authentication state after login:', {
        isAuthenticated: isAuthenticated.value,
        user: user.value
      });
    }

    const handleLogout = () => {
      console.log('App: handleLogout called');
      isAuthenticated.value = false
      user.value = {}
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      router.push('/login')
      console.log('App: Authentication state after logout:', {
        isAuthenticated: isAuthenticated.value,
        user: user.value
      });
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
      handleLogout
    }
  }
}
</script>

<style>
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg,
      #1e3c72 0%,
      #2a5298 25%,
      #3d6db0 50%,
      #4a7bc8 75%,
      #5b8ce0 100%);
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
