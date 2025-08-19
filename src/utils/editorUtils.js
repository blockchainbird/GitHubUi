/**
 * Utility functions for text editing operations
 * Provides common text manipulation functions for editors
 */

import { nextTick } from 'vue'

/**
 * Insert text around selection in textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string} content - Current content
 * @param {string} before - Text to insert before selection
 * @param {string} after - Text to insert after selection
 * @returns {Promise<{newContent: string, newPosition: number}>}
 */
export const insertText = async (textarea, content, before, after = '') => {
  if (!textarea) return { newContent: content, newPosition: 0 }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.substring(start, end)

  const replacement = before + selectedText + after
  const newContent = content.substring(0, start) + replacement + content.substring(end)
  const newPosition = start + before.length

  await nextTick()
  textarea.focus()
  textarea.setSelectionRange(newPosition, newPosition + selectedText.length)

  return { newContent, newPosition }
}

/**
 * Insert heading at current position
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string} content - Current content
 * @returns {Promise<{newContent: string, newPosition: number}>}
 */
export const insertHeading = async (textarea, content) => {
  return insertText(textarea, content, '## ', '')
}

/**
 * Insert list item at line start
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string} content - Current content
 * @returns {Promise<{newContent: string, newPosition: number}>}
 */
export const insertList = async (textarea, content) => {
  if (!textarea) return { newContent: content, newPosition: 0 }

  const start = textarea.selectionStart
  const lineStart = content.lastIndexOf('\n', start - 1) + 1
  const newContent = content.substring(0, lineStart) + '* ' + content.substring(lineStart)
  const newPosition = start + 2

  await nextTick()
  textarea.focus()
  textarea.setSelectionRange(newPosition, newPosition)

  return { newContent, newPosition }
}

/**
 * Get file extension from path
 * @param {string} filePath - File path
 * @returns {string} File extension
 */
export const getFileExtension = (filePath) => {
  const ext = filePath.split('.').pop()?.toLowerCase()
  return ext || 'unknown'
}


/**
 * Process term references in markdown content for rendering
 * @param {string} content - Markdown content
 * @param {Array} terms - Available terms for reference resolution
 * @returns {string} Processed HTML content
 */
export const processTermReferences = (content, terms = []) => {
  if (!content) return ''

  let html = content

  // Split content into lines for processing
  const lines = html.split('\n')
  const processedLines = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Process markdown headings
    if (line.match(/^#{6}\s+(.+)$/)) {
      line = line.replace(/^#{6}\s+(.+)$/, '<h6>$1</h6>')
    } else if (line.match(/^#{5}\s+(.+)$/)) {
      line = line.replace(/^#{5}\s+(.+)$/, '<h5>$1</h5>')
    } else if (line.match(/^#{4}\s+(.+)$/)) {
      line = line.replace(/^#{4}\s+(.+)$/, '<h4>$1</h4>')
    } else if (line.match(/^#{3}\s+(.+)$/)) {
      line = line.replace(/^#{3}\s+(.+)$/, '<h3>$1</h3>')
    } else if (line.match(/^#{2}\s+(.+)$/)) {
      line = line.replace(/^#{2}\s+(.+)$/, '<h2>$1</h2>')
    } else if (line.match(/^#{1}\s+(.+)$/)) {
      line = line.replace(/^#{1}\s+(.+)$/, '<h1>$1</h1>')
    } else if (line.match(/^~\s*(.+)$/)) {
      // Process definition paragraphs (lines starting with ~)
      line = line.replace(/^~\s*(.+)$/, '<p class="definition-paragraph">$1</p>')
    } else if (line.trim() === '') {
      // Keep empty lines as paragraph breaks
      line = ''
    } else if (!line.match(/^<[^>]+>/)) {
      // For regular text lines (not already HTML), wrap in paragraph tags
      line = '<p>' + line + '</p>'
    }

    processedLines.push(line)
  }

  // Join lines back together
  html = processedLines.join('\n')

  // Process inline markdown formatting
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+?)_/g, '<em>$1</em>')
  html = html.replace(/`([^`]+?)`/g, '<code>$1</code>')

  // Process basic links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Handle tref patterns (external term definitions)
  html = html.replace(/\[\[tref:\s*([^,\]]+),\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/g, (match, specName, termId, aliases) => {
    const cleanSpecName = specName.trim()
    const cleanTermId = termId.trim()
    const cleanAliases = aliases ? aliases.split(',').map(a => a.trim()).filter(a => a.length > 0) : []
    
    // Find the external term in the loaded terms
    const externalTerm = terms.find(t => 
      t.external && 
      t.externalSpec === cleanSpecName && 
      t.id === cleanTermId
    )

    if (externalTerm && externalTerm.definition) {
      return `<div class="external-term-reference">
        <div class="term-name">${cleanTermId}${cleanAliases.length > 0 ? ` (${cleanAliases.join(', ')})` : ''}</div>
        <div class="term-definition">${externalTerm.definition}</div>
      </div>`
    } else {
      return `<div class="external-term-reference">
        <div class="term-name">${cleanTermId}${cleanAliases.length > 0 ? ` (${cleanAliases.join(', ')})` : ''}</div>
        <div class="term-definition not-found">Definition not found for ${cleanTermId} from ${cleanSpecName}</div>
      </div>`
    }
  })

  // Handle xref patterns (external references)
  html = html.replace(/\[\[xref:\s*([^,\]]+),\s*([^\]]+)\]\]/g, (match, specName, termId) => {
    const cleanSpecName = specName.trim()
    const cleanTermId = termId.trim()
    
    const externalTerm = terms.find(t => 
      t.external && 
      t.externalSpec === cleanSpecName && 
      t.id === cleanTermId
    )
    
    const tooltip = externalTerm ? 
      `External reference: ${externalTerm.definitionText || cleanTermId}` : 
      `External reference to ${cleanTermId} from ${cleanSpecName}`
    
    return `<span class="term-reference external" title="${tooltip}">
      ${cleanTermId}
    </span>`
  })

  // Handle ref patterns (local references)
  html = html.replace(/\[\[ref:\s*([^\]]+)\]\]/g, (match, termId) => {
    const cleanTermId = termId.trim()
    const term = terms.find(t => t.id === cleanTermId && !t.external)
    
    if (term) {
      return `<span class="term-reference local" title="${term.definitionText || 'Local term reference'}">
        ${cleanTermId}
      </span>`
    }
    return `<span class="term-reference local missing" title="Term not found">
      ${cleanTermId}
    </span>`
  })

  // Handle def patterns (term definitions)
  html = html.replace(/\[\[def:\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/g, (match, termId, aliases) => {
    const cleanTermId = termId.trim()
    const cleanAliases = aliases ? aliases.split(',').map(a => a.trim()).filter(a => a.length > 0) : []

    return `<div class="term-definition-marker">
      <div class="definition-term-name">${cleanTermId}</div>
      ${cleanAliases.length > 0 ? `<div class="definition-aliases">Aliases: ${cleanAliases.join(', ')}</div>` : ''}
    </div>`
  })

  return html
}

/**
 * Create debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
