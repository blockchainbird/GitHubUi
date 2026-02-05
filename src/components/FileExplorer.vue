<template>
  <div :class="isOffcanvasMode ? '' : 'container mt-3'">
    <div :class="isOffcanvasMode ? '' : 'row justify-content-center'">
      <div :class="isOffcanvasMode ? '' : 'col-12 col-lg-10'">
        <div v-if="!isOffcanvasMode" class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-0">
              <i class="bi bi-folder"></i>
              Files
            </h2>

            <!-- <button @click="$router.push('/home')" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left"></i>
          Back to Home
        </button> -->
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
                  {{ currentDirectory }}
                </h5>
                <RepoInfo 
                  v-if="!isOffcanvasMode" 
                  :owner="owner" 
                  :repo="repo" 
                  :branch="branch"
                  :default-branch="defaultBranch"
                  @branch-click="showBranchSelector = true" />
                <div class="d-flex gap-2">
                  <button @click="showCreateModal" class="btn btn-primary btn-sm" title="Create New File">
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
                    <input v-model="filterText" type="text" class="form-control"
                      placeholder="Filter files and folders..." @input="applyFilter"
                      @keydown.escape="clearFilterCompletely">
                    <button v-if="filterText" @click="clearFilterCompletely" class="btn btn-outline-secondary"
                      type="button" title="Clear filter">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
                <!-- <div class="col-auto">
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
            </div> -->
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
              <button v-if="isRootDirectory && hasUnsavedChanges" @click="saveOrder" class="btn btn-primary btn-sm"
                title="Save Order">
                <i class="bi bi-save"></i>
                Save Order
              </button>
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
                <!-- Show items in their dragged order with smooth transitions -->
                <div v-if="isRootDirectory" class="sortable-container">
                  <div v-for="(item, index) in orderedItems" :key="item.path"
                    class="list-group-item list-group-item-action d-flex align-items-center" :class="{
                      'recently-created': item.type === 'file' && item.name === recentlyCreatedFile
                    }">
                    <i v-if="isRootDirectory" class="bi bi-grip-vertical me-2 drag-handle" title="Drag to reorder"
                      style="cursor: grab;"></i>
                    <button @click="handleItemClick(item, $event)" @contextmenu="handleItemRightClick(item, $event)"
                      class="flex-grow-1 btn btn-link text-start p-0 border-0 d-flex align-items-center text-decoration-none"
                      :title="item.type === 'file' ? 'Click to open, Ctrl+Click or Right-click to open in new tab' : ''">
                      <i v-if="item.type === 'folder'" class="bi bi-folder-fill me-3" style="color: #ffc107;"></i>
                      <i v-else class="bi bi-file-text me-3" style="color: #0d6efd;"></i>
                      <div class="flex-grow-1">
                        <div class="fw-medium">
                          {{ item.name }}
                          <span v-if="item.type === 'file' && item.name === recentlyCreatedFile"
                            class="badge bg-primary ms-2">New</span>
                          <span v-if="item.type === 'file' && item.name.startsWith('_')"
                            title="If a file has an underscore at the beginning of the file name, it is a draft version."
                            class="badge bg-warning text-dark ms-2">Draft</span>
                          <span v-if="item.type === 'file' && item.hasExternalRefs"
                            title="This file has an external reference." class="badge bg-success ms-2">External</span>
                        </div>
                        <small class="text-muted">{{ item.path }}</small>
                      </div>
                    </button>
                    <div v-if="item.type === 'file'" class="d-flex align-items-center gap-2">
                      <button @click.stop="showDeleteModal(item)" class="btn btn-outline-danger btn-sm"
                        title="Delete File">
                        <i class="bi bi-trash"></i>
                      </button>
                      <i class="bi bi-chevron-right"></i>
                    </div>
                    <i v-else class="bi bi-chevron-right"></i>
                  </div>
                </div>

                <!-- Non-sortable list for non-root directories -->
                <div v-else>
                  <div v-for="(item, index) in orderedItems" :key="item.path"
                    class="list-group-item list-group-item-action d-flex align-items-center" :class="{
                      'recently-created': item.type === 'file' && item.name === recentlyCreatedFile
                    }">
                    <button @click="handleItemClick(item, $event)" @contextmenu="handleItemRightClick(item, $event)"
                      class="flex-grow-1 btn btn-link text-start p-0 border-0 d-flex align-items-center text-decoration-none"
                      :title="item.type === 'file' ? 'Click to open, Ctrl+Click or Right-click to open in new tab' : ''">
                      <i v-if="item.type === 'folder'" class="bi bi-folder-fill me-3" style="color: #ffc107;"></i>
                      <i v-else class="bi bi-file-text me-3" style="color: #0d6efd;"></i>
                      <div class="flex-grow-1">
                        <div class="fw-medium">
                          {{ item.name }}
                          <span v-if="item.type === 'file' && item.name === recentlyCreatedFile"
                            class="badge bg-primary ms-2">New</span>
                          <span v-if="item.type === 'file' && item.name.startsWith('_')"
                            title="If a file has an underscore at the beginning of the file name, it is a draft version."
                            class="badge bg-warning text-dark ms-2">Draft</span>
                          <span v-if="item.type === 'file' && item.hasExternalRefs"
                            title="This file has an external reference." class="badge bg-success ms-2">External</span>
                        </div>
                        <small class="text-muted">{{ item.path }}</small>
                      </div>
                    </button>
                    <div v-if="item.type === 'file'" class="d-flex align-items-center gap-2">
                      <button @click.stop="showDeleteModal(item)" class="btn btn-outline-danger btn-sm"
                        title="Delete File">
                        <i class="bi bi-trash"></i>
                      </button>
                      <i class="bi bi-chevron-right"></i>
                    </div>
                    <i v-else class="bi bi-chevron-right"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Create New File Modal -->
        <div v-if="showCreateFileModal" class="modal fade show d-block" tabindex="-1"
          style="background-color: rgba(0,0,0,0.5);" @click.self="confirmAndCloseModal"
          @keyup.escape="confirmAndCloseModal">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="bi bi-plus-circle"></i>
                  Create New File
                </h5>
                <button @click="confirmAndCloseModal" type="button" class="btn-close"></button>
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
                <button @click="confirmAndCloseModal" type="button" class="btn btn-secondary">Cancel</button>
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

        <!-- Discard Changes Confirmation Modal -->
        <div v-if="showConfirmDiscardModal" class="modal fade show d-block" tabindex="-1"
          style="background-color: rgba(0,0,0,0.5);">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="bi bi-exclamation-triangle text-warning"></i>
                  Discard Changes?
                </h5>
                <button @click="showConfirmDiscardModal = false" type="button" class="btn-close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-3">
                  You have unsaved changes in the "Create New File" form. Are you sure you want to discard them?
                </p>
                <p class="text-muted mb-0">
                  <i class="bi bi-info-circle"></i>
                  This action cannot be undone.
                </p>
              </div>
              <div class="modal-footer">
                <button @click="showConfirmDiscardModal = false" type="button" class="btn btn-secondary">Keep Editing</button>
                <button @click="discardChangesAndClose" type="button" class="btn btn-danger">
                  <i class="bi bi-trash"></i>
                  Discard Changes
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
                <button @click="deleteFile" type="button" class="btn btn-danger" :disabled="deletingFile">
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

        <!-- Branch Selector Modal -->
        <BranchSelector
          :is-open="showBranchSelector"
          :owner="owner"
          :repo="repo"
          :current-branch="decodedBranch"
          @close="showBranchSelector = false"
          @branch-selected="handleBranchChange" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import Sortable from 'sortablejs'
