/**
 * Composable for managing notepad functionality
 * Handles content storage, size management, and auto-saving
 */

import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'notepad_content'
const MAX_SIZE_KB = 500 // 500KB maximum size
const CHUNK_SIZE_KB = 50 // Remove 50KB chunks when over limit

// Global state
const isOpen = ref(false)
const content = ref('')

export function useNotepad() {
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
      let contentToSave = content.value
      
      // Check size and trim if necessary
      const currentSizeKB = new Blob([contentToSave]).size / 1024
      
      if (currentSizeKB > MAX_SIZE_KB) {
        // Remove oldest content in chunks
        const lines = contentToSave.split('\n')
        const targetSizeBytes = (MAX_SIZE_KB - CHUNK_SIZE_KB) * 1024
        
        // Find the cut point by working backwards from the end
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
        
        // Keep only the most recent content
        if (cutIndex < lines.length) {
          const trimmedLines = lines.slice(cutIndex)
          contentToSave = `[... earlier content trimmed ...]\n\n${trimmedLines.join('\n')}`
        }
      }
      
      localStorage.setItem(STORAGE_KEY, contentToSave)
      content.value = contentToSave
      
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
    saveContent()
  }

  // Add new content with timestamp and separator
  const addContent = (newContent, source = 'Manual') => {
    if (!newContent || !newContent.trim()) return
    
      const timestamp = getCurrentTimestamp()
      const separator = '\n------------------------------------------------------\n'
      const header = `👇 [${timestamp}] From ${source}: 👇`

      content.value = separator + header + separator + '\n\n' + newContent.trim() + '\n\n\n' + content.value
    // Auto-save
    saveContent()
    
    // Auto-open notepad when content is added
    if (!isOpen.value) {
      openNotepad()
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

  // Watch for content changes and auto-save
  watch(content, () => {
    saveContent()
  })

  // Initialize content on first use
  if (!content.value) {
    loadContent()
  }

  return {
    // State
    isOpen,
    content,
    currentSize,
    
    // Methods
    openNotepad,
    closeNotepad,
    addContent,
    copyContent,
    clearContent,
    formatSize,
    loadContent,
    saveContent
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
