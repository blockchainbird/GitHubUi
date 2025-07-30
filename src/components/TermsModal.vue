<template>
  <div class="modal fade" id="termsModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-bookmark"></i>
            Insert Term Reference
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Controls -->
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input type="text" class="form-control" 
                       v-model="searchFilter"
                       @input="$emit('filter-terms')"
                       placeholder="Search terms...">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="referenceType">
                <option value="auto">Auto (recommended)</option>
                <option value="ref">[[ref: term]]</option>
                <option value="xref">[[xref: spec, term]]</option>
                <option value="tref">[[tref: spec, term]]</option>
              </select>
            </div>
            <div class="col-md-3">
              <div class="btn-group w-100">
                <button class="btn btn-outline-secondary btn-sm" 
                        @click="$emit('toggle-definitions')"
                        :class="{ 'active': !definitionsCollapsed }">
                  <i class="bi" :class="definitionsCollapsed ? 'bi-eye' : 'bi-eye-slash'"></i>
                  {{ definitionsCollapsed ? 'Show' : 'Hide' }} Definitions
                </button>
                <button class="btn btn-outline-info btn-sm" @click="$emit('refresh-terms')">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">{{ proxyInfo || 'Loading terms...' }}</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <!-- Terms List -->
          <div v-else-if="displayedTerms.length > 0" class="terms-list">
            <div class="list-group list-group-flush" style="max-height: 400px; overflow-y: auto;">
              <div v-for="term in displayedTerms" :key="term.id + (term.external ? '_' + term.externalSpec : '')"
                   class="list-group-item list-group-item-action"
                   :class="{ 'external-term': term.external }"
                   @click="$emit('insert-term', term)">
                
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center">
                      <strong class="term-name">{{ term.id }}</strong>
                      <span v-if="term.external" class="badge bg-success ms-2">
                        {{ term.externalSpec }}
                      </span>
                      <span v-else class="badge bg-primary ms-2">Local</span>
                    </div>
                    
                    <div v-if="term.aliases && term.aliases.length > 0" class="text-muted small mt-1">
                      Aliases: {{ term.aliases.join(', ') }}
                    </div>

                    <!-- Term Definition -->
                    <div v-if="isDefinitionVisible(term)" class="definition-preview mt-2">
                      <div v-if="term.definition" v-html="term.definition"></div>
                      <div v-else-if="term.definitionText" class="text-muted">
                        {{ term.definitionText }}
                      </div>
                      <div v-else class="text-muted fst-italic">
                        No definition available
                      </div>
                    </div>

                    <!-- Individual toggle for collapsed definitions -->
                    <button v-if="definitionsCollapsed" 
                            class="btn btn-link btn-sm p-0 mt-1"
                            @click.stop="$emit('toggle-individual-term', term)">
                      <i class="bi" :class="isDefinitionVisible(term) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                      {{ isDefinitionVisible(term) ? 'Hide' : 'Show' }} definition
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Terms Found -->
          <div v-else class="text-center py-4 text-muted">
            <i class="bi bi-search fs-1"></i>
            <p class="mt-2">
              {{ searchFilter ? 'No terms found matching your search.' : 'No terms available.' }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <div class="me-auto small text-muted">
            <i class="bi bi-info-circle"></i>
            Click a term to insert its reference into your document.
          </div>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'TermsModal',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    proxyInfo: {
      type: String,
      default: ''
    },
    terms: {
      type: Array,
      default: () => []
    },
    searchFilter: {
      type: String,
      default: ''
    },
    referenceType: {
      type: String,
      default: 'auto'
    },
    definitionsCollapsed: {
      type: Boolean,
      default: true
    },
    isDefinitionVisible: {
      type: Function,
      required: true
    },
    isFromSimpleEditor: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'update:searchFilter',
    'update:referenceType',
    'filter-terms',
    'toggle-definitions',
    'toggle-individual-term',
    'refresh-terms',
    'insert-term'
  ],
  setup(props, { emit }) {
    const displayedTerms = computed(() => {
      if (props.isFromSimpleEditor) {
        // Show only external terms for simple editor
        return props.terms.filter(term => term.external)
      }
      return props.terms
    })

    const searchFilter = computed({
      get: () => props.searchFilter,
      set: (value) => emit('update:searchFilter', value)
    })

    const referenceType = computed({
      get: () => props.referenceType,
      set: (value) => emit('update:referenceType', value)
    })

    return {
      displayedTerms,
      searchFilter,
      referenceType
    }
  }
}
</script>

<style scoped>
.terms-list .list-group-item:hover {
  background-color: #f8f9fa;
}

.terms-list .list-group-item {
  cursor: pointer;
  border-left: none;
  border-right: none;
}

.terms-list .list-group-item:first-child {
  border-top: none;
}

.terms-list .list-group-item:last-child {
  border-bottom: none;
}

.definition-preview {
  font-size: 0.85rem;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border-left: 3px solid #0d6efd;
}

.definition-preview dl {
  margin: 0;
}

.definition-preview dd {
  margin: 0;
  padding: 0.25rem 0;
}

.definition-preview dd:last-child {
  padding-bottom: 0;
}

.external-term {
  border-left: 4px solid #198754 !important;
}

.external-term:hover {
  background-color: #f0f8f0 !important;
}

.term-name {
  font-weight: 600;
  color: #0d6efd;
  font-size: 1.1em;
}
</style>
