<template>
  <div id="app" class="d-flex flex-column h-100">
    <MainNav :isAuthenticated="isAuthenticated" :user="user" @logout="handleLogout"
      @toggle-file-explorer="toggleFileExplorer" class="flex-shrink-0" />
    <main
      :class="isSplitViewActive ? 'container-fluid mt-3 flex-grow-1 d-flex flex-column' : 'container mt-3 flex-grow-1'">
      <router-view @login="handleLogin" @logout="handleLogout"></router-view>
    </main>
    <BackToTop />
    <VersionNotification />
    <Notepad />

    <!-- Floating File Manager Button -->
    <button v-if="showRepoRelatedButtons && !isFileExplorerVisible" @click="toggleFileExplorer"
      class="floating-file-manager-btn btn btn-primary" title="Open File Explorer" aria-label="Open File Explorer">
      <i class="bi bi-folder2-open"></i>
    </button>

    <OffcanvasFileExplorer :visible="isFileExplorerVisible" @close="closeFileExplorer"
      @file-selected="onFileSelected" />
  </div>
</template>

<script>

import { ref, onMounted, provide, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainNav from './components/MainNav.vue'
import BackToTop from './components/BackToTop.vue'
import Notepad from './components/Notepad.vue'
import OffcanvasFileExplorer from './components/OffcanvasFileExplorer.vue'
import { secureTokenManager } from './utils/secureTokenManager.js'
// Choose one of these notification components:
import VersionNotification from './components/VersionNotification.vue'           // Simple: Auto-reload
// import EnhancedVersionNotification from './components/EnhancedVersionNotification.vue'  // Enhanced: User choice

export default {
  name: 'App',
  components: { MainNav, BackToTop, VersionNotification, Notepad, OffcanvasFileExplorer },
  // If switching to enhanced, change to: components: { MainNav, BackToTop, EnhancedVersionNotification },
  setup() {
    const router = useRouter()
    const route = useRoute()
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

    // Repository-related UI visibility
    const showRepoRelatedButtons = computed(() => {
      const { owner, repo, branch } = route.params
      return isAuthenticated.value && owner && repo && branch
    })

    // Dynamic tab title management
    const updatePageTitle = () => {
      const { owner, repo, branch, path } = route.params
      const routePath = route.path

      let title = 'Spec-Up-T Editor'

      if (routePath.includes('/editor/') && path) {
        // Decode the file path and get just the filename
        const pathArray = Array.isArray(path) ? path : [path]
        const fullPath = pathArray.join('/')
        const decodedPath = decodeURIComponent(fullPath)
        const fileName = decodedPath.split('/').pop()
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '') // Remove extension
        title = `${fileNameWithoutExt} - Spec-Up-T Editor`
      } else if (routePath.includes('/terms-preview/') && owner && repo) {
        title = `Terms Preview - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/spec/') && owner && repo) {
        title = `Spec View - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/files/') && owner && repo) {
        title = `Files - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/health-check/') && owner && repo) {
        title = `Health Check - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/actions/') && owner && repo) {
        title = `Actions - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/settings/') && owner && repo) {
        title = `Settings - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/external-specs/') && owner && repo) {
        title = `External Specs - ${repo} - Spec-Up-T Editor`
      } else if (routePath.includes('/admin/') && owner && repo) {
        title = `Admin - ${repo} - Spec-Up-T Editor`
      } else if (routePath === '/home') {
        title = `Home - Spec-Up-T Editor`
      } else if (routePath === '/login') {
        title = `Login - Spec-Up-T Editor`
      } else if (routePath === '/create-project') {
        title = `Create Project - Spec-Up-T Editor`
      } else if (owner && repo) {
        title = `${repo} - Spec-Up-T Editor`
      }

      document.title = title
    }

    // Watch route changes to update title
    watch(route, updatePageTitle, { immediate: true })

    const handleLogin = (userData) => {
      console.log('App: handleLogin called with:', userData);
      isAuthenticated.value = true
      user.value = userData
      
      // Use secure token manager instead of localStorage
      if (!secureTokenManager.storeToken(userData.token, userData)) {
        console.error('Failed to store token securely')
        // Fallback to show error to user
        alert('Warning: Failed to store authentication token securely. Please try logging in again.')
        return
      }
      
      console.log('App: Authentication state after login:', {
        isAuthenticated: isAuthenticated.value,
        user: user.value
      });
    }

    const handleLogout = () => {
      console.log('App: handleLogout called');
      isAuthenticated.value = false
      user.value = {}
      
      // Use secure token manager to clear tokens
      secureTokenManager.clearToken()
      
      // Also clear any remaining localStorage entries for migration cleanup
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      
      router.push('/login')
      console.log('App: Authentication state after logout:', {
        isAuthenticated: isAuthenticated.value,
        user: user.value
      });
    }


    onMounted(() => {
      // Try to migrate from old localStorage first
      secureTokenManager.migrateFromLocalStorage()
      
      // Check if user is already logged in using secure storage
      const token = secureTokenManager.getToken()
      const userData = secureTokenManager.getUserData()

      if (token && userData) {
        try {
          handleLogin({ ...userData, token })
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
          console.error('Failed to restore authentication from secure storage:', error)
          secureTokenManager.clearToken()
        }
      }
    })

    // File Explorer state management
    const isFileExplorerVisible = ref(false)

    const toggleFileExplorer = () => {
      isFileExplorerVisible.value = !isFileExplorerVisible.value
    }

    const closeFileExplorer = () => {
      isFileExplorerVisible.value = false
    }

    const onFileSelected = (fileInfo) => {
      // Generate the URL for the selected file
      const encodedPath = encodeURIComponent(fileInfo.file.path)
      const encodedDir = encodeURIComponent(fileInfo.directory)
      const fileUrl = `/editor/${fileInfo.owner}/${fileInfo.repo}/${fileInfo.branch}/${encodedPath}?dir=${encodedDir}`

      if (fileInfo.newTab) {
        // Open in new tab
        const url = router.resolve(fileUrl)
        window.open(url.href, '_blank')
      } else {
        // Navigate in current tab
        router.push(fileUrl)
      }
    }

    return {
      isAuthenticated,
      user,
      handleLogin,
      handleLogout,
      isSplitViewActive,
      showRepoRelatedButtons,
      isFileExplorerVisible,
      toggleFileExplorer,
      closeFileExplorer,
      onFileSelected
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

/* Floating File Manager Button */
.floating-file-manager-btn {
  position: fixed;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1040;
  /* Below modal backdrop (1050) but above most content */
  width: 48px;
  height: 148px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: none;
  transition: all 0.2s ease-in-out;
  padding-right: 0 !important;
}

.floating-file-manager-btn:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.floating-file-manager-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* Hide floating button on very small screens to avoid overlap */
@media (max-width: 576px) {
  .floating-file-manager-btn {
    display: none;
  }
}
</style>
