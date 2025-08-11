/**
 * Composable for content validation
 * Handles validation rules for terms files
 */

import { ref } from 'vue'
import { isInTermsDirectory } from '../utils/termsFileDetection.js'
import { useSoundSystem } from './useSoundSystem.js'

export function useContentValidation(props) {
  // Validation state
  const validationWarnings = ref([])
  const showValidationWarnings = ref(false)

  // Sound system
  const { playErrorSound } = useSoundSystem()

  // Validate content according to rules
  const validateContent = async (content, filename, specsConfig) => {
    const warnings = []

    if (!content.trim()) {
      showValidationWarnings.value = false
      validationWarnings.value = []
      return
    }

    // Single check: is file in terms directory?
    const isTermsFile = specsConfig
      ? isInTermsDirectory(props.path, specsConfig)
      : false

    if (!isTermsFile) {
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

    // Play error sound if there are validation warnings
    if (warnings.length > 0) {
      playErrorSound()
    }
  }

  return {
    // State
    validationWarnings,
    showValidationWarnings,

    // Methods
    validateContent
  }
}
