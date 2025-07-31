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
  const proxyInfo = ref('')
  
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

  // Load external specs and extract terms
  const loadExternalSpecs = async (externalSpecs) => {
    const externalTerms = []

    const basePath = import.meta.env.VITE_BASE_PATH || '/';
    let proxyPath;
    if (import.meta.env.VITE_PROXY_URL) {
      proxyPath = import.meta.env.VITE_PROXY_URL;
    } else {
      proxyPath = basePath.endsWith('/') ? basePath + 'proxy.php?url=' : basePath + '/proxy.php?url=';
    }

    const corsProxies = [
      proxyPath
      // Fallback proxies commented out for now - can be enabled if needed
      // ,
      // 'https://api.allorigins.win/raw?url=',
      // 'https://corsproxy.io/?',
      // 'https://api.codetabs.com/v1/proxy?quest=',
      // 'https://thingproxy.freeboard.io/fetch/'
    ]

    for (const spec of externalSpecs) {
      let success = false

      for (let proxyIndex = 0; proxyIndex < corsProxies.length && !success; proxyIndex++) {
        try {
          const proxyUrl = corsProxies[proxyIndex]
          const targetUrl = proxyUrl === 'https://thingproxy.freeboard.io/fetch/'
            ? spec.gh_page
            : encodeURIComponent(spec.gh_page)

          // Check if first proxy (our PHP proxy) is responsive
          if (proxyIndex === 0) {
            try {
              console.log(`🔄 Checking proxy status for ${spec.external_spec}...`)
              const statusResponse = await axios.get(`${proxyUrl.replace('?url=', '?status=1&url=')}${targetUrl}`, {
                timeout: 2000
              })
              if (statusResponse.data?.status === 'proxy_active') {
                console.log(`✅ Proxy is responsive for ${spec.external_spec}`)
              }
            } catch (statusErr) {
              console.warn(`⚠️ Proxy status check failed for ${spec.external_spec}, proceeding anyway`)
            }
          }

          console.log(`Loading external spec: ${spec.external_spec} from ${spec.gh_page} (proxy ${proxyIndex + 1}/${corsProxies.length})`)

          const response = await axios.get(`${proxyUrl}${targetUrl}`, {
            headers: {
              'Accept': 'text/html'
            },
            timeout: 15000 // Increased timeout to 15 seconds
          })

          // Parse the HTML to extract terms from the dl.terms-and-definitions-list
          const parser = new DOMParser()
          const doc = parser.parseFromString(response.data, 'text/html')
          const termsList = doc.querySelector('dl.terms-and-definitions-list')

          if (termsList) {
            const dtElements = termsList.querySelectorAll('dt')

            dtElements.forEach(dt => {
              const termId = dt.textContent?.trim()
              if (termId) {
                // Collect all dd elements that follow this dt until the next dt
                const ddElements = []
                let nextElement = dt.nextElementSibling

                while (nextElement && nextElement.tagName.toLowerCase() === 'dd') {
                  ddElements.push(nextElement.outerHTML)
                  nextElement = nextElement.nextElementSibling
                }

                if (ddElements.length > 0) {
                  const definitionHtml = `<dl>${ddElements.join('')}</dl>`
                  const definitionText = ddElements
                    .map(dd => {
                      const tempDiv = document.createElement('div')
                      tempDiv.innerHTML = dd
                      return tempDiv.textContent || tempDiv.innerText || ''
                    })
                    .join(' ')
                    .trim()

                  externalTerms.push({
                    id: termId,
                    aliases: [],
                    file: spec.gh_page,
                    definition: definitionHtml,
                    definitionText: definitionText,
                    external: true,
                    externalSpec: spec.external_spec,
                    source: `External: ${spec.external_spec}`
                  })
                }
              }
            })

            console.log(`✅ Successfully loaded ${dtElements.length} terms from ${spec.external_spec} using proxy ${proxyIndex + 1}`)
            success = true
          } else {
            console.warn(`No terms-and-definitions-list found in ${spec.gh_page} using proxy ${proxyIndex + 1}`)
            // Try next proxy even if HTML was fetched but no terms found
          }
        } catch (err) {
          console.warn(`❌ Proxy ${proxyIndex + 1} failed for ${spec.external_spec}:`, err.message)

          // If this is the last proxy, log final failure
          if (proxyIndex === corsProxies.length - 1) {
            console.error(`🔴 All proxies failed for external spec ${spec.external_spec}. Skipping.`)
          }
        }
      }

      if (!success) {
        console.error(`🔴 Unable to load external spec ${spec.external_spec} from ${spec.gh_page} - all proxy methods failed`)
      }
    }

    return externalTerms
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

      // Load external specs if they exist
      if (config.external_specs && Array.isArray(config.external_specs)) {
        proxyInfo.value = 'Loading external specifications...'
        const externalTerms = await loadExternalSpecs(config.external_specs)
        termsData.push(...externalTerms)
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
    proxyInfo,
    
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
