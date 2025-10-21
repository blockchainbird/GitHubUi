/**
 * Composable for managing terms functionality
 * Handles loading terms from repository and external sources
 */

import { ref, computed } from 'vue'
import axios from 'axios'
import { consoleMessages } from '../utils/loadingMessages.js'
import { getGitHubHeaders, addCacheBusting } from '../utils/apiUtils.js'
import { secureTokenManager } from '../utils/secureTokenManager.js'

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

  // Refresh feedback state
  const refreshFeedback = ref('')
  const isRefreshing = ref(false)

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
      const token = secureTokenManager.getToken()
      const config = {
        headers: getGitHubHeaders(token)
      }

      const url = addCacheBusting(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`
      )
      const response = await axios.get(url, config)

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
        console.error(consoleMessages.errorParsingStoredTerms(err.message))
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
      const token = secureTokenManager.getToken()
      const config = {
        headers: getGitHubHeaders(token)
      }

      const url = addCacheBusting(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${filePath}?ref=${props.branch}`
      )
      const response = await axios.get(url, config)

      const content = atob(response.data.content)
      const extractedTerms = parseTermsFromContent(content, filePath)

      if (extractedTerms && extractedTerms.length > 0) {
        console.log(consoleMessages.extractedTerms(extractedTerms.length, filePath))
      }

      return extractedTerms && extractedTerms.length > 0 ? extractedTerms : null
    } catch (err) {
      console.error(consoleMessages.errorLoadingFile(filePath, err.message))
      if (checkAuthAndRedirect(err)) {
        return null
      }
    }
    return null
  }

  // Parse terms from raw file content (helper so we can reuse when only a single file is needed)
  const parseTermsFromContent = (content, filePath) => {
    const lines = content.split('\n')
    const extractedTerms = []

    console.log(consoleMessages.scanningFile(filePath))

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
            } else if (defLine.trim() && !defLine.startsWith('[[def:')) {
              // Continue reading definition lines until we hit another term or empty line
              break
            }
          }

          const definitionHtml = definitionLines.length > 0 ?
            `<dl><dd>${definitionLines.join('</dd><dd>')}</dd></dl>` : ''

          if (termId) {
            console.log(consoleMessages.foundTerm(termId, filePath))
            extractedTerms.push({
              id: termId,
              aliases: aliases,
              file: filePath,
              definition: definitionHtml,
              definitionText: definitionLines.join(' ').trim(),
              external: false,
              source: `Local: ${filePath}`
            })
          }
        }
      }
    }

    return extractedTerms.length > 0 ? extractedTerms : null
  }

  // Load external specs and extract terms
  const loadExternalSpecs = async (externalSpecs) => {
    const externalTerms = []
    let processedSpecs = 0

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
      processedSpecs++
      proxyInfo.value = `Loading external spec ${processedSpecs}/${externalSpecs.length}: ${spec.external_spec}...`

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
              console.log(consoleMessages.checkingProxy(spec.external_spec))
              proxyInfo.value = `Checking proxy connectivity for ${spec.external_spec}...`
              const statusResponse = await axios.get(`${proxyUrl.replace('?url=', '?status=1&url=')}${targetUrl}`, {
                timeout: 2000
              })
              if (statusResponse.data?.status === 'proxy_active') {
                console.log(consoleMessages.proxyResponsive(spec.external_spec))
              }
            } catch (statusErr) {
              console.warn(consoleMessages.proxyCheckFailed(spec.external_spec))
            }
          }

          console.log(consoleMessages.loadingExternalSpec(spec.external_spec, spec.gh_page, proxyIndex + 1, corsProxies.length))
          proxyInfo.value = `Fetching ${spec.external_spec} (attempt ${proxyIndex + 1}/${corsProxies.length})...`

          const response = await axios.get(`${proxyUrl}${targetUrl}`, {
            headers: {
              'Accept': 'text/html'
            },
            timeout: 15000 // Increased timeout to 15 seconds
          })

          proxyInfo.value = `Processing terms from ${spec.external_spec}...`

          // Parse the HTML to extract terms from the dl.terms-and-definitions-list
          const parser = new DOMParser()
          const doc = parser.parseFromString(response.data, 'text/html')
          const termsList = doc.querySelector('dl.terms-and-definitions-list')

          if (termsList) {
            const dtElements = termsList.querySelectorAll('dt')

            dtElements.forEach(dt => {
              // Follow spec-up-t's fetch-terms-from-index.js logic exactly
              // This requires span.term-local-original-term to exist (no backward compatibility)
              
              // First check if there's any term span
              const termSpan = dt.querySelector('span[id^="term:"]')
              if (!termSpan) {
                return
              }

              // Extract the canonical term identifier from the term-local-original-term span
              // This contains the original term identifier as used in tref/xref references
              // If this span doesn't exist, skip the term entirely (no backward compatibility)
              const originalTermSpan = dt.querySelector('span.term-local-original-term')
              if (!originalTermSpan) {
                return
              }

              const termId = originalTermSpan.textContent?.trim()
              if (!termId) {
                return
              }

              // Extract classes from the <dt> element to determine if it's a local or external term
              const dtClasses = dt.className ? dt.className.split(/\s+/).filter(Boolean) : []
              const termClasses = dtClasses.filter(cls => cls === 'term-local' || cls === 'term-external')

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
                  source: `External: ${spec.external_spec}`,
                  classes: termClasses
                })
              }
            })

            console.log(consoleMessages.loadedExternalTerms(dtElements.length, spec.external_spec, proxyIndex + 1))
            proxyInfo.value = `Successfully loaded ${dtElements.length} terms from ${spec.external_spec}`
            success = true
          } else {
            console.warn(consoleMessages.noTermsFound(spec.gh_page, proxyIndex + 1))
            proxyInfo.value = `No terms found in ${spec.external_spec}, trying alternative method...`
            // Try next proxy even if HTML was fetched but no terms found
          }
        } catch (err) {
          console.warn(consoleMessages.proxyFailed(proxyIndex + 1, spec.external_spec, err.message))
          proxyInfo.value = `Connection failed for ${spec.external_spec} (attempt ${proxyIndex + 1}), retrying...`

          // If this is the last proxy, log final failure
          if (proxyIndex === corsProxies.length - 1) {
            console.error(consoleMessages.allProxiesFailed(spec.external_spec))
            proxyInfo.value = `Failed to load ${spec.external_spec} - all connection attempts failed`
          }
        }
      }

      if (!success) {
        console.error(consoleMessages.unableToLoad(spec.external_spec, spec.gh_page))
      }

      // Brief pause between specs to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (externalTerms.length > 0) {
      proxyInfo.value = `Successfully loaded ${externalTerms.length} external terms from ${processedSpecs} spec(s)`
    } else {
      proxyInfo.value = `Completed external spec processing - no terms found`
    }

    return externalTerms
  }

  // Load cached terms (external terms from localStorage) without fetching local repository terms
  const loadCachedTermsOnly = () => {
    const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Date.now() - parsed.timestamp < 3600000) { // 1 hour cache
          // Only load external terms from cache to avoid overwriting local file terms
          const externalTerms = (parsed.terms || []).filter(term => term.external)
          if (externalTerms.length > 0) {
            terms.value = externalTerms
            filteredTerms.value = externalTerms
            console.log(`Loaded ${externalTerms.length} external terms from cache`)
            return true
          }
        }
      } catch (err) {
        console.error(consoleMessages.errorParsingStoredTerms(err.message))
      }
    }
    return false
  }

  // Load terms for a single file only (does not enumerate repository terms)
  // This is useful when opening a single file in the editor to avoid fetching the entire terms directory
  const loadTermsForFile = async (filePath, fileContent = null) => {
    loadingTerms.value = true
    termsError.value = ''
    try {
      let localTerms = []
      let extracted = null

      if (fileContent) {
        extracted = parseTermsFromContent(fileContent, filePath)
      } else {
        extracted = await extractTermsFromFile(filePath)
      }

      if (extracted && Array.isArray(extracted)) {
        localTerms = extracted
      }

      // Load external terms from cache and combine with local file terms
      const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
      const stored = localStorage.getItem(storageKey)
      let externalTerms = []

      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Date.now() - parsed.timestamp < 3600000) { // 1 hour cache
            externalTerms = (parsed.terms || []).filter(term => term.external)
          }
        } catch (err) {
          console.error('Error loading external terms from cache:', err)
        }
      }

      // Combine local file terms with cached external terms
      const allTerms = [...localTerms, ...externalTerms]
      terms.value = allTerms
      filteredTerms.value = allTerms

      // Update cache with the combined terms (preserve external terms)
      if (allTerms.length > 0) {
        saveTermsToStorage(allTerms)
      }

      return terms.value
    } catch (err) {
      console.error(consoleMessages.errorLoadingTerms(err.message))
      termsError.value = 'Failed to load terms for file.'
      return null
    } finally {
      loadingTerms.value = false
    }
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

      const token = secureTokenManager.getToken()
      const requestConfig = {
        headers: getGitHubHeaders(token)
      }

      const termsData = []

      // Load terms from the traditional terms directory
      try {
        proxyInfo.value = 'Loading local terms from repository...'
        const url = addCacheBusting(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fullTermsPath}?ref=${props.branch}`
        )
        const response = await axios.get(url, requestConfig)

        const files = response.data.filter(item =>
          item.type === 'file' &&
          (item.name.toLowerCase().endsWith('.md') ||
            item.name.toLowerCase().endsWith('.txt') ||
            item.name.toLowerCase().endsWith('.rst') ||
            item.name.toLowerCase().endsWith('.adoc'))
        )

        if (files.length > 0) {
          proxyInfo.value = `Reading ${files.length} term definition files...`
        }

        const batchSize = 5
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize)
          const promises = batch.map(file => extractTermsFromFile(file.path))
          const results = await Promise.all(promises)
          results.forEach(terms => {
            if (terms && Array.isArray(terms)) {
              termsData.push(...terms)
            } else if (terms) {
              termsData.push(terms)
            }
          })
        }

        console.log(consoleMessages.loadedLocalTerms(termsData.length))
        if (termsData.length > 0) {
          proxyInfo.value = `Found ${termsData.length} local terms`
        }
      } catch (err) {
        console.warn(consoleMessages.termsDirectoryNotFound(err.message))
        proxyInfo.value = 'No local terms directory found'
      }

      // Load external specs if they exist
      if (config.external_specs && Array.isArray(config.external_specs)) {
        proxyInfo.value = 'Preparing to load external specifications...'
        const externalTerms = await loadExternalSpecs(config.external_specs)
        termsData.push(...externalTerms)
        // Show final summary briefly before clearing
        if (externalTerms.length > 0) {
          proxyInfo.value = `✓ Loading complete - ${termsData.length} total terms (${termsData.length - externalTerms.length} local, ${externalTerms.length} external)`
        } else {
          proxyInfo.value = `✓ Loading complete - ${termsData.length} total terms`
        }
        // Clear proxy info after showing summary
        setTimeout(() => {
          proxyInfo.value = ''
        }, 3000)
      } else if (termsData.length > 0) {
        // Show summary for local-only loading
        proxyInfo.value = `✓ Loading complete - ${termsData.length} local terms`
        setTimeout(() => {
          proxyInfo.value = ''
        }, 2000)
      }

      termsData.sort((a, b) => a.id.localeCompare(b.id))
      terms.value = termsData
      filteredTerms.value = termsData

      saveTermsToStorage(termsData)

    } catch (err) {
      console.error(consoleMessages.errorLoadingTerms(err.message))
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

    // Only load terms if not already loaded
    if (terms.value.length === 0) {
      if (!loadTermsFromStorage()) {
        await loadTermsFromRepository()
      }
    }

    loadingTerms.value = false
    filteredTerms.value = terms.value
  }

  // Load terms on initialization (for preview mode)
  const initializeTerms = async () => {
    // Always load specs config first
    if (!specsConfig.value) {
      try {
        specsConfig.value = await loadSpecsConfig()
      } catch (error) {
        console.error('Failed to load specs config in initializeTerms:', error)
      }
    }

    // Try to load from storage first, then from repository if needed
    if (!loadTermsFromStorage()) {
      loadingTerms.value = true
      try {
        await loadTermsFromRepository()
      } catch (error) {
        console.warn(consoleMessages.initializationFailed(error.message))
        termsError.value = 'Failed to load terms'
      } finally {
        loadingTerms.value = false
      }
    }
    filteredTerms.value = terms.value
  }

  // Refresh terms (clear cache and reload)
  const refreshTerms = async () => {
    console.log(consoleMessages.refreshingTerms())

    // Set initial feedback
    isRefreshing.value = true
    refreshFeedback.value = 'Clearing cache...'

    try {
      const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
      localStorage.removeItem(storageKey)
      // Clear proxy info when starting refresh
      proxyInfo.value = ''
      console.log(consoleMessages.cacheCleared())

      refreshFeedback.value = 'Reloading terms...'

      await loadTermsFromRepository()
      filterTerms()

      const count = terms.value.length
      console.log(consoleMessages.refreshComplete(count))

      // Show success feedback
      refreshFeedback.value = `✅ ${count} terms loaded`

      // Clear feedback after 3 seconds
      setTimeout(() => {
        refreshFeedback.value = ''
        isRefreshing.value = false
      }, 3000)

    } catch (error) {
      console.error('Refresh failed:', error)
      refreshFeedback.value = '❌ Refresh failed'

      // Clear error feedback after 5 seconds
      setTimeout(() => {
        refreshFeedback.value = ''
        isRefreshing.value = false
      }, 5000)
    }
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
    refreshFeedback,
    isRefreshing,

    // Methods
    filterTerms,
    isTermDefinitionVisible,
    toggleDefinitionsCollapse,
    toggleIndividualTerm,
    showTermsModal,
    refreshTerms,
    loadTermsFromRepository,
    initializeTerms,
    loadTermsForFile,
    loadSpecsConfig,
    loadCachedTermsOnly
  }
}
