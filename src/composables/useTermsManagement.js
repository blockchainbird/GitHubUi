/**
 * Composable for managing terms functionality
 * Handles loading terms from repository and external sources
 */

import { ref, computed } from 'vue'
import axios from 'axios'

export function useTermsManagement(props, checkAuthAndRedirect) {
  // Terms state
  const terms = ref([])
  const filteredTerms = ref([])
  const termFilter = ref('')
  const loadingTerms = ref(false)
  const termsError = ref('')
  const specsConfig = ref(null)
  const referenceType = ref('auto')
  
  // Definition collapse state
  const definitionsCollapsed = ref(true)
  const individualTermsExpanded = ref(new Map())

  // Filter terms based on search input
  const filterTerms = () => {
    const filter = termFilter.value.toLowerCase()
    if (!filter) {
      filteredTerms.value = terms.value
    } else {
      filteredTerms.value = terms.value.filter(term => {
        const basicMatch = term.id.toLowerCase().includes(filter) ||
          term.aliases.some(alias => alias.toLowerCase().includes(filter)) ||
          (term.external && term.externalSpec.toLowerCase().includes(filter))
        
        const definitionMatch = term.definitionText && 
          term.definitionText.toLowerCase().includes(filter) && 
          isTermDefinitionVisible(term)
        
        return basicMatch || definitionMatch
      })
    }
  }

  // Check if term definition should be visible
  const isTermDefinitionVisible = (term) => {
    if (definitionsCollapsed.value) {
      const termKey = term.id + (term.external ? '_' + term.externalSpec : '')
      return individualTermsExpanded.value.get(termKey) || false
    }
    return true
  }

  // Toggle global definitions collapse state
  const toggleDefinitionsCollapse = () => {
    definitionsCollapsed.value = !definitionsCollapsed.value
    
    if (!definitionsCollapsed.value) {
      individualTermsExpanded.value.clear()
    }
    
    filterTerms()
  }

  // Toggle individual term expansion
  const toggleIndividualTerm = (term) => {
    const termKey = term.id + (term.external ? '_' + term.externalSpec : '')
    const currentState = individualTermsExpanded.value.get(termKey) || false
    individualTermsExpanded.value.set(termKey, !currentState)
  }

  // Load specs configuration
  const loadSpecsConfig = async () => {
    try {
      const token = localStorage.getItem('github_token')
      const config = {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }

      const response = await axios.get(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`,
        config
      )

      const content = JSON.parse(atob(response.data.content))
      specsConfig.value = content
      return content
    } catch (err) {
      console.error('Error loading specs config:', err)
      if (checkAuthAndRedirect(err)) {
        return null
      }
      return {
        specs: [{
          spec_directory: './spec',
          spec_terms_directory: 'terms-definitions'
        }]
      }
    }
  }

  // Load terms from storage cache
  const loadTermsFromStorage = () => {
    const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Date.now() - parsed.timestamp < 3600000) { // 1 hour cache
          terms.value = parsed.terms || []
          filteredTerms.value = parsed.terms || []
          return true
        }
      } catch (err) {
        console.error('Error parsing stored terms:', err)
      }
    }
    return false
  }

  // Save terms to storage cache
  const saveTermsToStorage = (termsData) => {
    const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
    const data = {
      terms: termsData,
      timestamp: Date.now()
    }
    localStorage.setItem(storageKey, JSON.stringify(data))
  }

  // Extract terms from a single file
  const extractTermsFromFile = async (filePath) => {
    try {
      const token = localStorage.getItem('github_token')
      const config = {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }

      const response = await axios.get(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${filePath}?ref=${props.branch}`,
        config
      )

      const content = atob(response.data.content)
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          const termMatch = line.match(/^\[\[def:\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/)
          if (termMatch) {
            const termId = termMatch[1].trim()
            const aliasesStr = termMatch[2]
            const aliases = aliasesStr ? 
              aliasesStr.split(',').map(a => a.trim()).filter(a => a.length > 0) : []

            const definitionLines = []
            for (let j = i + 1; j < lines.length; j++) {
              const defLine = lines[j]
              if (defLine.startsWith('~ ') || defLine.startsWith('~')) {
                definitionLines.push(defLine.replace(/^~\s?/, ''))
              }
            }

            const definitionHtml = definitionLines.length > 0 ?
              `<dl><dd>${definitionLines.join('</dd><dd>')}</dd></dl>` : ''

            if (termId) {
              return {
                id: termId,
                aliases: aliases,
                file: filePath,
                definition: definitionHtml,
                definitionText: definitionLines.join(' ').trim(),
                external: false,
                source: `Local: ${filePath}`
              }
            }
          }
          break
        }
      }
    } catch (err) {
      console.error(`Error loading file ${filePath}:`, err)
      if (checkAuthAndRedirect(err)) {
        return null
      }
    }
    return null
  }

  // Load terms from repository
  const loadTermsFromRepository = async () => {
    loadingTerms.value = true
    termsError.value = ''

    try {
      if (!specsConfig.value) {
        specsConfig.value = await loadSpecsConfig()
      }

      const config = specsConfig.value.specs[0]
      const specDir = config.spec_directory.replace('./', '')
      const termsDir = config.spec_terms_directory
      const fullTermsPath = `${specDir}/${termsDir}`

      const token = localStorage.getItem('github_token')
      const requestConfig = {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }

      const response = await axios.get(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fullTermsPath}?ref=${props.branch}`,
        requestConfig
      )

      const files = response.data.filter(item =>
        item.type === 'file' &&
        (item.name.toLowerCase().endsWith('.md') ||
          item.name.toLowerCase().endsWith('.txt') ||
          item.name.toLowerCase().endsWith('.rst') ||
          item.name.toLowerCase().endsWith('.adoc'))
      )

      const termsData = []
      const batchSize = 5

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        const promises = batch.map(file => extractTermsFromFile(file.path))
        const results = await Promise.all(promises)
        results.forEach(term => {
          if (term) {
            termsData.push(term)
          }
        })
      }

      termsData.sort((a, b) => a.id.localeCompare(b.id))
      terms.value = termsData
      filteredTerms.value = termsData

      saveTermsToStorage(termsData)

    } catch (err) {
      console.error('Error loading terms:', err)
      if (checkAuthAndRedirect(err)) {
        return
      }
      if (err.response?.status === 404) {
        termsError.value = 'Terms directory not found in repository.'
      } else {
        termsError.value = 'Failed to load terms from repository.'
      }
    } finally {
      loadingTerms.value = false
    }
  }

  // Show terms modal
  const showTermsModal = async () => {
    loadingTerms.value = true
    termsError.value = ''
    termFilter.value = ''
    filteredTerms.value = []
    
    const modal = new bootstrap.Modal(document.getElementById('termsModal'))
    modal.show()

    if (!loadTermsFromStorage()) {
      await loadTermsFromRepository()
    } else {
      loadingTerms.value = false
    }
    filteredTerms.value = terms.value
  }

  // Refresh terms (clear cache and reload)
  const refreshTerms = async () => {
    const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
    localStorage.removeItem(storageKey)
    await loadTermsFromRepository()
    filterTerms()
  }

  return {
    // State
    terms,
    filteredTerms,
    termFilter,
    loadingTerms,
    termsError,
    referenceType,
    definitionsCollapsed,
    individualTermsExpanded,
    specsConfig,
    
    // Methods
    filterTerms,
    isTermDefinitionVisible,
    toggleDefinitionsCollapse,
    toggleIndividualTerm,
    showTermsModal,
    refreshTerms,
    loadTermsFromRepository
  }
}
