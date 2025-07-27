<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-folder"></i>
        {{ owner }}/{{ repo }} - Spec Files
      </h2>
      <div>
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
      <p class="mt-2">Loading files: {{ loadingMessage }}</p>
    </div>

    <div v-else-if="specDirectory">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">
              <i class="bi bi-folder-fill"></i>
              Spec Directory: {{ currentDirectory }}
            </h5>
            <div class="d-flex gap-2">
              <button v-if="isRootDirectory && hasUnsavedChanges" @click="saveOrder" class="btn btn-primary btn-sm" title="Save Order">
                <i class="bi bi-save"></i>
                Save Order
              </button>
              <button @click="showCreateModal" class="btn btn-success btn-sm" title="Create New File">
                <i class="bi bi-plus-circle"></i>
                New File
              </button>
            </div>
          </div>

          <!-- Filter/Search Bar -->
          <div class="row g-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input v-model="filterText" type="text" class="form-control" placeholder="Filter files and folders..."
                  @input="applyFilter" @keydown.escape="clearFilterCompletely">
                <button v-if="filterText" @click="clearFilterCompletely" class="btn btn-outline-secondary" type="button"
                  title="Clear filter">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <div class="col-auto">
              <div class="dropdown">
                <button ref="dropdownButton" class="btn btn-outline-secondary dropdown-toggle" type="button"
                  @click="toggleDropdown" title="Filter options">
                  <i class="bi bi-funnel"></i>
                  {{ selectedFilter }}
                </button>
                <ul ref="dropdownMenu" class="dropdown-menu" :class="{ show: dropdownOpen }">
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('All')">All</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('Files')">Files Only</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="selectFilter('Folders')">Folders Only</a></li>
                  <li>
                    <hr class="dropdown-divider">
                  </li>
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
              Showing {{ orderedItems.length }} results
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
          <div v-if="orderedItems.length === 0" class="text-center py-4">
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
            <!-- Show items in their dragged order -->
            <button v-for="(item, index) in orderedItems" :key="item.path" 
              @click="item.type === 'folder' ? openFolder(item) : openFile(item)"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :class="{ 
                'recently-created': item.type === 'file' && item.name === recentlyCreatedFile, 
                'draggable': isRootDirectory 
              }"
              :draggable="isRootDirectory"
              @dragstart="onDragStart($event, item, item.type, index)"
              @dragover="onDragOver($event, index, item.type)"
              @drop="onDrop($event, index, item.type)"
              @dragend="onDragEnd">
              <i v-if="isRootDirectory" class="bi bi-grip-vertical me-2 drag-handle"></i>
              <i v-if="item.type === 'folder'" class="bi bi-folder-fill me-3" style="color: #ffc107;"></i>
              <i v-else class="bi bi-file-text me-3" style="color: #0d6efd;"></i>
              <div class="flex-grow-1">
                <div class="fw-medium">
                  {{ item.name }}
                  <span v-if="item.type === 'file' && item.name === recentlyCreatedFile" class="badge bg-primary ms-2">New</span>
                  <span v-if="item.type === 'file' && item.name.startsWith('_')" 
                    title="If a file has an underscore at the beginning of the file name, it is a draft version."
                    class="badge bg-warning text-dark ms-2">Draft</span>
                  <span v-if="item.type === 'file' && item.hasExternalRefs" 
                    title="This file has an external reference." 
                    class="badge bg-success ms-2">External</span>
                </div>
                <small class="text-muted">{{ item.path }}</small>
              </div>
              <div v-if="item.type === 'file'" class="d-flex align-items-center gap-2">
                <button @click.stop="showDeleteModal(item)" class="btn btn-outline-danger btn-sm" title="Delete File">
                  <i class="bi bi-trash"></i>
                </button>
                <i class="bi bi-chevron-right"></i>
              </div>
              <i v-else class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create New File Modal -->
    <div v-if="showCreateFileModal" class="modal fade show d-block" tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);" @click.self="closeCreateFileModal"
      @keyup.escape="closeCreateFileModal">
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
              <input v-model="newFileName" ref="fileNameInput" type="text" class="form-control" id="fileName"
                placeholder="example.md" @keyup.enter="createNewFile" @input="updateDefaultContent">
              <div class="form-text">
                Supported extensions: .md
              </div>
            </div>

            <div class="mb-3">
              <label for="fileContent" class="form-label">Initial Content (Optional)</label>
              <textarea v-model="newFileContent" class="form-control" id="fileContent" rows="6"
                placeholder="Enter initial content for the file..." @keydown.ctrl.enter="createNewFile"></textarea>
              <div class="form-text">
                Press Ctrl+Enter to create the file quickly
              </div>
            </div>

            <div class="mb-3">
              <label for="commitMsg" class="form-label">Commit Message</label>
              <input v-model="newFileCommitMessage" type="text" class="form-control" id="commitMsg"
                placeholder="Add new file" @keydown.ctrl.enter="createNewFile">
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeCreateFileModal" type="button" class="btn btn-secondary">Cancel</button>
            <button @click="createNewFile" type="button" class="btn btn-success"
              :disabled="!newFileName.trim() || creatingFile">
              <span v-if="creatingFile">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating...
              </span>
              <span v-else>
                <i class="bi bi-plus-circle"></i>
                Create Draft
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete File Confirmation Modal -->
    <div v-if="showDeleteFileModal" class="modal fade show d-block" tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);" @click.self="closeDeleteFileModal"
      @keyup.escape="closeDeleteFileModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle text-warning"></i>
              Delete File
            </h5>
            <button @click="closeDeleteFileModal" type="button" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div v-if="deleteFileError" class="alert alert-danger" role="alert">
              {{ deleteFileError }}
            </div>

            <p class="mb-3">
              Are you sure you want to delete the file <strong>{{ fileToDelete?.name }}</strong>?
            </p>
            <p class="text-danger mb-3">
              <i class="bi bi-exclamation-circle"></i>
              This action cannot be undone.
            </p>

            <div class="mb-3">
              <label for="deleteCommitMsg" class="form-label">Commit Message</label>
              <input v-model="deleteFileCommitMessage" type="text" class="form-control" id="deleteCommitMsg"
                placeholder="Delete file" @keydown.enter="deleteFile">
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeDeleteFileModal" type="button" class="btn btn-secondary">Cancel</button>
            <button @click="deleteFile" type="button" class="btn btn-danger"
              :disabled="deletingFile">
              <span v-if="deletingFile">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Deleting...
              </span>
              <span v-else>
                <i class="bi bi-trash"></i>
                Delete File
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
    const loadingMessage = ref('')
    const error = ref('')
    const specDirectory = ref('')
    const files = ref([])
    const folders = ref([])
    const currentDirectory = ref('')
    const specsConfig = ref(null)
    const specTermsDirectory = ref('')

    // Drag and drop state
    const isDragMode = ref(false)
    const hasUnsavedChanges = ref(false)
    const draggedItems = ref([])
    const originalOrder = ref([])
    const isDragging = ref(false)

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

    // Delete file modal state
    const showDeleteFileModal = ref(false)
    const fileToDelete = ref(null)
    const deleteFileCommitMessage = ref('Delete file')
    const deletingFile = ref(false)
    const deleteFileError = ref('')

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

    // Combined items in drag order (only used in root directory)
    const orderedItems = computed(() => {
      if (!isRootDirectory.value) {
        // If not in root, use default order (folders first, then files)
        const items = []
        
        // Add filtered folders first
        filteredFolders.value.forEach(folder => {
          items.push({ ...folder, type: 'folder' })
        })
        
        // Then add filtered files
        filteredFiles.value.forEach(file => {
          items.push({ ...file, type: 'file' })
        })
        
        return items
      }

      // In root directory, use dragged order if available, otherwise initialize with current data
      if (draggedItems.value.length > 0) {
        const filtered = draggedItems.value.filter(item => {
          if (item.type === 'folder') {
            return filteredFolders.value.some(f => f.name === item.name)
          } else {
            return filteredFiles.value.some(f => f.name === item.name)
          }
        })
        
        return filtered;
      } else {
        // Initialize with default order - but only when files/folders are actually loaded
        if (files.value.length === 0 && folders.value.length === 0) {
          return [];
        }
        
        const items = []
        
        // Add filtered folders first  
        filteredFolders.value.forEach(folder => {
          items.push({ ...folder, type: 'folder' })
        })
        
        // Then add filtered files
        filteredFiles.value.forEach(file => {
          items.push({ ...file, type: 'file' })
        })
        
        // Set this as the initial drag items - but don't modify during computed execution
        // Use nextTick to avoid infinite loops
        if (isRootDirectory.value && items.length > 0) {
          nextTick(() => {
            if (draggedItems.value.length === 0) {
              draggedItems.value = [...items];
              originalOrder.value = [...items];
            }
          });
        }
        
        return items
      }
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
        loadingMessage.value = 'Loading repository configuration...'
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
        specsConfig.value = content
        // Get spec_directory from the first item in specs array
        if (Array.isArray(content.specs) && content.specs.length > 0) {
          specDirectory.value = content.specs[0].spec_directory || 'spec'
          specTermsDirectory.value = content.specs[0].spec_terms_directory || 'terms-definitions'
        } else {
          specDirectory.value = 'spec'
          specTermsDirectory.value = 'terms-definitions'
        }
        
        // Check if we have a directory query parameter to navigate to
        const targetDir = route.query.dir
        if (targetDir) {
          currentDirectory.value = decodeURIComponent(targetDir)
        } else {
          currentDirectory.value = specDirectory.value
        }
        
        await loadSpecFiles(currentDirectory.value)

      } catch (err) {
        console.error('Error loading specs config:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          error.value = 'specs.json file not found in repository root. Using default "specs" directory.'
          specDirectory.value = 'specs'
          specTermsDirectory.value = 'terms-definitions'
          
          // Check if we have a directory query parameter to navigate to
          const targetDir = route.query.dir
          if (targetDir) {
            currentDirectory.value = decodeURIComponent(targetDir)
          } else {
            currentDirectory.value = specDirectory.value
          }
          
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
        loadingMessage.value = 'Loading directory contents...'
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
        const textFileExtensions = ['.md']
        const filteredFiles = response.data
          .filter(file => file.type === 'file')
          .filter(file => textFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext)))

        // Check each file for external references and add hasExternalRefs property
        // Process files in batches to avoid overwhelming the API
        const batchSize = 5
        const filesWithExternalCheck = []

        loadingMessage.value = `Analyzing ${filteredFiles.length} files for external references...`

        for (let i = 0; i < filteredFiles.length; i += batchSize) {
          const batch = filteredFiles.slice(i, i + batchSize)
          const currentBatch = Math.floor(i / batchSize) + 1
          const totalBatches = Math.ceil(filteredFiles.length / batchSize)
          
          loadingMessage.value = `Checking batch ${currentBatch} of ${totalBatches} (${Math.min(i + batchSize, filteredFiles.length)}/${filteredFiles.length} files)...`
          
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
        
        // If we're in root directory and have specs config, apply saved order from markdown_paths
        if (isRootDirectory.value && specsConfig.value) {
          applySavedOrder();
        }
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
      // Don't navigate if we're in the middle of a drag operation
      if (isDragging.value) return;
      
      const encodedPath = encodeURIComponent(file.path)
      const encodedDir = encodeURIComponent(currentDirectory.value)
      router.push(`/editor/${props.owner}/${props.repo}/${props.branch}/${encodedPath}?dir=${encodedDir}`)
    }

    const openFolder = (folder) => {
      // Don't navigate if we're in the middle of a drag operation
      if (isDragging.value) return;
      
      recentlyCreatedFile.value = '' // Clear when navigating to different folder
      localStorage.removeItem('recentlyCreatedFile') // Also clear from localStorage
      hasUnsavedChanges.value = false // Reset unsaved changes when navigating away from root
      draggedItems.value = [] // Reset drag items when leaving root
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
        newFileContent.value = `[[def: term, alias1, alias2]]\n\n~ First paragraph\n\n~ Second paragraph\n`
      }
    }

    const createNewFile = async () => {
      if (!newFileName.value.trim()) {
        createFileError.value = 'Please enter a file name'
        return
      }

      // Add underscore prefix if not already present
      if (!newFileName.value.startsWith('_')) {
        newFileName.value = '_' + newFileName.value
      }

      // Validate file extension
      const allowedExtensions = ['.md']
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

        // Construct the file path
        const filePath = currentDirectory.value ?
          `${currentDirectory.value}/${newFileName.value}` :
          `${specDirectory.value}/${newFileName.value}`

        // Close modal
        closeCreateFileModal()

        // Navigate to the editor with new file parameters
        const encodedPath = encodeURIComponent(filePath)
        const encodedDir = encodeURIComponent(currentDirectory.value || specDirectory.value)
        const encodedContent = encodeURIComponent(newFileContent.value || '')
        const encodedCommitMessage = encodeURIComponent(newFileCommitMessage.value || 'Add new file')
        
        router.push(`/editor/${props.owner}/${props.repo}/${props.branch}/${encodedPath}?dir=${encodedDir}&new=true&content=${encodedContent}&commitMessage=${encodedCommitMessage}`)

      } catch (err) {
        console.error('Error navigating to new file editor:', err)
        createFileError.value = 'Failed to open file editor. Please try again.'
      } finally {
        creatingFile.value = false
      }
    }

    const showDeleteModal = (file) => {
      fileToDelete.value = file
      deleteFileCommitMessage.value = `Delete ${file.name}`
      deleteFileError.value = ''
      showDeleteFileModal.value = true
    }

    const closeDeleteFileModal = () => {
      showDeleteFileModal.value = false
      fileToDelete.value = null
      deleteFileCommitMessage.value = 'Delete file'
      deleteFileError.value = ''
    }

    const deleteFile = async () => {
      if (!fileToDelete.value) return

      try {
        deletingFile.value = true
        deleteFileError.value = ''

        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Get the current file to get its SHA
        const fileResponse = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fileToDelete.value.path}?ref=${props.branch}`,
          config
        )

        // Delete the file
        const deleteData = {
          message: deleteFileCommitMessage.value || `Delete ${fileToDelete.value.name}`,
          branch: props.branch,
          sha: fileResponse.data.sha
        }

        await axios.delete(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fileToDelete.value.path}`,
          {
            ...config,
            data: deleteData
          }
        )

        // Close modal
        closeDeleteFileModal()

        // Remove from current file list
        files.value = files.value.filter(f => f.name !== fileToDelete.value.name)
        
        // Also remove from dragged items if in root directory
        if (isRootDirectory.value) {
          draggedItems.value = draggedItems.value.filter(item => 
            !(item.type === 'file' && item.name === fileToDelete.value.name)
          )
          hasUnsavedChanges.value = true // Mark as changed since we removed an item
        }

        // Clear recently created file if it was the deleted file
        if (recentlyCreatedFile.value === fileToDelete.value.name) {
          recentlyCreatedFile.value = ''
          localStorage.removeItem('recentlyCreatedFile')
        }

      } catch (err) {
        console.error('Error deleting file:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        deleteFileError.value = 'Failed to delete file. Please try again.'
      } finally {
        deletingFile.value = false
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

    // Watch for directory changes to reset drag state when navigating
    watch(currentDirectory, (newDir, oldDir) => {
      // Only reset drag items when actually changing directories, not when files/folders update
      if (newDir !== oldDir) {
        console.log('Directory changed from', oldDir, 'to', newDir, '- resetting drag items');
        draggedItems.value = [];
        hasUnsavedChanges.value = false;
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
          hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
          draggedItems.value = []; // Reset drag items when navigating
          loadSpecFiles(parent);
        } else {
          hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
          draggedItems.value = []; // Reset drag items when navigating
          loadSpecFiles(root);
        }
      } else {
        hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
        draggedItems.value = []; // Reset drag items when navigating
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

    // Check if we're in the root directory
    const isRootDirectory = computed(() => {
      return normalizeDir(currentDirectory.value) === normalizeDir(specDirectory.value);
    });

    // Drag and drop methods
    const onDragStart = (event, item, type, index) => {
      if (!isRootDirectory.value) return;
      
      isDragging.value = true;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ 
        item, 
        type, 
        originalIndex: index
      }));
      event.target.style.opacity = '0.5';
    };

    const onDragOver = (event, index, type) => {
      if (!isRootDirectory.value) return;
      
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event, dropIndex, dropType) => {
      if (!isRootDirectory.value) return;
      
      event.preventDefault();
      
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      const draggedItem = dragData.item;
      const draggedType = dragData.type;
      const originalIndex = dragData.originalIndex;
      
      if (originalIndex !== dropIndex) {
        // Reorder the items
        const newItems = [...draggedItems.value];
        const [movedItem] = newItems.splice(originalIndex, 1);
        
        // Adjust target index if we removed an item before it
        let targetIndex = dropIndex;
        if (originalIndex < dropIndex) {
          targetIndex--;
        }
        
        newItems.splice(targetIndex, 0, movedItem);
        
        draggedItems.value = newItems;
        
        // Update files and folders arrays to maintain consistency
        const newFolders = [];
        const newFiles = [];
        
        draggedItems.value.forEach(item => {
          if (item.type === 'folder') {
            newFolders.push({ name: item.name, path: item.path });
          } else {
            const { type, ...fileItem } = item;
            newFiles.push(fileItem);
          }
        });
        
        folders.value = newFolders;
        files.value = newFiles;
        
        hasUnsavedChanges.value = true;
      }
    };

    const onDragEnd = (event) => {
      event.target.style.opacity = '1';
      // Small delay to prevent click event from firing immediately after drag
      setTimeout(() => {
        isDragging.value = false;
      }, 100);
    };

    const saveOrder = async () => {
      if (!isRootDirectory.value || !hasUnsavedChanges.value) return;
      
      try {
        loading.value = true;
        loadingMessage.value = 'Saving file order...';
        
        const token = localStorage.getItem('github_token');
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        };
        
        // Get current specs.json
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`,
          config
        );
        
        const currentContent = JSON.parse(atob(response.data.content));
        
        // Build markdown_paths array
        const markdownPaths = [];
        
        draggedItems.value.forEach(item => {
          if (item.type === 'folder') {
            // Special handling for spec_terms_directory
            if (item.name === specTermsDirectory.value) {
              markdownPaths.push('terms-and-definitions-intro.md');
            } else {
              markdownPaths.push(item.name);
            }
          } else {
            // Only add files that are NOT "terms-and-definitions-intro.md" 
            // since that filename is reserved for representing the terms directory
            if (item.name !== 'terms-and-definitions-intro.md') {
              markdownPaths.push(item.name);
            }
          }
        });
        
        // Update the specs configuration
        if (currentContent.specs && currentContent.specs.length > 0) {
          currentContent.specs[0].markdown_paths = markdownPaths;
        }
        
        // Save back to GitHub
        const updateData = {
          message: `Update file order in markdown_paths`,
          content: btoa(JSON.stringify(currentContent, null, 2)),
          branch: props.branch,
          sha: response.data.sha
        };
        
        await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json`,
          updateData,
          config
        );
        
        hasUnsavedChanges.value = false;
        originalOrder.value = [...draggedItems.value];
        
      } catch (err) {
        console.error('Error saving file order:', err);
        if (checkAuthAndRedirect(err)) {
          return;
        }
        error.value = 'Failed to save file order. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Apply saved order from specs.json markdown_paths
    const applySavedOrder = () => {
      if (!specsConfig.value?.specs?.[0]?.markdown_paths) {
        return; // No saved order, use default
      }
      
      const savedPaths = specsConfig.value.specs[0].markdown_paths;
      const orderedItems = [];
      
      // Process each item in the saved order
      savedPaths.forEach(path => {
        if (path === 'terms-and-definitions-intro.md') {
          // This represents the terms directory
          const termsFolder = folders.value.find(f => f.name === specTermsDirectory.value);
          if (termsFolder) {
            orderedItems.push({ ...termsFolder, type: 'folder' });
          }
        } else {
          // Check if it's a folder
          const folder = folders.value.find(f => f.name === path);
          if (folder) {
            orderedItems.push({ ...folder, type: 'folder' });
          } else {
            // It's a file
            const file = files.value.find(f => f.name === path);
            if (file) {
              orderedItems.push({ ...file, type: 'file' });
            }
          }
        }
      });
      
      // Add any items not in the saved order at the end
      folders.value.forEach(folder => {
        if (!orderedItems.find(item => item.type === 'folder' && item.name === folder.name)) {
          orderedItems.push({ ...folder, type: 'folder' });
        }
      });
      
      files.value.forEach(file => {
        if (!orderedItems.find(item => item.type === 'file' && item.name === file.name)) {
          orderedItems.push({ ...file, type: 'file' });
        }
      });
      
      // Set the ordered items
      if (orderedItems.length > 0) {
        draggedItems.value = orderedItems;
        originalOrder.value = [...orderedItems];
        console.log('Applied saved order:', orderedItems.map(item => `${item.name} (${item.type})`));
      }
    };

    return {
      loading,
      loadingMessage,
      error,
      specDirectory,
      files,
      folders,
      filteredFiles,
      filteredFolders,
      orderedItems,
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
      showDeleteModal,
      closeDeleteFileModal,
      deleteFile,
      showDeleteFileModal,
      fileToDelete,
      deleteFileCommitMessage,
      deletingFile,
      deleteFileError,
      toggleDropdown,
      selectFilter,
      setFilter,
      clearFilter,
      clearFilterCompletely,
      applyFilter,
      goUpDirectory,
      showGoUpButton,
      isRootDirectory,
      hasUnsavedChanges,
      isDragging,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      saveOrder
    }
  }
}
</script>

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

.badge.bg-warning {
  font-size: 0.7em;
}

/* Drag and drop styles */
.draggable {
  cursor: move;
}

.drag-handle {
  color: #6c757d;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.list-group-item.draggable:hover .drag-handle {
  color: #495057;
}

.list-group-item[draggable="true"]:hover {
  background-color: #f8f9fa;
  border-color: #0d6efd;
}

/* Delete button styling - keep it subtle until hover */
.btn-outline-danger.btn-sm {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.list-group-item:hover .btn-outline-danger.btn-sm {
  opacity: 1;
}

.list-group-item .btn-outline-danger.btn-sm {
  border: none;
  padding: 0.25rem 0.5rem;
}

.list-group-item .btn-outline-danger.btn-sm:hover {
  background-color: #dc3545;
  color: white;
}
</style>
