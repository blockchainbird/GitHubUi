<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <!-- Repository Info Row -->
        <div class="repository-info d-flex align-items-center text-muted">
          <i class="bi bi-github me-2"></i>
          <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
          <span class="mx-2">•</span>
          <span class="fs-6 badge bg-secondary">{{ branch }}</span>
        </div>
      </h2>
      <div>
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
              Spec Directory: {{ currentDirectory }}
            </h5>
            <div class="d-flex gap-2">
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

          <div v-else class="list-group list-group-flush" @dragover="onListDragOver" @drop="onListDrop">
            <!-- Show items in their dragged order with smooth transitions -->
            <transition-group name="file-list" tag="div" class="file-list-container">
              <div v-for="(item, index) in orderedItems" :key="item.path" class="position-relative file-item-wrapper">
                <!-- Drop zone indicator at the top -->
                <div v-if="isRootDirectory && isDragging && dragOverIndex === index && dragPosition === 'before'"
                  class="drop-zone-indicator drop-zone-before">
                  <div class="drop-line"></div>
                  <span class="drop-text">Drop here</span>
                </div>

                <button @click="item.type === 'folder' ? openFolder(item) : openFile(item)"
                  class="list-group-item list-group-item-action d-flex align-items-center" :class="{
                    'recently-created': item.type === 'file' && item.name === recentlyCreatedFile,
                    'recently-moved': recentlyMovedItem && recentlyMovedItem.path === item.path,
                    'drag-over': isRootDirectory && isDragging && dragOverIndex === index && dragPosition === 'on',
                    'being-dragged': isRootDirectory && isDragging && draggedIndex === index
                  }" @dragover="onDragOver($event, index, item.type)" @drop="onDrop($event, index, item.type)"
                  @dragenter="onDragEnter($event, index)" @dragleave="onDragLeave($event)">
                  <i v-if="isRootDirectory" class="bi bi-grip-vertical me-2 drag-handle" draggable="true"
                    @dragstart="onDragStart($event, item, item.type, index)" @dragend="onDragEnd" @click.stop></i>
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
                  <div v-if="item.type === 'file'" class="d-flex align-items-center gap-2">
                    <button @click.stop="showDeleteModal(item)" class="btn btn-outline-danger btn-sm"
                      title="Delete File">
                      <i class="bi bi-trash"></i>
                    </button>
                    <i class="bi bi-chevron-right"></i>
                  </div>
                  <i v-else class="bi bi-chevron-right"></i>
                </button>

                <!-- Drop zone indicator at the bottom of last item -->
                <div v-if="isRootDirectory && isDragging && dragOverIndex === index && dragPosition === 'after'"
                  class="drop-zone-indicator drop-zone-after">
                  <div class="drop-line"></div>
                  <span class="drop-text">Drop here</span>
                </div>
              </div>
            </transition-group>

            <!-- Final drop zone at the very end of the list -->
            <div v-if="isRootDirectory && isDragging && dragOverIndex === -2"
              class="drop-zone-indicator drop-zone-after">
              <div class="drop-line"></div>
              <span class="drop-text">Drop at end</span>
            </div>
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

    <!-- GitHub Actions Modal -->
    <div v-if="showActionsModal" class="modal fade show d-block" tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);" @click.self="closeActionsModal" @keyup.escape="closeActionsModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-play-circle"></i>
              Run GitHub Actions
            </h5>
            <button @click="closeActionsModal" type="button" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div v-if="actionError" class="alert alert-danger" role="alert">
              {{ actionError }}
            </div>

            <p class="mb-3">
              Select the action you want to run on the specification:
            </p>

            <div class="mb-3">
              <label class="form-label">Action Type</label>
              <div class="form-check">
                <input v-model="selectedAction" class="form-check-input" type="radio" value="render" id="action-render">
                <label class="form-check-label" for="action-render">
                  <strong>Render Specification</strong><br>
                  <small class="text-muted">Generate HTML output from markdown files</small>
                </label>
              </div>
              <div class="form-check">
                <input v-model="selectedAction" class="form-check-input" type="radio" value="topdf" id="action-topdf">
                <label class="form-check-label" for="action-topdf">
                  <strong>Generate PDF</strong><br>
                  <small class="text-muted">Create a PDF version of the specification</small>
                </label>
              </div>
              <div class="form-check">
                <input v-model="selectedAction" class="form-check-input" type="radio" value="todocx" id="action-todocx">
                <label class="form-check-label" for="action-todocx">
                  <strong>Generate DOCX</strong><br>
                  <small class="text-muted">Create a Word document version</small>
                </label>
              </div>
              <div class="form-check">
                <input v-model="selectedAction" class="form-check-input" type="radio" value="freeze" id="action-freeze">
                <label class="form-check-label" for="action-freeze">
                  <strong>Freeze Specification</strong><br>
                  <small class="text-muted">Lock the current version and commit changes</small>
                </label>
              </div>
              <div class="form-check">
                <input v-model="selectedAction" class="form-check-input" type="radio" value="custom-update"
                  id="action-custom">
                <label class="form-check-label" for="action-custom">
                  <strong>Custom Update</strong><br>
                  <small class="text-muted">Run custom specification updates</small>
                </label>
              </div>
              <div class="form-check">
                <input v-model="selectedAction" class="form-check-input" type="radio" value="collectExternalReferences"
                  id="action-external">
                <label class="form-check-label" for="action-external">
                  <strong>Collect External References</strong><br>
                  <small class="text-muted">Gather and process external term references</small>
                </label>
              </div>
            </div>

            <div class="mb-3">
              <small class="text-info">
                <i class="bi bi-info-circle"></i>
                The action will run on branch: <strong>{{ branch }}</strong>
                <span v-if="selectedWorkflow">
                  <br>Using workflow: <strong>{{ selectedWorkflow }}</strong>
                </span>
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeActionsModal" type="button" class="btn btn-secondary">Cancel</button>
            <button @click="triggerWorkflow" type="button" class="btn btn-warning"
              :disabled="!selectedAction || triggeringWorkflow">
              <span v-if="triggeringWorkflow">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Triggering...
              </span>
              <span v-else>
                <i class="bi bi-play-circle"></i>
                Run Action
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
  </div>

  <!-- Terms Preview Modal -->
  <TermsPreview :owner="owner" :repo="repo" :branch="branch" />
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { addToVisitedRepos } from '../utils/visitedRepos.js'
import { setupFragmentHandling, handleTermsPreviewFragment } from '../utils/urlFragments.js'
import TermsPreview from './TermsPreview.vue'

