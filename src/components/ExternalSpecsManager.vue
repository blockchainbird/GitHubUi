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
            <!-- Repository Info Row -->
            <div class="repository-info d-flex align-items-center text-muted">
              <i class="bi bi-github me-2"></i>
              <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
              <span class="mx-2">•</span>
              <span class="badge bg-secondary">{{ branch }}</span>
            </div>
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
                              <div v-if="set.filename">
                                <strong>Source:</strong> 
                                <a :href="getRepositoryFileUrl(set)" target="_blank" rel="noopener" 
                                   class="text-decoration-none small">
                                  <i class="bi bi-file-earmark-code"></i> {{ set.filename }}
                                  <i class="bi bi-box-arrow-up-right ms-1"></i>
                                </a>
                              </div>
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
                                <div v-if="selectedReferenceSet.filename">
                                  <strong>Source:</strong> 
                                  <a :href="getRepositoryFileUrl(selectedReferenceSet)" target="_blank" rel="noopener" 
                                     class="text-decoration-none">
                                    <i class="bi bi-file-earmark-code"></i> {{ selectedReferenceSet.filename }}
                                    <i class="bi bi-box-arrow-up-right ms-1"></i>
                                  </a>
                                </div>
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
import { useSpecsManager } from '../composables/useSpecsManager.js'
import { useSpecsValidation } from '../composables/useSpecsValidation.js'
import { useBulkImport } from '../composables/useBulkImport.js'
import { useReferenceSets } from '../composables/useReferenceSets.js'
import { useNotifications } from '../composables/useNotifications.js'

