import { ref } from 'vue'
import { secureTokenManager } from '../utils/secureTokenManager.js'

export function useSpecsManager() {
  // State
  const loading = ref(true)
  const saving = ref(false)
  const error = ref('')
  const externalSpecs = ref([])
  const originalSpecsJson = ref(null)
  const hasChanges = ref(false)

  const newSpec = ref({
    external_spec: '',
    gh_page: '',
    url: '',
    terms_dir: 'spec/terms-definitions'
  })

  const resetNewSpec = () => {
    newSpec.value = {
      external_spec: '',
      gh_page: '',
      url: '',
      terms_dir: 'spec/terms-definitions'
    }
  }

  const markAsChanged = () => {
    hasChanges.value = true
  }

  const checkAuthAndRedirect = (error, router) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      router.push('/login')
      return true
    }
    return false
  }

  const createGitHubHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  })

  const createSpecsUrl = (owner, repo, branch) => 
    `https://api.github.com/repos/${owner}/${repo}/contents/specs.json?ref=${branch}`

  const loadSpecs = async (owner, repo, branch, router) => {
    try {
      loading.value = true
      error.value = ''

      const token = secureTokenManager.getToken()
      if (!token) {
        throw new Error('No GitHub token found')
      }

      const response = await fetch(createSpecsUrl(owner, repo, branch), {
        headers: createGitHubHeaders(token)
      })

      if (!response.ok) {
        throw new Error(`Failed to load specs.json: ${response.statusText}`)
      }

      const data = await response.json()
      const content = JSON.parse(atob(data.content))

      originalSpecsJson.value = {
        content: content,
        sha: data.sha
      }

      // Extract external_specs from the first spec
      if (content.specs?.[0]?.external_specs) {
        externalSpecs.value = [...content.specs[0].external_specs]
      } else {
        externalSpecs.value = []
      }

    } catch (err) {
      if (checkAuthAndRedirect(err, router)) {
        return
      }
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const refreshFileState = async (owner, repo, branch) => {
    const token = secureTokenManager.getToken()
    if (!token) {
      throw new Error('No GitHub token found')
    }

    const response = await fetch(createSpecsUrl(owner, repo, branch), {
      headers: createGitHubHeaders(token)
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh file state: ${response.statusText}`)
    }

    const data = await response.json()
    const content = JSON.parse(atob(data.content))

    originalSpecsJson.value = {
      content: content,
      sha: data.sha
    }
  }

  const addNewSpec = (newSpecData, externalSpecsList, checkForDuplicateId, validateNewSpec) => {
    const validation = validateNewSpec(newSpecData)
    
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(', ') }
    }

    if (checkForDuplicateId(externalSpecsList, newSpecData.external_spec)) {
      return { 
        success: false, 
        message: 'Specification ID already exists. Please choose a unique identifier.' 
      }
    }

    externalSpecsList.push({ ...newSpecData })
    resetNewSpec()
    markAsChanged()
    
    return { success: true }
  }

  const removeSpec = (index) => {
    externalSpecs.value.splice(index, 1)
    markAsChanged()
  }

  const createCommitData = (updatedContent, sha) => ({
    message: 'Update external specifications',
    content: btoa(JSON.stringify(updatedContent, null, 2)),
    sha
  })

  const saveSpecs = async (owner, repo, branch, router, validateAllSpecs, checkForDuplicates, retryCount = 0) => {
    const maxRetries = 2

    try {
      const validation = validateAllSpecs(externalSpecs.value)
      if (!validation.isValid) {
        return { 
          success: false, 
          message: 'Please fix validation errors before saving. All fields are required and URLs must be valid.' 
        }
      }

      const duplicateCheck = checkForDuplicates(externalSpecs.value)
      if (duplicateCheck.hasDuplicates) {
        return { 
          success: false, 
          message: `Duplicate specification IDs found: ${duplicateCheck.duplicates.join(', ')}. Please ensure all spec IDs are unique.` 
        }
      }

      saving.value = true
      error.value = ''

      const token = secureTokenManager.getToken()
      if (!token) {
        throw new Error('No GitHub token found')
      }

      if (retryCount > 0) {
        await refreshFileState(owner, repo, branch)
      }

      const updatedContent = { ...originalSpecsJson.value.content }
      if (updatedContent.specs?.[0]) {
        updatedContent.specs[0].external_specs = externalSpecs.value
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/specs.json`,
        {
          method: 'PUT',
          headers: {
            ...createGitHubHeaders(token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createCommitData(updatedContent, originalSpecsJson.value.sha))
        }
      )

      if (!response.ok) {
        if (response.status === 409 && retryCount < maxRetries) {
          return await saveSpecs(owner, repo, branch, router, validateAllSpecs, checkForDuplicates, retryCount + 1)
        }
        throw new Error(`Failed to save specs.json: ${response.statusText}`)
      }

      const result = await response.json()
      originalSpecsJson.value.sha = result.content.sha
      hasChanges.value = false

      const retryMessage = retryCount > 0 ? ` (resolved after ${retryCount} retry${retryCount === 1 ? '' : 'ies'})` : ''
      return { 
        success: true, 
        message: `External specifications saved successfully!${retryMessage}` 
      }

    } catch (err) {
      if (checkAuthAndRedirect(err, router)) {
        return { success: false, message: 'Authentication failed' }
      }
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      saving.value = false
    }
  }

  return {
    // State
    loading,
    saving,
    error,
    externalSpecs,
    hasChanges,
    newSpec,

    // Methods
    resetNewSpec,
    markAsChanged,
    checkAuthAndRedirect,
    loadSpecs,
    addNewSpec,
    removeSpec,
    saveSpecs
  }
}