export default {
  name: 'FileExplorer',
  components: { TermsPreview },
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

    // Fragment handling cleanup
    const fragmentCleanup = ref(null)

    // Drag and drop state
    const isDragMode = ref(false)
    const hasUnsavedChanges = ref(false)
    const draggedItems = ref([])
    const originalOrder = ref([])
    const isDragging = ref(false)
    const draggedIndex = ref(-1)
    const dragOverIndex = ref(-1)
    const dragPosition = ref('') // 'before', 'on', or 'after'
    const isReordering = ref(false) // Track when items are animating to new positions
    const recentlyMovedItem = ref(null) // Track which item was just moved
    
    // Throttle drag events to prevent excessive re-renders
    let dragThrottleTimer = null

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
    const triggeringWorkflow = ref(false)

    // Delete file modal state
    const showDeleteFileModal = ref(false)
    const fileToDelete = ref(null)
    const deleteFileCommitMessage = ref('Delete file')
    const deletingFile = ref(false)
    const deleteFileError = ref('')

    // Actions modal state
    const showActionsModal = ref(false)
    const selectedAction = ref('render')
    const actionError = ref('')
    const availableWorkflows = ref([])
    const selectedWorkflow = ref('')

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
        const token = localStorage.getItem('github_token')
        console.log('GitHub token exists:', !!token)
        console.log('Props:', { owner: props.owner, repo: props.repo, branch: props.branch })

        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Try to get specs.json from repository root, with branch
        const specsUrl = `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`
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

        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Only add cache-busting headers and timestamp for retry attempts
        if (retryCount > 0) {
          config.headers['Cache-Control'] = 'no-cache'
          config.headers['If-None-Match'] = ''
        }

        // Get files and folders from the given directory, with branch
        let url = `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${directory}?ref=${props.branch}`

        // Add timestamp to URL only for retry attempts to prevent caching
        if (retryCount > 0) {
          const timestamp = Date.now()
          url += `&t=${timestamp}`
        }

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
      
      // Clear animation states when navigating away from root
      isReordering.value = false
      recentlyMovedItem.value = null

      // Update URL with new directory
      const encodedDir = encodeURIComponent(folder.path)
      router.push(`/files/${props.owner}/${props.repo}/${props.branch}?dir=${encodedDir}`)
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

        // Capture the values before closing the modal (which resets them)
        const contentToPass = newFileContent.value || ''
        const commitMessageToPass = newFileCommitMessage.value || 'Add new file'

        // Navigate to the editor with new file parameters
        const encodedPath = encodeURIComponent(filePath)
        const encodedDir = encodeURIComponent(currentDirectory.value || specDirectory.value)
        const encodedContent = encodeURIComponent(contentToPass)
        const encodedCommitMessage = encodeURIComponent(commitMessageToPass)

        const finalUrl = `/editor/${props.owner}/${props.repo}/${props.branch}/${encodedPath}?dir=${encodedDir}&new=true&content=${encodedContent}&commitMessage=${encodedCommitMessage}`

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

    // Actions modal methods
    const showActionModal = async () => {
      showActionsModal.value = true
      selectedAction.value = 'render' // Default selection
      actionError.value = ''
      selectedWorkflow.value = '' // Clear previous workflow info

      // Try to determine which workflow will be used
      try {
        const token = localStorage.getItem('github_token')
        if (!token) return

        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        const workflowsResponse = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/actions/workflows`,
          config
        )

        const workflows = workflowsResponse.data.workflows.filter(w => w.state === 'active')

        // Find spec-related workflow
        const specWorkflow = workflows.find(w => {
          const name = w.name.toLowerCase()
          return name.includes('spec-up') || name === 'spec-up-t render'
        })

        if (specWorkflow) {
          selectedWorkflow.value = specWorkflow.name
        } else {
          const renderWorkflow = workflows.find(w => w.name.toLowerCase().includes('render'))
          selectedWorkflow.value = renderWorkflow?.name || 'Will determine at runtime'
        }
      } catch (err) {
        console.warn('Could not pre-determine workflow:', err)
        selectedWorkflow.value = 'Will determine at runtime'
      }
    }

    const closeActionsModal = () => {
      showActionsModal.value = false
      selectedAction.value = 'render'
      actionError.value = ''
      selectedWorkflow.value = ''
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

        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        // Get the current file to get its SHA
        const fileResponse = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fileInfo.path}?ref=${props.branch}`,
          config
        )

        // Delete the file
        const deleteData = {
          message: deleteFileCommitMessage.value || `Delete ${fileInfo.name}`,
          branch: props.branch,
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

    // GitHub Actions Workflow Trigger
    const triggerWorkflow = async () => {
      try {
        triggeringWorkflow.value = true
        loadingMessage.value = 'Triggering GitHub Actions workflow...'

        const token = localStorage.getItem('github_token')
        if (!token) {
          actionError.value = 'GitHub token not found. Please log in again.'
          return
        }

        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }

        console.log(`🔍 Checking workflows for ${props.owner}/${props.repo}...`)

        // First, let's check what workflows are available
        const workflowsResponse = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/actions/workflows`,
          config
        )

        const workflows = workflowsResponse.data.workflows
        console.log(`📋 Found ${workflows.length} workflows:`, workflows.map(w => w.name))

        if (workflows.length === 0) {
          actionError.value = 'No GitHub Actions workflows found in this repository. Please add a workflow file to .github/workflows/ first.'
          return
        }

        // Check each workflow to see if it supports workflow_dispatch
        let targetWorkflow = null
        const candidateWorkflows = []

        for (const workflow of workflows) {
          if (workflow.state !== 'active') {
            console.log(`⏭️ Skipping inactive workflow: ${workflow.name}`)
            continue
          }

          try {
            console.log(`🔍 Checking workflow: ${workflow.name} (${workflow.path})`)

            // Get the workflow file content to check for workflow_dispatch
            const workflowFileResponse = await axios.get(
              `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${workflow.path}?ref=${props.branch}`,
              config
            )

            const workflowContent = atob(workflowFileResponse.data.content)

            // Check if workflow supports workflow_dispatch
            if (workflowContent.includes('workflow_dispatch')) {
              console.log(`✅ Found workflow with manual trigger support: ${workflow.name}`)
              candidateWorkflows.push({ workflow, content: workflowContent })
            } else {
              console.log(`❌ Workflow ${workflow.name} does not support workflow_dispatch`)
            }
          } catch (workflowErr) {
            console.warn(`⚠️ Could not check workflow ${workflow.name}:`, workflowErr)
            continue
          }
        }

        if (candidateWorkflows.length === 0) {
          actionError.value = 'No workflows found that support manual triggering (workflow_dispatch). Please add workflow_dispatch to a workflow\'s "on" triggers.'
          return
        }

        // Prefer spec-related workflows with more specific matching
        const specWorkflows = candidateWorkflows.filter(({ workflow }) => {
          const name = workflow.name.toLowerCase()
          const path = workflow.path.toLowerCase()

          // Prioritize workflows that are clearly spec-related
          return name.includes('spec-up') ||
            name.includes('render') && (name.includes('spec') || path.includes('spec')) ||
            name === 'spec-up-t render' ||
            path.includes('render-spec') ||
            path.includes('spec-render')
        })

        const buildWorkflows = candidateWorkflows.filter(({ workflow }) => {
          const name = workflow.name.toLowerCase()
          return name.includes('build') || name.includes('deploy')
        })

        if (specWorkflows.length > 0) {
          targetWorkflow = specWorkflows[0].workflow
          console.log(`🎯 Using spec-related workflow: ${targetWorkflow.name}`)
        } else if (buildWorkflows.length > 0) {
          targetWorkflow = buildWorkflows[0].workflow
          console.log(`🎯 Using build-related workflow: ${targetWorkflow.name}`)
        } else {
          targetWorkflow = candidateWorkflows[0].workflow
          console.log(`🎯 Using first available workflow: ${targetWorkflow.name}`)
          console.warn(`⚠️ This workflow (${targetWorkflow.name}) may not be designed for spec operations`)
        }

        if (!targetWorkflow) {
          actionError.value = 'No workflows found that support manual triggering (workflow_dispatch). Please add workflow_dispatch to a workflow\'s "on" triggers.'
          return
        }

        console.log(`🚀 Triggering workflow: ${targetWorkflow.name} (${targetWorkflow.id}) with action: ${selectedAction.value}`)

        // Get the workflow content to determine what inputs it expects
        const selectedWorkflowData = candidateWorkflows.find(({ workflow }) => workflow.id === targetWorkflow.id)
        const workflowContent = selectedWorkflowData?.content || ''

        // Build inputs based on what the workflow expects
        let inputs = {}

        // Check if workflow expects specific inputs by looking for input definitions
        const hasInputSection = workflowContent.includes('inputs:')

        if (hasInputSection) {
          // Only add inputs that seem to be defined in the workflow
          if (workflowContent.includes('action_type:') || workflowContent.includes('action_type')) {
            inputs.action_type = selectedAction.value || 'render'
          }

          if (workflowContent.includes('repository:') || workflowContent.includes('repository')) {
            inputs.repository = `${props.owner}/${props.repo}`
          }

          if (workflowContent.includes('branch:') || workflowContent.includes('branch')) {
            inputs.branch = props.branch
          }

          if (workflowContent.includes('triggered_by:') || workflowContent.includes('triggered_by')) {
            inputs.triggered_by = 'GitHubUI'
          }
        }

        console.log(`📋 Workflow inputs section found: ${hasInputSection}`)
        console.log(`📋 Inputs to send:`, inputs)

        // Trigger the workflow using workflow_dispatch
        const dispatchData = {
          ref: props.branch,
          ...(Object.keys(inputs).length > 0 ? { inputs } : {})
        }

        console.log('📤 Dispatch data:', dispatchData)

        await axios.post(
          `https://api.github.com/repos/${props.owner}/${props.repo}/actions/workflows/${targetWorkflow.id}/dispatches`,
          dispatchData,
          config
        )

        // Clear any previous errors and show success message
        error.value = ''
        actionError.value = ''
        console.log(`✅ Successfully triggered workflow: "${targetWorkflow.name}" with action "${selectedAction.value}" on branch ${props.branch}`)
        console.log(`View workflow runs: https://github.com/${props.owner}/${props.repo}/actions`)

        // Close the modal on success
        closeActionsModal()

        // Show temporary success message in loading area
        loadingMessage.value = `✅ Successfully triggered ${selectedAction.value} action`
        setTimeout(() => {
          if (loadingMessage.value.includes('Successfully triggered')) {
            loadingMessage.value = ''
          }
        }, 5000)

      } catch (err) {
        console.error('❌ Error triggering workflow:', err)
        console.error('Response details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers
        })

        if (checkAuthAndRedirect(err)) return

        if (err.response?.status === 404) {
          actionError.value = 'Workflow not found or this repository has no GitHub Actions workflows set up.'
        } else if (err.response?.status === 422) {
          const errorMsg = err.response?.data?.message || ''
          console.log('422 Error message:', errorMsg)

          if (errorMsg.includes('Unexpected inputs')) {
            actionError.value = `Workflow "${targetWorkflow?.name || 'selected'}" doesn't accept the inputs we tried to send. This workflow may not be designed for this interface.`
          } else if (errorMsg.includes('workflow_dispatch')) {
            actionError.value = 'This workflow does not support manual triggering. Please add "workflow_dispatch:" to the workflow\'s "on" section.'
          } else {
            actionError.value = `Cannot trigger workflow: ${errorMsg}`
          }
        } else {
          actionError.value = 'Failed to trigger workflow: ' + (err.response?.data?.message || err.message)
        }
      } finally {
        triggeringWorkflow.value = false
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

    // Listen for custom event from MainNav to trigger actions modal
    const handleTriggerActionsModal = () => {
      showActionModal()
    }

    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(props.owner, props.repo, props.branch)

      loadSpecsConfig()
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Listen for custom event from MainNav to trigger actions modal
      window.addEventListener('trigger-actions-modal', handleTriggerActionsModal)

      // Set up fragment handling for terms preview
      const cleanupFragmentHandling = setupFragmentHandling((hash) => {
        handleTermsPreviewFragment(hash, router, route)
      })

      // Store cleanup function for unmount
      fragmentCleanup.value = cleanupFragmentHandling

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
    })

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

    // Clean up event listener
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('trigger-actions-modal', handleTriggerActionsModal)
      
      // Clean up fragment handling
      if (fragmentCleanup.value) {
        fragmentCleanup.value()
      }
      
      // Clean up drag throttle timer
      if (dragThrottleTimer) {
        clearTimeout(dragThrottleTimer);
        dragThrottleTimer = null;
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
          router.push(`/files/${props.owner}/${props.repo}/${props.branch}?dir=${encodedDir}`)
        } else {
          hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
          draggedItems.value = []; // Reset drag items when navigating

          // Update URL with root directory
          const encodedDir = encodeURIComponent(root)
          router.push(`/files/${props.owner}/${props.repo}/${props.branch}?dir=${encodedDir}`)
        }
      } else {
        hasUnsavedChanges.value = false; // Reset unsaved changes when navigating
        draggedItems.value = []; // Reset drag items when navigating

        // Update URL with root directory
        const encodedDir = encodeURIComponent(root)
        router.push(`/files/${props.owner}/${props.repo}/${props.branch}?dir=${encodedDir}`)
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
      draggedIndex.value = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({
        item,
        type,
        originalIndex: index
      }));
      event.target.style.opacity = '0.5';
    };

    const onDragEnter = (event, index) => {
      if (!isRootDirectory.value || !isDragging.value) return;

      event.preventDefault();
      
      // Avoid unnecessary updates if we're already at this position
      if (dragOverIndex.value === index) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const height = rect.height;

      // Determine if we're in the top, middle, or bottom third
      if (y < height * 0.33) {
        dragPosition.value = 'before';
      } else if (y > height * 0.67) {
        dragPosition.value = 'after';
      } else {
        dragPosition.value = 'on';
      }

      dragOverIndex.value = index;
    };

    const onDragLeave = (event) => {
      if (!isRootDirectory.value || !isDragging.value) return;

      // Only clear if we're really leaving the element (not entering a child)
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        dragOverIndex.value = -1;
        dragPosition.value = '';
      }
    };

    const onDragOver = (event, index, type) => {
      if (!isRootDirectory.value) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Throttle updates to prevent oscillation
      if (dragThrottleTimer) return;
      
      dragThrottleTimer = setTimeout(() => {
        dragThrottleTimer = null;
      }, 200);

      // Only update position if we're over a different element or need to recalculate position
      if (dragOverIndex.value !== index) {
        dragOverIndex.value = index;
      }

      // Update position based on mouse position
      const rect = event.currentTarget.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const height = rect.height;

      let newPosition;
      if (y < height * 0.33) {
        newPosition = 'before';
      } else if (y > height * 0.67) {
        newPosition = 'after';
      } else {
        newPosition = 'on';
      }

      // Only update if position actually changed
      if (dragPosition.value !== newPosition) {
        dragPosition.value = newPosition;
      }
    };

    const onDrop = (event, dropIndex, dropType) => {
      if (!isRootDirectory.value) return;

      event.preventDefault();

      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      const originalIndex = dragData.originalIndex;

      // Calculate the actual target index based on position
      let targetIndex = dropIndex;
      if (dragPosition.value === 'after') {
        targetIndex = dropIndex + 1;
      } else if (dragPosition.value === 'before') {
        targetIndex = dropIndex;
      } else {
        // 'on' position - place after the target item
        targetIndex = dropIndex + 1;
      }

      if (originalIndex !== targetIndex && Math.abs(originalIndex - targetIndex) > 0) {
        // Set animation state
        isReordering.value = true;
        
        // Reorder the items
        const newItems = [...draggedItems.value];
        const [movedItem] = newItems.splice(originalIndex, 1);

        // Track which item was moved for highlighting
        recentlyMovedItem.value = movedItem;

        // Adjust target index if we removed an item before it
        let adjustedTargetIndex = targetIndex;
        if (originalIndex < targetIndex) {
          adjustedTargetIndex--;
        }

        // Ensure we don't go out of bounds
        adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, newItems.length));

        newItems.splice(adjustedTargetIndex, 0, movedItem);

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

        // Clear animation state after a brief delay to show the movement
        setTimeout(() => {
          isReordering.value = false;
          // Clear the recently moved item highlight after animation completes
          setTimeout(() => {
            recentlyMovedItem.value = null;
          }, 500);
        }, 200);
      }

      // Clear drag state
      dragOverIndex.value = -1;
      dragPosition.value = '';
    };

    const onDragEnd = (event) => {
      event.target.style.opacity = '1';
      
      // Clear throttle timer
      if (dragThrottleTimer) {
        clearTimeout(dragThrottleTimer);
        dragThrottleTimer = null;
      }
      
      // Clear all drag state
      draggedIndex.value = -1;
      dragOverIndex.value = -1;
      dragPosition.value = '';

      // Small delay to prevent click event from firing immediately after drag
      setTimeout(() => {
        isDragging.value = false;
      }, 100);
    };

    // Handle dragging over the list container (for dropping at the end)
    const onListDragOver = (event) => {
      if (!isRootDirectory.value || !isDragging.value) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Check if we're dragging over empty space at the bottom
      const rect = event.currentTarget.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const listItems = event.currentTarget.querySelectorAll('.position-relative');

      if (listItems.length > 0) {
        const lastItem = listItems[listItems.length - 1];
        const lastItemRect = lastItem.getBoundingClientRect();
        const relativeY = event.clientY - lastItemRect.bottom;

        // If we're below the last item, show the end drop zone
        if (relativeY > 10) {
          dragOverIndex.value = -2; // Special value for end of list
          dragPosition.value = 'end';
        }
      }
    };

    // Handle dropping at the end of the list
    const onListDrop = (event) => {
      if (!isRootDirectory.value || !isDragging.value) return;

      event.preventDefault();

      if (dragOverIndex.value === -2) {
        // Drop at the end of the list
        const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
        const originalIndex = dragData.originalIndex;
        const targetIndex = draggedItems.value.length; // End of list

        if (originalIndex !== targetIndex - 1) { // Don't move if already at the end
          const newItems = [...draggedItems.value];
          const [movedItem] = newItems.splice(originalIndex, 1);
          newItems.push(movedItem); // Add to end

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
      }

      // Clear drag state
      dragOverIndex.value = -1;
      dragPosition.value = '';
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
      showActionsModal,
      selectedAction,
      actionError,
      availableWorkflows,
      selectedWorkflow,
      showActionModal,
      closeActionsModal,
      toggleDropdown,
      selectFilter,
      setFilter,
      clearFilter,
      clearFilterCompletely,
      applyFilter,
      triggerWorkflow,
      triggeringWorkflow,
      goUpDirectory,
      showGoUpButton,
      isRootDirectory,
      hasUnsavedChanges,
      isDragging,
      draggedIndex,
      dragOverIndex,
      dragPosition,
      isReordering,
      recentlyMovedItem,
      onDragStart,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      onDragEnd,
      onListDragOver,
      onListDrop,
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

/* File list container for smooth transitions */
.file-list-container {
  position: relative;
}

.file-item-wrapper {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Vue transition-group animations */
.file-list-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.file-list-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.file-list-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: absolute;
}

.file-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.file-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

/* Enhanced drag visual feedback */
.list-group-item.being-dragged {
  opacity: 0.6;
  transform: scale(0.95) rotate(2deg);
  transition: all 0.2s ease;
  z-index: 1000;
  position: relative;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.list-group-item.drag-over {
  background-color: #e3f2fd !important;
  border-color: #2196f3 !important;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  transform: scale(1.02);
  transition: all 0.2s ease;
}

/* Recently moved item highlight */
.list-group-item.recently-moved {
  background-color: #f0f9ff !important;
  border-color: #0ea5e9 !important;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.4);
  animation: moved-item-highlight 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
