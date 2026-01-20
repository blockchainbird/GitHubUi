/**
 * Composable for fetching external references from Spec-Up-T specifications
 * and building a hierarchical flowchart data structure.
 * 
 * This module recursively fetches external_specs from index.html files
 * to create a dependency graph that can be visualized as a flowchart.
 * 
 * @module useExternalRefsFlowchart
 */

import { ref } from 'vue'
import axios from 'axios'

/**
 * Maximum recursion depth for fetching external references.
 * This prevents infinite loops and limits the scope of the flowchart.
 * Configurable by changing this value.
 */
const MAX_DEPTH = 3

/**
 * Cache for already fetched specifications to avoid redundant requests.
 * Key: URL, Value: external_specs array
 */
const specsCache = new Map()

/**
 * Composable function to manage external references flowchart generation.
 * 
 * @returns {Object} Object containing state and methods for flowchart generation
 */
export function useExternalRefsFlowchart() {
  const loading = ref(false)
  const error = ref('')
  const flowchartData = ref(null)
  const mermaidCode = ref('')

  /**
   * Gets the proxy URL for CORS-safe requests.
   * 
   * @returns {string} The proxy URL path
   */
  const getProxyUrl = () => {
    const basePath = import.meta.env.VITE_BASE_PATH || '/'
    if (import.meta.env.VITE_PROXY_URL) {
      return import.meta.env.VITE_PROXY_URL
    }
    return basePath.endsWith('/') 
      ? basePath + 'proxy.php?url=' 
      : basePath + '/proxy.php?url='
  }

  /**
   * Extracts window.specConfig from an HTML string.
   * The specConfig contains the specs.json data embedded in the index.html.
   * 
   * @param {string} html - The HTML content to parse
   * @returns {Object|null} The parsed specConfig object or null if not found
   */
  const extractSpecConfig = (html) => {
    try {
      // Look for the script tag containing window.specConfig
      const scriptPattern = /window\.specConfig\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i
      const scriptMatch = scriptPattern.exec(html)
      if (scriptMatch?.[1]) {
        return JSON.parse(scriptMatch[1])
      }
      
      // Alternative pattern: window.specConfig = {...}
      const altPattern = /window\.specConfig\s*=\s*(\{[^<]+\})/i
      const altMatch = altPattern.exec(html)
      if (altMatch?.[1]) {
        return JSON.parse(altMatch[1])
      }
      
      return null
    } catch (err) {
      console.warn('Failed to parse specConfig:', err.message)
      return null
    }
  }

  /**
   * Normalizes a URL to ensure it points to index.html.
   * 
   * @param {string} url - The URL to normalize
   * @returns {string} The normalized URL ending with index.html
   */
  const normalizeUrl = (url) => {
    let normalized = url.trim()
    
    // Remove trailing slashes
    while (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }
    
    // Add index.html if not already present
    if (!normalized.endsWith('.html')) {
      normalized += '/index.html'
    }
    
    return normalized
  }

  /**
   * Fetches a specification's index.html and extracts its external_specs.
   * 
   * @param {string} url - The URL of the specification (gh_page)
   * @returns {Promise<Object>} Object containing title, url, and external_specs
   */
  const fetchSpecExternalRefs = async (url) => {
    const normalizedUrl = normalizeUrl(url)
    
    // Check cache first
    if (specsCache.has(normalizedUrl)) {
      return specsCache.get(normalizedUrl)
    }
    
    try {
      const proxyUrl = getProxyUrl()
      const targetUrl = encodeURIComponent(normalizedUrl)
      
      const response = await axios.get(`${proxyUrl}${targetUrl}`, {
        headers: { 'Accept': 'text/html' },
        timeout: 15000
      })
      
      const specConfig = extractSpecConfig(response.data)
      
      const result = {
        title: specConfig?.title || extractTitleFromUrl(url),
        url: url,
        external_specs: specConfig?.external_specs || [],
        source: specConfig?.source || null
      }
      
      // Cache the result
      specsCache.set(normalizedUrl, result)
      
      return result
    } catch (err) {
      console.warn(`Failed to fetch spec from ${url}:`, err.message)
      return {
        title: extractTitleFromUrl(url),
        url: url,
        external_specs: [],
        error: err.message
      }
    }
  }

  /**
   * Extracts a readable title from a URL.
   * 
   * @param {string} url - The URL to extract title from
   * @returns {string} A human-readable title
   */
  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url)
      // Get the last meaningful path segment
      const pathParts = urlObj.pathname.split('/').filter(p => p && p !== 'index.html')
      return pathParts.pop() || urlObj.hostname
    } catch {
      return url
    }
  }

  /**
   * Recursively builds the flowchart tree structure.
   * 
   * @param {string} url - The root URL to start from
   * @param {number} depth - Current recursion depth
   * @param {Set} visited - Set of already visited URLs to prevent cycles
   * @returns {Promise<Object>} Tree node with children
   */
  const buildFlowchartTree = async (url, depth = 0, visited = new Set()) => {
    // Normalize URL for consistent comparison
    const normalizedUrl = normalizeUrl(url)
    
    // Check depth limit
    if (depth > MAX_DEPTH) {
      return {
        id: generateNodeId(normalizedUrl),
        title: '...',
        url: normalizedUrl,
        children: [],
        truncated: true
      }
    }
    
    // Check for cycles
    if (visited.has(normalizedUrl)) {
      console.log(`[Flowchart] Cycle detected: ${normalizedUrl}`)
      console.log(`[Flowchart] Already visited:`, Array.from(visited))
      return {
        id: generateNodeId(normalizedUrl),
        title: '(cycle)',
        url: normalizedUrl,
        children: [],
        cycle: true
      }
    }
    
    visited.add(normalizedUrl)
    
    const specData = await fetchSpecExternalRefs(normalizedUrl)
    
    console.log(`[Flowchart] Processing: ${specData.title} (${normalizedUrl})`)
    console.log(`[Flowchart] External specs count: ${specData.external_specs?.length || 0}`)
    if (specData.external_specs) {
      console.log(`[Flowchart] External specs:`, specData.external_specs.map(s => ({ 
        external_spec: s.external_spec, 
        gh_page: s.gh_page 
      })))
    }
    
    const node = {
      id: generateNodeId(normalizedUrl),
      title: specData.title,
      url: normalizedUrl,
      children: [],
      error: specData.error || null,
      depth: depth
    }
    
    // Recursively fetch children
    if (specData.external_specs && specData.external_specs.length > 0) {
      const childPromises = specData.external_specs.map(async (extSpec) => {
        const childUrl = extSpec.gh_page
        if (!childUrl) return null
        
        console.log(`[Flowchart] Building tree for child: ${extSpec.external_spec} (${childUrl})`)
        return buildFlowchartTree(childUrl, depth + 1, visited)
      })
      
      const children = await Promise.all(childPromises)
      node.children = children.filter(c => c !== null)
    }
    
    return node
  }

  /**
   * Generates a unique node ID from a URL.
   * Uses a simple hash to ensure uniqueness even for similar URLs.
   * 
   * @param {string} url - The URL to generate ID from
   * @returns {string} A sanitized ID safe for Mermaid
   */
  const generateNodeId = (url) => {
    // Create a simple hash from the URL
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.codePointAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Convert to positive hex string
    const hashStr = Math.abs(hash).toString(36)
    
    // Create a readable prefix from the URL
    const prefix = url
      .replaceAll(/[^a-zA-Z0-9]/g, '_')
      .replaceAll(/_+/g, '_')
      .slice(0, 30)
    
    return `node_${prefix}_${hashStr}`
  }

  /**
   * Converts the tree structure to Mermaid flowchart syntax.
   * 
   * @param {Object} tree - The root node of the tree
   * @returns {string} Mermaid flowchart code
   */
  const treeToMermaid = (tree) => {
    const lines = ['flowchart BT']
    const processedLinks = new Set()
    const processedNodes = new Map() // Track node ID -> was it defined
    const clickHandlers = [] // Store click handlers to add at the end
    const linkStyles = [] // Store link styles with their indices
    let linkIndex = 0 // Track the current link index for styling
    
    /**
     * Extracts a display URL from a full URL for shorter labels.
     * 
     * @param {string} url - The full URL
     * @returns {string} A shorter display URL
     */
    const getUrlDisplay = (url) => {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname + urlObj.pathname.replace(/\/$/, '')
      } catch {
        return url
      }
    }
    
    /**
     * Defines a node in the Mermaid diagram with appropriate styling.
     * 
     * @param {Object} node - The node to define
     * @param {string} nodeId - The sanitized node ID
     * @param {string} label - The escaped label
     * @param {string} urlDisplay - The display URL
     */
    const defineNode = (node, nodeId, label, urlDisplay) => {
      if (node.cycle) {
        return // Don't create a separate node for cycles
      }
      
      if (node.truncated) {
        lines.push(`    ${nodeId}[/"..."/]`)
      } else if (node.error) {
        lines.push(`    ${nodeId}[/"${label} (error)"/]:::errorNode`)
      } else if (node.depth === 0) {
        lines.push(`    ${nodeId}(["${label}<br/><small>${urlDisplay}</small>"]):::rootNode`)
      } else if (node.depth === 1) {
        lines.push(`    ${nodeId}["${label}<br/><small>${urlDisplay}</small>"]:::directExternalRef`)
      } else {
        lines.push(`    ${nodeId}["${label}<br/><small>${urlDisplay}</small>"]`)
      }
      
      processedNodes.set(nodeId, true)
      
      // Add click handler to open URL in new tab
      if (node.url && !node.cycle && !node.truncated) {
        clickHandlers.push(`    click ${nodeId} href "${node.url}" _blank`)
      }
    }
    
    /**
     * Processes a single node and its children recursively.
     * 
     * @param {Object} node - The node to process
     * @param {string|null} parentId - The parent node ID
     * @param {number|null} parentDepth - The parent node depth
     */
    const processNode = (node, parentId = null, parentDepth = null) => {
      const nodeId = sanitizeMermaidId(node.id)
      const label = escapeForMermaid(node.title)
      const urlDisplay = getUrlDisplay(node.url)
      
      // Only define the node if it hasn't been defined yet
      if (!processedNodes.has(nodeId)) {
        defineNode(node, nodeId, label, urlDisplay)
      }
      
      // Add link from parent if exists
      if (parentId) {
        const linkKey = `${parentId}->${nodeId}`
        if (!processedLinks.has(linkKey)) {
          // Add the link
          lines.push(`    ${parentId} --> ${nodeId}`)
          processedLinks.add(linkKey)
          
          // Add link styling based on depth
          if (parentDepth === 0) {
            // Direct link from root: thicker blue line
            linkStyles.push(`    linkStyle ${linkIndex} stroke:#6366f1,stroke-width:4px`)
          } else {
            // Nested link: thinner gray line
            linkStyles.push(`    linkStyle ${linkIndex} stroke:#6b7280,stroke-width:1px`)
          }
          linkIndex++
        }
      }
      
      // Process children
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          processNode(child, nodeId, node.depth)
        })
      }
    }
    
    processNode(tree)
    
    // Add click handlers at the end
    lines.push(...clickHandlers)
    
    // Add link styles
    lines.push(...linkStyles)
    
    // Add node styles (classDef for nodes only)
    const styleDefinitions = [
      '    classDef rootNode fill:#a3a5f6,stroke:#6366f1,stroke-width:3px,color:#1e293b',
      '    classDef directExternalRef fill:#c4b5fd,stroke:#8b5cf6,stroke-width:2px,color:#1e293b',
      '    classDef errorNode fill:#f87171,stroke:#dc2626,stroke-width:2px,color:#fff'
    ]
    lines.push(...styleDefinitions)
    
    return lines.join('\n')
  }

  /**
   * Sanitizes a string to be used as a Mermaid node ID.
   * 
   * @param {string} id - The ID to sanitize
   * @returns {string} A sanitized ID
   */
  const sanitizeMermaidId = (id) => {
    return id.replaceAll(/\W/g, '_').substring(0, 50)
  }

  /**
   * Escapes special characters for Mermaid labels.
   * 
   * @param {string} text - The text to escape
   * @returns {string} Escaped text safe for Mermaid
   */
  const escapeForMermaid = (text) => {
    return text
      .replaceAll('"', "'")
      .replaceAll(/[[\](){}]/g, '')
      .replaceAll(/[<>]/g, '')
      .substring(0, 40)
  }

  /**
   * Main function to generate the flowchart from a specification URL.
   * 
   * @param {string} specUrl - The URL of the root specification
   * @returns {Promise<void>}
   */
  const generateFlowchart = async (specUrl) => {
    loading.value = true
    error.value = ''
    flowchartData.value = null
    mermaidCode.value = ''
    
    try {
      // Clear cache for fresh data
      specsCache.clear()
      
      // Build the tree
      const tree = await buildFlowchartTree(specUrl)
      flowchartData.value = tree
      
      // Convert to Mermaid code
      mermaidCode.value = treeToMermaid(tree)
      
    } catch (err) {
      console.error('Error generating flowchart:', err)
      error.value = `Failed to generate flowchart: ${err.message}`
    } finally {
      loading.value = false
    }
  }

  /**
   * Clears the current flowchart data.
   */
  const clearFlowchart = () => {
    flowchartData.value = null
    mermaidCode.value = ''
    error.value = ''
  }

  /**
   * Updates the maximum depth setting.
   * Note: This requires re-generating the flowchart to take effect.
   * 
   * @param {number} newDepth - The new maximum depth
   */
  const setMaxDepth = (newDepth) => {
    // This is a placeholder - in a real implementation,
    // you might want to make MAX_DEPTH a ref
    console.log('Max depth would be set to:', newDepth)
  }

  return {
    loading,
    error,
    flowchartData,
    mermaidCode,
    generateFlowchart,
    clearFlowchart,
    setMaxDepth,
    MAX_DEPTH
  }
}
