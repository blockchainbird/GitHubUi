import { ref } from 'vue'

export function useReferenceSets() {
  // State
  const referenceSets = ref([])
  const referenceSetsLoading = ref(false)
  const referenceSetsError = ref('')
  const selectedReferenceSet = ref(null)
  const showReferenceSetPreview = ref(false)

  const resetReferenceSetSelection = () => {
    selectedReferenceSet.value = null
    showReferenceSetPreview.value = false
    referenceSetsError.value = ''
  }

  const selectReferenceSet = (set) => {
    selectedReferenceSet.value = set
    showReferenceSetPreview.value = true
  }

  const loadReferenceSets = async () => {
    try {
      referenceSetsLoading.value = true
      referenceSetsError.value = ''

      const response = await fetch(
        'https://api.github.com/repos/blockchainbird/spec-up-gs/contents/external-reference-sets'
      )

      if (!response.ok) {
        throw new Error(`Failed to load reference sets: ${response.statusText}`)
      }

      const files = await response.json()
      const jsonFiles = files.filter(file => file.name.endsWith('.json'))

      const sets = await loadReferenceSetData(jsonFiles)
      referenceSets.value = sets.filter(set => set !== null)

    } catch (err) {
      referenceSetsError.value = err.message
    } finally {
      referenceSetsLoading.value = false
    }
  }

  const loadReferenceSetData = async (jsonFiles) => {
    const setsPromises = jsonFiles.map(async (file) => {
      try {
        const setResponse = await fetch(file.download_url)
        if (!setResponse.ok) {
          throw new Error(`Failed to load ${file.name}`)
        }
        const setData = await setResponse.json()
        return {
          ...setData,
          filename: file.name,
          downloadUrl: file.download_url
        }
      } catch {
        return null
      }
    })

    return await Promise.all(setsPromises)
  }

  const validateReferenceSetImport = (selectedSet, externalSpecs, validateExternalSpec) => {
    if (!selectedSet) return { valid: false }

    const setReferences = selectedSet.references || []
    const validSpecs = setReferences.filter(spec => validateExternalSpec(spec))

    if (validSpecs.length === 0) {
      return { 
        valid: false, 
        message: 'No valid specifications found in the selected reference set.' 
      }
    }

    const duplicates = validSpecs.filter(spec =>
      externalSpecs.some(existing => existing.external_spec === spec.external_spec)
    )

    return { valid: true, validSpecs, duplicates }
  }

  const createImportMessage = (importedCount, skippedCount, setTitle) => {
    let message = `Successfully imported ${importedCount} specification${importedCount === 1 ? '' : 's'} from ${setTitle}!`

    if (skippedCount > 0) {
      message += ` (${skippedCount} duplicate${skippedCount === 1 ? '' : 's'} skipped)`
    }

    return message
  }

  return {
    // State
    referenceSets,
    referenceSetsLoading,
    referenceSetsError,
    selectedReferenceSet,
    showReferenceSetPreview,

    // Methods
    resetReferenceSetSelection,
    selectReferenceSet,
    loadReferenceSets,
    validateReferenceSetImport,
    createImportMessage
  }
}
