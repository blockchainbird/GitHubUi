<template>
  <div class="modal fade" id="termsPreviewModal" tabindex="-1" aria-labelledby="termsPreviewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-light">
          <h5 class="modal-title" id="termsPreviewModalLabel">
            <i class="bi bi-book"></i>
            Terms & Definitions Preview
          </h5>
          <div class="d-flex align-items-center ms-3">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm me-2 refresh-btn"
              @click="refreshPreview"
              :disabled="loading"
              :title="loading ? 'Refreshing terms...' : 'Clear cache and reload all terms'">
              <i class="bi" :class="loading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'"></i>
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        </div>
        
        <div class="modal-body">
          <!-- Search and Filter Controls -->
          <div class="search-controls">
            <div class="row">
              <div class="col-md-8">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="searchQuery"
                    placeholder="Search terms or definitions..."
                    @input="filterTerms">
                </div>
              </div>
              <div class="col-md-4">
                <select class="form-select" v-model="filterType" @change="filterTerms">
                  <option value="all">All Terms</option>
                  <option value="local">Local Terms</option>
                  <option value="external">External Terms</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="empty-state">
            <div class="loading-spinner spinner-border" role="status">
              <span class="visually-hidden">{{ loadingMessage }}</span>
            </div>
            <p class="loading-text mt-3">{{ loadingMessage }}</p>
            
            <!-- Progress indicator for external specs -->
            <div v-if="proxyInfo && specsConfig?.specs?.[0]?.external_specs?.length" class="mt-3">
              <div class="alert alert-info d-flex align-items-center">
                <i class="bi bi-info-circle me-2"></i>
                <div>
                  <small class="text-muted d-block">
                    Loading external specifications may take a moment...
                  </small>
                  <small class="text-muted">
                    Found {{ specsConfig.specs[0].external_specs.length }} external spec(s) to process
                  </small>
                </div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            {{ error }}
          </div>

          <!-- Terms Display -->
          <div v-else class="terms-preview-container">
            <!-- Statistics -->
            <div class="stats-bar">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex flex-wrap">
                  <div class="stats-item">
                    <strong>{{ filteredTerms.length }}</strong> of {{ allTerms.length }} terms
                  </div>
                  <div class="stats-item" v-if="getTermCounts().local > 0">
                    <i class="bi bi-folder"></i> {{ getTermCounts().local }} Terms Dir
                  </div>
                  <div class="stats-item" v-if="getTermCounts().external > 0">
                    <i class="bi bi-link-45deg"></i> {{ getTermCounts().external }} External
                  </div>
                </div>
                <div class="view-mode-buttons btn-group btn-group-sm">
                  <button 
                    class="btn btn-outline-secondary"
                    :class="{ active: viewMode === 'compact' }"
                    @click="viewMode = 'compact'">
                    <i class="bi bi-list"></i> Compact
                  </button>
                  <button 
                    class="btn btn-outline-secondary"
                    :class="{ active: viewMode === 'detailed' }"
                    @click="viewMode = 'detailed'">
                    <i class="bi bi-card-text"></i> Detailed
                  </button>
                </div>
              </div>
              
              <!-- Show loading completion summary -->
              <div v-if="proxyInfo && !loading" class="mt-2">
                <div class="alert alert-success alert-sm d-flex align-items-center">
                  <i class="bi bi-check-circle me-2"></i>
                  <small>{{ proxyInfo }}</small>
                </div>
              </div>
              
              <!-- Show refresh success message -->
              <div v-if="refreshSuccess && !loading" class="mt-2">
                <div class="alert alert-info alert-sm d-flex align-items-center">
                  <i class="bi bi-arrow-clockwise me-2"></i>
                  <small>Terms refreshed successfully! Cache cleared and reloaded {{ allTerms.length }} terms.</small>
                </div>
              </div>
            </div>

            <!-- No Results -->
            <div v-if="filteredTerms.length === 0 && !loading" class="empty-state">
              <i class="bi bi-search"></i>
              <p class="mt-3">
                {{ searchQuery ? 'No terms found matching your search.' : 'No terms available.' }}
              </p>
              <div v-if="!searchQuery && allTerms.length === 0" class="mt-2">
                <small class="text-muted">
                  This repository may not contain any term definitions, or they may be located in a different directory structure.
                </small>
              </div>
            </div>

            <!-- Terms List -->
            <div v-else class="terms-list" style="max-height: 60vh; overflow-y: auto;">
              
              <!-- Compact View -->
              <template v-if="viewMode === 'compact'">
                <div class="list-group">
                  <div 
                    v-for="term in filteredTerms" 
                    :key="getTermKey(term)"
                    class="list-group-item compact-term-item">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                          <strong class="term-name me-2">{{ term.id }}</strong>
                          <span 
                            v-if="term.external" 
                            class="badge bg-success">
                            <i class="bi bi-link-45deg"></i> {{ term.externalSpec }}
                          </span>
                          <span v-else class="badge bg-primary">
                            <i class="bi bi-folder"></i> Terms
                          </span>
                        </div>
                        
                        <div v-if="term.aliases && term.aliases.length > 0" class="aliases-list mb-2">
                          <small class="text-muted me-1"><strong>Aliases:</strong></small>
                          <span 
                            v-for="alias in term.aliases" 
                            :key="alias"
                            class="alias-badge">
                            {{ alias }}
                          </span>
                        </div>
                        
                        <div class="definition-content">
                          <div v-if="term.definitionText" class="text-secondary">
                            {{ truncateText(term.definitionText, 120) }}
                          </div>
                          <div v-else class="text-muted fst-italic">
                            No definition available
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Detailed View -->
              <template v-else>
                <div class="row g-3">
                  <div 
                    v-for="term in filteredTerms" 
                    :key="getTermKey(term)"
                    class="col-12">
                    <div class="card term-card h-100">
                      <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                          <strong class="term-name me-2">{{ term.id }}</strong>
                          <span 
                            v-if="term.external" 
                            class="badge bg-success">
                            <i class="bi bi-link-45deg"></i> {{ term.externalSpec }}
                          </span>
                          <span v-else class="badge bg-primary">
                            <i class="bi bi-folder"></i> Terms
                          </span>
                        </div>
                        <small class="text-muted">
                          {{ term.source || (term.external ? 'External' : 'Local') }}
                        </small>
                      </div>
                      <div class="card-body">
                        <div v-if="term.aliases && term.aliases.length > 0" class="aliases-list mb-3">
                          <strong class="text-muted small">Aliases:</strong>
                          <div class="mt-1">
                            <span 
                              v-for="alias in term.aliases" 
                              :key="alias"
                              class="alias-badge">
                              {{ alias }}
                            </span>
                          </div>
                        </div>
                        
                        <div class="definition-content">
                          <div v-if="term.definition" v-html="term.definition" class="terms-and-definitions-list"></div>
                          <div v-else-if="term.definitionText" class="definition-text">
                            {{ term.definitionText }}
                          </div>
                          <div v-else class="text-muted fst-italic">
                            No definition available
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
        
        <div class="modal-footer bg-light">
          <div class="me-auto small text-muted">
            <i class="bi bi-info-circle"></i>
            Static preview of all terms and definitions in the repository
          </div>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="bi bi-x-lg"></i> Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useTermsManagement } from '../composables/useTermsManagement.js'
import { getLoadingMessage } from '../utils/loadingMessages.js'
import '../styles/terms-preview.css'

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

    // Load terms when modal is shown
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

    // Set up modal event listeners
    onMounted(() => {
      const modalElement = document.getElementById('termsPreviewModal')
      if (modalElement) {
        // Load terms when modal is shown
        modalElement.addEventListener('show.bs.modal', () => {
          loadAllTerms()
        })
        
        // Clean up when modal is hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
          // Reset state when modal closes
          searchQuery.value = ''
          filterType.value = 'all'
          allTerms.value = []
          filteredTerms.value = []
          refreshSuccess.value = false
        })
      }
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
      refreshPreview
    }
  }
}
</script>

<style scoped>
/* Component-specific styles - main styles are in terms-preview.css */
@media (max-width: 768px) {
  .search-controls {
    padding: 0.5rem;
  }
  
  .search-controls .row > div {
    margin-bottom: 0.5rem;
  }
  
  .search-controls .row > div:last-child {
    margin-bottom: 0;
  }
  
  .stats-bar {
    padding: 0.5rem;
  }
  
  .stats-item {
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }
}
</style>
