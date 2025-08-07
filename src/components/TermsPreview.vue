<template>
  <!-- Full Page View -->
  <div class="terms-preview-standalone min-vh-100 bg-light">
    <div class="container-fluid mt-3">
      <!-- Header Section -->
      <div class="row mb-1">
        <div class="col-12">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center">
              <!-- <button type="button" class="btn btn-outline-secondary me-3" @click="navigateBack">
                <i class="bi bi-arrow-left"></i>
                <span class="d-none d-sm-inline ms-1">Back</span>
              </button> -->
              <h2 class="mb-0 d-flex align-items-center">
                <i class="bi bi-book text-primary me-2"></i>
                <span class="fw-semibold">Terms & Definitions Preview</span>
              </h2>
            </div>
            <button type="button" class="btn btn-outline-primary d-flex align-items-center gap-1"
              @click="refreshPreview" :disabled="loading"
              :title="loading ? 'Refreshing terms...' : 'Clear cache and reload all terms'">
              <i class="bi" :class="loading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'"></i>
              <span class="d-none d-sm-inline">Refresh</span>
            </button>
          </div>
          <!-- Repository Info -->
          <div
            class="repository-info d-flex flex-column flex-md-row align-items-start align-items-md-center gap-1 text-muted mb-4">
            <i class="bi bi-github me-2"></i>
            <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
            <span class="mx-2">•</span>
            <span class="badge bg-secondary">{{ branch }}</span>
          </div>
        </div>
      </div>

      <!-- Content Section (reuse modal content) -->
      <div class="terms-preview-content bg-white rounded shadow-sm p-4">
        <template v-if="loading || error || allTerms.length > 0">
          <!-- Search and Filter Controls (reuse from modal) -->
          <div class="search-controls-section mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body p-3">
                <div class="row g-3 align-items-end">
                  <div class="col-md-7">
                    <label class="form-label small text-muted fw-medium mb-1">Search Terms</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0">
                        <i class="bi bi-search text-muted"></i>
                      </span>
                      <input type="text" class="form-control border-start-0 ps-0" v-model="searchQuery"
                        placeholder="Search by term name, definition, or alias..." @input="filterTerms">
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label small text-muted fw-medium mb-1">Filter Type</label>
                    <select class="form-select" v-model="filterType" @change="filterTerms">
                      <option value="all">All Terms</option>
                      <option value="local">Local Only</option>
                      <option value="external">External Only</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <div class="view-mode-toggle btn-group w-100 justify-content-center" role="group">
                      <input type="radio" class="btn-check" id="compact-view-standalone" v-model="viewMode"
                        value="compact">
                      <label class="btn btn-outline-secondary btn-sm" for="compact-view-standalone"
                        title="Compact View">
                        <i class="bi bi-list"></i>
                      </label>
                      <input type="radio" class="btn-check" id="detailed-view-standalone" v-model="viewMode"
                        value="detailed">
                      <label class="btn btn-outline-secondary btn-sm" for="detailed-view-standalone"
                        title="Detailed View">
                        <i class="bi bi-card-text"></i>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Include the rest of the modal content -->
          <div v-if="loading" class="loading-state-container">
            <!-- Same loading content as modal -->
            <div class="text-center py-5">
              <div class="loading-spinner spinner-border text-primary mb-3" role="status"
                style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">{{ loadingMessage }}</span>
              </div>
              <h6 class="fw-medium text-dark mb-2">Loading Terms & Definitions</h6>
              <p class="text-muted mb-0">{{ loadingMessage }}</p>
            </div>

            <!-- Progress indicator for external specs -->
            <div v-if="proxyInfo && specsConfig?.specs?.[0]?.external_specs?.length" class="mt-4">
              <div class="alert alert-info border-0 shadow-sm d-flex align-items-start">
                <i class="bi bi-info-circle text-info me-3 mt-1"></i>
                <div class="flex-grow-1">
                  <div class="fw-medium mb-1">Processing External Specifications</div>
                  <div class="small text-muted">
                    Loading {{ specsConfig.specs[0].external_specs.length }} external spec(s) may take a moment...
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            {{ error }}
          </div>

          <!-- Terms Display (reuse from modal) -->
          <div v-else class="terms-preview-container">
            <!-- Statistics and Status -->
            <div class="stats-section mb-4">
              <div class="card border-0 bg-light">
                <div class="card-body px-3 py-0">
                  <div class="row align-items-center">
                    <div class="col-md-8">
                      <div class="d-flex flex-wrap align-items-center gap-3">
                        <div class="stats-metric">
                          <span class="text-primary fs-5">{{ filteredTerms.length }}</span>
                          <span class="text-muted small"> of {{ allTerms.length }} terms displayed</span>
                        </div>
                        <div v-if="getTermCounts().local > 0" class="stats-badge">
                          <i class="bi bi-folder text-primary me-1"></i>
                          <span class="fw-medium">{{ getTermCounts().local }}</span>
                          <span class="text-muted small"> Local</span>
                        </div>
                        <div v-if="getTermCounts().external > 0" class="stats-badge">
                          <i class="bi bi-link-45deg text-success me-1"></i>
                          <span class="fw-medium">{{ getTermCounts().external }}</span>
                          <span class="text-muted small"> External</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Status Messages -->
                  <div v-if="proxyInfo && !loading" class="mt-3">
                    <div class="alert alert-success alert-sm border-0 d-flex align-items-center mb-0 py-2">
                      <i class="bi bi-check-circle text-success me-2"></i>
                      <small class="mb-0">{{ proxyInfo }}</small>
                    </div>
                  </div>

                  <div v-if="refreshSuccess && !loading" class="mt-3">
                    <div class="alert alert-info alert-sm border-0 d-flex align-items-center mb-0 py-2">
                      <i class="bi bi-arrow-clockwise text-info me-2"></i>
                      <small class="mb-0">Terms refreshed successfully! Cache cleared and reloaded {{ allTerms.length }}
                        terms.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Include terms list content from modal (same structure) -->
            <!-- No Results -->
            <div v-if="filteredTerms.length === 0 && !loading" class="empty-results-state">
              <div class="text-center py-5">
                <div class="empty-icon mb-3">
                  <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                </div>
                <h6 class="fw-medium text-dark mb-2">
                  {{ searchQuery ? 'No Terms Found' : 'No Terms Available' }}
                </h6>
                <p class="text-muted mb-3">
                  {{ searchQuery ? 'No terms found matching your search criteria.' :
                    'This repository does not contain any term definitions.' }}
                </p>
                <div v-if="!searchQuery && allTerms.length === 0" class="alert alert-light border d-inline-block">
                  <div class="d-flex align-items-start">
                    <i class="bi bi-info-circle text-info me-2 mt-1"></i>
                    <div class="text-start">
                      <div class="small fw-medium mb-1">Possible Reasons:</div>
                      <ul class="small text-muted mb-0 ps-3">
                        <li>Terms may be located in a different directory structure</li>
                        <li>Repository may not contain Spec-Up term definitions</li>
                        <li>External specifications may not be accessible</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div v-if="searchQuery" class="mt-3">
                  <button class="btn btn-outline-secondary btn-sm" @click="searchQuery = ''; filterTerms()">
                    <i class="bi bi-x-circle me-1"></i> Clear Search
                  </button>
                </div>
              </div>
            </div>

            <!-- Terms List (reuse from modal) -->
            <div v-else class="terms-list">
              <!-- Compact View -->
              <template v-if="viewMode === 'compact'">
                <div class="compact-terms-container">
                  <div class="list-group list-group-flush">
                    <div v-for="term in filteredTerms" :key="getTermKey(term)"
                      class="list-group-item compact-term-item border-0 border-bottom">
                      <div class="row align-items-start flex-column flex-sm-row">
                        <div class="col-md-4 col-lg-3 mb-2 mb-md-0">
                          <div class="term-header mb-3 mb-sm-0">
                            <div class="term-name-container d-flex align-items-center mb-1">
                              <span class="term-name text-primary me-2">{{ term.id }}</span>
                              <span v-if="term.external" class="badge bg-success badge-sm">
                                <i class="bi bi-link-45deg"></i> {{ term.externalSpec }}
                              </span>
                              <span v-else class="badge bg-primary badge-sm">
                                <i class="bi bi-folder"></i> Local
                              </span>
                            </div>

                            <div v-if="term.aliases && term.aliases.length > 0" class="aliases-compact">
                              <div class="small text-muted mb-1">
                                <i class="bi bi-tags me-1"></i>Aliases:
                              </div>
                              <div class="alias-tags">
                                <span v-for="alias in term.aliases.slice(0, 3)" :key="alias" class="alias-tag">
                                  {{ alias }}
                                </span>
                                <span v-if="term.aliases.length > 3" class="text-muted small">
                                  +{{ term.aliases.length - 3 }} more
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="col-md-8 col-lg-9">
                          <div class="definition-preview">
                            <div v-if="term.definitionText" class="text-secondary small lh-base">
                              {{ truncateText(term.definitionText, 150) }}
                            </div>
                            <div v-else class="text-muted fst-italic small">
                              <i class="bi bi-exclamation-circle me-1"></i>
                              No definition available
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Detailed View -->
              <template v-else>
                <div class="detailed-terms-container">
                  <div class="row g-4">
                    <div v-for="term in filteredTerms" :key="getTermKey(term)" class="col-12 col-lg-6">
                      <div class="card term-card h-100 shadow-sm border-0">
                        <div class="card-header bg-light border-0 d-flex justify-content-between align-items-start">
                          <div class="term-header-info flex-grow-1">
                            <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
                              <h6 class="term-name text-primary mb-0 fw-semibold">{{ term.id }}</h6>
                              <span v-if="term.external" class="badge bg-success d-flex align-items-center gap-1">
                                <i class="bi bi-link-45deg"></i>
                                <span class="small">{{ term.externalSpec }}</span>
                              </span>
                              <span v-else class="badge bg-primary d-flex align-items-center gap-1">
                                <i class="bi bi-folder"></i>
                                <span class="small">Local</span>
                              </span>
                            </div>
                            <div class="small text-muted">
                              <i class="bi bi-file-text me-1"></i>
                              {{ term.source || (term.external ? 'External Reference' : 'Local Definition') }}
                            </div>
                          </div>
                        </div>

                        <div class="card-body">
                          <!-- Aliases Section -->
                          <div v-if="term.aliases && term.aliases.length > 0" class="aliases-section mb-3">
                            <div class="small fw-medium text-muted mb-2 d-flex align-items-center">
                              <i class="bi bi-tags me-1"></i>
                              Also known as:
                            </div>
                            <div class="alias-tags-detailed">
                              <span v-for="alias in term.aliases" :key="alias" class="alias-tag-detailed me-1 mb-1">
                                {{ alias }}
                              </span>
                            </div>
                          </div>

                          <!-- Definition Section -->
                          <div class="definition-section">
                            <div class="small fw-medium text-muted mb-2 d-flex align-items-center">
                              <i class="bi bi-blockquote-left me-1"></i>
                              Definition:
                            </div>
                            <div class="definition-content-detailed">
                              <div v-if="term.definition" v-html="term.definition"
                                class="terms-and-definitions-list rendered-definition"></div>
                              <div v-else-if="term.definitionText" class="definition-text-plain">
                                {{ term.definitionText }}
                              </div>
                              <div v-else class="no-definition-notice">
                                <div class="alert alert-light border d-flex align-items-center mb-0">
                                  <i class="bi bi-info-circle text-warning me-2"></i>
                                  <span class="small">No definition available for this term</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTermsManagement } from '../composables/useTermsManagement.js'