import { addToVisitedRepos } from '../utils/visitedRepos.js'
import { getGitHubHeaders, addCacheBusting } from '../utils/apiUtils.js'
import { decodeBranchName, buildRoutePath, encodeBranchName } from '../utils/branchUtils.js'
import TermsPreview from './TermsPreview.vue'
import RepoInfo from './RepoInfo.vue'
import BranchSelector from './BranchSelector.vue'
import { secureTokenManager } from '../utils/secureTokenManager.js'
import { useDefaultBranch } from '../composables/useDefaultBranch.js'

export default {
  name: 'FileExplorer',
  components: { TermsPreview, RepoInfo, BranchSelector },
  props: {
    owner: String,
    repo: String,
    branch: String,
    isOffcanvasMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['file-selected', 'close-offcanvas'],
  setup(props, { emit }) {
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

    // Branch selector state
    const showBranchSelector = ref(false)

    // Fetch default branch
    const { defaultBranch } = useDefaultBranch(props)

    // Decode branch name to handle URL-encoded characters like slashes
    const decodedBranch = computed(() => {
      return decodeBranchName(props.branch)
    })

    // Fragment handling cleanup
    const fragmentCleanup = ref(null)

    // Drag and drop state - simplified for Sortable.js
    const hasUnsavedChanges = ref(false)
    const draggedItems = ref([])
    const originalOrder = ref([])
    const sortableInstance = ref(null)

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
    const hasUnsavedModalChanges = ref(false)
    const showConfirmDiscardModal = ref(false)

    // Delete file modal state
    const showDeleteFileModal = ref(false)
    const fileToDelete = ref(null)
    const deleteFileCommitMessage = ref('Delete file')
    const deletingFile = ref(false)
    const deleteFileError = ref('')

    // Computed properties for filtered results
    const filteredFiles = computed(() => {
      let result = files.value

      // Filter out terms-and-definitions-intro.md as it's only meant as a hook for the terms directory
      result = result.filter(file => file.name !== 'terms-and-definitions-intro.md')

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

      // In root directory, use dragged order if available, otherwise use default order
      if (draggedItems.value.length > 0) {
        // Filter dragged items to only show items that match current filters
        const filtered = draggedItems.value.filter(item => {
          if (item.type === 'folder') {
            return filteredFolders.value.some(f => f.name === item.name)
          } else {
            return filteredFiles.value.some(f => f.name === item.name)
          }
        })

        return filtered;
      } else {
        // Return default order - initialization happens elsewhere
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
    })

    // Initialize drag items for root directory
    const initializeDragItems = () => {
      if (!isRootDirectory.value || draggedItems.value.length > 0) {
        return
      }

      const items = []

      // Add folders first  
      folders.value.forEach(folder => {
        items.push({ ...folder, type: 'folder' })
      })

      // Then add files
      files.value.forEach(file => {
        items.push({ ...file, type: 'file' })
      })

      if (items.length > 0) {
        draggedItems.value = [...items]
        originalOrder.value = [...items]
      }
    }

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
        const token = secureTokenManager.getToken()
        console.log('GitHub token exists:', !!token)
        console.log('Props:', { owner: props.owner, repo: props.repo, branch: decodedBranch.value })

        const config = {
          headers: getGitHubHeaders(token)
        }

        // Try to get specs.json from repository root, with branch and cache-busting
        const specsUrl = addCacheBusting(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${decodedBranch.value}`
        )
        console.log('Loading specs config from:', specsUrl)

        const response = await axios.get(specsUrl, config)
        console.log('Specs config loaded successfully')

        // Decode base64 content
        const content = JSON.parse(atob(response.data.content))
        specsConfig.value = content
        console.log('Specs config content:', content)

        // Get spec_directory from the first item in specs array
        if (Array.isArray(content.specs) && content.specs.length > 0) {
          // Remove leading ./ if present to normalize the path
          const rawSpecDir = content.specs[0].spec_directory || 'spec'
          specDirectory.value = rawSpecDir.replace(/^\.\//, '')

          const rawTermsDir = content.specs[0].spec_terms_directory || 'terms-definitions'
          specTermsDirectory.value = rawTermsDir.replace(/^\.\//, '')
        } else {
          specDirectory.value = 'spec'
          specTermsDirectory.value = 'terms-definitions'
        }

        console.log('Spec directory set to:', specDirectory.value)
        console.log('Spec terms directory set to:', specTermsDirectory.value)

        // Check if we have a directory query parameter to navigate to
        const targetDir = route.query.dir
        if (targetDir) {
          currentDirectory.value = decodeURIComponent(targetDir)
          console.log('Using target directory from query:', currentDirectory.value)
        } else {
          currentDirectory.value = specDirectory.value
          console.log('Using default spec directory:', currentDirectory.value)
        }

        console.log('About to load spec files from:', currentDirectory.value)
        await loadSpecFiles(currentDirectory.value)

      } catch (err) {
        console.error('Error loading specs config:', err)
        console.error('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        })
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          console.log('specs.json not found, using default directory')
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

          console.log('Loading files from default directory:', currentDirectory.value)
          await loadSpecFiles(currentDirectory.value)
        } else {
          error.value = 'Failed to load repository configuration: ' + (err.response?.data?.message || err.message)
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

    const loadSpecFiles = async (directory, retryCount = 0) => {
      try {
        loading.value = true
        loadingMessage.value = retryCount > 0 ?
          `Refreshing directory contents (attempt ${retryCount + 1})...` :
          'Loading directory contents...'
        error.value = ''

        console.log('Loading files from directory:', directory, 'retry count:', retryCount)

        const token = secureTokenManager.getToken()
        const config = {
          headers: getGitHubHeaders(token)
        }

        // Always add cache-busting to ensure fresh data
        const url = addCacheBusting(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${directory}?ref=${decodedBranch.value}`
        )

        console.log('Making API request to:', url)
        const response = await axios.get(url, config)
        console.log('API response received:', response.data?.length, 'items')

        // Folders
        folders.value = response.data
          .filter(item => item.type === 'dir')
          .map(folder => ({
            name: folder.name,
            path: folder.path
          }))
        console.log('Found folders:', folders.value.length)

        // Files
        const textFileExtensions = ['.md']
        const filteredFiles = response.data
          .filter(file => file.type === 'file')
          .filter(file => textFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext)))

        console.log('Found .md files:', filteredFiles.length)

        // Check each file for external references
        const filesWithExternalRefs = await Promise.all(
          filteredFiles.map(async (file) => {
            const hasExternalRefs = await checkForExternalReferences(file.download_url, config)
            return {
              name: file.name,
              path: file.path,
              sha: file.sha,
              download_url: file.download_url,
              hasExternalRefs
            }
          })
        )

        files.value = filesWithExternalRefs

        console.log('Files set in reactive array:', files.value.length)
        currentDirectory.value = directory

        console.log('Current directory set to:', currentDirectory.value)
        console.log('Is root directory:', isRootDirectory.value)

        // If we're in root directory and have specs config, apply saved order from markdown_paths
        if (isRootDirectory.value && specsConfig.value) {
          console.log('Applying saved order...')
          applySavedOrder();
        } else {
          // Initialize drag items for root directory if no saved order
          initializeDragItems()
        }
      } catch (err) {
        console.error('Error loading spec files:', err)
        console.error('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        })
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          error.value = `Spec directory "${directory}" not found in repository.`
        } else {
          error.value = 'Failed to load spec files: ' + (err.response?.data?.message || err.message)
        }
      } finally {
        loading.value = false

        // Reinitialize Sortable after files are loaded
        setTimeout(() => {
          forceReinitializeSortable()
        }, 100)
      }
    }

    // Helper function to refresh file list after deletion with retry logic
    const refreshAfterDeletion = async (deletedFileName, maxRetries = 3) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          loadingMessage.value = `Verifying deletion... (attempt ${attempt + 1}/${maxRetries})`
          // Wait before next attempt (simpler fixed delay)
          const delay = 2000 // 2 seconds
          console.log(`File ${deletedFileName} still visible, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        await loadSpecFiles(currentDirectory.value, attempt)

        // Check if the deleted file is still in the list
        const fileStillExists = files.value.some(f => f.name === deletedFileName)

        if (!fileStillExists) {
          // File successfully removed from the list
          console.log(`File ${deletedFileName} successfully removed after ${attempt + 1} attempts`)
          return
        }
      }

      // If we get here, the file is still visible after all retries
      console.warn(`File ${deletedFileName} still visible after ${maxRetries} attempts. This may be due to GitHub API caching.`)
      loadingMessage.value = ''
    }

    // Helper function to refresh file list after creation with retry logic
    const refreshAfterCreation = async (createdFileName, maxRetries = 5) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          loadingMessage.value = `Looking for new file... (attempt ${attempt + 1}/${maxRetries})`
          // Wait before next attempt with increasing delay
          const delay = Math.min(1000 + (attempt * 1000), 5000) // 1s, 2s, 3s, 4s, 5s max
          console.log(`File ${createdFileName} not visible yet, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        await loadSpecFiles(currentDirectory.value, attempt)

        // Check if the created file is now in the list
        const fileExists = files.value.some(f => f.name === createdFileName)

        if (fileExists) {
          // File successfully found in the list
          console.log(`File ${createdFileName} successfully found after ${attempt + 1} attempts`)
          recentlyCreatedFile.value = createdFileName
          loadingMessage.value = ''
          return
        }
      }

      // If we get here, the file is still not visible after all retries
      console.warn(`File ${createdFileName} still not visible after ${maxRetries} attempts. This may be due to GitHub API caching.`)
      loadingMessage.value = ''
    }

    // Helper function to refresh file list after rename (publish/unpublish) with retry logic
    const refreshAfterRename = async (renameInfo, maxRetries = 5) => {
      const { oldName, newName, action } = renameInfo

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          loadingMessage.value = `Verifying ${action} operation... (attempt ${attempt + 1}/${maxRetries})`
          // Wait before next attempt with increasing delay
          const delay = Math.min(1000 + (attempt * 1000), 5000) // 1s, 2s, 3s, 4s, 5s max
          console.log(`File rename from ${oldName} to ${newName} not reflected yet, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        await loadSpecFiles(currentDirectory.value, attempt)

        // Check if the rename was successful: old file gone, new file present
        const oldFileExists = files.value.some(f => f.name === oldName)
        const newFileExists = files.value.some(f => f.name === newName)

        if (!oldFileExists && newFileExists) {
          // Rename successfully completed
          console.log(`File rename from ${oldName} to ${newName} successfully completed after ${attempt + 1} attempts`)
          recentlyCreatedFile.value = newName
          loadingMessage.value = ''
          return
        }
      }

      // If we get here, the rename is still not reflected after all retries
      console.warn(`File rename from ${oldName} to ${newName} still not reflected after ${maxRetries} attempts. This may be due to GitHub API caching.`)
      loadingMessage.value = ''
    }

    const openFile = (file) => {
      if (props.isOffcanvasMode) {
        // In offcanvas mode, emit an event with file info
        emit('file-selected', {
          file,
          owner: props.owner,
          repo: props.repo,
          branch: decodedBranch.value,
          directory: currentDirectory.value
        })
        return
      }

      const encodedPath = encodeURIComponent(file.path)
      const encodedDir = encodeURIComponent(currentDirectory.value)
      router.push(buildRoutePath('/editor', props.owner, props.repo, decodedBranch.value, `${encodedPath}?dir=${encodedDir}`))
    }

    const openFileInNewTab = (file) => {
      const encodedPath = encodeURIComponent(file.path)
      const encodedDir = encodeURIComponent(currentDirectory.value)
      const url = router.resolve(buildRoutePath('/editor', props.owner, props.repo, decodedBranch.value, `${encodedPath}?dir=${encodedDir}`))
      window.open(url.href, '_blank')
    }

    const handleItemClick = (item, event) => {
      // Check if it's a ctrl+click (or cmd+click on Mac)
      const isNewTabClick = event.ctrlKey || event.metaKey

      if (item.type === 'folder') {
        openFolder(item)
      } else {
        if (isNewTabClick) {
          if (props.isOffcanvasMode) {
            // In offcanvas mode, emit an event for new tab opening
            emit('file-selected', {
              file: item,
              owner: props.owner,
              repo: props.repo,
              branch: decodedBranch.value,
              directory: currentDirectory.value,
              newTab: true
            })
          } else {
            openFileInNewTab(item)
          }
        } else {
          openFile(item)
        }
      }
    }

    const handleItemRightClick = (item, event) => {
      event.preventDefault()
      if (item.type === 'file') {
        if (props.isOffcanvasMode) {
          // In offcanvas mode, emit an event for new tab opening
          emit('file-selected', {
            file: item,
            owner: props.owner,
            repo: props.repo,
            branch: decodedBranch.value,
            directory: currentDirectory.value,
            newTab: true
          })
        } else {
          openFileInNewTab(item)
        }
      }
    }

    const openFolder = (folder) => {
      recentlyCreatedFile.value = '' // Clear when navigating to different folder
      localStorage.removeItem('recentlyCreatedFile') // Also clear from localStorage
      hasUnsavedChanges.value = false // Reset unsaved changes when navigating away from root
      draggedItems.value = [] // Reset drag items when leaving root

      // Update URL with new directory
      const encodedDir = encodeURIComponent(folder.path)
      router.push(buildRoutePath('/files', props.owner, props.repo, decodedBranch.value) + `?dir=${encodedDir}`)
    }

    const showCreateModal = async () => {
      showCreateFileModal.value = true
      hasUnsavedModalChanges.value = false
      await nextTick()
      if (fileNameInput.value) {
        fileNameInput.value.focus()
      }
    }

    // Watch for changes in the create file modal fields
    watch(() => [newFileName.value, newFileContent.value, newFileCommitMessage.value], () => {
      if (showCreateFileModal.value) {
        // Mark as unsaved if any field has meaningful content
        hasUnsavedModalChanges.value = !!(
          newFileName.value.trim() ||
          newFileContent.value.trim() ||
          (newFileCommitMessage.value && newFileCommitMessage.value !== 'Add new file')
        )
      }
    })

    const confirmAndCloseModal = () => {
      if (hasUnsavedModalChanges.value) {
        showConfirmDiscardModal.value = true
      } else {
        closeCreateFileModal()
      }
    }

    const closeCreateFileModal = () => {
      showCreateFileModal.value = false
      hasUnsavedModalChanges.value = false
      newFileName.value = ''
      newFileContent.value = ''
      newFileCommitMessage.value = 'Add new file'
      createFileError.value = ''
    }

    const discardChangesAndClose = () => {
      showConfirmDiscardModal.value = false
      closeCreateFileModal()
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

        // Capture the values before closing the modal (which resets them)
        const contentToPass = newFileContent.value || ''
        const commitMessageToPass = newFileCommitMessage.value || 'Add new file'

        // Navigate to the editor with new file parameters
        const encodedPath = encodeURIComponent(filePath)
        const encodedDir = encodeURIComponent(currentDirectory.value || specDirectory.value)
        const encodedContent = encodeURIComponent(contentToPass)
        const encodedCommitMessage = encodeURIComponent(commitMessageToPass)

        const finalUrl = buildRoutePath('/editor', props.owner, props.repo, decodedBranch.value, `${encodedPath}?dir=${encodedDir}&new=true&content=${encodedContent}&commitMessage=${encodedCommitMessage}`)

        // Close modal AFTER capturing the values
        closeCreateFileModal()

        router.push(finalUrl)

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

      // Store file info before starting deletion to prevent null reference errors
      const fileInfo = {
        name: fileToDelete.value.name,
        path: fileToDelete.value.path
      }

      try {
        deletingFile.value = true
        deleteFileError.value = ''

        const token = secureTokenManager.getToken()
        const config = {
          headers: getGitHubHeaders(token)
        }

        // Get the current file to get its SHA with cache-busting
        const fileUrl = addCacheBusting(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fileInfo.path}?ref=${decodedBranch.value}`
        )
        const fileResponse = await axios.get(fileUrl, config)

        // Delete the file
        const deleteData = {
          message: deleteFileCommitMessage.value || `Delete ${fileInfo.name}`,
          branch: decodedBranch.value,
          sha: fileResponse.data.sha
        }

        await axios.delete(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fileInfo.path}`,
          {
            ...config,
            data: deleteData
          }
        )

        // Close modal
        closeDeleteFileModal()

        // Clear recently created file if it was the deleted file
        if (recentlyCreatedFile.value === fileInfo.name) {
          recentlyCreatedFile.value = ''
          localStorage.removeItem('recentlyCreatedFile')
        }

        // Store the deleted file name for retry logic
        const deletedFileName = fileInfo.name

        // Optimistically remove the file from UI immediately for better UX
        files.value = files.value.filter(f => f.name !== deletedFileName)

        // Also remove from dragged items if in root directory
        if (isRootDirectory.value) {
          draggedItems.value = draggedItems.value.filter(item =>
            !(item.type === 'file' && item.name === deletedFileName)
          )
        }

        // Refresh the file list with retry logic to handle GitHub API caching
        // This runs in background to ensure consistency
        setTimeout(() => {
          refreshAfterDeletion(deletedFileName).catch(err => {
            console.error('Error during post-deletion refresh:', err)
            // If refresh fails, just log it - don't reload since the optimistic update already worked
          })
        }, 1000) // Start retry check after 1 second

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

        // Check if we have a recently renamed file (publish/unpublish operation)
        const storedRenameInfo = localStorage.getItem('recentlyRenamedFile')
        if (storedRenameInfo) {
          try {
            const renameInfo = JSON.parse(storedRenameInfo)
            console.log('Recently renamed file detected, refreshing with retry logic...', renameInfo)
            refreshAfterRename(renameInfo).catch(err => {
              console.error('Error during post-rename refresh:', err)
              // Fallback to simple refresh if retry logic fails
              loadSpecFiles(currentDirectory.value || specDirectory.value).catch(fallbackErr => {
                console.error('Fallback refresh also failed:', fallbackErr)
              })
            })
            // Clear the rename info after handling
            localStorage.removeItem('recentlyRenamedFile')
            return
          } catch (parseErr) {
            console.error('Error parsing recentlyRenamedFile:', parseErr)
            localStorage.removeItem('recentlyRenamedFile')
          }
        }

        // Check if we have a recently created file that might not be in the current list
        const storedRecentFile = localStorage.getItem('recentlyCreatedFile')
        if (storedRecentFile && !files.value.some(f => f.name === storedRecentFile)) {
          console.log('Recently created file not found in list, refreshing with retry logic...')
          refreshAfterCreation(storedRecentFile).catch(err => {
            console.error('Error during post-creation refresh:', err)
            // Fallback to simple refresh if retry logic fails
            loadSpecFiles(currentDirectory.value || specDirectory.value).catch(fallbackErr => {
              console.error('Fallback refresh also failed:', fallbackErr)
            })
          })
        }
      }
    }

    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(props.owner, props.repo, decodedBranch.value, defaultBranch.value)

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

      // Check if we have a recently renamed file in localStorage
      const storedRenameInfo = localStorage.getItem('recentlyRenamedFile')
      if (storedRenameInfo) {
        try {
          const renameInfo = JSON.parse(storedRenameInfo)
          console.log('Found recentlyRenamedFile on mount:', renameInfo)
          // Auto-clear after 30 seconds to give user time to navigate back
          setTimeout(() => {
            localStorage.removeItem('recentlyRenamedFile')
          }, 30000)
        } catch (parseErr) {
          console.error('Error parsing recentlyRenamedFile on mount:', parseErr)
          localStorage.removeItem('recentlyRenamedFile')
        }
      }

      // Initialize Sortable.js after DOM is ready
      nextTick(() => {
        const sortableContainer = document.querySelector('.sortable-container');
        if (sortableContainer) {
          initializeSortable()
        }
      })
    })

    // Watch file list for changes and reinitialize sortable (disabled to prevent conflicts)
    // watch(() => [files.value, folders.value], () => {
    //   nextTick(() => {
    //     const sortableContainer = document.querySelector('.sortable-container');
    //     if (sortableContainer && sortableInstance.value) {
    //       sortableInstance.value.destroy()
    //       initializeSortable()
    //     }
    //   })
    // }, { deep: true })

    // Watch for when user navigates back to this component  
    watch(() => route.path, (newPath, oldPath) => {
      // If we're on the file explorer route and the path changed
      if (newPath.includes('/files/') && oldPath && !oldPath.includes('/files/')) {
        console.log('Navigating back to file explorer, refreshing file list with retry logic...')
        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          if (currentDirectory.value || specDirectory.value) {

            // Check if we have a recently renamed file (publish/unpublish operation)
            const storedRenameInfo = localStorage.getItem('recentlyRenamedFile')
            if (storedRenameInfo) {
              try {
                const renameInfo = JSON.parse(storedRenameInfo)
                console.log('Recently renamed file detected in route watcher, refreshing...', renameInfo)
                refreshAfterRename(renameInfo).catch(err => {
                  console.error('Error during post-navigation refresh with rename logic:', err)
                  // Fallback to simple refresh with retry
                  loadSpecFiles(currentDirectory.value || specDirectory.value, 0).catch(fallbackErr => {
                    console.error('Fallback refresh also failed:', fallbackErr)
                  })
                })
                // Clear the rename info after handling
                localStorage.removeItem('recentlyRenamedFile')
                return
              } catch (parseErr) {
                console.error('Error parsing recentlyRenamedFile in route watcher:', parseErr)
                localStorage.removeItem('recentlyRenamedFile')
              }
            }

            const storedRecentFile = localStorage.getItem('recentlyCreatedFile')
            if (storedRecentFile) {
              // If we have a recently created file, use creation retry logic
              refreshAfterCreation(storedRecentFile).catch(err => {
                console.error('Error during post-navigation refresh with creation logic:', err)
                // Fallback to simple refresh with retry
                loadSpecFiles(currentDirectory.value || specDirectory.value, 0).catch(fallbackErr => {
                  console.error('Fallback refresh also failed:', fallbackErr)
                })
              })
            } else {
              // Use regular retry logic for general refresh
              loadSpecFiles(currentDirectory.value || specDirectory.value, 0).catch(err => {
                console.error('Error during post-navigation refresh:', err)
              })
            }
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

    // Watch for query parameter changes (directory navigation)
    watch(() => route.query.dir, (newDir, oldDir) => {
      if (newDir && newDir !== oldDir && currentDirectory.value !== newDir) {
        console.log('Query dir parameter changed, loading new directory:', newDir)
        const decodedDir = decodeURIComponent(newDir)
        loadSpecFiles(decodedDir)
      }
    })

    /**
     * Watch for branch changes from the branch selector
     * Reloads the entire component state when branch changes
     */
    watch(() => props.branch, (newBranch, oldBranch) => {
      if (newBranch && oldBranch && newBranch !== oldBranch) {
        console.log('Branch changed from', oldBranch, 'to', newBranch, '- reloading data')
        // Reset state
        error.value = ''
        loading.value = true
        currentDirectory.value = ''
        files.value = []
        folders.value = []
        draggedItems.value = []
        hasUnsavedChanges.value = false
        
        // Update visited repos with new branch
        addToVisitedRepos(props.owner, props.repo, decodedBranch.value, defaultBranch.value)
        
        // Reload specs config and files
        loadSpecsConfig()
      }
    })

    // Clean up event listener
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Clean up fragment handling
      if (fragmentCleanup.value) {
        fragmentCleanup.value()
      }

      // Clean up Sortable instance
      if (sortableInstance.value) {
        sortableInstance.value.destroy()
        sortableInstance.value = null
      }
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

          // Update URL with new directory
          const encodedDir = encodeURIComponent(parent)
          router.push(buildRoutePath('/files', props.owner, props.repo, decodedBranch.value) + `?dir=${encodedDir}`)
        } else {
          hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
          draggedItems.value = []; // Reset drag items when navigating

          // Update URL with root directory
          const encodedDir = encodeURIComponent(root)
          router.push(buildRoutePath('/files', props.owner, props.repo, decodedBranch.value) + `?dir=${encodedDir}`)
        }
      } else {
        hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
        draggedItems.value = []; // Reset drag items when navigating

        // Update URL with root directory
        const encodedDir = encodeURIComponent(root)
        router.push(buildRoutePath('/files', props.owner, props.repo, decodedBranch.value) + `?dir=${encodedDir}`)
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

    // Sortable.js setup for drag and drop
    const initializeSortable = async () => {
      if (!isRootDirectory.value) {
        console.log('Skipping sortable initialization - not in root directory');
        return;
      }

      await nextTick(); // Ensure DOM is updated

      const sortableContainer = document.querySelector('.sortable-container');
      if (!sortableContainer) {
        console.log('Sortable container not found, skipping initialization');
        return;
      }

      // Destroy existing instance if it exists
      if (sortableInstance.value) {
        console.log('Destroying existing sortable instance');
        sortableInstance.value.destroy();
        sortableInstance.value = null;
      }

      console.log('Initializing new sortable instance');
      sortableInstance.value = Sortable.create(sortableContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        handle: '.drag-handle',
        onStart: () => {
          console.log('Sortable drag started');
          // Store original order for comparison
          originalOrder.value = [...draggedItems.value];
        },
        onEnd: (evt) => {
          console.log('Sortable drag ended', { oldIndex: evt.oldIndex, newIndex: evt.newIndex });
          const { oldIndex, newIndex } = evt;

          if (oldIndex !== newIndex) {
            console.log('Order changed, reordering items...');
            // Reorder the items
            const newItems = [...draggedItems.value];
            const [movedItem] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, movedItem);

            console.log('Old order:', draggedItems.value.map(i => i.name));
            console.log('New order:', newItems.map(i => i.name));

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
            console.log('Unsaved changes flag set to true');
          } else {
            console.log('No order change detected');
          }
        }
      });

      console.log('Sortable instance created successfully');
    };

    // Force reinitialize function that can be called manually
    const forceReinitializeSortable = async () => {
      console.log('Force reinitializing Sortable...');
      await nextTick();
      await initializeSortable();
    };

    // Watch for changes that require re-initializing sortable
    watch([isRootDirectory, () => draggedItems.value.length], () => {
      if (isRootDirectory.value && draggedItems.value.length > 0) {
        setTimeout(() => {
          initializeSortable();
        }, 100);
      }
    }, { immediate: false });

    // Refresh order with retry logic after saving
    const refreshOrderWithRetry = async (maxRetries = 3) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Retry ${attempt + 1}: Refreshing order after save...`)
            // Wait before retry with increasing delay
            const delay = 1500 + (attempt * 1000) // 1.5s, 2.5s, 3.5s
            await new Promise(resolve => setTimeout(resolve, delay))
          } else {
            // First attempt with initial delay
            await new Promise(resolve => setTimeout(resolve, 1500))
          }

          // Reload specs config first to get fresh order data
          await loadSpecsConfig()

          // Then reload files which will apply the updated order
          await loadSpecFiles(currentDirectory.value, attempt)

          // If we get here without error, break out of retry loop
          console.log(`Order refresh successful on attempt ${attempt + 1}`)

          // Reinitialize Sortable after successful refresh
          setTimeout(() => {
            forceReinitializeSortable()
          }, 100)

          return

        } catch (refreshErr) {
          console.error(`Order refresh attempt ${attempt + 1} failed:`, refreshErr)
          if (attempt === maxRetries - 1) {
            console.error('All order refresh attempts failed')
          }
        }
      }
    }

    const saveOrder = async () => {
      if (!isRootDirectory.value || !hasUnsavedChanges.value) return

      try {
        loading.value = true
        loadingMessage.value = 'Saving file order...'

        console.log('Saving order for items:', draggedItems.value.map(item => `${item.name} (${item.type})`))

        const token = secureTokenManager.getToken()
        const config = {
          headers: getGitHubHeaders(token)
        }

        // Get current specs.json with cache-busting
        const specsUrl = addCacheBusting(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${decodedBranch.value}`
        )
        const response = await axios.get(specsUrl, config)

        const currentContent = JSON.parse(atob(response.data.content))

        // Build markdown_paths array
        const markdownPaths = []

        draggedItems.value.forEach(item => {
          if (item.type === 'folder') {
            // Special handling for spec_terms_directory
            if (item.name === specTermsDirectory.value) {
              markdownPaths.push('terms-and-definitions-intro.md')
            } else {
              markdownPaths.push(item.name)
            }
          } else {
            // Only add files that are NOT "terms-and-definitions-intro.md" 
            // since that filename is reserved for representing the terms directory
            if (item.name !== 'terms-and-definitions-intro.md') {
              markdownPaths.push(item.name)
            }
          }
        })

        console.log('Generated markdown_paths:', markdownPaths)

        // Update the specs configuration
        if (currentContent.specs && currentContent.specs.length > 0) {
          currentContent.specs[0].markdown_paths = markdownPaths
          console.log('Updated specs config with new markdown_paths')
        }

        // Save back to GitHub
        const updateData = {
          message: `Update file order in markdown_paths`,
          content: btoa(JSON.stringify(currentContent, null, 2)),
          branch: decodedBranch.value,
          sha: response.data.sha
        };

        await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json`,
          updateData,
          config
        );

        hasUnsavedChanges.value = false
        originalOrder.value = [...draggedItems.value]

        // Force refresh with retry logic to ensure we get the updated order
        refreshOrderWithRetry()

        // Also force reinitialize after a short delay to ensure everything is ready
        setTimeout(() => {
          forceReinitializeSortable()
        }, 2000)

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
        console.log('No saved order found in specs.json, using default order')
        return // No saved order, use default
      }

      const savedPaths = specsConfig.value.specs[0].markdown_paths
      console.log('Applying saved order from specs.json:', savedPaths)
      const orderedItems = []

      // Process each item in the saved order
      savedPaths.forEach(path => {
        if (path === 'terms-and-definitions-intro.md') {
          // This represents the terms directory
          const termsFolder = folders.value.find(f => f.name === specTermsDirectory.value)
          if (termsFolder) {
            orderedItems.push({ ...termsFolder, type: 'folder' })
          }
        } else {
          // Check if it's a folder
          const folder = folders.value.find(f => f.name === path)
          if (folder) {
            orderedItems.push({ ...folder, type: 'folder' })
          } else {
            // It's a file
            const file = files.value.find(f => f.name === path)
            if (file) {
              orderedItems.push({ ...file, type: 'file' })
            }
          }
        }
      })

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
        draggedItems.value = orderedItems
        originalOrder.value = [...orderedItems]
        console.log('Applied saved order:', orderedItems.map(item => `${item.name} (${item.type})`))
        console.log('Updated draggedItems.value length:', draggedItems.value.length)
      } else {
        console.log('No items found to apply saved order')
      }
    };

    /**
     * Handles branch change from the branch selector
     * Navigates to the same route with the new branch
     */
    const handleBranchChange = (newBranch) => {
      const encodedBranch = encodeBranchName(newBranch)
      const newPath = buildRoutePath('/files', props.owner, props.repo, encodedBranch)
      router.push(newPath)
    }

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
      openFileInNewTab,
      handleItemClick,
      handleItemRightClick,
      currentDirectory,
      showCreateFileModal,
      newFileName,
      newFileContent,
      newFileCommitMessage,
      creatingFile,
      createFileError,
      fileNameInput,
      showCreateModal,
      confirmAndCloseModal,
      closeCreateFileModal,
      createNewFile,
      updateDefaultContent,
      hasUnsavedModalChanges,
      showConfirmDiscardModal,
      discardChangesAndClose,
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
      initializeSortable,
      forceReinitializeSortable,
      saveOrder,
      showBranchSelector,
      handleBranchChange,
      decodedBranch,
      defaultBranch
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

