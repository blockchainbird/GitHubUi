<template>
  <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-pencil-square"></i>
        Editing: {{ filename }}
      </h2>
      <div>
        <button @click="goBack" class="btn btn-outline-secondary me-2">
          Close
        </button>
        <button @click="saveFile" class="btn btn-success" :disabled="saving || !hasChanges">
          <span v-if="saving">
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Saving...
          </span>
          <span v-else>
            <i class="bi bi-save"></i>
            Save & Commit
          </span>
        </button>
      </div>
    </div>
    
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    
    <div v-if="success" class="alert alert-success" role="alert">
      {{ success }}
    </div>
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading file content...</p>
    </div>
    
    <div v-else class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="bi bi-file-text"></i>
              {{ path }}
            </h5>
            <div class="btn-group" role="group">
              <input type="radio" class="btn-check" id="edit-mode" v-model="editMode" value="edit" autocomplete="off">
              <label class="btn btn-outline-primary btn-sm" for="edit-mode">
                <i class="bi bi-pencil"></i> Edit
              </label>
              
              <input type="radio" class="btn-check" id="preview-mode" v-model="editMode" value="preview" autocomplete="off">
              <label class="btn btn-outline-primary btn-sm" for="preview-mode">
                <i class="bi bi-eye"></i> Preview
              </label>
            </div>
          </div>
          
          <div class="card-body p-0">
            <!-- Edit Mode -->
            <div v-if="editMode === 'edit'" class="position-relative">
              <div class="editor-toolbar p-2 border-bottom bg-light">
                <div class="btn-group btn-group-sm" role="group">
                  <button @click="insertText('**', '**')" class="btn btn-outline-secondary" title="Bold">
                    <i class="bi bi-type-bold"></i>
                  </button>
                  <button @click="insertText('*', '*')" class="btn btn-outline-secondary" title="Italic">
                    <i class="bi bi-type-italic"></i>
                  </button>
                  <button @click="insertText('`', '`')" class="btn btn-outline-secondary" title="Code">
                    <i class="bi bi-code"></i>
                  </button>
                  <button @click="insertText('[', '](url)')" class="btn btn-outline-secondary" title="Link">
                    <i class="bi bi-link"></i>
                  </button>
                  <button @click="insertHeading" class="btn btn-outline-secondary" title="Heading">
                    <i class="bi bi-type-h1"></i>
                  </button>
                  <button @click="insertList" class="btn btn-outline-secondary" title="List">
                    <i class="bi bi-list-ul"></i>
                  </button>
                  <button @click="showTermsModal" class="btn btn-outline-info" title="Insert Term Reference">
                    <i class="bi bi-bookmark"></i>
                  </button>
                  <button @click="showAddTermModal" class="btn btn-outline-success" title="Add New Term">
                    <i class="bi bi-plus-circle"></i>
                    Term
                  </button>
                </div>
              </div>
              
              <textarea
                ref="editor"
                v-model="content"
                @input="handleContentChange"
                class="form-control border-0"
                style="min-height: 600px; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; resize: vertical;"
                placeholder="Start editing your content here..."
              ></textarea>
            </div>
            
            <!-- Preview Mode -->
            <div v-else class="p-4" style="min-height: 600px;">
              <div v-if="isMarkdown" v-html="renderedContent" class="markdown-preview"></div>
              <pre v-else class="text-wrap">{{ content }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Commit Message Modal -->
    <div class="modal fade" id="commitModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Commit Changes</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="commitMessage" class="form-label">Commit Message</label>
              <textarea
                id="commitMessage"
                v-model="commitMessage"
                class="form-control"
                rows="3"
                placeholder="Describe your changes..."
                required
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" @click="commitChanges" class="btn btn-primary">
              <i class="bi bi-check-circle"></i>
              Commit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Terms Modal -->
    <div class="modal fade" id="termsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-bookmark"></i>
              Insert Term Reference
              <small v-if="!loadingTerms && terms.length > 0" class="text-muted">
                ({{ filteredTerms.length }} of {{ terms.length }} terms)
              </small>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="termFilter" class="form-label">Search Terms</label>
              <input
                id="termFilter"
                v-model="termFilter"
                @keyup="filterTerms"
                class="form-control"
                placeholder="Search terms, definitions, or external specs..."
                autocomplete="off"
              >
            </div>
            
            <div class="mb-3">
              <label class="form-label">Reference Type</label>
              <div class="btn-group w-100" role="group">
                <input type="radio" class="btn-check" id="refType-auto" v-model="referenceType" value="auto" autocomplete="off" checked>
                <label class="btn btn-outline-primary" for="refType-auto">Auto</label>
                
                <input type="radio" class="btn-check" id="refType-ref" v-model="referenceType" value="ref" autocomplete="off">
                <label class="btn btn-outline-primary" for="refType-ref">[[ref:]]</label>
                
                <input type="radio" class="btn-check" id="refType-xref" v-model="referenceType" value="xref" autocomplete="off">
                <label class="btn btn-outline-primary" for="refType-xref">[[xref:]]</label>
                
                <input type="radio" class="btn-check" id="refType-tref" v-model="referenceType" value="tref" autocomplete="off">
                <label class="btn btn-outline-primary" for="refType-tref">[[tref:]]</label>
                
                <!-- <input type="radio" class="btn-check" id="refType-def" v-model="referenceType" value="def" autocomplete="off">
                <label class="btn btn-outline-success" for="refType-def">[[def:]]</label> -->
              </div>
              <div class="form-text">
                Auto: Uses the appropriate format based on term type (ref for local, xref for external). Use [[def:]] to create term definitions.
              </div>
            </div>
            
            <div v-if="loadingTerms" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading terms...</span>
              </div>
              <p class="mt-2">Loading terms from repository... {{ proxyInfo }}</p>
            </div>
            
            <div v-else-if="termsError" class="alert alert-warning" role="alert">
              {{ termsError }}
            </div>
            
            <div v-else-if="filteredTerms.length === 0 && !loadingTerms" class="text-center py-4">
              <i class="bi bi-search" style="font-size: 2rem; color: #6c757d;"></i>
              <p class="mt-2 text-muted">No terms found matching your search.</p>
            </div>
            
            <div v-else class="terms-list" style="max-height: 400px; overflow-y: auto;">
              <div class="list-group">
                <button
                  v-for="term in filteredTerms"
                  :key="term.id + (term.external ? '_' + term.externalSpec : '')"
                  @click="insertTermReference(term)"
                  class="list-group-item list-group-item-action d-flex flex-column align-items-start"
                  :class="{ 'external-term': term.external }"
                >
                  <div class="d-flex align-items-center w-100 mb-2">
                    <i class="bi me-3" 
                       :class="term.external ? 'bi-link-45deg' : 'bi-bookmark-fill'"
                       :style="term.external ? 'color: #198754;' : 'color: #0d6efd;'"></i>
                    <div class="flex-grow-1">
                      <div class="fw-medium">{{ term.id }}</div>
                      <small v-if="term.aliases.length > 0" class="text-muted">
                        Aliases: {{ term.aliases.join(', ') }}
                      </small>
                      <small class="text-muted d-block">
                        {{ term.external ? term.source : term.file }}
                      </small>
                    </div>
                    <span v-if="term.external" class="badge bg-success">External</span>
                  </div>
                  <div v-if="term.definition" class="definition-preview w-100 mt-2 pt-2 border-top" v-html="term.definition"></div>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" @click="refreshTerms" class="btn btn-outline-primary" :disabled="loadingTerms">
              <i class="bi bi-arrow-clockwise"></i>
              Refresh Terms
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Term Modal -->
    <div class="modal fade" id="addTermModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle"></i>
              Add New Term
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="addTermError" class="alert alert-danger" role="alert">
              {{ addTermError }}
            </div>
            
            <div class="mb-3">
              <label for="termName" class="form-label">Term <span class="text-danger">*</span></label>
              <input
                id="termName"
                v-model="newTerm.name"
                @input="onTermNameChange"
                type="text"
                class="form-control"
                placeholder="Enter the term..."
                required
              >
              <div class="form-text">Enter the main term that will be defined</div>
            </div>
            
            <div v-if="newTerm.name.trim()" class="mb-3">
              <label class="form-label">Aliases</label>
              <div v-for="(alias, index) in newTerm.aliases" :key="index" class="input-group mb-2">
                <input
                  v-model="newTerm.aliases[index]"
                  @input="onAliasChange(index)"
                  type="text"
                  class="form-control"
                  :placeholder="`Alias ${index + 1}...`"
                >
                <button 
                  @click="removeAlias(index)" 
                  type="button" 
                  class="btn btn-outline-danger"
                  :disabled="newTerm.aliases.length === 1"
                  title="Remove alias"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <button 
                @click="addAlias" 
                type="button" 
                class="btn btn-outline-secondary btn-sm"
                title="Add another alias"
              >
                <i class="bi bi-plus"></i>
                Add Alias
              </button>
              <div class="form-text">Add alternative terms or synonyms for this definition</div>
            </div>
            
            <div v-if="newTerm.name.trim()" class="mb-3">
              <label class="form-label">Preview</label>
              <div class="border rounded p-3 bg-light">
                <code>{{ generateTermDefinition() }}</code>
              </div>
              <div class="form-text">This is what will be inserted into your document</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button 
              @click="insertNewTerm" 
              type="button" 
              class="btn btn-success"
              :disabled="!newTerm.name.trim()"
            >
              <i class="bi bi-plus-circle"></i>
              Add Term
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { addToVisitedRepos } from '../utils/visitedRepos.js'

export default {
  name: 'FileEditor',
  props: ['owner', 'repo', 'branch', 'path'],
  setup(props) {
    const router = useRouter()
    const loading = ref(true)
    const saving = ref(false)
    const error = ref('')
    const success = ref('')
    const content = ref('')
    const originalContent = ref('')
    const fileSha = ref('')
    const editMode = ref('edit')
    const commitMessage = ref('')
    const editor = ref(null)
    
    // Terms functionality
    const terms = ref([])
    const filteredTerms = ref([])
    const termFilter = ref('')
    const loadingTerms = ref(false)
    const proxyInfo = ref('')
    const termsError = ref('')
    const specsConfig = ref(null)
    const referenceType = ref('auto')
    
    // Add Term modal state
    const newTerm = ref({
      name: '',
      aliases: ['']
    })
    const addTermError = ref('')
    
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
    
    const filename = computed(() => {
      return props.path ? decodeURIComponent(props.path).split('/').pop() : ''
    })
    
    const decodedPath = computed(() => {
      return props.path ? decodeURIComponent(props.path) : ''
    })
    
    const isMarkdown = computed(() => {
      return filename.value.toLowerCase().endsWith('.md')
    })
    
    const hasChanges = computed(() => {
      return content.value !== originalContent.value
    })
    
    const renderedContent = computed(() => {
      if (!isMarkdown.value) return content.value
      
      // Basic markdown rendering (you might want to use a proper markdown library)
      let html = content.value
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`(.*?)`/gim, '<code>$1</code>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/\n/gim, '<br>')
      
      // Process term reference patterns: [[tref: spec_name, term_id]], [[xref: spec_name, term_id]], and [[ref: term_id]]
      // We need to access terms.value to make this reactive
      const currentTerms = terms.value
      
      // Handle tref patterns (external references)
      html = html.replace(/\[\[tref:\s*([^,\]]+),\s*([^\]]+)\]\]/g, (match, specName, termId) => {
        const cleanSpecName = specName.trim()
        const cleanTermId = termId.trim()
        // Try to find the term definition from current terms
        const termDef = currentTerms.find(t => {
          // For external specs, match by external spec name and term id
          if (t.external && t.externalSpec === cleanSpecName && t.id === cleanTermId) {
            return true
          }
          // For local specs, just match by term id (assuming local spec)
          if (!t.external && t.id === cleanTermId) {
            return true
          }
          return false
        })
        if (termDef) {
          const definition = termDef.definition || termDef.definitionText || 'No definition available'
          return `<h2 class="term-reference">
            <span class="term-name">${cleanTermId}</span>
            <div class="term-definition">${definition}</div>
          </h2>`
        } else {
          // If definition not found and terms are not loaded, trigger loading
          if (currentTerms.length === 0) {
            // Trigger async loading without blocking
            setTimeout(() => loadTermDefinitionAsync(cleanSpecName, cleanTermId), 0)
            return `<div class="term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition loading">Loading definition...</div>
            </div>`
          } else {
            // Terms are loaded but term not found
            return `<div class="term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition not-found">Definition not found for "${cleanTermId}" in spec "${cleanSpecName}"</div>
            </div>`
          }
        }
      })

      // Handle xref patterns (external references)
      html = html.replace(/\[\[xref:\s*([^,\]]+),\s*([^\]]+)\]\]/g, (match, specName, termId) => {
        const cleanSpecName = specName.trim()
        const cleanTermId = termId.trim()

        // Try to find the term definition from current terms
        const termDef = currentTerms.find(t => {
          // For external specs, match by external spec name and term id
          if (t.external && t.externalSpec === cleanSpecName && t.id === cleanTermId) {
            return true
          }
          // For local specs, just match by term id (assuming local spec)
          if (!t.external && t.id === cleanTermId) {
            return true
          }
          return false
        })

        if (termDef) {
          const definition = termDef.definition || termDef.definitionText || 'No definition available'
          return `<div class="term-reference">
            <span class="term-name">${cleanTermId}</span>
            <div class="term-definition">${definition}</div>
          </div>`
        } else {
          // If definition not found and terms are not loaded, trigger loading
          if (currentTerms.length === 0) {
            // Trigger async loading without blocking
            setTimeout(() => loadTermDefinitionAsync(cleanSpecName, cleanTermId), 0)
            return `<div class="term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition loading">Loading definition...</div>
            </div>`
          } else {
            // Terms are loaded but term not found
            return `<div class="term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition not-found">Definition not found for "${cleanTermId}" in spec "${cleanSpecName}"</div>
            </div>`
          }
        }
      })
      
      // Handle ref patterns (local references)
      html = html.replace(/\[\[ref:\s*([^\]]+)\]\]/g, (match, termId) => {
        const cleanTermId = termId.trim()
        
        // Try to find the term definition from current terms
        const termDef = currentTerms.find(t => {
          // For local specs, match by term id
          if (!t.external && t.id === cleanTermId) {
            return true
          }
          return false
        })
        
        if (termDef) {
          const definition = termDef.definition || termDef.definitionText || 'No definition available'
          return `<div class="term-reference">
            <span class="term-name">${cleanTermId}</span>
            <div class="term-definition">${definition}</div>
          </div>`
        } else {
          // If definition not found and terms are not loaded, trigger loading
          if (currentTerms.length === 0) {
            // Trigger async loading without blocking
            setTimeout(() => loadTermDefinitionAsync('', cleanTermId), 0)
            return `<div class="term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition loading">Loading definition...</div>
            </div>`
          } else {
            // Terms are loaded but term not found
            return `<div class="term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition not-found">Definition not found for "${cleanTermId}"</div>
            </div>`
          }
        }
      })
      
      // Handle def patterns (term definitions) [[def: term-id, alias1, alias2, ...]]
      html = html.replace(/\[\[def:\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/g, (match, termId, aliases) => {
        const cleanTermId = termId.trim()
        const cleanAliases = aliases ? aliases.split(',').map(a => a.trim()).filter(a => a.length > 0) : []
        
        return `<h2 class="term-definition-marker">
          <span class="definition-term-name">${cleanTermId}</span>
          ${cleanAliases.length > 0 ? `<div class="definition-aliases">Aliases: ${cleanAliases.join(', ')}</div>` : ''}
        </h2>`
      })
      
      // Wrap consecutive list items in ul tags
      html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
      
      return html
    })
    
    const loadFileContent = async () => {
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}?ref=${props.branch}`,
          config
        )
        
        fileSha.value = response.data.sha
        content.value = atob(response.data.content)
        originalContent.value = content.value
        
      } catch (err) {
        console.error('Error loading file:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        error.value = 'Failed to load file content.'
      } finally {
        loading.value = false
      }
    }
    
    const handleContentChange = () => {
      error.value = ''
      success.value = ''
    }
    
    const insertText = (before, after = '') => {
      const textarea = editor.value
      if (!textarea) return
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.value.substring(start, end)
      
      const replacement = before + selectedText + after
      content.value = content.value.substring(0, start) + replacement + content.value.substring(end)
      
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
      })
    }
    
    const insertHeading = () => {
      insertText('## ', '')
    }
    
    const insertList = () => {
      const textarea = editor.value
      if (!textarea) return
      
      const start = textarea.selectionStart
      const lineStart = content.value.lastIndexOf('\n', start - 1) + 1
      content.value = content.value.substring(0, lineStart) + '* ' + content.value.substring(lineStart)
      
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 2, start + 2)
      })
    }
    
    const saveFile = () => {
      if (!hasChanges.value) return
      
      commitMessage.value = `Update ${filename.value}`
      // Show modal (you'll need to include Bootstrap JS for this to work)
      const modal = new bootstrap.Modal(document.getElementById('commitModal'))
      modal.show()
    }
    
    const commitChanges = async () => {
      if (!commitMessage.value.trim()) {
        error.value = 'Please enter a commit message.'
        return
      }
      
      saving.value = true
      error.value = ''
      success.value = ''
      
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }
        
        const data = {
          message: commitMessage.value,
          content: btoa(content.value),
          sha: fileSha.value,
          branch: props.branch
        }
        
        const response = await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}`,
          data,
          config
        )
        
        fileSha.value = response.data.content.sha
        originalContent.value = content.value
        success.value = 'File saved and committed successfully!'
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('commitModal'))
        modal.hide()
        
      } catch (err) {
        console.error('Error saving file:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        error.value = 'Failed to save file. Please try again.'
      } finally {
        saving.value = false
      }
    }
    
    // Terms functionality methods
    const loadSpecsConfig = async () => {
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`,
          config
        )

        const content = JSON.parse(atob(response.data.content))
        specsConfig.value = content
        return content
      } catch (err) {
        console.error('Error loading specs config:', err)
        if (checkAuthAndRedirect(err)) {
          return null
        }
        // Default fallback
        return {
          specs: [{
            spec_directory: './spec',
            spec_terms_directory: 'terms-definitions'
          }]
        }
      }
    }
    
    const loadTermsFromStorage = () => {
      const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Check if terms were cached within last hour
          if (Date.now() - parsed.timestamp < 3600000) {
            terms.value = parsed.terms || []
            filteredTerms.value = parsed.terms || []
            return true
          }
        } catch (err) {
          console.error('Error parsing stored terms:', err)
        }
      }
      return false
    }
    
    const saveTermsToStorage = (termsData) => {
      const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
      const data = {
        terms: termsData,
        timestamp: Date.now()
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    }
    
    const extractTermsFromFile = async (filePath) => {
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${filePath}?ref=${props.branch}`,
          config
        )
        
        const content = atob(response.data.content)
        const lines = content.split('\n')
        
        // Find the first non-empty line and check if it contains a term definition
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line) {
            // More robust regex to handle various whitespace patterns
            const termMatch = line.match(/^\[\[def:\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/)
            if (termMatch) {
              const termId = termMatch[1].trim()
              const aliasesStr = termMatch[2]
              const aliases = aliasesStr ? 
                aliasesStr.split(',').map(a => a.trim()).filter(a => a.length > 0) : 
                []
              
              // Extract definition lines that start with ~ after the term definition
              const definitionLines = []
              for (let j = i + 1; j < lines.length; j++) {
                const defLine = lines[j].trim()
                if (defLine.startsWith('~')) {
                  // Remove the ~ and trim whitespace
                  definitionLines.push(defLine.substring(1).trim())
                } else if (defLine === '') {
                  // Skip empty lines
                  continue
                } else {
                  // Stop when we hit a non-~ line that's not empty
                  break
                }
              }
              
              // Convert definition lines to HTML <dl> format
              const definitionHtml = definitionLines.length > 0 
                ? `<dl>${definitionLines.map(def => `<dd>${def}</dd>`).join('')}</dl>`
                : ''
              
              // Validate term ID (should not be empty)
              if (termId) {
                return {
                  id: termId,
                  aliases: aliases,
                  file: filePath,
                  definition: definitionHtml,
                  definitionText: definitionLines.join(' ')
                }
              }
            }
            break // Only check the first content line
          }
        }
      } catch (err) {
        console.error(`Error loading file ${filePath}:`, err)
        if (checkAuthAndRedirect(err)) {
          return null
        }
      }
      return null
    }
    
    const loadTermsFromRepository = async () => {
      loadingTerms.value = true
      termsError.value = ''
      
      try {
        // Load specs config if not already loaded
        if (!specsConfig.value) {
          specsConfig.value = await loadSpecsConfig()
        }
        
        const config = specsConfig.value.specs[0]
        const specDir = config.spec_directory.replace('./', '')
        const termsDir = config.spec_terms_directory
        const fullTermsPath = `${specDir}/${termsDir}`
        
        const token = localStorage.getItem('github_token')
        const requestConfig = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        // Get files in terms directory
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${fullTermsPath}?ref=${props.branch}`,
          requestConfig
        )
        const files = response.data.filter(item => 
          item.type === 'file' && 
          (item.name.toLowerCase().endsWith('.md') || 
           item.name.toLowerCase().endsWith('.txt') ||
           item.name.toLowerCase().endsWith('.rst') ||
           item.name.toLowerCase().endsWith('.adoc'))
        )
        
        const termsData = []
        
        // Process local files in parallel but limit concurrency to avoid rate limits
        const batchSize = 5
        for (let i = 0; i < files.length; i += batchSize) {
          proxyInfo.value = `Processing files ${i + 1} to ${Math.min(i + batchSize, files.length)}...`;
          const batch = files.slice(i, i + batchSize)
          const promises = batch.map(file => extractTermsFromFile(file.path))
          const results = await Promise.all(promises)
          results.forEach(term => {
            if (term) {
              termsData.push(term)
            }
          })
        }
        
        // Load external specs if they exist
        if (config.external_specs && Array.isArray(config.external_specs)) {
          const externalTerms = await loadExternalSpecs(config.external_specs)
          termsData.push(...externalTerms)
        }
        
        termsData.sort((a, b) => a.id.localeCompare(b.id))
        terms.value = termsData
        filteredTerms.value = termsData
        
        // Save to local storage
        saveTermsToStorage(termsData)
        
      } catch (err) {
        console.error('Error loading terms:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          termsError.value = 'Terms directory not found in repository.'
        } else {
          termsError.value = 'Failed to load terms from repository.'
        }
      } finally {
        loadingTerms.value = false
      }
    }
    
    const loadExternalSpecs = async (externalSpecs) => {
      const externalTerms = []
      
      // Define multiple CORS proxy options, with local PHP proxy first
      // Use VITE_BASE_PATH for proxy path if available
      const basePath = import.meta.env.VITE_BASE_PATH || '/';
      const proxyPath = basePath.endsWith('/') ? basePath + 'proxy.php?url=' : basePath + '/proxy.php?url=';
      const corsProxies = [
        proxyPath,
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://thingproxy.freeboard.io/fetch/'
      ]
      
      for (const spec of externalSpecs) {
        let success = false
        
        for (let proxyIndex = 0; proxyIndex < corsProxies.length && !success; proxyIndex++) {
          try {
            const proxyUrl = corsProxies[proxyIndex]
            const targetUrl = proxyUrl === 'https://thingproxy.freeboard.io/fetch/' 
              ? spec.gh_page 
              : encodeURIComponent(spec.gh_page)
            
            // Check if first proxy (our PHP proxy) is responsive
            if (proxyIndex === 0) {
              try {
                console.log(`🔄 Checking proxy status for ${spec.external_spec}...`)
                const statusResponse = await axios.get(`${proxyUrl.replace('?url=', '?status=1&url=')}${targetUrl}`, {
                  timeout: 2000
                })
                if (statusResponse.data?.status === 'proxy_active') {
                  console.log(`✅ Proxy is responsive for ${spec.external_spec}`)
                }
              } catch (statusErr) {
                console.warn(`⚠️ Proxy status check failed for ${spec.external_spec}, proceeding anyway`)
              }
            }
            
            console.log(`Loading external spec: ${spec.external_spec} from ${spec.gh_page} (proxy ${proxyIndex + 1}/${corsProxies.length})`)
            
            const response = await axios.get(`${proxyUrl}${targetUrl}`, {
              headers: {
                'Accept': 'text/html'
              },
              timeout: 15000 // Increased timeout to 15 seconds
            })
            
            // Parse the HTML to extract terms from the dl.terms-and-definitions-list
            const parser = new DOMParser()
            const doc = parser.parseFromString(response.data, 'text/html')
            const termsList = doc.querySelector('dl.terms-and-definitions-list')
            
            if (termsList) {
              const dtElements = termsList.querySelectorAll('dt')
              
              dtElements.forEach(dt => {
                const termId = dt.textContent?.trim()
                if (termId) {
                  // Collect all dd elements that follow this dt until the next dt
                  const ddElements = []
                  let nextElement = dt.nextElementSibling
                  
                  while (nextElement && nextElement.tagName.toLowerCase() === 'dd') {
                    ddElements.push(nextElement.outerHTML)
                    nextElement = nextElement.nextElementSibling
                  }
                  
                  if (ddElements.length > 0) {
                    const definitionHtml = `<dl>${ddElements.join('')}</dl>`
                    const definitionText = ddElements
                      .map(dd => {
                        const tempDiv = document.createElement('div')
                        tempDiv.innerHTML = dd
                        return tempDiv.textContent || tempDiv.innerText || ''
                      })
                      .join(' ')
                      .trim()
                    
                    externalTerms.push({
                      id: termId,
                      aliases: [],
                      file: spec.gh_page,
                      definition: definitionHtml,
                      definitionText: definitionText,
                      external: true,
                      externalSpec: spec.external_spec,
                      source: `External: ${spec.external_spec}`
                    })
                  }
                }
              })
              
              console.log(`✅ Successfully loaded ${dtElements.length} terms from ${spec.external_spec} using proxy ${proxyIndex + 1}`)
              success = true
            } else {
              console.warn(`No terms-and-definitions-list found in ${spec.gh_page} using proxy ${proxyIndex + 1}`)
              // Try next proxy even if HTML was fetched but no terms found
            }
          } catch (err) {
            console.warn(`❌ Proxy ${proxyIndex + 1} failed for ${spec.external_spec}:`, err.message)
            
            // If this is the last proxy, log final failure
            if (proxyIndex === corsProxies.length - 1) {
              console.error(`🔴 All proxies failed for external spec ${spec.external_spec}. Skipping.`)
            }
          }
        }
        
        if (!success) {
          console.error(`🔴 Unable to load external spec ${spec.external_spec} from ${spec.gh_page} - all proxy methods failed`)
        }
      }
      
      return externalTerms
    }
    
    const showTermsModal = async () => {
      // Show modal immediately with loading spinner
      loadingTerms.value = true
      termsError.value = ''
      termFilter.value = ''
      filteredTerms.value = []
      const modal = new bootstrap.Modal(document.getElementById('termsModal'))
      modal.show()

      // Try to load from storage first
      if (!loadTermsFromStorage()) {
        // If not in storage, load from repository
        await loadTermsFromRepository()
      } else {
        loadingTerms.value = false
      }
      filteredTerms.value = terms.value
    }
    
    const filterTerms = () => {
      const filter = termFilter.value.toLowerCase()
      if (!filter) {
        filteredTerms.value = terms.value
      } else {
        filteredTerms.value = terms.value.filter(term => 
          term.id.toLowerCase().includes(filter) ||
          term.aliases.some(alias => alias.toLowerCase().includes(filter)) ||
          (term.definitionText && term.definitionText.toLowerCase().includes(filter)) ||
          (term.external && term.externalSpec.toLowerCase().includes(filter))
        )
      }
    }
    
    const insertTermReference = (term) => {
      const textarea = editor.value
      if (!textarea) return
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      let refText
      
      // Determine reference format based on user selection
      switch (referenceType.value) {
        case 'ref':
          refText = `[[ref: ${term.id}]]`
          break
        case 'xref':
          if (term.external) {
            refText = `[[xref: ${term.externalSpec}, ${term.id}]]`
          } else {
            refText = `[[xref: local, ${term.id}]]`
          }
          break
        case 'tref':
          if (term.external) {
            refText = `[[tref: ${term.externalSpec}, ${term.id}]]`
          } else {
            refText = `[[tref: local, ${term.id}]]`
          }
          break
        // case 'def':
        //   // For def, include aliases if available
        //   if (term.aliases && term.aliases.length > 0) {
        //     refText = `[[def: ${term.id}, ${term.aliases.join(', ')}]]`
        //   } else {
        //     refText = `[[def: ${term.id}]]`
        //   }
        //   break
        case 'auto':
        default:
          if (term.external) {
            refText = `[[xref: ${term.externalSpec}, ${term.id}]]`
          } else {
            refText = `[[ref: ${term.id}]]`
          }
          break
      }
      
      content.value = content.value.substring(0, start) + refText + content.value.substring(end)
      
      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'))
      modal.hide()
      
      nextTick(() => {
        textarea.focus()
        const newPosition = start + refText.length
        textarea.setSelectionRange(newPosition, newPosition)
      })
    }
    
    const refreshTerms = async () => {
      // Clear storage cache
      const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
      localStorage.removeItem(storageKey)
      
      // Reload from repository
      await loadTermsFromRepository()
      filterTerms()
    }
    
    // Add Term functionality
    const showAddTermModal = () => {
      // Reset form
      newTerm.value = {
        name: '',
        aliases: ['']
      }
      addTermError.value = ''
      
      const modal = new bootstrap.Modal(document.getElementById('addTermModal'))
      modal.show()
    }
    
    const onTermNameChange = () => {
      addTermError.value = ''
      // If term name exists and we only have an empty alias, keep one empty alias ready
      if (newTerm.value.name.trim() && newTerm.value.aliases.length === 1 && !newTerm.value.aliases[0].trim()) {
        // Keep the empty alias for user to fill
      }
    }
    
    const onAliasChange = (index) => {
      addTermError.value = ''
      // If this is the last alias and it's been filled, add a new empty one
      if (index === newTerm.value.aliases.length - 1 && newTerm.value.aliases[index].trim()) {
        newTerm.value.aliases.push('')
      }
    }
    
    const addAlias = () => {
      newTerm.value.aliases.push('')
    }
    
    const removeAlias = (index) => {
      if (newTerm.value.aliases.length > 1) {
        newTerm.value.aliases.splice(index, 1)
      }
    }
    
    const generateTermDefinition = () => {
      if (!newTerm.value.name.trim()) return ''
      
      const term = newTerm.value.name.trim()
      const validAliases = newTerm.value.aliases
        .map(alias => alias.trim())
        .filter(alias => alias.length > 0)
      
      if (validAliases.length === 0) {
        return `[[def: ${term}]]`
      } else {
        return `[[def: ${term}, ${validAliases.join(', ')}]]`
      }
    }
    
    const insertNewTerm = () => {
      if (!newTerm.value.name.trim()) {
        addTermError.value = 'Please enter a term name'
        return
      }
      
      const textarea = editor.value
      if (!textarea) return
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      const termDefinition = generateTermDefinition()
      
      content.value = content.value.substring(0, start) + termDefinition + content.value.substring(end)
      
      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addTermModal'))
      modal.hide()
      
      nextTick(() => {
        textarea.focus()
        const newPosition = start + termDefinition.length
        textarea.setSelectionRange(newPosition, newPosition)
      })
    }
    
    // Helper functions for tref processing
    const loadTermDefinitionAsync = async (specName, termId) => {
      // If terms are not loaded yet, load them
      if (!terms.value || terms.value.length === 0) {
        // Try loading from storage first
        if (!loadTermsFromStorage()) {
          // If not in storage, load from repository
          await loadTermsFromRepository()
        }
        // The computed property will automatically re-render when terms.value changes
      }
    }
    
    const goBack = () => {
      router.push(`/files/${props.owner}/${props.repo}/${props.branch}`)
    }
    
    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(props.owner, props.repo, props.branch)
      
      loadFileContent()
    })
    
    return {
      loading,
      saving,
      error,
      success,
      content,
      editMode,
      commitMessage,
      filename,
      path: decodedPath,
      isMarkdown,
      hasChanges,
      renderedContent,
      editor,
      handleContentChange,
      insertText,
      insertHeading,
      insertList,
      saveFile,
      commitChanges,
      goBack,
      // Terms functionality
      terms,
      filteredTerms,
      termFilter,
      loadingTerms,
      proxyInfo,
      termsError,
      showTermsModal,
      filterTerms,
      insertTermReference,
      refreshTerms,
      referenceType,
      // Add Term functionality
      newTerm,
      addTermError,
      showAddTermModal,
      onTermNameChange,
      onAliasChange,
      addAlias,
      removeAlias,
      generateTermDefinition,
      insertNewTerm
    }
  }
}
</script>

<style>
.markdown-preview {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.markdown-preview code {
  background-color: #f8f9fa;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.markdown-preview ul {
  padding-left: 1.5rem;
}

.editor-toolbar {
  border-bottom: 1px solid #dee2e6 !important;
}

textarea:focus {
  box-shadow: none !important;
  border-color: transparent !important;
}

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

/* Term reference styles */
.term-reference {
  margin: 1rem 0;
  padding: 0.15rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #94c3f1;
}

.term-name {
  font-weight: 600;
  color: #0d6efd;
  font-size: 1.1em;
  display: block;
  margin-bottom: 0.5rem;
}

.term-definition {
  color: #495057;
  font-size: 0.95em;
  line-height: 1.5;
}

.term-definition.loading {
  color: #6c757d;
  font-style: italic;
}

.term-definition.not-found {
  color: #dc3545;
  font-style: italic;
  background-color: #f8d7da;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #f5c6cb;
}

.term-definition dl {
  margin: 0;
}

.term-definition dd {
  margin: 0;
  padding: 0.25rem 0;
}

/* Term definition marker styles */
.term-definition-marker {
  margin: 1rem 0;
  padding: 0.75rem;
  border: 2px solid #28a745;
  border-radius: 0.375rem;
  background-color: #d4edda;
  border-left: 4px solid #28a745;
}

.definition-term-name {
  font-weight: 700;
  color: #155724;
  font-size: 1.2em;
  display: block;
  margin-bottom: 0.25rem;
}

.definition-aliases {
  color: #6c757d;
  font-size: 0.9em;
  font-style: italic;
}
</style>

```
