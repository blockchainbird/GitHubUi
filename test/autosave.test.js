/**
 * Basic test for autosave functionality
 * This test verifies that the autosave composable works correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useAutosave } from '../src/composables/useAutosave.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('useAutosave', () => {
  let props, content, isNewFile

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup test props
    props = {
      owner: 'testowner',
      repo: 'testrepo',
      branch: 'main',
      path: 'test/file.md'
    }
    
    content = ref('initial content')
    isNewFile = ref(false)
  })

  it('should generate unique localStorage key', () => {
    const { saveToLocalStorage } = useAutosave(props, content, isNewFile)
    
    saveToLocalStorage()
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'autosave_testowner_testrepo_main_test/file.md',
      expect.any(String)
    )
  })

  it('should save content to localStorage', () => {
    const { saveToLocalStorage } = useAutosave(props, content, isNewFile)
    
    content.value = 'test content'
    saveToLocalStorage()
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'autosave_testowner_testrepo_main_test/file.md',
      expect.stringContaining('test content')
    )
  })

  it('should clear autosave from localStorage', () => {
    const { clearAutosave } = useAutosave(props, content, isNewFile)
    
    clearAutosave()
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'autosave_testowner_testrepo_main_test/file.md'
    )
  })

  it('should handle array path correctly', () => {
    props.path = ['test', 'nested', 'file.md']
    const { saveToLocalStorage } = useAutosave(props, content, isNewFile)
    
    saveToLocalStorage()
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'autosave_testowner_testrepo_main_test/nested/file.md',
      expect.any(String)
    )
  })

  it('should restore content from localStorage', () => {
    const mockSavedData = {
      content: 'restored content',
      timestamp: Date.now(),
      isNewFile: false
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedData))
    
    const { restoreFromAutosave } = useAutosave(props, content, isNewFile)
    const restored = restoreFromAutosave()
    
    expect(restored).toBe(true)
    expect(content.value).toBe('restored content')
  })

  it('should detect unsaved content between autosaves', async () => {
    const { 
      hasUnsavedContent, 
      hasUnsavedContentWarning,
      saveToLocalStorage,
      initializeAutosave 
    } = useAutosave(props, content, isNewFile)
    
    // Initialize the autosave system
    initializeAutosave()
    
    // Initially no unsaved content
    expect(hasUnsavedContent.value).toBe(false)
    expect(hasUnsavedContentWarning.value).toBe(false)
    
    // Change content - should mark as unsaved
    content.value = 'changed content'
    
    // Wait for reactivity
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(hasUnsavedContent.value).toBe(true)
    expect(hasUnsavedContentWarning.value).toBe(false) // Not yet past warning threshold
    
    // Save content - should clear unsaved flag
    saveToLocalStorage()
    
    expect(hasUnsavedContent.value).toBe(false)
    expect(hasUnsavedContentWarning.value).toBe(false)
  })

  it('should show warning for long unsaved content', async () => {
    vi.useFakeTimers()
    
    const { 
      hasUnsavedContent, 
      hasUnsavedContentWarning,
      initializeAutosave 
    } = useAutosave(props, content, isNewFile)
    
    // Initialize the autosave system
    initializeAutosave()
    
    // Change content
    content.value = 'changed content'
    
    // Wait for reactivity
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(hasUnsavedContent.value).toBe(true)
    expect(hasUnsavedContentWarning.value).toBe(false)
    
    // Fast-forward time past warning threshold (30 seconds)
    vi.advanceTimersByTime(31000)
    
    expect(hasUnsavedContentWarning.value).toBe(true)
    
    vi.useRealTimers()
  })

  it('should clear unsaved content flags when clearing autosave', () => {
    const { 
      hasUnsavedContent, 
      clearAutosave,
      initializeAutosave 
    } = useAutosave(props, content, isNewFile)
    
    // Initialize and change content
    initializeAutosave()
    content.value = 'changed content'
    
    expect(hasUnsavedContent.value).toBe(true)
    
    // Clear autosave should reset flags
    clearAutosave()
    
    expect(hasUnsavedContent.value).toBe(false)
  })
})