/* Drag and drop styles - Sortable.js */
.drag-handle {
  color: #6c757d;
  cursor: grab;
  padding: 0.25rem;
  border-radius: 3px;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.drag-handle:hover {
  background-color: #e9ecef;
  color: #495057;
  opacity: 1;
  transform: scale(1.1);
}

.drag-handle:active {
  cursor: grabbing;
  background-color: #dee2e6;
  transform: scale(1.05);
}

/* Show drag handles on item hover */
.list-group-item:hover .drag-handle {
  opacity: 1;
}

/* Sortable.js default classes */
.sortable-ghost {
  opacity: 0.6;
  background-color: #f8f9fa;
  border: 2px dashed #6c757d;
}

.sortable-chosen {
  cursor: grabbing;
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(2deg);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

@keyframes moved-item-highlight {
  0% {
    background-color: #dbeafe !important;
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6);
    transform: scale(1.05) translateY(-2px);
  }

  30% {
    transform: scale(1.02) translateY(-1px);
  }

  60% {
    background-color: #eff6ff !important;
    transform: scale(1.01) translateY(0);
  }

  100% {
    background-color: #f0f9ff !important;
    border-color: #0ea5e9 !important;
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.4);
    transform: scale(1) translateY(0);
  }
}

/* Drop zone indicators */
.drop-zone-indicator {
  position: relative;
  height: 8px;
  margin: 2px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.drop-zone-before {
  margin-top: 0;
  margin-bottom: 4px;
}

.drop-zone-after {
  margin-top: 4px;
  margin-bottom: 0;
}

.drop-line {
  position: absolute;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #4caf50);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.6);
  animation: pulse-line 1.5s ease-in-out infinite;
}

.drop-text {
  background-color: #2196f3;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  z-index: 11;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse-text 1.5s ease-in-out infinite;
}

/* Animations */
@keyframes pulse-line {

  0%,
  100% {
    opacity: 0.8;
    transform: scaleY(1);
  }

  50% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}

@keyframes pulse-text {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
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
