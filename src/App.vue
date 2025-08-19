<template>
  <div id="app" class="d-flex flex-column h-100">
    <MainNav :isAuthenticated="isAuthenticated" :user="user" @logout="handleLogout" class="flex-shrink-0" />
    <main
      :class="isSplitViewActive ? 'container-fluid mt-3 flex-grow-1 d-flex flex-column' : 'container mt-3 flex-grow-1'">
      <router-view @login="handleLogin" @logout="handleLogout"></router-view>
    </main>
    <BackToTop />
    <VersionNotification />
    <Notepad />
  </div>
</template>

<script>

import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import MainNav from './components/MainNav.vue'
import BackToTop from './components/BackToTop.vue'
import Notepad from './components/Notepad.vue'
// Choose one of these notification components:
import VersionNotification from './components/VersionNotification.vue'           // Simple: Auto-reload
// import EnhancedVersionNotification from './components/EnhancedVersionNotification.vue'  // Enhanced: User choice

export default {
  name: 'App',
  components: { MainNav, BackToTop, VersionNotification, Notepad },
  // If switching to enhanced, change to: components: { MainNav, BackToTop, EnhancedVersionNotification },
  setup() {
    const router = useRouter()
    const isAuthenticated = ref(false)
    const user = ref({})

    // Split view state management
    const isSplitViewActive = ref(false)

    const setSplitViewActive = (active) => {
      isSplitViewActive.value = active
    }

    // Provide the split view state and setter to child components
    provide('splitViewState', {
      isSplitViewActive,
      setSplitViewActive
    })

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
      handleLogout,
      isSplitViewActive
    }
  }
}
</script>

<style>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg,
        #e3ecfa 0%,
        #c7daf6 25%,
        #cfdcf4 50%,
        #c9d2ea 75%,
        #c5d1ef 100%);
    min-height: 100vh;
  
    /* Make the gradient fixed and cover the viewport */
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-size: cover;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
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

/* Utility class for full-height editors */
.full-height-editor {
  height: calc(100vh - 200px) !important;
  min-height: 400px !important;
  resize: vertical;
}
</style>
