<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-folder"></i>
        {{ owner }}/{{ repo }} - Spec Files
      </h2>
      <div>
        <button 
          @click="$router.push(`/health-check/${owner}/${repo}/${branch}`)" 
          class="btn btn-outline-success me-2"
          title="Run Health Check"
        >
          <i class="bi bi-heart-pulse"></i>
          Health Check
        </button>
        <button 
          @click="$router.push(`/external-specs/${owner}/${repo}/${branch}`)" 
          class="btn btn-outline-primary me-2"
          title="Manage External Specifications"
        >
          <i class="bi bi-link-45deg"></i>
          External Specs
        </button>
        <button @click="$router.push('/home')" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left"></i>
          Back to Home
        </button>
      </div>
    </div>
    
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading spec files...</p>
    </div>
    
    <div v-else-if="specDirectory">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">
              <i class="bi bi-folder-fill"></i>
              Spec Directory: {{ currentDirectory }}
            </h5>
            <button 
              @click="showCreateModal" 
              class="btn btn-success btn-sm"
              title="Create New File"
            >
              <i class="bi bi-plus-circle"></i>
              New File
            </button>
          </div>
          
          <!-- Filter/Search Bar -->
          <div class="row g-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input
                  v-model="filterText"
                  type="text"
                  class="form-control"
                  placeholder="Filter files and folders..."
                  @input="applyFilter"
                  @keydown.escape="clearFilterCompletely"
                >
                <button 
                  v-if="filterText"
                  @click="clearFilterCompletely"
                  class="btn btn-outline-secondary"
                  type="button"
                  title="Clear filter"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <div class="col-auto">
              <div class="dropdown">
                <button 
                  ref="dropdownButton"
                  class="btn btn-outline-secondary dropdown-toggle" 
                  type="button" 
                  @click="toggleDropdown"
                  title="Filter options"
                >
                  <i class="bi bi-funnel"></i>
                  {{ selectedFilter }}
                </button>
                <ul 
                  ref="dropdownMenu"
                  class="dropdown-menu"
                  :class="{ show: dropdownOpen }"
                >
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('All')">All</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('Files')">Files Only</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('Folders')">Folders Only</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('.md')">.md Files</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('.txt')">.txt Files</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('.html')">.html Files</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Results info -->
          <div v-if="filterText || selectedFilter !== 'All'" class="mt-2">
            <small class="text-muted">
              Showing {{ filteredFolders.length + filteredFiles.length }} results
              <span v-if="filterText">(filtered by: "{{ filterText }}")</span>
              <span v-if="selectedFilter !== 'All'">({{ selectedFilter }})</span>
            </small>
          </div>
        </div>
        <div class="card-body">
          <!-- Go Up button: only show if not at root specDirectory -->
          <div v-if="showGoUpButton" class="mb-3">
            <button @click="goUpDirectory" class="btn btn-outline-secondary btn-sm" :disabled="loading">
              <i class="bi bi-arrow-up"></i> Go Up
            </button>
          </div>
          <div v-if="filteredFiles.length === 0 && filteredFolders.length === 0" class="text-center py-4">
            <i class="bi bi-folder2-open" style="font-size: 3rem; color: #6c757d;"></i>
            <p class="mt-2 text-muted">
              <span v-if="filterText || selectedFilter !== 'All'">
                No items match your filter criteria.
              </span>
              <span v-else>
                No files found in the spec directory.
              </span>
            </p>
          </div>
          
          <div v-else class="list-group list-group-flush">
            <!-- Show filtered folders first -->
            <button
              v-for="folder in filteredFolders"
              :key="folder.path"
              @click="openFolder(folder)"
              class="list-group-item list-group-item-action d-flex align-items-center"
            >
              <i class="bi bi-folder-fill me-3" style="color: #ffc107;"></i>
              <div class="flex-grow-1">
                <div class="fw-medium">{{ folder.name }}</div>
                <small class="text-muted">{{ folder.path }}</small>
              </div>
              <i class="bi bi-chevron-right"></i>
            </button>
            <!-- Then show filtered files -->
            <button
              v-for="file in filteredFiles"
              :key="file.path"
              @click="openFile(file)"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :class="{ 'recently-created': file.name === recentlyCreatedFile }"
            >
              <i class="bi bi-file-text me-3" style="color: #0d6efd;"></i>
              <div class="flex-grow-1">
                <div class="fw-medium">
                  {{ file.name }}
                  <span v-if="file.name === recentlyCreatedFile" class="badge bg-primary ms-2">New</span>
                  <span v-if="file.hasExternalRefs" class="badge bg-success ms-2">External</span>
                </div>
                <small class="text-muted">{{ file.path }}</small>
              </div>
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create New File Modal -->
    <div v-if="showCreateFileModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);" @click.self="closeCreateFileModal" @keyup.escape="closeCreateFileModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle"></i>
              Create New File
            </h5>
            <button @click="closeCreateFileModal" type="button" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div v-if="createFileError" class="alert alert-danger" role="alert">
              {{ createFileError }}
            </div>
            
            <div class="mb-3">
              <label for="fileName" class="form-label">File Name</label>
              <input
                v-model="newFileName"
                ref="fileNameInput"
                type="text"
                class="form-control"
                id="fileName"
                placeholder="example.md"
                @keyup.enter="createNewFile"
                @input="updateDefaultContent"
              >
              <div class="form-text">
                Supported extensions: .md, .txt, .rst, .adoc, .html
              </div>
            </div>
            
            <div class="mb-3">
              <label for="fileContent" class="form-label">Initial Content (Optional)</label>
              <textarea
                v-model="newFileContent"
                class="form-control"
                id="fileContent"
                rows="6"
                placeholder="Enter initial content for the file..."
                @keydown.ctrl.enter="createNewFile"
              ></textarea>
              <div class="form-text">
                Press Ctrl+Enter to create the file quickly
              </div>
            </div>
            
            <div class="mb-3">
              <label for="commitMsg" class="form-label">Commit Message</label>
              <input
                v-model="newFileCommitMessage"
                type="text"
                class="form-control"
                id="commitMsg"
                placeholder="Add new file"
                @keydown.ctrl.enter="createNewFile"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeCreateFileModal" type="button" class="btn btn-secondary">Cancel</button>
            <button 
              @click="createNewFile" 
              type="button" 
              class="btn btn-success"
              :disabled="!newFileName.trim() || creatingFile"
            >
              <span v-if="creatingFile">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating...
              </span>
              <span v-else>
                <i class="bi bi-plus-circle"></i>
                Create File
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-menu.show {
  display: block;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.list-group-item.list-group-item-action {
  border-left: none;
  border-right: none;
}

.list-group-item.list-group-item-action:first-child {
  border-top: none;
}

.list-group-item.list-group-item-action:last-child {
  border-bottom: none;
}

/* Make filter section stand out slightly */
.card-header {
  background-color: #fff;
  border-bottom: 2px solid #e9ecef;
}

/* Results counter styling */
.text-muted small {
  font-size: 0.875em;
}

/* Recently created file highlighting */
.list-group-item.recently-created {
  background-color: #d1edff;
  border-color: #0d6efd;
}

.list-group-item.recently-created:hover {
  background-color: #b8e0ff;
}

.badge.bg-success {
  font-size: 0.7em;
}

.badge.bg-info {
  font-size: 0.7em;
}

.badge.bg-primary {
  font-size: 0.7em;
}
</style>

<script>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { addToVisitedRepos } from '../utils/visitedRepos.js'

export default {
  name: 'FileExplorer',
  props: ['owner', 'repo', 'branch'],
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(true)
    const error = ref('')
    const specDirectory = ref('')
    const files = ref([])
    const folders = ref([])
    const currentDirectory = ref('')
    
    // Filter state
    const filterText = ref('')
    const selectedFilter = ref('All')
    const dropdownOpen = ref(false)
    const dropdownButton = ref(null)
    const dropdownMenu = ref(null)
    const recentlyCreatedFile = ref('')
    
    // Create file modal state
    const showCreateFileModal = ref(false)
    const newFileName = ref('')
    const newFileContent = ref('')
    const newFileCommitMessage = ref('Add new file')
    const creatingFile = ref(false)
    const createFileError = ref('')
    const fileNameInput = ref(null)
    
    // Computed properties for filtered results
    const filteredFiles = computed(() => {
      let result = files.value
      
      // Apply filter type
      if (selectedFilter.value === 'Folders') {
        result = []
      } else if (selectedFilter.value.startsWith('.')) {
        result = result.filter(file => 
          file.name.toLowerCase().endsWith(selectedFilter.value) ||
          // Always include recently created file
          file.name === recentlyCreatedFile.value
        )
      }
      
      // Apply text filter
      if (filterText.value) {
        const searchTerm = filterText.value.toLowerCase()
        result = result.filter(file => 
          file.name.toLowerCase().includes(searchTerm) ||
          file.path.toLowerCase().includes(searchTerm) ||
          // Always include recently created file even if it doesn't match filter
          file.name === recentlyCreatedFile.value
        )
      }
            
      return result
    })
    
    const filteredFolders = computed(() => {
      let result = folders.value
      
      // Apply filter type
      if (selectedFilter.value === 'Files' || selectedFilter.value.startsWith('.')) {
        result = []
      }
      
      // Apply text filter
      if (filterText.value) {
        const searchTerm = filterText.value.toLowerCase()
        result = result.filter(folder => 
          folder.name.toLowerCase().includes(searchTerm) ||
          folder.path.toLowerCase().includes(searchTerm)
        )
      }
      
      return result
    })
    
    // Helper function to check authentication and redirect if needed
    const checkAuthAndRedirect = (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Token is invalid or expired, clear it and redirect to login
        localStorage.removeItem('github_token')
        localStorage.removeItem('github_user')
        router.push('/login')
        return true
      }
      return false
    }
    
    const loadSpecsConfig = async () => {
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Try to get specs.json from repository root, with branch
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`,
          config
        )

        // Decode base64 content
        const content = JSON.parse(atob(response.data.content))
        // Get spec_directory from the first item in specs array
        if (Array.isArray(content.specs) && content.specs.length > 0) {
          specDirectory.value = content.specs[0].spec_directory || 'spec'
        } else {
          specDirectory.value = 'spec'
        }
        currentDirectory.value = specDirectory.value
        await loadSpecFiles(currentDirectory.value)

      } catch (err) {
        console.error('Error loading specs config:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          error.value = 'specs.json file not found in repository root. Using default "specs" directory.'
          specDirectory.value = 'specs'
          currentDirectory.value = specDirectory.value
          await loadSpecFiles(currentDirectory.value)
        } else {
          error.value = 'Failed to load repository configuration.'
        }
      }
    }
    
    // Function to check if a file contains external references in the first line
    const checkForExternalReferences = async (downloadUrl, config) => {
      try {
        // Use the download_url directly without auth headers (it's a public raw content URL)
        let response
        try {
          // First try with range request for performance
          response = await axios.get(downloadUrl, {
            headers: {
              'Range': 'bytes=0-200' // Only get first 200 bytes
            }
          })
        } catch (rangeErr) {
          // If range doesn't work, get the full file
          response = await axios.get(downloadUrl)
        }
        
        // Check if first line contains [[tref:
        const content = response.data
        const firstLine = content.split('\n')[0] || ''
        const hasExternalRef = firstLine.includes('[[tref:')
        
        return hasExternalRef
      } catch (err) {
        console.warn('Could not check external references for file:', downloadUrl, err)
        return false
      }
    }
    
    const loadSpecFiles = async (directory) => {
      try {
        loading.value = true
        error.value = ''
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        // Get files and folders from the given directory, with branch
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${directory}?ref=${props.branch}`,
          config
        )
        // Folders
        folders.value = response.data
          .filter(item => item.type === 'dir')
          .map(folder => ({
            name: folder.name,
            path: folder.path
          }))
        // Files
        const textFileExtensions = ['.md', '.txt', '.rst', '.adoc', '.html']
        const filteredFiles = response.data
          .filter(file => file.type === 'file')
          .filter(file => textFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext)))
        
        // Check each file for external references and add hasExternalRefs property
        // Process files in batches to avoid overwhelming the API
        const batchSize = 5
        const filesWithExternalCheck = []
        
        for (let i = 0; i < filteredFiles.length; i += batchSize) {
          const batch = filteredFiles.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (file) => {
              const hasExternalRefs = await checkForExternalReferences(file.download_url, config)
              return {
                name: file.name,
                path: file.path,
                sha: file.sha,
                download_url: file.download_url,
                hasExternalRefs: hasExternalRefs || file.name.includes('test') // Temporary test: mark files with 'test' in name
              }
            })
          )
          filesWithExternalCheck.push(...batchResults)
        }
        
        files.value = filesWithExternalCheck
        currentDirectory.value = directory
      } catch (err) {
        console.error('Error loading spec files:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          error.value = `Spec directory "${directory}" not found in repository.`
        } else {
          error.value = 'Failed to load spec files.'
        }
      } finally {
        loading.value = false
      }
    }
    
    const openFile = (file) => {
      const encodedPath = encodeURIComponent(file.path)
      router.push(`/editor/${props.owner}/${props.repo}/${props.branch}/${encodedPath}`)
    }

    const openFolder = (folder) => {
      recentlyCreatedFile.value = '' // Clear when navigating to different folder
      localStorage.removeItem('recentlyCreatedFile') // Also clear from localStorage
      loadSpecFiles(folder.path)
    }
    
    const showCreateModal = async () => {
      showCreateFileModal.value = true
      await nextTick()
      if (fileNameInput.value) {
        fileNameInput.value.focus()
      }
    }
    
    const closeCreateFileModal = () => {
      showCreateFileModal.value = false
      newFileName.value = ''
      newFileContent.value = ''
      newFileCommitMessage.value = 'Add new file'
      createFileError.value = ''
    }
    
    const updateDefaultContent = () => {
      const fileName = newFileName.value.toLowerCase()
      if (fileName.endsWith('.md') && !newFileContent.value) {
        const baseName = newFileName.value.replace(/\.[^/.]+$/, "")
        newFileContent.value = `# ${baseName}\n\n## Overview\n\nDescription of this specification.\n\n## Details\n\nDetailed content goes here.\n`
      }
    }
    
    const createNewFile = async () => {
      if (!newFileName.value.trim()) {
        createFileError.value = 'Please enter a file name'
        return
      }
      
      // Validate file extension
      const allowedExtensions = ['.md', '.txt', '.rst', '.adoc', '.html']
      const hasValidExtension = allowedExtensions.some(ext => 
        newFileName.value.toLowerCase().endsWith(ext)
      )
      
      if (!hasValidExtension) {
        createFileError.value = 'File must have one of these extensions: ' + allowedExtensions.join(', ')
        return
      }
      
      try {
        creatingFile.value = true
        createFileError.value = ''
        
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        
        // Construct the file path
        const filePath = currentDirectory.value ? 
          `${currentDirectory.value}/${newFileName.value}` : 
          `${specDirectory.value}/${newFileName.value}`
        
        // Create the file via GitHub API
        const createData = {
          message: newFileCommitMessage.value || 'Add new file',
          content: btoa(newFileContent.value || ''), // Base64 encode the content
          branch: props.branch
        }
        
        await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${filePath}`,
          createData,
          config
        )
        
        // Close modal and refresh file list
        closeCreateFileModal()
        
        // Store the newly created file name for filtering purposes
        recentlyCreatedFile.value = newFileName.value
        // Also store in localStorage to persist across navigation
        localStorage.setItem('recentlyCreatedFile', newFileName.value)
        
        // Don't clear filters - let the computed properties handle showing the new file
        await loadSpecFiles(currentDirectory.value || specDirectory.value)
        
        // Auto-clear the recently created indicator after 10 seconds
        setTimeout(() => {
          recentlyCreatedFile.value = ''
          localStorage.removeItem('recentlyCreatedFile')
        }, 10000)
        
        // Navigate to the new file for editing
        const encodedPath = encodeURIComponent(filePath)
        router.push(`/editor/${props.owner}/${props.repo}/${props.branch}/${encodedPath}`)
        
      } catch (err) {
        console.error('Error creating file:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 422) {
          createFileError.value = 'A file with this name already exists'
        } else {
          createFileError.value = 'Failed to create file. Please try again.'
        }
      } finally {
        creatingFile.value = false
      }
    }
    
    // Filter methods
    const toggleDropdown = () => {
      dropdownOpen.value = !dropdownOpen.value
    }
    
    const selectFilter = (filterType) => {
      selectedFilter.value = filterType
      dropdownOpen.value = false
    }
    
    const setFilter = (filterType) => {
      selectedFilter.value = filterType
    }
    
    const clearFilter = () => {
      filterText.value = ''
      selectedFilter.value = 'All'
      // Don't clear recentlyCreatedFile here - let it remain for tracking
    }
    
    const clearFilterCompletely = () => {
      filterText.value = ''
      selectedFilter.value = 'All'
      recentlyCreatedFile.value = '' // Clear recently created file tracking when user manually clears
      localStorage.removeItem('recentlyCreatedFile') // Also clear from localStorage
    }
    
    const applyFilter = () => {
      // Clear recently created file indicator when user starts filtering
      if (filterText.value && recentlyCreatedFile.value) {
        // Small delay to allow the user to see their new file first
        setTimeout(() => {
          recentlyCreatedFile.value = ''
          localStorage.removeItem('recentlyCreatedFile')
        }, 2000)
      }
    }
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownButton.value && dropdownMenu.value) {
        if (!dropdownButton.value.contains(event.target) && !dropdownMenu.value.contains(event.target)) {
          dropdownOpen.value = false
        }
      }
    }
    
    // Function to refresh file list when returning to the page
    const handleVisibilityChange = () => {
      if (!document.hidden && route.path.includes('/files/') && (currentDirectory.value || specDirectory.value)) {
        console.log('Page became visible, checking if we need to refresh file list...')
        // Check if we have a recently created file that might not be in the current list
        const storedRecentFile = localStorage.getItem('recentlyCreatedFile')
        if (storedRecentFile && !files.value.some(f => f.name === storedRecentFile)) {
          console.log('Recently created file not found in list, refreshing...')
          loadSpecFiles(currentDirectory.value || specDirectory.value)
        }
      }
    }
    
    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(props.owner, props.repo, props.branch)
      
      loadSpecsConfig()
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Check if we have a recently created file in localStorage
      const storedRecentFile = localStorage.getItem('recentlyCreatedFile')
      if (storedRecentFile) {
        recentlyCreatedFile.value = storedRecentFile
        // Auto-clear after 30 seconds to give user time to navigate back
        setTimeout(() => {
          recentlyCreatedFile.value = ''
          localStorage.removeItem('recentlyCreatedFile')
        }, 30000)
      }
    })
    
    // Watch for when user navigates back to this component  
    watch(() => route.path, (newPath, oldPath) => {
      // If we're on the file explorer route and the path changed
      if (newPath.includes('/files/') && oldPath && !oldPath.includes('/files/')) {
        console.log('Navigating back to file explorer, refreshing file list...')
        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          if (currentDirectory.value || specDirectory.value) {
            loadSpecFiles(currentDirectory.value || specDirectory.value);
          }
        }, 200)
      }
    })
    
    // Clean up event listener
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
    
    // Go Up directory function (never go above root specDirectory)
    const goUpDirectory = () => {
      const current = normalizeDir(currentDirectory.value);
      const root = normalizeDir(specDirectory.value);
      if (current === root) return;
      const parts = current.split('/');
      if (parts.length > 1) {
        parts.pop();
        const parent = parts.join('/') || root;
        // Prevent going above root
        if (normalizeDir(parent).startsWith(root)) {
          loadSpecFiles(parent);
        } else {
          loadSpecFiles(root);
        }
      } else {
        loadSpecFiles(root);
      }
    };

    // Utility to normalize directory strings (remove trailing slashes)
    function normalizeDir(dir) {
      return dir ? dir.replace(/\/+$/, '') : '';
    }

    // Only show Go Up button if not at root and not loading
    const showGoUpButton = computed(() => {
      if (loading.value) return false;
      return normalizeDir(currentDirectory.value) !== normalizeDir(specDirectory.value);
    });

    return {
      loading,
      error,
      specDirectory,
      files,
      folders,
      filteredFiles,
      filteredFolders,
      filterText,
      selectedFilter,
      dropdownOpen,
      dropdownButton,
      dropdownMenu,
      recentlyCreatedFile,
      openFile,
      openFolder,
      currentDirectory,
      showCreateFileModal,
      newFileName,
      newFileContent,
      newFileCommitMessage,
      creatingFile,
      createFileError,
      fileNameInput,
      showCreateModal,
      closeCreateFileModal,
      createNewFile,
      updateDefaultContent,
      toggleDropdown,
      selectFilter,
      setFilter,
      clearFilter,
      clearFilterCompletely,
      applyFilter,
      goUpDirectory,
      showGoUpButton
    }
  }
}
</script>