import { getLoadingMessage } from '../utils/loadingMessages.js'

export default {
  name: 'TermsPreview',
  props: {
    owner: {
      type: String,
      required: true
    },
    repo: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      default: 'main'
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()

    // Navigation function for standalone view
    const navigateBack = () => {
      // Navigate back to the file explorer for this repository
      router.push(`/files/${props.owner}/${props.repo}/${props.branch}`)
    }

    // Mock auth function for terms management
    const checkAuthAndRedirect = (err) => {
      if (err?.response?.status === 401) {
        // Could emit or handle auth redirect here
        console.warn('Authentication required for terms preview')
        return true
      }
      return false
    }

    // UI State
    const searchQuery = ref('')
    const filterType = ref('all')
    const viewMode = ref('compact')
    const allTerms = ref([])
    const filteredTerms = ref([])
    const refreshSuccess = ref(false)

    // Use terms management composable
    const {
      initializeTerms,
      terms: managedTerms,
      loadingTerms,
      termsError,
      proxyInfo,
      specsConfig,
      refreshTerms
    } = useTermsManagement(props, checkAuthAndRedirect)

    // Use loading and error states from composable
    const loading = computed(() => loadingTerms.value)
    const error = computed(() => termsError.value)
    const loadingMessage = computed(() => getLoadingMessage(proxyInfo.value))

    // Filter terms based on search and type
    const filterTerms = () => {
      let filtered = allTerms.value

      // Filter by type
      if (filterType.value === 'local') {
        filtered = filtered.filter(term => !term.external)
      } else if (filterType.value === 'external') {
        filtered = filtered.filter(term => term.external)
      }

      // Filter by search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(term => {
          return term.id.toLowerCase().includes(query) ||
            term.aliases.some(alias => alias.toLowerCase().includes(query)) ||
            (term.definitionText && term.definitionText.toLowerCase().includes(query)) ||
            (term.external && term.externalSpec && term.externalSpec.toLowerCase().includes(query)) ||
            (term.source && term.source.toLowerCase().includes(query))
        })
      }

      filteredTerms.value = filtered
    }

    // Utility functions
    const getTermKey = (term) => {
      return term.id + (term.external ? '_' + term.externalSpec : '_local')
    }

    const truncateText = (text, length) => {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    }

    // Get counts of different term types
    const getTermCounts = () => {
      const counts = { local: 0, external: 0 }
      allTerms.value.forEach(term => {
        if (term.external) {
          counts.external++
        } else {
          counts.local++
        }
      })
      return counts
    }

    // Load terms when component is mounted
    const loadAllTerms = async () => {
      try {
        await initializeTerms()
        allTerms.value = [...managedTerms.value]
        filterTerms()
      } catch (err) {
        console.error('Error loading terms for preview:', err)
      }
    }

    // Watch for changes and re-filter
    const refreshPreview = async () => {
      console.log('🔄 Refresh preview clicked - clearing cache and reloading...')
      refreshSuccess.value = false
      try {
        // Clear cache and force reload from repository
        await refreshTerms()
        // Update local state with the fresh data
        allTerms.value = [...managedTerms.value]
        filterTerms()
        console.log(`✅ Refresh completed - loaded ${allTerms.value.length} terms`)

        // Show success feedback briefly
        refreshSuccess.value = true
        setTimeout(() => {
          refreshSuccess.value = false
        }, 3000)
      } catch (err) {
        console.error('❌ Error refreshing terms for preview:', err)
      }
    }

    // Setup component initialization
    onMounted(() => {
      // Load terms immediately
      loadAllTerms()
    })

    // Watch for route changes to reload terms
    watch(() => route.path, () => {
      loadAllTerms()
    })

    return {
      // UI State
      searchQuery,
      filterType,
      viewMode,
      allTerms,
      filteredTerms,
      loading,
      error,
      loadingMessage,
      proxyInfo,
      specsConfig,
      refreshSuccess,

      // Methods
      filterTerms,
      getTermKey,
      truncateText,
      getTermCounts,
      refreshPreview,
      navigateBack
    }
  }
}
</script>

<style scoped></style>
