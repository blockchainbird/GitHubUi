/**
 * Composable for managing notepad functionality
 * Handles content storage, size management, and auto-saving
 */

import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const STORAGE_KEY = 'notepad_content'
const MAX_SIZE_KB = 500 // 500KB maximum size
const CHUNK_SIZE_KB = 50 // Remove 50KB chunks when over limit

// Global state
const isOpen = ref(false)
const content = ref('')
const notepadMessage = ref('')

// Global watcher - only set up once at module level
let watcherInitialized = false
const initializeWatcher = () => {
  if (watcherInitialized) return
  watcherInitialized = true
  
  watch(content, () => {
    try {
      localStorage.setItem(STORAGE_KEY, content.value)
      console.log('🚀 saveContent (single watcher)')
    } catch (error) {
      console.warn('Failed to save notepad content:', error)
    }
  })
}

function useNotepad() {
  // Initialize the global watcher on first use
  initializeWatcher()
  
  // Trims content if it exceeds the max size, returns true if trimmed
  const trimContentIfNeeded = () => {
    let contentToSave = content.value
    const currentSizeKB = new Blob([contentToSave]).size / 1024
    if (currentSizeKB > MAX_SIZE_KB) {
      const lines = contentToSave.split('\n')
      const targetSizeBytes = (MAX_SIZE_KB - CHUNK_SIZE_KB) * 1024
      let currentSize = 0
      let cutIndex = lines.length
      for (let i = lines.length - 1; i >= 0; i--) {
        const lineSize = new Blob([lines[i] + '\n']).size
        if (currentSize + lineSize > targetSizeBytes) {
          cutIndex = i + 1
          break
        }
        currentSize += lineSize
      }
      if (cutIndex < lines.length) {
        const trimmedLines = lines.slice(cutIndex)
        content.value = `[... earlier content trimmed ...]\n\n${trimmedLines.join('\n')}`
        return true
      }
    }
    return false
  }
  // Unique watcher id for debugging
  const watcherId = Math.random().toString(36).slice(2, 10)
  const route = useRoute()

  // Load content from localStorage
  const loadContent = () => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEY)
      if (savedContent) {
        content.value = savedContent
      }
    } catch (error) {
      console.warn('Failed to load notepad content:', error)
    }
  }

  // Save content to localStorage
  const saveContent = () => {
    try {
      localStorage.setItem(STORAGE_KEY, content.value)
    } catch (error) {
      console.warn('Failed to save notepad content:', error)
    }
  }

  // Computed properties
  const currentSize = computed(() => {
    return new Blob([content.value]).size
  })

  // Format size for display
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Get current timestamp
  const getCurrentTimestamp = () => {
    const now = new Date()
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Open notepad
  const openNotepad = () => {
    isOpen.value = true
    if (!content.value) {
      loadContent()
    }
  }

  // Close notepad
  const closeNotepad = () => {
    isOpen.value = false
  }

  // Add new content with timestamp and separator
  const addContent = (newContent, source = 'Manual', showMessage = false) => {
    if (!newContent || !newContent.trim()) return

    const timestamp = getCurrentTimestamp()
    const dateObj = new Date(timestamp)
    const humanReadable = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
      ', ' + dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    const separatorStart = '–––––––––––––––––––––––––––––– 👇\n'
    const separatorEnd = '\n\n============================ 👆\n\n'

    // Add repo context to source if it contains a filename
    let enhancedSource = source
    if (source.includes('.') || source.includes('/')) {
      // If source appears to contain a filename, add repo context
      const owner = route.params?.owner || 'unknown'
      const repo = route.params?.repo || 'unknown'
      const branch = route.params?.branch || 'unknown'
      enhancedSource = `${owner}/${repo} ${branch} - ${source}`
    }

    const header = `${humanReadable}\nFrom ${enhancedSource}\n`

    content.value = separatorStart + header + separatorStart + '\n\n' + newContent.trim() + separatorEnd + '\n\n\n' + content.value

    // Auto-open notepad when content is added
    if (!isOpen.value) {
      openNotepad()
    }

    // Always show message when content is added via script (non-manual sources)
    // or when explicitly requested via showMessage parameter
    const isScriptAdded = source !== 'Manual'
    if (showMessage || isScriptAdded) {
      notepadMessage.value = isScriptAdded ? 'Content auto-saved to notepad!' : 'Content copied to notepad!'
    }

    // Scroll to top when content is added automatically
    if (source !== 'Manual') {
      setTimeout(() => {
        const notepadElement = document.querySelector('[data-notepad-content]')
        if (notepadElement) {
          notepadElement.scrollTop = 0
        }
      }, 100)
    }
  }

  // Copy content to clipboard
  const copyContent = async () => {
    if (!content.value.trim()) {
      return
    }

    try {
      await navigator.clipboard.writeText(content.value)
      // Could add a toast notification here
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = content.value
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch (fallbackError) {
        console.error('Failed to copy content:', fallbackError)
      }
    }
  }

  // Clear all content
  const clearContent = () => {
    if (content.value.trim() && !confirm('Are you sure you want to clear all notepad content? This cannot be undone.')) {
      return
    }

    content.value = ''
    saveContent()
  }

  // Set notepad message
  const setNotepadMessage = (msg) => {
    notepadMessage.value = msg
  }

  // Initialize content on first use
  if (!content.value) {
    loadContent()
  }

  return {
    // State
    isOpen,
    content,
    currentSize,
    notepadMessage,

    // Methods
    openNotepad,
    closeNotepad,
    addContent,
    copyContent,
    clearContent,
    formatSize,
    loadContent,
    saveContent,
    setNotepadMessage
  }
}

// Global instance for external access
let globalNotepadInstance = null

export function getNotepadInstance() {
  if (!globalNotepadInstance) {
    globalNotepadInstance = useNotepad()
  }
  return globalNotepadInstance
}
