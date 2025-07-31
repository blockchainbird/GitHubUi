<template>
  <div class="modal fade" id="termsPreviewModal" tabindex="-1" aria-labelledby="termsPreviewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-light">
          <h5 class="modal-title" id="termsPreviewModalLabel">
            <i class="bi bi-book"></i>
            Terms & Definitions Preview
          </h5>
          <div class="d-flex align-items-center">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm me-2"
              @click="refreshPreview"
              :disabled="loading"
              title="Refresh terms">
              <i class="bi" :class="loading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'"></i>
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        </div>
        
        <div class="modal-body">
          <!-- Search and Filter Controls -->
          <div class="row mb-4">
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
                <option value="local">Local Terms Only</option>
                <option value="external">External Terms Only</option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading terms...</span>
            </div>
            <p class="mt-3 text-muted">Loading terms and definitions...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            {{ error }}
          </div>

          <!-- Terms Display -->
          <div v-else class="terms-preview-container">
            <!-- Statistics -->
            <div class="row mb-3">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center bg-light p-2 rounded">
                  <small class="text-muted">
                    Showing {{ filteredTerms.length }} of {{ allTerms.length }} terms
                  </small>
                  <div class="btn-group btn-group-sm">
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
              </div>
            </div>

            <!-- No Results -->
            <div v-if="filteredTerms.length === 0 && !loading" class="text-center py-5">
              <i class="bi bi-search fs-1 text-muted"></i>
              <p class="mt-3 text-muted">
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
                    class="list-group-item list-group-item-action">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                          <strong class="term-name me-2">{{ term.id }}</strong>
                          <span 
                            v-if="term.external" 
                            class="badge bg-success">
                            {{ term.externalSpec }}
                          </span>
                          <span v-else class="badge bg-primary">Local</span>
                        </div>
                        
                        <div v-if="term.aliases && term.aliases.length > 0" class="text-muted small mb-2">
                          <strong>Aliases:</strong> {{ term.aliases.join(', ') }}
                        </div>
                        
                        <div class="definition-text">
                          <div v-if="term.definitionText" class="text-secondary small">
                            {{ truncateText(term.definitionText, 120) }}
                          </div>
                          <div v-else class="text-muted fst-italic small">
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
                    <div class="card h-100">
                      <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                          <strong class="term-name me-2">{{ term.id }}</strong>
                          <span 
                            v-if="term.external" 
                            class="badge bg-success">
                            <i class="bi bi-link-45deg"></i> {{ term.externalSpec }}
                          </span>
                          <span v-else class="badge bg-primary">
                            <i class="bi bi-house"></i> Local
                          </span>
                        </div>
                        <small class="text-muted">
                          {{ term.source || (term.external ? 'External' : 'Local') }}
                        </small>
                      </div>
                      <div class="card-body">
                        <div v-if="term.aliases && term.aliases.length > 0" class="mb-3">
                          <strong class="text-muted small">Aliases:</strong>
                          <div class="mt-1">
                            <span 
                              v-for="alias in term.aliases" 
                              :key="alias"
                              class="badge bg-light text-dark me-1">
                              {{ alias }}
                            </span>
                          </div>
                        </div>
                        
                        <div class="definition-content">
                          <div v-if="term.definition" v-html="term.definition" class="definition-html"></div>
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

    // Use terms management composable
    const { 
      initializeTerms,
      terms: managedTerms,
      loadingTerms,
      termsError
    } = useTermsManagement(props, checkAuthAndRedirect)

    // Use loading and error states from composable
    const loading = computed(() => loadingTerms.value)
    const error = computed(() => termsError.value)

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
                 (term.external && term.externalSpec && term.externalSpec.toLowerCase().includes(query))
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
    const refreshPreview = () => {
      loadAllTerms()
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
      
      // Methods
      filterTerms,
      getTermKey,
      truncateText,
      refreshPreview
    }
  }
}
</script>

<style scoped>
.terms-preview-container {
  font-size: 0.95rem;
}

.term-name {
  color: #2d72d9;
  font-size: 1.1rem;
}

.definition-html {
  line-height: 1.6;
}

.definition-html :deep(dl) {
  margin-bottom: 0;
}

.definition-html :deep(dd) {
  margin-left: 0;
  margin-bottom: 0.5rem;
}

.definition-text {
  line-height: 1.6;
  white-space: pre-wrap;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.card {
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.badge {
  font-size: 0.75rem;
}

.modal-dialog.modal-xl {
  max-width: 1200px;
}

@media (max-width: 768px) {
  .modal-dialog.modal-xl {
    max-width: 95vw;
    margin: 0.5rem;
  }
  
  .terms-list {
    max-height: 50vh !important;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
