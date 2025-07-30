/**
 * Composable for managing file content operations
 * Handles loading, saving, and content validation
 */

import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

export function useFileContent(props) {
  const router = useRouter()
  const route = useRoute()
  
  // Content state
  const loading = ref(true)
  const saving = ref(false)
  const error = ref('')
  const success = ref('')
  const content = ref('')
  const originalContent = ref('')
  const fileSha = ref('')
  const commitMessage = ref('')
  
  // New file state
  const isNewFile = ref(false)

  // Computed properties
  const filename = computed(() => {
    return props.path ? decodeURIComponent(props.path).split('/').pop() : ''
  })

  const decodedPath = computed(() => {
    return props.path ? decodeURIComponent(props.path) : ''
  })

  const isDraft = computed(() => {
    return filename.value.startsWith('_')
  })

  const isMarkdown = computed(() => {
    return filename.value.toLowerCase().endsWith('.md')
  })

  const hasChanges = computed(() => {
    if (isNewFile.value) {
      return content.value.trim().length > 0
    }
    return content.value !== originalContent.value
  })

  // Helper function for auth checking
  const checkAuthAndRedirect = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      router.push('/login')
      return true
    }
    return false
  }

  // Load file content from GitHub
  const loadFileContent = async () => {
    try {
      if (route.query.new === 'true') {
        isNewFile.value = true
        loading.value = false
        return
      }

      const token = localStorage.getItem('github_token')
      const config = {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }

      const response = await axios.get(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}?ref=${props.branch}`,
        config
      )

      fileSha.value = response.data.sha
      content.value = atob(response.data.content)
      originalContent.value = content.value

    } catch (err) {
      console.error('Error loading file:', err)
      if (checkAuthAndRedirect(err)) {
        return
      }
      error.value = 'Failed to load file content.'
    } finally {
      loading.value = false
    }
  }

  // Save file content to GitHub
  const saveFile = async () => {
    if (!commitMessage.value.trim()) {
      error.value = 'Please enter a commit message.'
      return
    }

    saving.value = true
    error.value = ''
    success.value = ''

    try {
      const token = localStorage.getItem('github_token')
      const config = {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }

      const data = {
        message: commitMessage.value,
        content: btoa(content.value),
        branch: props.branch
      }

      if (!isNewFile.value && fileSha.value) {
        data.sha = fileSha.value
      }

      const response = await axios.put(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}`,
        data,
        config
      )

      fileSha.value = response.data.content.sha
      originalContent.value = content.value
      
      if (isNewFile.value) {
        success.value = 'File created and committed successfully!'
        isNewFile.value = false
        
        const fileName = decodedPath.value.split('/').pop()
        localStorage.setItem('recentlyCreatedFile', fileName)

        const newRoute = `/editor/${props.owner}/${props.repo}/${props.branch}/${encodeURIComponent(decodedPath.value)}`
        const queryParams = new URLSearchParams()
        if (route.query.dir) {
          queryParams.set('dir', route.query.dir)
        }
        const finalRoute = queryParams.toString() ? `${newRoute}?${queryParams.toString()}` : newRoute
        await router.replace(finalRoute)
      } else {
        success.value = 'File saved and committed successfully!'
      }

    } catch (err) {
      console.error('Error saving file:', err)
      if (checkAuthAndRedirect(err)) {
        return
      }
      if (err.response?.status === 422 && isNewFile.value) {
        error.value = 'A file with this name already exists. Please choose a different name.'
      } else {
        error.value = 'Failed to save file. Please try again.'
      }
    } finally {
      saving.value = false
    }
  }

  return {
    // State
    loading,
    saving,
    error,
    success,
    content,
    originalContent,
    fileSha,
    commitMessage,
    isNewFile,
    
    // Computed
    filename,
    decodedPath,
    isDraft,
    isMarkdown,
    hasChanges,
    
    // Methods
    loadFileContent,
    saveFile,
    checkAuthAndRedirect
  }
}