export default {
  name: 'ExternalSpecsManager',
  setup() {
    const router = useRouter()
    const route = useRoute()

    // Route parameters
    const owner = ref(route.params.owner)
    const repo = ref(route.params.repo)
    const branch = ref(route.params.branch)

    // Composables
    const specsManager = useSpecsManager()
    const validation = useSpecsValidation()
    const bulkImport = useBulkImport()
    const referenceSets = useReferenceSets()
    const { notifySuccess, notifyError, notifyWarning, confirmAction } = useNotifications()

    // UI state
    const addMode = ref('single')

    // Enhanced methods
    const handleAddNewSpec = () => {
      const result = specsManager.addNewSpec(
        specsManager.newSpec.value,
        specsManager.externalSpecs.value,
        validation.checkForDuplicateId,
        validation.validateNewSpec
      )

      if (result.success) {
        notifySuccess('Specification added successfully!')
      } else {
        notifyError(result.message)
      }
    }

    const handleRemoveSpec = (index) => {
      if (confirmAction('Are you sure you want to remove this external specification?')) {
        specsManager.removeSpec(index)
      }
    }

    const handlePreviewBulkImport = async () => {
      bulkImport.bulkImportLoading.value = true
      bulkImport.clearErrorsAndStatus()

      try {
        let specsData = null

        if (bulkImport.bulkImportMode.value === 'json') {
          specsData = bulkImport.parseJsonData()
        } else if (bulkImport.bulkImportMode.value === 'url') {
          specsData = await bulkImport.fetchDataFromUrl(validation.isValidUrl)
        }

        if (!specsData) {
          bulkImport.bulkPreviewData.value = []
          return
        }

        if (!bulkImport.validateArrayData(specsData)) {
          bulkImport.bulkPreviewData.value = []
          return
        }

        const { validSpecs, invalidSpecs } = bulkImport.categorizeSpecs(specsData, validation.validateExternalSpec)

        if (validSpecs.length === 0) {
          bulkImport.handleNoValidSpecs(invalidSpecs)
          return
        }

        const validSpecsWithDuplicateCheck = validation.markSpecsWithDuplicates(validSpecs, specsManager.externalSpecs.value)
        bulkImport.bulkPreviewData.value = [...validSpecsWithDuplicateCheck, ...invalidSpecs]
        bulkImport.updateAutoPreviewStatus(validSpecs)

      } catch (err) {
        const errorMsg = `Error processing data: ${err.message}`
        bulkImport.setError(bulkImport.bulkImportMode.value, errorMsg)
        bulkImport.bulkPreviewData.value = []
      } finally {
        bulkImport.bulkImportLoading.value = false
      }
    }

    const handleImportBulkSpecs = () => {
      const validSpecs = bulkImport.bulkPreviewData.value.filter(spec => !spec._isInvalid)

      if (validSpecs.length === 0) {
        notifyError('No valid specifications to import. Please fix the validation errors first.')
        return
      }

      const duplicates = validSpecs.filter(spec => spec._isDuplicate)
      if (duplicates.length > 0) {
        const unresolved = duplicates.filter(spec => 
          !spec.external_spec ||
          specsManager.externalSpecs.value.some(existing => existing.external_spec === spec.external_spec)
        )

        if (unresolved.length > 0) {
          notifyError('Please resolve all duplicate specification IDs before importing')
          return
        }
      }

      validSpecs.forEach(spec => {
        const cleanSpec = { ...spec }
        delete cleanSpec._isDuplicate
        delete cleanSpec._isInvalid
        specsManager.externalSpecs.value.push(cleanSpec)
      })

      bulkImport.resetBulkImport()
      addMode.value = 'single'
      specsManager.markAsChanged()

      notifySuccess(`Successfully imported ${validSpecs.length} valid external specifications!`)
    }

    const handleImportReferenceSet = () => {
      const validation_result = referenceSets.validateReferenceSetImport(
        referenceSets.selectedReferenceSet.value,
        specsManager.externalSpecs.value,
        validation.validateExternalSpec
      )

      if (!validation_result.valid) {
        notifyError(validation_result.message || 'Invalid reference set')
        return
      }

      const { validSpecs, duplicates } = validation_result

      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map(spec => spec.external_spec).join(', ')
        if (!confirmAction(`The following specification IDs already exist: ${duplicateIds}. Do you want to skip duplicates and import the rest?`)) {
          return
        }
      }

      const nonDuplicateSpecs = validSpecs.filter(spec =>
        !specsManager.externalSpecs.value.some(existing => existing.external_spec === spec.external_spec)
      )

      nonDuplicateSpecs.forEach(spec => {
        specsManager.externalSpecs.value.push({ ...spec })
      })

      specsManager.markAsChanged()
      referenceSets.resetReferenceSetSelection()

      const message = referenceSets.createImportMessage(
        nonDuplicateSpecs.length,
        duplicates.length,
        referenceSets.selectedReferenceSet.value.title
      )
      notifySuccess(message)
    }

    const handleSaveSpecs = async () => {
      const result = await specsManager.saveSpecs(
        owner.value,
        repo.value,
        branch.value,
        router,
        validation.validateAllSpecs,
        validation.checkForDuplicates
      )

      if (result.success) {
        notifySuccess(result.message)
      } else {
        notifyError(result.message)
      }
    }

    const handleGoBack = () => {
      if (specsManager.hasChanges.value) {
        if (confirmAction('You have unsaved changes. Are you sure you want to go back?')) {
          router.push(`/files/${owner.value}/${repo.value}/${branch.value}`)
        }
      } else {
        router.push(`/files/${owner.value}/${repo.value}/${branch.value}`)
      }
    }

    const getRepositoryFileUrl = (set) => {
      if (!set.filename) return '#'
      return `https://github.com/blockchainbird/spec-up-gs/blob/main/external-reference-sets/${set.filename}`
    }

    onMounted(() => {
      addToVisitedRepos(owner.value, repo.value, branch.value)
      specsManager.loadSpecs(owner.value, repo.value, branch.value, router)
      referenceSets.loadReferenceSets()
    })

    return {
      // Route parameters
      owner,
      repo,
      branch,

      // Manager state
      loading: specsManager.loading,
      saving: specsManager.saving,
      error: specsManager.error,
      externalSpecs: specsManager.externalSpecs,
      newSpec: specsManager.newSpec,
      hasChanges: specsManager.hasChanges,

      // Bulk import state
      addMode,
      bulkImportMode: bulkImport.bulkImportMode,
      jsonInput: bulkImport.jsonInput,
      githubUrlInput: bulkImport.githubUrlInput,
      jsonError: bulkImport.jsonError,
      urlError: bulkImport.urlError,
      bulkImportLoading: bulkImport.bulkImportLoading,
      bulkPreviewData: bulkImport.bulkPreviewData,
      jsonInputFocused: bulkImport.jsonInputFocused,
      exampleJsonPlaceholder: bulkImport.exampleJsonPlaceholder,
      autoPreviewStatus: bulkImport.autoPreviewStatus,

      // Reference sets state
      referenceSets: referenceSets.referenceSets,
      referenceSetsLoading: referenceSets.referenceSetsLoading,
      referenceSetsError: referenceSets.referenceSetsError,
      selectedReferenceSet: referenceSets.selectedReferenceSet,
      showReferenceSetPreview: referenceSets.showReferenceSetPreview,

      // Methods
      resetNewSpec: specsManager.resetNewSpec,
      resetBulkImport: bulkImport.resetBulkImport,
      resetReferenceSetSelection: referenceSets.resetReferenceSetSelection,
      onJsonInputChange: () => bulkImport.onJsonInputChange(handlePreviewBulkImport),
      markAsChanged: specsManager.markAsChanged,
      isValidUrl: validation.isValidUrl,
      getRepositoryFileUrl,

      // Enhanced handlers
      addNewSpec: handleAddNewSpec,
      removeSpec: handleRemoveSpec,
      previewBulkImport: handlePreviewBulkImport,
      importBulkSpecs: handleImportBulkSpecs,
      loadReferenceSets: referenceSets.loadReferenceSets,
      selectReferenceSet: referenceSets.selectReferenceSet,
      importReferenceSet: handleImportReferenceSet,
      saveSpecs: handleSaveSpecs,
      goBack: handleGoBack
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
