<template>
  <div class="container-fluid mt-3">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">
              <i class="bi bi-link-45deg"></i>
              External Specifications Manager
            </h4>
            <div>
              <button @click="goBack" class="btn btn-outline-secondary me-2">
                <i class="bi bi-arrow-left"></i> Back
              </button>
              <button @click="saveSpecs" class="btn btn-success" :disabled="saving">
                <i class="bi bi-save"></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <div class="card-body">
            <!-- Loading State -->
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <div class="mt-2">Loading specifications...</div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle"></i>
              {{ error }}
            </div>

            <!-- Main Content -->
            <div v-else>
              <!-- Repository Info -->
              <div class="alert alert-info mb-4">
                <i class="bi bi-info-circle"></i>
                Managing external specs for: <strong>{{ owner }}/{{ repo }}</strong> ({{ branch }} branch)
              </div>

              <!-- External Specs List -->
              <div class="mb-4">
                <h5>Current External Specifications</h5>
                <div v-if="externalSpecs.length === 0" class="text-muted">
                  No external specifications configured.
                </div>
                <div v-else class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Spec ID</th>
                        <th>GitHub Page</th>
                        <th>Repository URL</th>
                        <th>Terms Directory</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(spec, index) in externalSpecs" :key="index">
                        <td>
                          <input v-model="spec.external_spec" class="form-control form-control-sm"
                            placeholder="e.g., toip1" @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.external_spec }">
                          <div v-if="!spec.external_spec" class="invalid-feedback">
                            Spec ID is required
                          </div>
                        </td>
                        <td class="d-flex align-items-center gap-2">
                          <input v-model="spec.gh_page" type="url" class="form-control form-control-sm"
                            placeholder="https://example.github.io/spec/" @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.gh_page || !isValidUrl(spec.gh_page) }">
                          <a v-if="isValidUrl(spec.gh_page)" :href="spec.gh_page" target="_blank" rel="noopener"
                            class="btn btn-link btn-sm px-1" title="Open GitHub Page">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                          <div v-if="!spec.gh_page" class="invalid-feedback">
                            GitHub Page URL is required
                          </div>
                          <div v-else-if="!isValidUrl(spec.gh_page)" class="invalid-feedback">
                            Please enter a valid URL
                          </div>
                        </td>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <input v-model="spec.url" type="url" class="form-control form-control-sm"
                              placeholder="https://github.com/user/repo" @input="markAsChanged"
                              :class="{ 'is-invalid': !spec.url || !isValidUrl(spec.url) }">
                            <a v-if="isValidUrl(spec.url)" :href="spec.url" target="_blank" rel="noopener"
                              class="btn btn-link btn-sm px-1" title="Open Repository">
                              <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                          </div>
                          <div v-if="!spec.url" class="invalid-feedback">
                            Repository URL is required
                          </div>
                          <div v-else-if="!isValidUrl(spec.url)" class="invalid-feedback">
                            Please enter a valid URL
                          </div>
                        </td>
                        <td>
                          <input v-model="spec.terms_dir" class="form-control form-control-sm"
                            placeholder="spec/terms-definitions" @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.terms_dir }">
                          <div v-if="!spec.terms_dir" class="invalid-feedback">
                            Terms directory is required
                          </div>
                        </td>
                        <td>
                          <button @click="removeSpec(index)" class="btn btn-danger btn-sm" title="Remove specification">
                            <i class="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Add New Spec Form -->
              <div class="card mb-4">
                <div class="card-header">
                  <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Add External Specifications</h6>
                    <div class="btn-group btn-group-sm" role="group">
                      <input type="radio" class="btn-check" name="addMode" id="singleMode" value="single"
                        v-model="addMode">
                      <label class="btn btn-outline-primary" for="singleMode">Single</label>

                      <input type="radio" class="btn-check" name="addMode" id="bulkMode" value="bulk" v-model="addMode">
                      <label class="btn btn-outline-primary" for="bulkMode">Bulk Import</label>

                      <input type="radio" class="btn-check" name="addMode" id="setsMode" value="sets" v-model="addMode">
                      <label class="btn btn-outline-primary" for="setsMode">Reference Sets</label>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <!-- Single Spec Mode -->
                  <div v-if="addMode === 'single'">
                    <form @submit.prevent="addNewSpec">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label for="newSpecId" class="form-label">Specification ID</label>
                          <input id="newSpecId" v-model="newSpec.external_spec" class="form-control"
                            placeholder="e.g., toip1, keri1" required>
                          <div class="form-text">Unique identifier for this external specification</div>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label for="newSpecGhPage" class="form-label">GitHub Page URL</label>
                          <input id="newSpecGhPage" v-model="newSpec.gh_page" type="url" class="form-control"
                            placeholder="https://example.github.io/spec/" required>
                          <div class="form-text">The GitHub Pages URL where the spec is hosted</div>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label for="newSpecUrl" class="form-label">Repository URL</label>
                          <input id="newSpecUrl" v-model="newSpec.url" type="url" class="form-control"
                            placeholder="https://github.com/user/repo" required>
                          <div class="form-text">The GitHub repository URL</div>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label for="newSpecTermsDir" class="form-label">Terms Directory</label>
                          <input id="newSpecTermsDir" v-model="newSpec.terms_dir" class="form-control"
                            placeholder="spec/terms-definitions" required>
                          <div class="form-text">Path to the terms definitions directory</div>
                        </div>
                      </div>
                      <div class="d-flex justify-content-end">
                        <button type="button" @click="resetNewSpec" class="btn btn-outline-secondary me-2">
                          Clear
                        </button>
                        <button type="submit" class="btn btn-primary">
                          <i class="bi bi-plus-circle"></i>
                          Add Specification
                        </button>
                      </div>
                    </form>
                  </div>

                  <!-- Bulk Import Mode -->
                  <div v-else-if="addMode === 'bulk'">
                    <div class="mb-4">
                      <div class="nav nav-tabs" role="tablist">
                        <button class="nav-link" :class="{ active: bulkImportMode === 'json' }"
                          @click="bulkImportMode = 'json'" type="button">
                          <i class="bi bi-code"></i> JSON Input
                        </button>
                        <button class="nav-link" :class="{ active: bulkImportMode === 'url' }"
                          @click="bulkImportMode = 'url'" type="button">
                          <i class="bi bi-link-45deg"></i> GitHub URL
                        </button>
                      </div>
                    </div>

                    <!-- JSON Input Tab -->
                    <div v-if="bulkImportMode === 'json'" class="mb-4">
                      <label for="jsonInput" class="form-label">External Specs JSON</label>
                      <textarea id="jsonInput" v-model="jsonInput" class="form-control font-monospace" rows="8"
                        :readonly="false" :placeholder="jsonInputFocused ? '' : exampleJsonPlaceholder"
                        @focus="jsonInputFocused = true" @blur="jsonInputFocused = false"
                        @input="onJsonInputChange"></textarea>
                      <div class="form-text">Paste a JSON array of external specifications - validation happens
                        automatically</div>
                      <div v-if="jsonError" class="text-danger small mt-1">{{ jsonError }}</div>
                      <div v-if="autoPreviewStatus" class="text-info small mt-1">
                        <i class="bi bi-info-circle"></i> {{ autoPreviewStatus }}
                      </div>
                    </div>

                    <!-- GitHub URL Tab -->
                    <div v-if="bulkImportMode === 'url'" class="mb-4">
                      <label for="githubUrl" class="form-label">GitHub JSON File URL</label>
                      <input id="githubUrl" v-model="githubUrlInput" type="url" class="form-control"
                        placeholder="https://github.com/user/repo/blob/main/external-specs.json">
                      <div class="form-text">URL to a GitHub JSON file containing external specifications</div>
                      <div v-if="urlError" class="text-danger small mt-1">{{ urlError }}</div>
                    </div>

                    <!-- Import Actions -->
                    <div class="d-flex justify-content-between align-items-center gap-2">
                      <div class="text-muted">
                        <small>
                          <i class="bi bi-lightbulb"></i>
                          Tip: Paste your JSON above and the preview will update automatically
                        </small>
                      </div>
                      <div class="d-flex gap-2">
                        <button type="button" @click="resetBulkImport" class="btn btn-outline-secondary">
                          Clear
                        </button>
                        <button type="button" @click="previewBulkImport" class="btn btn-outline-primary"
                          :disabled="bulkImportLoading">
                          <i class="bi bi-arrow-clockwise"></i>
                          {{ bulkImportLoading ? 'Validating...' : 'Refresh Preview' }}
                        </button>
                        <button type="button" @click="importBulkSpecs" class="btn btn-success"
                          :disabled="!bulkPreviewData.length || bulkImportLoading || bulkPreviewData.some(spec => spec._isInvalid)">
                          <i class="bi bi-upload"></i>
                          {{bulkPreviewData.filter(spec => !spec._isInvalid).length > 0
                            ? `Import ${bulkPreviewData.filter(spec => !spec._isInvalid).length} Valid Specs`
                            : 'No Valid Specs to Import'}}
                        </button>
                      </div>
                    </div>

                    <!-- Preview Section -->
                    <div v-if="bulkPreviewData.length > 0" class="mt-4">
                      <h6>Preview ({{ bulkPreviewData.length }} specifications)</h6>
                      <div class="table-responsive">
                        <table class="table table-sm table-striped">
                          <thead>
                            <tr>
                              <th>Spec ID</th>
                              <th>GitHub Page</th>
                              <th>Repository URL</th>
                              <th>Terms Directory</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(spec, index) in bulkPreviewData" :key="index"
                              :class="{ 'table-warning': spec._isDuplicate, 'table-danger': spec._isInvalid }">
                              <td>
                                <span v-if="!spec._isDuplicate && !spec._isInvalid">{{ spec.external_spec }}</span>
                                <input v-else-if="spec._isDuplicate" v-model="spec.external_spec"
                                  class="form-control form-control-sm" placeholder="Enter new unique ID">
                                <span v-else class="text-danger">{{ spec.external_spec || 'Missing' }}</span>
                              </td>
                              <td class="text-truncate" style="max-width: 200px;">
                                <span
                                  :class="{ 'text-danger': spec._isInvalid && (!spec.gh_page || !isValidUrl(spec.gh_page)) }">
                                  {{ spec.gh_page || 'Missing' }}
                                </span>
                              </td>
                              <td class="text-truncate" style="max-width: 200px;">
                                <span
                                  :class="{ 'text-danger': spec._isInvalid && (!spec.url || !isValidUrl(spec.url)) }">
                                  {{ spec.url || 'Missing' }}
                                </span>
                              </td>
                              <td>
                                <span :class="{ 'text-danger': spec._isInvalid && !spec.terms_dir }">
                                  {{ spec.terms_dir || 'Missing' }}
                                </span>
                              </td>
                              <td>
                                <span v-if="spec._isInvalid" class="badge bg-danger">
                                  <i class="bi bi-x-circle"></i> Invalid
                                </span>
                                <span v-else-if="spec._isDuplicate" class="badge bg-warning text-dark">
                                  <i class="bi bi-exclamation-triangle"></i> Duplicate
                                </span>
                                <span v-else class="badge bg-success">
                                  <i class="bi bi-check-circle"></i> Ready
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <!-- Reference Sets Mode -->
                  <div v-else-if="addMode === 'sets'">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <label class="form-label mb-0">Available Reference Sets</label>
                      <button type="button" @click="loadReferenceSets" class="btn btn-outline-primary btn-sm"
                        :disabled="referenceSetsLoading">
                        <i class="bi bi-arrow-clockwise"></i>
                        {{ referenceSetsLoading ? 'Loading...' : 'Refresh Sets' }}
                      </button>
                    </div>

                    <!-- Loading State -->
                    <div v-if="referenceSetsLoading" class="text-center py-3">
                      <div class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <div class="mt-2 small">Loading reference sets...</div>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="referenceSetsError" class="alert alert-danger" role="alert">
                      <i class="bi bi-exclamation-triangle"></i>
                      Error loading reference sets: {{ referenceSetsError }}
                    </div>

                    <!-- Reference Sets Grid -->
                    <div v-else-if="referenceSets.length > 0" class="row">
                      <div v-for="set in referenceSets" :key="set.identifier" class="col-md-6 mb-3">
                        <div class="card h-100"
                          :class="{ 'border-primary': selectedReferenceSet?.identifier === set.identifier }">
                          <div class="card-body d-flex flex-column">
                            <h6 class="card-title">{{ set.title }}</h6>
                            <p class="card-text small text-muted flex-grow-1">{{ set.description }}</p>
                            <div class="small text-muted mb-2">
                              <div><strong>Creator:</strong> {{ set.creator }}</div>
                              <div><strong>Date:</strong> {{ set.date }}</div>
                              <div><strong>References:</strong> {{ set.references?.length || 0 }} specifications</div>
                            </div>
                            <div class="d-flex gap-2">
                              <button type="button" @click="selectReferenceSet(set)"
                                class="btn btn-outline-primary btn-sm flex-grow-1">
                                <i class="bi bi-eye"></i> Preview
                              </button>
                              <button type="button" @click="selectedReferenceSet = set; importReferenceSet()"
                                class="btn btn-success btn-sm">
                                <i class="bi bi-plus-circle"></i> Import
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- No Sets Available -->
                    <div v-else class="text-center py-4 text-muted">
                      <i class="bi bi-collection"></i>
                      <div>No reference sets available</div>
                    </div>

                    <!-- Reference Set Preview Modal -->
                    <div v-if="showReferenceSetPreview && selectedReferenceSet" class="modal show d-block" tabindex="-1"
                      style="background-color: rgba(0,0,0,0.5);">
                      <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title">{{ selectedReferenceSet.title }}</h5>
                            <button type="button" class="btn-close" @click="resetReferenceSetSelection"></button>
                          </div>
                          <div class="modal-body">
                            <div class="mb-3">
                              <p class="text-muted">{{ selectedReferenceSet.description }}</p>
                              <div class="small">
                                <div><strong>Creator:</strong> {{ selectedReferenceSet.creator }}</div>
                                <div><strong>Date:</strong> {{ selectedReferenceSet.date }}</div>
                                <div><strong>Type:</strong> {{ selectedReferenceSet.type }}</div>
                              </div>
                            </div>

                            <h6>References ({{ selectedReferenceSet.references?.length || 0 }})</h6>
                            <div v-if="selectedReferenceSet.references?.length > 0" class="table-responsive">
                              <table class="table table-sm">
                                <thead>
                                  <tr>
                                    <th>Spec ID</th>
                                    <th>GitHub Page</th>
                                    <th>Repository</th>
                                    <th>Terms Dir</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="ref in selectedReferenceSet.references" :key="ref.external_spec">
                                    <td>{{ ref.external_spec }}</td>
                                    <td><a :href="ref.gh_page" target="_blank" class="text-truncate d-block"
                                        style="max-width: 200px;">{{ ref.gh_page }}</a></td>
                                    <td><a :href="ref.url" target="_blank" class="text-truncate d-block"
                                        style="max-width: 200px;">{{ ref.url }}</a></td>
                                    <td>{{ ref.terms_dir }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div v-else class="text-muted">No references available</div>
                          </div>
                          <div class="modal-footer">
                            <button type="button" class="btn btn-secondary"
                              @click="resetReferenceSetSelection">Close</button>
                            <button type="button" class="btn btn-success" @click="importReferenceSet">
                              <i class="bi bi-plus-circle"></i> Import References
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Changes Indicator -->
              <div v-if="hasChanges" class="alert alert-warning mt-4">
                <i class="bi bi-exclamation-triangle"></i>
                You have unsaved changes. Don't forget to save!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addToVisitedRepos } from '../utils/visitedRepos.js'

export default {
  name: 'ExternalSpecsManager',
  setup() {
    const router = useRouter()
    const route = useRoute()

    // Props from route
    const owner = ref(route.params.owner)
    const repo = ref(route.params.repo)
    const branch = ref(route.params.branch)

    // State
    const loading = ref(true)
    const saving = ref(false)
    const error = ref('')
    const externalSpecs = ref([])
    const originalSpecsJson = ref(null)
    const hasChanges = ref(false)

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

    // New spec form
    const newSpec = ref({
      external_spec: '',
      gh_page: '',
      url: '',
      terms_dir: 'spec/terms-definitions'
    })

    // Bulk import state
    const addMode = ref('single')
    const bulkImportMode = ref('json')
    const jsonInput = ref('')
    const githubUrlInput = ref('')
    const jsonError = ref('')
    const urlError = ref('')
    const bulkImportLoading = ref(false)
    const bulkPreviewData = ref([])
    const jsonInputFocused = ref(false)
    const exampleJsonPlaceholder = '[\n  {\n    "external_spec": "toip1",\n    "gh_page": "https://example.github.io/spec/",\n    "url": "https://github.com/user/repo",\n    "terms_dir": "spec/terms-definitions"\n  }\n]'
    const autoPreviewStatus = ref('')
    const autoPreviewTimeout = ref(null)

    // Reference sets state
    const referenceSets = ref([])
    const referenceSetsLoading = ref(false)
    const referenceSetsError = ref('')
    const selectedReferenceSet = ref(null)
    const showReferenceSetPreview = ref(false)

    const resetNewSpec = () => {
      newSpec.value = {
        external_spec: '',
        gh_page: '',
        url: '',
        terms_dir: 'spec/terms-definitions'
      }
    }

    const resetBulkImport = () => {
      jsonInput.value = ''
      githubUrlInput.value = ''
      jsonError.value = ''
      urlError.value = ''
      bulkPreviewData.value = []
      autoPreviewStatus.value = ''
      if (autoPreviewTimeout.value) {
        clearTimeout(autoPreviewTimeout.value)
        autoPreviewTimeout.value = null
      }
    }

    const resetReferenceSetSelection = () => {
      selectedReferenceSet.value = null
      showReferenceSetPreview.value = false
      referenceSetsError.value = ''
    }

    const onJsonInputChange = () => {
      // Clear previous timeout
      if (autoPreviewTimeout.value) {
        clearTimeout(autoPreviewTimeout.value)
      }

      // Clear errors and status
      jsonError.value = ''
      autoPreviewStatus.value = ''

      // If input is empty, clear preview
      if (!jsonInput.value.trim()) {
        bulkPreviewData.value = []
        return
      }

      // Set a timeout to auto-preview after user stops typing
      autoPreviewTimeout.value = setTimeout(() => {
        autoPreviewStatus.value = 'Validating JSON...'
        previewBulkImport()
      }, 1000) // Wait 1 second after user stops typing
    }

    const markAsChanged = () => {
      hasChanges.value = true
    }

    const isValidUrl = (url) => {
      try {
        const result = new URL(url)
        console.log(`URL validation for "${url}":`, { valid: true, parsed: result.href })
        return true
      } catch (err) {
        console.log(`URL validation for "${url}":`, { valid: false, error: err.message })
        return false
      }
    }

    const loadSpecs = async () => {
      try {
        loading.value = true
        error.value = ''

        const token = localStorage.getItem('github_token')
        if (!token) {
          throw new Error('No GitHub token found')
        }

        // Fetch specs.json
        const response = await fetch(
          `https://api.github.com/repos/${owner.value}/${repo.value}/contents/specs.json?ref=${branch.value}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to load specs.json: ${response.statusText}`)
        }

        const data = await response.json()
        const content = JSON.parse(atob(data.content))

        // Store original for saving later
        originalSpecsJson.value = {
          content: content,
          sha: data.sha
        }

        // Extract external_specs from the first spec (assuming single spec structure)
        if (content.specs && content.specs.length > 0 && content.specs[0].external_specs) {
          externalSpecs.value = [...content.specs[0].external_specs]
        } else {
          externalSpecs.value = []
        }

      } catch (err) {
        console.error('Error loading specs:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const addNewSpec = () => {
      // Validate required fields
      if (!newSpec.value.external_spec || !newSpec.value.gh_page ||
        !newSpec.value.url || !newSpec.value.terms_dir) {
        alert('Please fill in all required fields')
        return
      }

      // Validate URLs
      if (!isValidUrl(newSpec.value.gh_page) || !isValidUrl(newSpec.value.url)) {
        alert('Please enter valid URLs for GitHub Page and Repository URL')
        return
      }

      // Check for duplicate spec IDs
      if (externalSpecs.value.some(spec => spec.external_spec === newSpec.value.external_spec)) {
        alert('Specification ID already exists. Please choose a unique identifier.')
        return
      }

      // Add new spec
      externalSpecs.value.push({ ...newSpec.value })
      resetNewSpec()
      markAsChanged()
    }

    const removeSpec = (index) => {
      if (confirm('Are you sure you want to remove this external specification?')) {
        externalSpecs.value.splice(index, 1)
        markAsChanged()
      }
    }

    const convertGithubUrlToRaw = (url) => {
      try {
        const urlObj = new URL(url)
        if (urlObj.hostname === 'github.com' && urlObj.pathname.includes('/blob/')) {
          return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
        }
        return url
      } catch {
        return url
      }
    }

    const validateExternalSpec = (spec) => {
      return spec &&
        typeof spec === 'object' &&
        spec.external_spec &&
        spec.gh_page &&
        spec.url &&
        spec.terms_dir &&
        isValidUrl(spec.gh_page) &&
        isValidUrl(spec.url)
    }

    const checkForDuplicates = (specs) => {
      const existingIds = externalSpecs.value.map(spec => spec.external_spec)
      return specs.map(spec => ({
        ...spec,
        _isDuplicate: existingIds.includes(spec.external_spec)
      }))
    }

    const previewBulkImport = async () => {
      bulkImportLoading.value = true
      jsonError.value = ''
      urlError.value = ''
      autoPreviewStatus.value = ''

      try {
        let specsData = []

        if (bulkImportMode.value === 'json') {
          if (!jsonInput.value.trim()) {
            jsonError.value = 'Please enter JSON data'
            bulkPreviewData.value = []
            return
          }

          try {
            specsData = JSON.parse(jsonInput.value)
            autoPreviewStatus.value = 'JSON parsed successfully'
          } catch (err) {
            jsonError.value = 'Invalid JSON format'
            bulkPreviewData.value = []
            return
          }
        } else if (bulkImportMode.value === 'url') {
          if (!githubUrlInput.value.trim()) {
            urlError.value = 'Please enter a GitHub URL'
            return
          }

          if (!isValidUrl(githubUrlInput.value)) {
            urlError.value = 'Please enter a valid URL'
            return
          }

          const rawUrl = convertGithubUrlToRaw(githubUrlInput.value)

          try {
            const response = await fetch(rawUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.statusText}`)
            }
            specsData = await response.json()
          } catch (err) {
            urlError.value = `Error fetching URL: ${err.message}`
            return
          }
        }

        if (!Array.isArray(specsData)) {
          const errorMsg = 'Data must be an array of external specifications'
          if (bulkImportMode.value === 'json') {
            jsonError.value = errorMsg
          } else {
            urlError.value = errorMsg
          }
          bulkPreviewData.value = []
          return
        }

        const validSpecs = []
        const invalidSpecs = []

        specsData.forEach((spec, index) => {
          console.log(`Validating spec ${index}:`, spec)

          // Detailed validation debugging
          const validationChecks = {
            exists: !!spec,
            isObject: typeof spec === 'object',
            hasExternalSpec: !!spec.external_spec,
            hasGhPage: !!spec.gh_page,
            hasUrl: !!spec.url,
            hasTermsDir: !!spec.terms_dir,
            validGhPageUrl: spec.gh_page ? isValidUrl(spec.gh_page) : false,
            validUrl: spec.url ? isValidUrl(spec.url) : false
          }

          console.log(`Validation checks for spec ${index}:`, validationChecks)

          if (validateExternalSpec(spec)) {
            console.log(`Spec ${index} is VALID`)
            validSpecs.push(spec)
          } else {
            console.log(`Spec ${index} is INVALID`)
            invalidSpecs.push({ ...spec, _isInvalid: true })
          }
        })

        console.log('Total specs in JSON:', specsData.length)
        console.log('Valid specs after filtering:', validSpecs.length)
        console.log('Invalid specs:', invalidSpecs.length)
        console.log('Valid specs:', validSpecs)

        if (validSpecs.length === 0) {
          const errorMsg = `No valid external specifications found. Please check your JSON format. Expected fields: external_spec, gh_page (valid URL), url (valid URL), terms_dir`
          if (bulkImportMode.value === 'json') {
            jsonError.value = errorMsg
          } else {
            urlError.value = errorMsg
          }
          // Show only invalid specs in preview
          bulkPreviewData.value = invalidSpecs
          return
        }

        // Combine valid specs (with duplicate check) and invalid specs
        const validSpecsWithDuplicateCheck = checkForDuplicates(validSpecs)
        bulkPreviewData.value = [...validSpecsWithDuplicateCheck, ...invalidSpecs]

        // Update status for successful auto-preview
        if (bulkImportMode.value === 'json' && validSpecs.length > 0) {
          autoPreviewStatus.value = `Found ${validSpecs.length} valid specification${validSpecs.length === 1 ? '' : 's'} ready to import`
        }

      } catch (err) {
        console.error('Preview error:', err)
        const errorMsg = `Error processing data: ${err.message}`
        if (bulkImportMode.value === 'json') {
          jsonError.value = errorMsg
        } else {
          urlError.value = errorMsg
        }
        bulkPreviewData.value = []
      } finally {
        bulkImportLoading.value = false
      }
    }

    const importBulkSpecs = () => {
      // Filter out invalid specs
      const validSpecs = bulkPreviewData.value.filter(spec => !spec._isInvalid)

      if (validSpecs.length === 0) {
        alert('No valid specifications to import. Please fix the validation errors first.')
        return
      }

      // Check for any remaining duplicates in valid specs
      const duplicates = validSpecs.filter(spec => spec._isDuplicate)
      if (duplicates.length > 0) {
        // Check if duplicates have new IDs
        const unresolved = duplicates.filter(spec => !spec.external_spec ||
          externalSpecs.value.some(existing => existing.external_spec === spec.external_spec))

        if (unresolved.length > 0) {
          alert('Please resolve all duplicate specification IDs before importing')
          return
        }
      }

      // Add valid specs to main list
      validSpecs.forEach(spec => {
        const cleanSpec = { ...spec }
        delete cleanSpec._isDuplicate
        delete cleanSpec._isInvalid
        externalSpecs.value.push(cleanSpec)
      })

      // Reset bulk import
      resetBulkImport()
      addMode.value = 'single'
      markAsChanged()

      alert(`Successfully imported ${validSpecs.length} valid external specifications!`)
    }

    const loadReferenceSets = async () => {
      try {
        referenceSetsLoading.value = true
        referenceSetsError.value = ''

        // Fetch directory listing from the external reference sets repository
        const response = await fetch(
          'https://api.github.com/repos/blockchainbird/spec-up-gs/contents/external-reference-sets'
        )

        if (!response.ok) {
          throw new Error(`Failed to load reference sets: ${response.statusText}`)
        }

        const files = await response.json()
        const jsonFiles = files.filter(file => file.name.endsWith('.json'))

        // Load metadata for each set
        const setsPromises = jsonFiles.map(async (file) => {
          try {
            const setResponse = await fetch(file.download_url)
            if (!setResponse.ok) {
              throw new Error(`Failed to load ${file.name}`)
            }
            const setData = await setResponse.json()
            return {
              ...setData,
              filename: file.name,
              downloadUrl: file.download_url
            }
          } catch (err) {
            console.error(`Error loading ${file.name}:`, err)
            return null
          }
        })

        const sets = await Promise.all(setsPromises)
        referenceSets.value = sets.filter(set => set !== null)

      } catch (err) {
        console.error('Error loading reference sets:', err)
        referenceSetsError.value = err.message
      } finally {
        referenceSetsLoading.value = false
      }
    }

    const selectReferenceSet = (set) => {
      selectedReferenceSet.value = set
      showReferenceSetPreview.value = true
    }

    const importReferenceSet = () => {
      if (!selectedReferenceSet.value) return

      const setReferences = selectedReferenceSet.value.references || []
      const validSpecs = setReferences.filter(spec => validateExternalSpec(spec))

      if (validSpecs.length === 0) {
        alert('No valid specifications found in the selected reference set.')
        return
      }

      // Check for duplicates
      const duplicates = validSpecs.filter(spec =>
        externalSpecs.value.some(existing => existing.external_spec === spec.external_spec)
      )

      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map(spec => spec.external_spec).join(', ')
        if (!confirm(`The following specification IDs already exist: ${duplicateIds}. Do you want to skip duplicates and import the rest?`)) {
          return
        }
      }

      // Add non-duplicate specs
      const nonDuplicateSpecs = validSpecs.filter(spec =>
        !externalSpecs.value.some(existing => existing.external_spec === spec.external_spec)
      )

      nonDuplicateSpecs.forEach(spec => {
        externalSpecs.value.push({ ...spec })
      })

      markAsChanged()
      resetReferenceSetSelection()

      const importedCount = nonDuplicateSpecs.length
      const skippedCount = duplicates.length
      let message = `Successfully imported ${importedCount} specification${importedCount === 1 ? '' : 's'} from ${selectedReferenceSet.value.title}!`

      if (skippedCount > 0) {
        message += ` (${skippedCount} duplicate${skippedCount === 1 ? '' : 's'} skipped)`
      }

      alert(message)
    }

    const saveSpecs = async (retryCount = 0) => {
      const maxRetries = 2

      try {
        // Validate all external specs before saving
        const invalidSpecs = externalSpecs.value.filter(spec =>
          !spec.external_spec || !spec.gh_page || !spec.url || !spec.terms_dir ||
          !isValidUrl(spec.gh_page) || !isValidUrl(spec.url)
        )

        if (invalidSpecs.length > 0) {
          alert('Please fix validation errors before saving. All fields are required and URLs must be valid.')
          return
        }

        // Check for duplicate spec IDs
        const specIds = externalSpecs.value.map(spec => spec.external_spec)
        const duplicates = specIds.filter((id, index) => specIds.indexOf(id) !== index)
        if (duplicates.length > 0) {
          alert(`Duplicate specification IDs found: ${duplicates.join(', ')}. Please ensure all spec IDs are unique.`)
          return
        }

        saving.value = true
        error.value = ''

        const token = localStorage.getItem('github_token')
        if (!token) {
          throw new Error('No GitHub token found')
        }

        // If this is a retry due to conflict, refresh the file state first
        if (retryCount > 0) {
          await refreshFileState()
        }

        // Prepare updated content
        const updatedContent = { ...originalSpecsJson.value.content }
        if (updatedContent.specs && updatedContent.specs.length > 0) {
          updatedContent.specs[0].external_specs = externalSpecs.value
        }

        // Commit changes
        const response = await fetch(
          `https://api.github.com/repos/${owner.value}/${repo.value}/contents/specs.json`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update external specifications',
              content: btoa(JSON.stringify(updatedContent, null, 2)),
              sha: originalSpecsJson.value.sha
            })
          }
        )

        if (!response.ok) {
          // Handle 409 Conflict - file was modified by someone else
          if (response.status === 409 && retryCount < maxRetries) {
            console.log(`File conflict detected, retrying... (attempt ${retryCount + 1}/${maxRetries})`)
            return await saveSpecs(retryCount + 1)
          }
          throw new Error(`Failed to save specs.json: ${response.statusText}`)
        }

        const result = await response.json()
        originalSpecsJson.value.sha = result.content.sha
        hasChanges.value = false

        const retryMessage = retryCount > 0 ? ` (resolved after ${retryCount} retry${retryCount === 1 ? '' : 'ies'})` : ''
        alert(`External specifications saved successfully!${retryMessage}`)

      } catch (err) {
        console.error('Error saving specs:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        error.value = err.message
      } finally {
        saving.value = false
      }
    }

    const refreshFileState = async () => {
      const token = localStorage.getItem('github_token')
      if (!token) {
        throw new Error('No GitHub token found')
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner.value}/${repo.value}/contents/specs.json?ref=${branch.value}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to refresh file state: ${response.statusText}`)
      }

      const data = await response.json()
      const content = JSON.parse(atob(data.content))

      // Update the SHA for the next save attempt
      originalSpecsJson.value = {
        content: content,
        sha: data.sha
      }

      console.log('File state refreshed with new SHA:', data.sha)
    }

    const goBack = () => {
      if (hasChanges.value) {
        if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
          router.push(`/files/${owner.value}/${repo.value}/${branch.value}`)
        }
      } else {
        router.push(`/files/${owner.value}/${repo.value}/${branch.value}`)
      }
    }

    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(owner.value, repo.value, branch.value)

      loadSpecs()
      loadReferenceSets()
    })

    return {
      owner,
      repo,
      branch,
      loading,
      saving,
      error,
      externalSpecs,
      newSpec,
      hasChanges,
      addMode,
      bulkImportMode,
      jsonInput,
      githubUrlInput,
      jsonError,
      urlError,
      bulkImportLoading,
      bulkPreviewData,
      jsonInputFocused,
      exampleJsonPlaceholder,
      autoPreviewStatus,
      referenceSets,
      referenceSetsLoading,
      referenceSetsError,
      selectedReferenceSet,
      showReferenceSetPreview,
      resetNewSpec,
      resetBulkImport,
      resetReferenceSetSelection,
      onJsonInputChange,
      markAsChanged,
      isValidUrl,
      addNewSpec,
      removeSpec,
      previewBulkImport,
      importBulkSpecs,
      loadReferenceSets,
      selectReferenceSet,
      importReferenceSet,
      saveSpecs,
      goBack
    }
  }
}
</script>

<style scoped>
.table input {
  border: none;
  background: transparent;
  font-size: 0.875rem;
}

.table input:focus {
  background: #f8f9fa;
  border: 1px solid #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.alert {
  border-left: 4px solid;
}

.alert-info {
  border-left-color: #0dcaf0;
}

.alert-warning {
  border-left-color: #ffc107;
}

.alert-danger {
  border-left-color: #dc3545;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.nav-tabs .nav-link {
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #495057;
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

.font-monospace {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
