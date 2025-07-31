import { ref } from 'vue'

export function useBulkImport() {
  // State
  const bulkImportMode = ref('json')
  const jsonInput = ref('')
  const githubUrlInput = ref('')
  const jsonError = ref('')
  const urlError = ref('')
  const bulkImportLoading = ref(false)
  const bulkPreviewData = ref([])
  const jsonInputFocused = ref(false)
  const autoPreviewStatus = ref('')
  const autoPreviewTimeout = ref(null)

  const exampleJsonPlaceholder = '[\n  {\n    "external_spec": "toip1",\n    "gh_page": "https://example.github.io/spec/",\n    "url": "https://github.com/user/repo",\n    "terms_dir": "spec/terms-definitions"\n  }\n]'

  const resetBulkImport = () => {
    jsonInput.value = ''
    githubUrlInput.value = ''
    jsonError.value = ''
    urlError.value = ''
    bulkPreviewData.value = []
    autoPreviewStatus.value = ''
    clearAutoPreviewTimeout()
  }

  const clearAutoPreviewTimeout = () => {
    if (autoPreviewTimeout.value) {
      clearTimeout(autoPreviewTimeout.value)
      autoPreviewTimeout.value = null
    }
  }

  const clearErrorsAndStatus = () => {
    jsonError.value = ''
    urlError.value = ''
    autoPreviewStatus.value = ''
  }

  const setError = (mode, message) => {
    if (mode === 'json') {
      jsonError.value = message
    } else {
      urlError.value = message
    }
  }

  const onJsonInputChange = (previewCallback) => {
    clearAutoPreviewTimeout()
    clearErrorsAndStatus()

    if (!jsonInput.value.trim()) {
      bulkPreviewData.value = []
      return
    }

    autoPreviewTimeout.value = setTimeout(() => {
      autoPreviewStatus.value = 'Validating JSON...'
      previewCallback()
    }, 1000)
  }

  const parseJsonData = () => {
    if (!jsonInput.value.trim()) {
      setError('json', 'Please enter JSON data')
      return null
    }

    try {
      const specsData = JSON.parse(jsonInput.value)
      autoPreviewStatus.value = 'JSON parsed successfully'
      return specsData
    } catch {
      setError('json', 'Invalid JSON format')
      return null
    }
  }

  const convertGithubUrlToRaw = (url) => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname === 'github.com' && urlObj.pathname.includes('/blob/')) {
        return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
      }
      return url
    } catch {
      return url
    }
  }

  const fetchDataFromUrl = async (isValidUrl) => {
    if (!githubUrlInput.value.trim()) {
      setError('url', 'Please enter a GitHub URL')
      return null
    }

    if (!isValidUrl(githubUrlInput.value)) {
      setError('url', 'Please enter a valid URL')
      return null
    }

    const rawUrl = convertGithubUrlToRaw(githubUrlInput.value)

    try {
      const response = await fetch(rawUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      return await response.json()
    } catch (err) {
      setError('url', `Error fetching URL: ${err.message}`)
      return null
    }
  }

  const validateArrayData = (specsData) => {
    if (!Array.isArray(specsData)) {
      const errorMsg = 'Data must be an array of external specifications'
      setError(bulkImportMode.value, errorMsg)
      return false
    }
    return true
  }

  const createValidationChecks = (spec) => ({
    exists: !!spec,
    isObject: typeof spec === 'object',
    hasExternalSpec: !!spec.external_spec,
    hasGhPage: !!spec.gh_page,
    hasUrl: !!spec.url,
    hasTermsDir: !!spec.terms_dir
  })

  const categorizeSpecs = (specsData, validateExternalSpec) => {
    const validSpecs = []
    const invalidSpecs = []

    specsData.forEach((spec) => {
      if (validateExternalSpec(spec)) {
        validSpecs.push(spec)
      } else {
        invalidSpecs.push({ ...spec, _isInvalid: true })
      }
    })

    return { validSpecs, invalidSpecs }
  }

  const handleNoValidSpecs = (invalidSpecs) => {
    const errorMsg = 'No valid external specifications found. Please check your JSON format. Expected fields: external_spec, gh_page (valid URL), url (valid URL), terms_dir'
    setError(bulkImportMode.value, errorMsg)
    bulkPreviewData.value = invalidSpecs
  }

  const updateAutoPreviewStatus = (validSpecs) => {
    if (bulkImportMode.value === 'json' && validSpecs.length > 0) {
      const count = validSpecs.length
      autoPreviewStatus.value = `Found ${count} valid specification${count === 1 ? '' : 's'} ready to import`
    }
  }

  return {
    // State
    bulkImportMode,
    jsonInput,
    githubUrlInput,
    jsonError,
    urlError,
    bulkImportLoading,
    bulkPreviewData,
    jsonInputFocused,
    autoPreviewStatus,
    exampleJsonPlaceholder,

    // Methods
    resetBulkImport,
    clearAutoPreviewTimeout,
    clearErrorsAndStatus,
    setError,
    onJsonInputChange,
    parseJsonData,
    fetchDataFromUrl,
    validateArrayData,
    createValidationChecks,
    categorizeSpecs,
    handleNoValidSpecs,
    updateAutoPreviewStatus
  }
}
