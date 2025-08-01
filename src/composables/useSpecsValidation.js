import { ref } from 'vue'

export function useSpecsValidation() {
  const isValidUrl = (url) => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateExternalSpec = (spec) => {
    return spec &&
      typeof spec === 'object' &&
      spec.external_spec &&
      spec.gh_page &&
      spec.url &&
      spec.terms_dir &&
      isValidUrl(spec.gh_page) &&
      isValidUrl(spec.url)
  }

  const validateNewSpec = (newSpec) => {
    const errors = []

    if (!newSpec.external_spec?.trim()) {
      errors.push('Specification ID is required')
    }

    if (!newSpec.gh_page?.trim()) {
      errors.push('GitHub Page URL is required')
    } else if (!isValidUrl(newSpec.gh_page)) {
      errors.push('GitHub Page URL must be valid')
    }

    if (!newSpec.url?.trim()) {
      errors.push('Repository URL is required')
    } else if (!isValidUrl(newSpec.url)) {
      errors.push('Repository URL must be valid')
    }

    if (!newSpec.terms_dir?.trim()) {
      errors.push('Terms directory is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateAllSpecs = (externalSpecs) => {
    const invalidSpecs = externalSpecs.filter(spec =>
      !spec.external_spec || 
      !spec.gh_page || 
      !spec.url || 
      !spec.terms_dir ||
      !isValidUrl(spec.gh_page) || 
      !isValidUrl(spec.url)
    )

    return {
      isValid: invalidSpecs.length === 0,
      invalidCount: invalidSpecs.length
    }
  }

  const checkForDuplicates = (externalSpecs, newSpecs = []) => {
    const allSpecs = [...externalSpecs, ...newSpecs]
    const specIds = allSpecs.map(spec => spec.external_spec)
    const duplicates = specIds.filter((id, index) => specIds.indexOf(id) !== index)
    
    return {
      hasDuplicates: duplicates.length > 0,
      duplicates: [...new Set(duplicates)]
    }
  }

  const checkForDuplicateId = (externalSpecs, specId) => {
    return externalSpecs.some(spec => spec.external_spec === specId)
  }

  const markSpecsWithDuplicates = (specs, existingSpecs) => {
    const existingIds = existingSpecs.map(spec => spec.external_spec)
    return specs.map(spec => ({
      ...spec,
      _isDuplicate: existingIds.includes(spec.external_spec)
    }))
  }

  return {
    isValidUrl,
    validateExternalSpec,
    validateNewSpec,
    validateAllSpecs,
    checkForDuplicates,
    checkForDuplicateId,
    markSpecsWithDuplicates
  }
}
