import { ref, computed, watch, onUnmounted } from 'vue'

/**
 * Composable for autosave functionality with localStorage
 * Provides safe content backup and visual indicators
 */
export function useAutosave(props, content, isNewFile) {
  // Autosave state
  const lastSavedToLocalStorage = ref(null)
  const autosaveInterval = ref(null)
  const AUTOSAVE_DELAY = 5000 // 5 seconds

  // Generate unique key for localStorage
  const getAutosaveKey = () => {
    const pathStr = Array.isArray(props.path) ? props.path.join('/') : props.path || 'new-file'
    return `autosave_${props.owner}_${props.repo}_${props.branch}_${pathStr}`
  }

  // Check if there's unsaved content in localStorage
  const hasAutosavedContent = computed(() => {
    if (!lastSavedToLocalStorage.value) return false
    return content.value !== lastSavedToLocalStorage.value
  })

  // Get autosave timestamp for display
  const autosaveTimestamp = ref(null)
  const autosaveTimeDisplay = computed(() => {
    if (!autosaveTimestamp.value) return ''
    return new Date(autosaveTimestamp.value).toLocaleTimeString()
  })

  // Save content to localStorage
  const saveToLocalStorage = () => {
    try {
      const key = getAutosaveKey()
      const autosaveData = {
        content: content.value,
        timestamp: Date.now(),
        isNewFile: isNewFile.value
      }
      
      localStorage.setItem(key, JSON.stringify(autosaveData))
      lastSavedToLocalStorage.value = content.value
      autosaveTimestamp.value = Date.now()
      
      console.log('🔄 Content autosaved to localStorage', { key, timestamp: autosaveTimestamp.value })
    } catch (error) {
      console.warn('Failed to autosave to localStorage:', error)
    }
  }

  // Load content from localStorage
  const loadFromLocalStorage = () => {
    try {
      const key = getAutosaveKey()
      const saved = localStorage.getItem(key)
      
      if (saved) {
        const autosaveData = JSON.parse(saved)
        return {
          content: autosaveData.content || '',
          timestamp: autosaveData.timestamp || null,
          isNewFile: autosaveData.isNewFile || false
        }
      }
    } catch (error) {
      console.warn('Failed to load autosaved content:', error)
    }
    return null
  }

  // Clear autosaved content from localStorage
  const clearAutosave = () => {
    try {
      const key = getAutosaveKey()
      localStorage.removeItem(key)
      lastSavedToLocalStorage.value = null
      autosaveTimestamp.value = null
      console.log('🗑️ Autosaved content cleared from localStorage', { key })
    } catch (error) {
      console.warn('Failed to clear autosaved content:', error)
    }
  }

  // Restore content from localStorage
  const restoreFromAutosave = () => {
    const saved = loadFromLocalStorage()
    if (saved && saved.content) {
      content.value = saved.content
      lastSavedToLocalStorage.value = saved.content
      autosaveTimestamp.value = saved.timestamp
      console.log('✅ Content restored from autosave', { timestamp: saved.timestamp })
      return true
    }
    return false
  }

  // Schedule autosave
  const scheduleAutosave = () => {
    if (autosaveInterval.value) {
      clearTimeout(autosaveInterval.value)
    }
    
    autosaveInterval.value = setTimeout(() => {
      if (content.value && content.value.trim()) {
        saveToLocalStorage()
      }
      console.log('⏰ Autosave scheduled and executed')
    }, AUTOSAVE_DELAY)
  }

  // Initialize autosave system
  const initializeAutosave = () => {
    console.log('🚀 Initializing autosave system...')
    
    // Check for existing autosaved content on initialization
    const saved = loadFromLocalStorage()
    if (saved && saved.timestamp) {
      autosaveTimestamp.value = saved.timestamp
      lastSavedToLocalStorage.value = saved.content
      console.log('📦 Found existing autosave data', { timestamp: saved.timestamp })
    }

    // Watch for content changes and schedule autosave
    watch(content, (newContent, oldContent) => {
      console.log('📝 Content changed, scheduling autosave...', { 
        newLength: newContent?.length || 0, 
        oldLength: oldContent?.length || 0 
      })
      
      if (newContent && newContent !== lastSavedToLocalStorage.value) {
        scheduleAutosave()
      }
    }, { immediate: false })
    
    console.log('✅ Autosave system initialized')
  }

  // Check if autosaved content exists and is different from current
  const checkForAutosavedContent = () => {
    const saved = loadFromLocalStorage()
    if (saved && saved.content) {
      // For new check, compare with current content if it exists, or assume different if no current content
      const currentContent = content.value || ''
      if (saved.content !== currentContent && saved.content.trim() !== '') {
        console.log('🔍 Found different autosaved content', { 
          savedLength: saved.content.length, 
          currentLength: currentContent.length 
        })
        return {
          hasAutosave: true,
          content: saved.content,
          timestamp: saved.timestamp
        }
      }
    }
    console.log('🔍 No autosaved content found or content is the same')
    return { hasAutosave: false }
  }

  // Force immediate save
  const forceAutosave = () => {
    console.log('🔧 Force autosave triggered')
    saveToLocalStorage()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (autosaveInterval.value) {
      clearTimeout(autosaveInterval.value)
    }
    console.log('🧹 Autosave cleanup completed')
  })

  return {
    // State
    hasAutosavedContent,
    autosaveTimeDisplay,
    autosaveTimestamp,

    // Methods
    saveToLocalStorage,
    loadFromLocalStorage,
    clearAutosave,
    restoreFromAutosave,
    checkForAutosavedContent,
    initializeAutosave,
    scheduleAutosave,
    forceAutosave
  }
}
