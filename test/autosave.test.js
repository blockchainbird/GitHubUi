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
})
