/**
 * Composable for content validation
 * Handles validation rules for terms files
 */

import { ref } from 'vue'

export function useContentValidation(props) {
  // Validation state
  const validationWarnings = ref([])
  const showValidationWarnings = ref(false)

  // Check if file is in terms directory
  const checkIfInTermsDirectory = async (specsConfig) => {
    try {
      if (!specsConfig || !specsConfig.specs || specsConfig.specs.length === 0) {
        return false
      }

      const config = specsConfig.specs[0]
      const specDir = config.spec_directory?.replace('./', '') || 'spec'
      const termsDir = config.spec_terms_directory || 'terms-definitions'
      const fullTermsPath = `${specDir}/${termsDir}`

      const normalizedTermsPath = fullTermsPath.replace(/^\/+|\/+$/g, '')
      const normalizedFilePath = (props.path ? decodeURIComponent(props.path) : '').replace(/^\/+|\/+$/g, '')

      return normalizedFilePath.startsWith(normalizedTermsPath + '/') || 
             normalizedFilePath === normalizedTermsPath
    } catch (err) {
      console.error('Error checking if file is in terms directory:', err)
      return false
    }
  }

  // Validate content according to rules
  const validateContent = async (content, filename, specsConfig) => {
    const warnings = []
    
    if (!content.trim()) {
      showValidationWarnings.value = false
      validationWarnings.value = []
      return
    }

    const isInTermsDirectory = await checkIfInTermsDirectory(specsConfig)
    
    const isLikelyTermsFile = filename.toLowerCase().includes('term') || 
                             content.includes('[[def:') || 
                             content.includes('[[tref:')
    
    if (!isInTermsDirectory && !isLikelyTermsFile) {
      showValidationWarnings.value = false
      validationWarnings.value = []
      return
    }

    const lines = content.split('\n')
    const firstLine = lines[0]?.trim() || ''
    
    // Rule 1: First line must start with [[def: or [[tref:
    if (firstLine && !firstLine.startsWith('[[def:') && !firstLine.startsWith('[[tref:')) {
      warnings.push('First line must start with [[def: or [[tref:')
    }
    
    // Rule 2: [[def: and [[tref: can only exist on the first line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim() || ''
      if (line.includes('[[def:') || line.includes('[[tref:')) {
        warnings.push('[[def: and [[tref: can only exist on the first line')
        break
      }
    }
    
    // Rule 3: [[ref: and [[xref: cannot exist on the first line
    if (firstLine && (firstLine.includes('[[ref:') || firstLine.includes('[[xref:'))) {
      warnings.push('[[ref: and [[xref: cannot exist on the first line')
    }
    
    // Rule 4: Every line after the first line must start with ~
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === '') continue
      
      if (!line.startsWith('~')) {
        warnings.push(`Line ${i + 1} must start with ~ (Found: "${line.substring(0, 20)}...")`)
        break
      }
    }
    
    validationWarnings.value = warnings
    showValidationWarnings.value = warnings.length > 0
  }

  return {
    // State
    validationWarnings,
    showValidationWarnings,
    
    // Methods
    validateContent
  }
}
