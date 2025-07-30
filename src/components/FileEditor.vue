<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi" :class="isNewFile ? 'bi-plus-circle' : 'bi-pencil-square'"></i>
        {{ isNewFile ? 'Creating: ' : 'Editing: ' }}{{ filename }}
        <span title="If a file has an underscore at the beginning of the file name, it is a draft version."
          v-if="isDraft" class="badge bg-warning text-dark ms-2">
          <i class="bi bi-file-earmark-text"></i>
          Draft
        </span>
        <span v-if="isNewFile" class="badge bg-info text-white ms-2">
          <i class="bi bi-asterisk"></i>
          New File
        </span>
      </h2>
      <div>
        <button @click="goBack" class="btn btn-outline-secondary me-2">
          Close
        </button>
        <button @click="togglePublishStatus" class="btn me-2" :class="isDraft ? 'btn-success' : 'btn-warning'"
          :disabled="saving || isNewFile"
          :title="isNewFile ? 'Create the file first before publishing/unpublishing' : ''">
          <i class="bi" :class="isDraft ? 'bi-eye' : 'bi-eye-slash'"></i>
          {{ isDraft ? 'Publish' : 'Unpublish' }}
        </button>
        <button @click="saveFile" class="btn btn-success" :disabled="saving || !hasChanges">
          <span v-if="saving">
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Saving...
          </span>
          <span v-else>
            <i class="bi" :class="isNewFile ? 'bi-plus-circle' : 'bi-save'"></i>
            {{ isNewFile ? 'Create & Commit' : 'Save & Commit' }}
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

    <div v-if="isNewFile" class="alert alert-info" role="alert">
      <div class="d-flex align-items-start">
        <i class="bi bi-info-circle-fill me-2 flex-shrink-0 mt-1"></i>
        <div>
          <strong>Creating New File:</strong>
          This file doesn't exist yet. You can edit and use all toolbar functions. Click "Create & Commit" when you're
          ready to save it to the repository.
        </div>
      </div>
    </div>

    <div v-if="showValidationWarnings" class="alert alert-warning" role="alert">
      <div class="d-flex align-items-start">
        <i class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0 mt-1"></i>
        <div>
          <strong>Content Validation Issues:</strong>
          <ul class="mb-0 mt-2">
            <li v-for="warning in validationWarnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">{{ isNewFile ? 'Setting up new file...' : 'Loading file content...' }}</p>
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
              <input type="radio" class="btn-check" id="simple-mode" v-model="editMode" value="simple"
                autocomplete="off" v-if="isTermsFile">
              <label class="btn btn-outline-success btn-sm" for="simple-mode" v-if="isTermsFile">
                <i class="bi bi-ui-checks"></i> Simple
              </label>

              <input type="radio" class="btn-check" id="edit-mode" v-model="editMode" value="edit" autocomplete="off">
              <label class="btn btn-outline-primary btn-sm" for="edit-mode">
                <i class="bi bi-pencil"></i> {{ isTermsFile ? 'Technical' : 'Edit' }}
              </label>

              <input type="radio" class="btn-check" id="preview-mode" v-model="editMode" value="preview"
                autocomplete="off">
              <label class="btn btn-outline-primary btn-sm" for="preview-mode">
                <i class="bi bi-eye"></i> Preview
              </label>
            </div>
          </div>

          <div class="card-body p-0">
            <!-- Simple Mode for Terms Files -->
            <div v-if="editMode === 'simple' && isTermsFile" class="p-4 simple-editor">
              <div class="row">
                <!-- Term Part -->
                <div class="col-12 mb-4">
                  <div class="card border-primary">
                    <div class="card-header bg-primary text-white">
                      <h5 class="mb-0">
                        <i class="bi bi-bookmark-fill"></i>
                        Term Definition
                      </h5>
                    </div>
                    <div class="card-body">
                      <!-- Term Type Selection -->
                      <div class="mb-3">
                        <label class="form-label fw-bold">Term Type</label>
                        <div class="btn-group w-100" role="group">
                          <input type="radio" class="btn-check" id="termType-local" v-model="simpleEditor.termType"
                            value="local" autocomplete="off">
                          <label class="btn btn-outline-primary" for="termType-local">
                            <i class="bi bi-house"></i> Create New Term
                          </label>
                          <input type="radio" class="btn-check" id="termType-external" v-model="simpleEditor.termType"
                            value="external" autocomplete="off">
                          <label class="btn btn-outline-success" for="termType-external" @click="onUseExternalTermClick">
                            <i class="bi bi-link-45deg"></i> Use External Term
                          </label>
                        </div>
                        <div class="form-text">
                          <strong>Create New Term:</strong> You want to create a new term and definition in this specification.
                          <strong>Use External Term:</strong> You want to reference a term defined in another specification.
                        </div>
                      </div>

                      <!-- External Repository (only for external terms) -->
                      <div v-if="simpleEditor.termType === 'external'" class="mb-3">
                        <label for="externalRepo" class="form-label fw-bold">External Repository</label>
                        <input id="externalRepo" v-model="simpleEditor.externalRepo" @input="syncSimpleToTechnicalDebounced"
                          class="form-control" placeholder="e.g., keri-spec, did-core" required>
                        <div class="form-text">The name of the external specification or repository.</div>
                      </div>

                      <!-- Main Term -->
                      <div class="mb-3">
                        <label for="mainTerm" class="form-label fw-bold">Main Term</label>
                        <input id="mainTerm" v-model="simpleEditor.mainTerm" @input="syncSimpleToTechnicalDebounced"
                          class="form-control" placeholder="e.g., identifier, credential, proof" required>
                        <div class="form-text">The primary term being defined or referenced.</div>
                      </div>

                      <!-- Aliases/Variants -->
                      <div class="mb-3">
                        <label class="form-label fw-bold">
                          {{ simpleEditor.termType === 'local' ? 'Term Variants' : 'Aliases' }}
                          <small class="text-muted">(optional)</small>
                        </label>
                        <div v-for="(alias, index) in simpleEditor.aliases" :key="`alias-${index}`"
                          class="input-group mb-2">
                          <input v-model="simpleEditor.aliases[index]" @input="onAliasInput(index)" class="form-control"
                            :placeholder="`${simpleEditor.termType === 'local' ? 'Variant' : 'Alias'} ${index + 1}`">
                          <button v-if="simpleEditor.aliases.length > 1" @click="removeAlias(index)"
                            class="btn btn-outline-danger" type="button" title="Remove this alias">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                        <button @click="addAlias" class="btn btn-outline-secondary btn-sm" type="button">
                          <i class="bi bi-plus"></i>
                          Add {{ simpleEditor.termType === 'local' ? 'Variant' : 'Alias' }}
                        </button>
                        <div class="form-text">
                          {{ simpleEditor.termType === 'local'
                          ? 'Different ways this term might be expressed (e.g., ID, identifier, identity)'
                          : 'Alternative names for this external term' }}
                        </div>
                      </div>

                      <!-- Generated Term Line Preview -->
                      <div class="alert alert-light border">
                        <div class="form-label fw-bold mb-2">Generated Term Line:</div>
                        <code class="d-block p-2 bg-white border rounded">{{ generatedTermLine }}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Definition Part -->
                <div class="col-12">
                  <div class="card border-success">
                    <div class="card-header bg-success text-white">
                      <h5 class="mb-0">
                        <i class="bi bi-file-text"></i>
                        Definition Content
                      </h5>
                    </div>
                    <div class="card-body">
                      <!-- Definition Editor Toolbar -->
                      <div class="editor-toolbar p-2 mb-3 border-bottom bg-light rounded">
                        <div class="btn-group btn-group-sm" role="group">
                          <button @click="insertDefinitionText('**', '**')" class="btn btn-outline-secondary"
                            title="Bold">
                            <i class="bi bi-type-bold"></i>
                          </button>
                          <button @click="insertDefinitionText('*', '*')" class="btn btn-outline-secondary"
                            title="Italic">
                            <i class="bi bi-type-italic"></i>
                          </button>
                          <button @click="insertDefinitionText('`', '`')" class="btn btn-outline-secondary"
                            title="Code">
                            <i class="bi bi-code"></i>
                          </button>
                          <button @click="insertDefinitionText('[', '](url)')" class="btn btn-outline-secondary"
                            title="Link">
                            <i class="bi bi-link"></i>
                          </button>
                          <button @click="showTermsModal" class="btn btn-outline-info" title="Insert Term Reference">
                            <i class="bi bi-bookmark"></i>
                            Insert Reference
                          </button>
                        </div>
                      </div>

                      <div class="mb-3">
                        <label for="definitionContent" class="form-label fw-bold">Definition</label>
                        <textarea id="definitionContent" ref="definitionEditor" v-model="simpleEditor.definition"
                          @input="onDefinitionInput" class="form-control" rows="12"
                          style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace;"
                          placeholder="Enter the definition content here. Each line will automatically be prefixed with '~' in the technical format.&#10;&#10;You can use:&#10;- **bold text**&#10;- *italic text*&#10;- `code snippets`&#10;- [links](url)&#10;- [[ref: term]] for local references&#10;- [[xref: spec, term]] for external references"></textarea>
                        <div class="form-text">
                          Write the definition content naturally. The system will automatically format it with '~'
                          prefixes for technical compatibility.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <!-- Technical Edit Mode -->
              <div v-else-if="editMode === 'edit'" class="position-relative">
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
                    <button @click="showHelpModal" class="btn btn-outline-info" title="Editor Help">
                      <i class="bi bi-question-circle"></i>
                      Help
                    </button>
                  </div>
                </div>

                <textarea ref="editor" v-model="content" @input="onTechnicalEditorInput" @keyup="onTechnicalEditorInput"
                  class="form-control border-0"
                  style="min-height: 600px; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; resize: vertical;"
                  placeholder="Start editing your content here..."></textarea>
              </div>            <!-- Preview Mode -->
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
            <h5 class="modal-title">{{ isNewFile ? 'Create File' : 'Commit Changes' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="commitMessage" class="form-label">Commit Message</label>
              <textarea id="commitMessage" v-model="commitMessage" class="form-control" rows="3"
                :placeholder="isNewFile ? 'Describe this new file...' : 'Describe your changes...'" required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" @click="commitChanges" class="btn btn-primary">
              <i class="bi" :class="isNewFile ? 'bi-plus-circle' : 'bi-check-circle'"></i>
              {{ isNewFile ? 'Create' : 'Commit' }}
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
              {{ isTermsModalFromSimpleEditor ? 'Select External Term' : 'Insert Term Reference' }}
              <small v-if="!loadingTerms && terms.length > 0" class="text-muted">
                ({{ filteredTerms.length }} of {{ terms.length }} terms)
              </small>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="termFilter" class="form-label">Search Terms</label>
              <input id="termFilter" v-model="termFilter" @keyup="filterTerms" class="form-control"
                :placeholder="isTermsModalFromSimpleEditor ? 'Search external terms and specs...' : 'Search terms, definitions, or external specs...'" autocomplete="off">
            </div>

            <div class="mb-3 d-flex justify-content-between align-items-center">
              <label class="form-label mb-0">Filter Options</label>
              <button @click="toggleDefinitionsCollapse" type="button" class="btn btn-outline-secondary btn-sm"
                :title="definitionsCollapsed ? 'Expand all definitions' : 'Collapse all definitions'">
                <i class="bi" :class="definitionsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                {{ definitionsCollapsed ? 'Expand' : 'Collapse' }} Definitions
              </button>
            </div>

            <div v-if="!isTermsModalFromSimpleEditor" class="mb-3">
              <label class="form-label">Reference Type</label>
              <div class="btn-group w-100" role="group">
                <input type="radio" class="btn-check" id="refType-auto" v-model="referenceType" value="auto"
                  autocomplete="off" checked>
                <label class="btn btn-outline-primary" for="refType-auto">Auto</label>

                <input type="radio" class="btn-check" id="refType-ref" v-model="referenceType" value="ref"
                  autocomplete="off">
                <label class="btn btn-outline-primary" for="refType-ref">[[ref:]]</label>

                <input type="radio" class="btn-check" id="refType-xref" v-model="referenceType" value="xref"
                  autocomplete="off">
                <label class="btn btn-outline-primary" for="refType-xref">[[xref:]]</label>

                <input type="radio" class="btn-check" id="refType-tref" v-model="referenceType" value="tref"
                  autocomplete="off">
                <label class="btn btn-outline-primary" for="refType-tref">[[tref:]]</label>

                <!-- <input type="radio" class="btn-check" id="refType-def" v-model="referenceType" value="def" autocomplete="off">
                <label class="btn btn-outline-success" for="refType-def">[[def:]]</label> -->
              </div>
              <div class="form-text">
                Auto: Uses the appropriate format based on term type (ref for local, xref for external). Use [[def:]] to
                create term definitions.
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

            <div v-else-if="displayedTermsForModal.length === 0 && !loadingTerms" class="text-center py-4">
              <i class="bi bi-search" style="font-size: 2rem; color: #6c757d;"></i>
              <p class="mt-2 text-muted">
                {{ isTermsModalFromSimpleEditor ? 'No external terms found matching your search.' : 'No terms found matching your search.' }}
              </p>
            </div>

            <div v-else class="terms-list" style="max-height: 400px; overflow-y: auto;">
              <div class="list-group">
                <button v-for="term in displayedTermsForModal" :key="term.id + (term.external ? '_' + term.externalSpec : '')"
                  @click="isTermsModalFromSimpleEditor ? selectExternalTermForSimpleEditor(term) : insertTermReference(term)"
                  class="list-group-item list-group-item-action d-flex flex-column align-items-start"
                  :class="{ 'external-term': term.external }">
                  <div class="d-flex align-items-center w-100 mb-2">
                    <i class="bi me-3" :class="term.external ? 'bi-link-45deg' : 'bi-bookmark-fill'"
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
                    <div class="d-flex align-items-center gap-2">
                      <button v-if="term.definition" @click.stop="toggleIndividualTerm(term)"
                        class="btn btn-outline-secondary btn-sm"
                        :title="isTermDefinitionVisible(term) ? 'Hide definition' : 'Show definition'" type="button">
                        <i class="bi" :class="isTermDefinitionVisible(term) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                      </button>
                      <span v-if="term.external" class="badge bg-success">External</span>
                    </div>
                  </div>
                  <div v-if="term.definition && isTermDefinitionVisible(term)"
                    class="definition-preview w-100 mt-2 pt-2 border-top" v-html="term.definition"></div>
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
              <input id="termName" v-model="newTerm.name" @input="onTermNameChange" type="text" class="form-control"
                placeholder="Enter the term..." required>
              <div class="form-text">Enter the main term that will be defined</div>
            </div>

            <div v-if="newTerm.name.trim()" class="mb-3">
              <label class="form-label">Aliases</label>
              <div v-for="(alias, index) in newTerm.aliases" :key="index" class="input-group mb-2">
                <input v-model="newTerm.aliases[index]" @input="onAliasChange(index)" type="text" class="form-control"
                  :placeholder="`Alias ${index + 1}...`">
                <button @click="removeTermAlias(index)" type="button" class="btn btn-outline-danger"
                  :disabled="newTerm.aliases.length === 1" title="Remove alias">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <button @click="addTermAlias" type="button" class="btn btn-outline-secondary btn-sm"
                title="Add another alias">
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
            <button @click="insertNewTerm" type="button" class="btn btn-success" :disabled="!newTerm.name.trim()">
              <i class="bi bi-plus-circle"></i>
              Add Term
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <div class="modal fade" id="helpModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-question-circle"></i>
              Editor Help
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="help-content" v-html="helpContent"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { addToVisitedRepos } from '../utils/visitedRepos.js'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics.js'

export default {
  name: 'FileEditor',
  props: ['owner', 'repo', 'branch', 'path'],
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const { trackFileOperation } = useGoogleAnalytics()
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

    // New file mode state
    // When isNewFile is true, the editor is in "creation mode" where:
    // - No file exists in GitHub yet
    // - Content can be edited freely using all toolbar functions
    // - Only when "Create & Commit" is clicked will the file be created in GitHub
    // - Publish/Unpublish is disabled until the file is created
    // - Navigation guards prevent losing unsaved changes
    const isNewFile = ref(false)
    const newFileInitialContent = ref('')
    const newFileCommitMessage = ref('')

    // Terms functionality
    const terms = ref([])
    const filteredTerms = ref([])
    const termFilter = ref('')
    const loadingTerms = ref(false)
    const proxyInfo = ref('')
    const termsError = ref('')
    const specsConfig = ref(null)
    const referenceType = ref('auto')
    
    // Definition preview collapse/expand state
    const definitionsCollapsed = ref(false)
    const individualTermsExpanded = ref(new Map()) // Track individual term expansion state

    // Add Term modal state
    const newTerm = ref({
      name: '',
      aliases: ['']
    })
    const addTermError = ref('')

    // Help modal content
    const helpContent = ref(`

<div class="alert alert-info">
  <strong>Tip:</strong>The editor will help you insert these definitions and references.
</div>


<h6><i class="bi bi-info-circle"></i> Term Definition</h6>

<p>This is how the content of the file for a Term Definition should look like:</p>

<code><pre>
[[def: term, alias1, alias2]]

~ First paragraph with a local reference: [[ref: term_id]]

~ Second paragraph with an external reference: [[xref: spec_name, term_id]]
</pre></code>

<h6><i class="bi bi-info-circle"></i> External Term Definition</h6>

<p>This is how the content of the file for an External Term Definition should look like:</p>

<code><pre>
[[tref: spec_name, term, alias1, alias2]]

&lt; the external definition will be inserted here &gt;

~ First paragraph with local definition content.

~ Second paragraph with local definition content.
</pre></code>
    `)

    // Content validation state
    const validationWarnings = ref([])
    const showValidationWarnings = ref(false)

    // Simple editor state for terms files
    const simpleEditor = ref({
      termType: 'local', // 'local' or 'external'
      externalRepo: '',
      mainTerm: '',
      aliases: [''],
      definition: ''
    })
    const definitionEditor = ref(null)
    const isTermsModalFromSimpleEditor = ref(false) // Track if modal opened from simple editor
    const isSyncing = ref(false) // Track if we're currently syncing to prevent loops

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

    const isDraft = computed(() => {
      return filename.value.startsWith('_')
    })

    const isMarkdown = computed(() => {
      return filename.value.toLowerCase().endsWith('.md')
    })

    const hasChanges = computed(() => {
      // For new files, consider any content as changes
      if (isNewFile.value) {
        return content.value.trim().length > 0
      }
      // For existing files, compare with original content
      return content.value !== originalContent.value
    })

    // Check if this is a terms file based on directory or content
    const isTermsFile = computed(() => {
      if (!filename.value) return false
      
      // Check if filename suggests it's a terms file
      const isLikelyTermsFile = filename.value.toLowerCase().includes('term') || 
                               content.value.includes('[[def:') || 
                               content.value.includes('[[tref:')
      
      // For better UX, enable simple mode for any markdown file that looks like terms
      return isLikelyTermsFile && isMarkdown.value
    })

    // Generate the term line for simple editor preview
    const generatedTermLine = computed(() => {
      if (!simpleEditor.value.mainTerm.trim()) {
        return simpleEditor.value.termType === 'local' ? '[[def: ]]' : '[[tref: , ]]'
      }

      const mainTerm = simpleEditor.value.mainTerm.trim()
      const validAliases = simpleEditor.value.aliases
        .map(alias => alias.trim())
        .filter(alias => alias.length > 0)

      if (simpleEditor.value.termType === 'local') {
        if (validAliases.length === 0) {
          return `[[def: ${mainTerm}]]`
        } else {
          return `[[def: ${mainTerm}, ${validAliases.join(', ')}]]`
        }
      } else {
        const externalRepo = simpleEditor.value.externalRepo.trim() || 'external-spec'
        if (validAliases.length === 0) {
          return `[[tref: ${externalRepo}, ${mainTerm}]]`
        } else {
          return `[[tref: ${externalRepo}, ${mainTerm}, ${validAliases.join(', ')}]]`
        }
      }
    })

    // Filter terms displayed in modal based on context
    const displayedTermsForModal = computed(() => {
      if (isTermsModalFromSimpleEditor.value) {
        // When opened from simple editor, only show external terms
        return filteredTerms.value.filter(term => term.external)
      }
      // Otherwise show all filtered terms
      return filteredTerms.value
    })
    
    // Helper function to get file extension for analytics
    const getFileExtension = (filePath) => {
      const ext = filePath.split('.').pop()?.toLowerCase()
      return ext || 'unknown'
    }

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
          return `<div class="external-term-reference">
            <span class="term-name">${cleanTermId}</span>
            <div class="term-definition">${definition}</div>
          </div>`
        } else {
          // If definition not found and terms are not loaded, trigger loading
          if (currentTerms.length === 0) {
            // Trigger async loading without blocking
            setTimeout(() => loadTermDefinitionAsync(cleanSpecName, cleanTermId), 0)
            return `<div class="external-term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition loading">Loading definition...</div>
            </div>`
          } else {
            // Terms are loaded but term not found
            return `<div class="external-term-reference">
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
          return `<div class="external-term-reference">
            <span class="term-name">${cleanTermId}</span>
            <div class="term-definition">${definition}</div>
          </div>`
        } else {
          // If definition not found and terms are not loaded, trigger loading
          if (currentTerms.length === 0) {
            // Trigger async loading without blocking
            setTimeout(() => loadTermDefinitionAsync(cleanSpecName, cleanTermId), 0)
            return `<div class="external-term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition loading">Loading definition...</div>
            </div>`
          } else {
            // Terms are loaded but term not found
            return `<div class="external-term-reference">
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
          return `<div class="external-term-reference">
            <span class="term-name">${cleanTermId}</span>
            <div class="term-definition">${definition}</div>
          </div>`
        } else {
          // If definition not found and terms are not loaded, trigger loading
          if (currentTerms.length === 0) {
            // Trigger async loading without blocking
            setTimeout(() => loadTermDefinitionAsync('', cleanTermId), 0)
            return `<div class="external-term-reference">
              <span class="term-name">${cleanTermId}</span>
              <div class="term-definition loading">Loading definition...</div>
            </div>`
          } else {
            // Terms are loaded but term not found
            return `<div class="external-term-reference">
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

        return `<div class="term-definition-marker">
          <span class="definition-term-name">${cleanTermId}</span>
          ${cleanAliases.length > 0 ? `<div class="definition-aliases">Aliases: ${cleanAliases.join(', ')}</div>` : ''}
        </div>`
      })

      // Wrap consecutive list items in ul tags
      html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')

      return html
    })

    const loadFileContent = async () => {
      try {
        // Check if this is a new file being created
        if (route.query.new === 'true') {
          isNewFile.value = true
          
          // Decode the initial content and commit message from query params
          try {
            // Handle content parameter - ensure we properly decode even empty content
            newFileInitialContent.value = route.query.content !== undefined 
              ? decodeURIComponent(route.query.content) 
              : ''
            newFileCommitMessage.value = route.query.commitMessage 
              ? decodeURIComponent(route.query.commitMessage) 
              : 'Add new file'
          } catch (decodeError) {
            console.warn('Error decoding query parameters:', decodeError)
            newFileInitialContent.value = ''
            newFileCommitMessage.value = 'Add new file'
          }
          
          // Set up the editor with initial content
          content.value = newFileInitialContent.value
          originalContent.value = '' // New file has no original content
          commitMessage.value = newFileCommitMessage.value
          
          // No SHA for new file
          fileSha.value = ''
          
          // Validate content after loading
          await validateContent()
          
          // Track file creation start
          trackFileOperation('create_start', getFileExtension(decodedPath.value))
          
          loading.value = false
          
          // Force validation after a short delay to ensure everything is set up
          setTimeout(async () => {
            await validateContent()
            
          // Additional safeguard: re-set content if it was lost
          if (!content.value && newFileInitialContent.value) {
            content.value = newFileInitialContent.value
          }
          
          // Set default edit mode to simple for terms files
          if (isTermsFile.value) {
            editMode.value = 'simple'
          }
        }, 100)
        
        return
        }

        // Regular file loading for existing files
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
        
        // Validate content after loading
        await validateContent()
        
        // Track file view
        trackFileOperation('view', getFileExtension(decodedPath.value))

        // Set default edit mode to simple for terms files
        if (isTermsFile.value) {
          editMode.value = 'simple'
        }

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

    const checkIfInTermsDirectory = async () => {
      try {
        // Load specs config if not already loaded
        if (!specsConfig.value) {
          specsConfig.value = await loadSpecsConfig()
        }

        if (!specsConfig.value || !specsConfig.value.specs || specsConfig.value.specs.length === 0) {
          return false
        }

        const config = specsConfig.value.specs[0]
        const specDir = config.spec_directory?.replace('./', '') || 'spec'
        const termsDir = config.spec_terms_directory || 'terms-definitions'
        const fullTermsPath = `${specDir}/${termsDir}`

        // Normalize paths for comparison (remove leading/trailing slashes)
        const normalizedTermsPath = fullTermsPath.replace(/^\/+|\/+$/g, '')
        const normalizedFilePath = decodedPath.value.replace(/^\/+|\/+$/g, '')

        // Check if the current file path starts with the terms directory path
        return normalizedFilePath.startsWith(normalizedTermsPath + '/') || 
               normalizedFilePath === normalizedTermsPath
      } catch (err) {
        console.error('Error checking if file is in terms directory:', err)
        // If we can't determine, default to not validating to avoid false positives
        return false
      }
    }

    const validateContent = async () => {
      const warnings = []
      
      if (!content.value.trim()) {
        showValidationWarnings.value = false
        validationWarnings.value = []
        return
      }

      // Check if the current file is in the spec_terms_directory
      const isInTermsDirectory = await checkIfInTermsDirectory()
      
      // Also check if filename suggests it's a terms file (contains common terms patterns)
      const isLikelyTermsFile = filename.value.toLowerCase().includes('term') || 
                               content.value.includes('[[def:') || 
                               content.value.includes('[[tref:')
      
      if (!isInTermsDirectory && !isLikelyTermsFile) {
        // File is not in terms directory and doesn't look like a terms file, skip validation
        showValidationWarnings.value = false
        validationWarnings.value = []
        return
      }

      const lines = content.value.split('\n')
      const firstLine = lines[0]?.trim() || ''
      
      // Rule 1: First line must start with [[def: or [[tref:
      if (firstLine && !firstLine.startsWith('[[def:') && !firstLine.startsWith('[[tref:')) {
        warnings.push('First line must start with [[def: or [[tref:')
      }
      
      // Rule 2: [[def: and [[tref: can only exist on the first line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim() || ''
        if (line.includes('[[def:') || line.includes('[[tref:')) {
          warnings.push(`[[def: and [[tref: can only exist on the first line (found on line ${i + 1})`)
          break // Only show this warning once
        }
      }
      
      // Rule 3: [[ref: and [[xref: cannot exist on the first line
      if (firstLine && (firstLine.includes('[[ref:') || firstLine.includes('[[xref:'))) {
        warnings.push('[[ref: and [[xref: cannot exist on the first line')
      }
      
      // Rule 4: Every line after the first line must start with ~
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        // Skip empty lines
        if (line.trim() === '') continue
        
        if (!line.startsWith('~')) {
          warnings.push(`Line ${i + 1} must start with ~ (content lines after the first line must start with ~)`)
          break // Only show this warning for the first violation
        }
      }
      
      validationWarnings.value = warnings
      showValidationWarnings.value = warnings.length > 0
    }

    // Simple editor methods
    const syncSimpleToTechnical = async () => {
      if (isSyncing.value) return // Prevent sync loops
      
      isSyncing.value = true
      
      try {
        // Generate the technical content from simple editor values
        const termLine = generatedTermLine.value
        
        if (!termLine.trim()) {
          content.value = ''
          await validateContent()
          return
        }
        
        // Convert definition to technical format (add ~ prefix to each line)
        let definitionContent = ''
        if (simpleEditor.value.definition.trim()) {
          const definitionLines = simpleEditor.value.definition
            .split('\n')
            .map(line => {
              const trimmed = line.trim()
              if (trimmed === '') {
                return ''  // Preserve empty lines
              }
              // Add ~ prefix if not already present
              return line.startsWith('~') ? line : `~ ${line}`
            })
          
          definitionContent = definitionLines.join('\n')
        }

        // Combine term line and definition with proper spacing
        const parts = [termLine]
        if (definitionContent.trim()) {
          parts.push('') // Empty line separator
          parts.push(definitionContent)
        }
        
        content.value = parts.join('\n')
        
        // Trigger validation
        await validateContent()
      } finally {
        isSyncing.value = false
      }
    }

    const syncTechnicalToSimple = () => {
      if (!content.value.trim()) {
        // Reset simple editor for empty content
        simpleEditor.value = {
          termType: 'local',
          externalRepo: '',
          mainTerm: '',
          aliases: [''],
          definition: ''
        }
        return
      }

      const lines = content.value.split('\n')
      const firstLine = lines[0]?.trim() || ''

      // Reset to defaults
      simpleEditor.value = {
        termType: 'local',
        externalRepo: '',
        mainTerm: '',
        aliases: [''],
        definition: ''
      }

      // Parse the term line
      if (firstLine.startsWith('[[def:')) {
        // Local term: [[def: term, alias1, alias2]]
        const match = firstLine.match(/^\[\[def:\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/)
        if (match) {
          simpleEditor.value.termType = 'local'
          simpleEditor.value.mainTerm = match[1].trim()
          simpleEditor.value.externalRepo = ''
          
          if (match[2]) {
            const aliases = match[2].split(',').map(a => a.trim()).filter(a => a.length > 0)
            simpleEditor.value.aliases = aliases.length > 0 ? aliases : ['']
          } else {
            simpleEditor.value.aliases = ['']
          }
        }
      } else if (firstLine.startsWith('[[tref:')) {
        // External term: [[tref: external-repo, term, alias1, alias2]]
        const match = firstLine.match(/^\[\[tref:\s*([^,\]]+),\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/)
        if (match) {
          simpleEditor.value.termType = 'external'
          simpleEditor.value.externalRepo = match[1].trim()
          simpleEditor.value.mainTerm = match[2].trim()
          
          if (match[3]) {
            const aliases = match[3].split(',').map(a => a.trim()).filter(a => a.length > 0)
            simpleEditor.value.aliases = aliases.length > 0 ? aliases : ['']
          } else {
            simpleEditor.value.aliases = ['']
          }
        }
      }

      // Ensure at least one empty alias slot for UX
      if (simpleEditor.value.aliases.length === 0 || 
          (simpleEditor.value.aliases.length > 0 && 
           simpleEditor.value.aliases[simpleEditor.value.aliases.length - 1].trim() !== '')) {
        simpleEditor.value.aliases.push('')
      }

      // Parse the definition content (remove ~ prefixes and handle empty lines)
      const definitionLines = []
      let foundContent = false
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.trim() === '') {
          // Preserve empty lines only if we've found content
          if (foundContent) {
            definitionLines.push('')
          }
        } else if (line.startsWith('~ ')) {
          // Standard definition line with ~ prefix and space
          definitionLines.push(line.substring(2))
          foundContent = true
        } else if (line.startsWith('~')) {
          // Definition line with ~ prefix but no space
          definitionLines.push(line.substring(1).trim())
          foundContent = true
        } else if (line.trim()) {
          // Line doesn't start with ~, but has content - include as is
          definitionLines.push(line)
          foundContent = true
        }
      }
      
      simpleEditor.value.definition = definitionLines.join('\n').trim()
    }

    const addAlias = () => {
      simpleEditor.value.aliases.push('')
      syncSimpleToTechnicalDebounced()
    }

    const removeAlias = (index) => {
      if (simpleEditor.value.aliases.length > 1) {
        simpleEditor.value.aliases.splice(index, 1)
        syncSimpleToTechnicalDebounced()
      }
    }

    const onAliasInput = (index) => {
      // If this is the last alias and it has content, add a new empty one
      if (index === simpleEditor.value.aliases.length - 1 && 
          simpleEditor.value.aliases[index].trim()) {
        simpleEditor.value.aliases.push('')
      }
      syncSimpleToTechnicalDebounced()
    }

    const insertDefinitionText = async (before, after = '') => {
      const textarea = definitionEditor.value
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = simpleEditor.value.definition.substring(start, end)

      const replacement = before + selectedText + after
      simpleEditor.value.definition = simpleEditor.value.definition.substring(0, start) + replacement + simpleEditor.value.definition.substring(end)

      // Sync to technical editor
      await syncSimpleToTechnical()

      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
      })
    }

    // Handle clicking "Use External Term" in simple editor
    const onUseExternalTermClick = async () => {
      // Set the term type to external
      simpleEditor.value.termType = 'external'
      
      // Set flag to indicate modal is opened from simple editor
      isTermsModalFromSimpleEditor.value = true
      
      // Show the terms modal
      await showTermsModal()
    }

    // Handle selecting an external term from the modal when in simple editor mode
    const selectExternalTermForSimpleEditor = (term) => {
      if (!term.external) {
        console.warn('Non-external term selected in simple editor mode')
        return
      }

      // Populate the simple editor fields
      simpleEditor.value.externalRepo = term.externalSpec || ''
      simpleEditor.value.mainTerm = term.id || ''
      
      // Set aliases, ensuring we have at least one empty slot for UX
      if (term.aliases && term.aliases.length > 0) {
        simpleEditor.value.aliases = [...term.aliases, '']
      } else {
        simpleEditor.value.aliases = ['']
      }

      // Sync to technical editor immediately (not debounced for user actions)
      syncSimpleToTechnical()

      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'))
      if (modal) {
        modal.hide()
      }

      // Reset the flag
      isTermsModalFromSimpleEditor.value = false
    }

    const handleContentChange = async () => {
      // Skip if we're currently syncing to prevent loops
      if (isSyncing.value) return
      
      error.value = ''
      success.value = ''
      await validateContent()
    }

    const onTechnicalEditorInput = async () => {
      // Handle technical editor input without triggering sync to simple editor
      if (isSyncing.value) return
      
      error.value = ''
      success.value = ''
      await validateContent()
    }

    // Debounced handler for simple editor definition input
    let definitionInputTimeout = null
    const onDefinitionInput = () => {
      // Clear existing timeout
      if (definitionInputTimeout) {
        clearTimeout(definitionInputTimeout)
      }
      
      // Set new timeout to sync after user stops typing
      definitionInputTimeout = setTimeout(async () => {
        if (!isSyncing.value && editMode.value === 'simple') {
          await syncSimpleToTechnical()
        }
      }, 500) // 500ms delay to allow for natural typing
    }

    // Debounced handler for simple editor form fields (faster sync)
    let formInputTimeout = null
    const syncSimpleToTechnicalDebounced = () => {
      // Clear existing timeout
      if (formInputTimeout) {
        clearTimeout(formInputTimeout)
      }
      
      // Set new timeout to sync after user stops typing (shorter delay for form fields)
      formInputTimeout = setTimeout(async () => {
        if (!isSyncing.value && editMode.value === 'simple') {
          await syncSimpleToTechnical()
        }
      }, 200) // 200ms delay for form fields
    }

    const handleDefinitionEnter = async (event) => {
      // Allow normal enter key behavior (create newline)
      // Don't prevent default - let the textarea handle the newline
      
      // Debounce sync to avoid too frequent updates
      setTimeout(async () => {
        await syncSimpleToTechnical()
      }, 100)
    }

    const insertText = async (before, after = '') => {
      const textarea = editor.value
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.value.substring(start, end)

      const replacement = before + selectedText + after
      content.value = content.value.substring(0, start) + replacement + content.value.substring(end)

      // Trigger validation after content change
      await validateContent()

      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
      })
    }

    const insertHeading = () => {
      insertText('## ', '')
    }

    const insertList = async () => {
      const textarea = editor.value
      if (!textarea) return

      const start = textarea.selectionStart
      const lineStart = content.value.lastIndexOf('\n', start - 1) + 1
      content.value = content.value.substring(0, lineStart) + '* ' + content.value.substring(lineStart)

      // Trigger validation after content change
      await validateContent()

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
          branch: props.branch
        }

        // Add SHA only for existing files (updates)
        if (!isNewFile.value && fileSha.value) {
          data.sha = fileSha.value
        }

        const response = await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}`,
          data,
          config
        )

        fileSha.value = response.data.content.sha
        originalContent.value = content.value
        
        if (isNewFile.value) {
          success.value = 'File created and committed successfully!'
          isNewFile.value = false // Convert to regular file after successful creation
          
          // Track file creation completion
          trackFileOperation('create_complete', getFileExtension(decodedPath.value))

          // Store recently created file info for FileExplorer to detect
          const fileName = decodedPath.value.split('/').pop()
          localStorage.setItem('recentlyCreatedFile', fileName)
          console.log('Set recentlyCreatedFile in localStorage:', fileName)

          // Update the URL to remove new file query parameters
          const newRoute = `/editor/${props.owner}/${props.repo}/${props.branch}/${encodeURIComponent(decodedPath.value)}`
          const queryParams = new URLSearchParams()
          if (route.query.dir) {
            queryParams.set('dir', route.query.dir)
          }
          const finalRoute = queryParams.toString() ? `${newRoute}?${queryParams.toString()}` : newRoute
          await router.replace(finalRoute)
        } else {
          success.value = 'File saved and committed successfully!'
          
          // Track file save
          trackFileOperation('save', getFileExtension(decodedPath.value))
        }

        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('commitModal'))
        modal.hide()

      } catch (err) {
        console.error('Error saving file:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 422 && isNewFile.value) {
          error.value = 'A file with this name already exists. Please choose a different name.'
        } else {
          error.value = 'Failed to save file. Please try again.'
        }
      } finally {
        saving.value = false
      }
    }

    const togglePublishStatus = async () => {
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

        const currentPath = decodedPath.value
        const pathParts = currentPath.split('/')
        const currentFilename = pathParts[pathParts.length - 1]
        
        console.log('Current path:', currentPath)
        console.log('Current filename:', currentFilename)
        console.log('Current SHA:', fileSha.value)
        
        // Toggle the underscore prefix
        let newFilename
        if (currentFilename.startsWith('_')) {
          newFilename = currentFilename.substring(1) // Remove underscore
        } else {
          newFilename = '_' + currentFilename // Add underscore
        }
        
        const newPath = pathParts.slice(0, -1).concat(newFilename).join('/')
        const action = currentFilename.startsWith('_') ? 'Published' : 'Unpublished'
        const commitMsg = `${action} ${currentFilename} -> ${newFilename}`

        console.log('New path:', newPath)
        console.log('New filename:', newFilename)
        console.log('Action:', action)

        // First, get the current file info to ensure we have the latest SHA
        const currentFileResponse = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${currentPath}?ref=${props.branch}`,
          config
        )
        
        const latestSha = currentFileResponse.data.sha
        console.log('Latest SHA from API:', latestSha)
        console.log('SHA matches stored SHA:', latestSha === fileSha.value)
        
        // Update our stored SHA with the latest one
        fileSha.value = latestSha

        // Create the file with the new name
        const createData = {
          message: commitMsg,
          content: btoa(content.value),
          branch: props.branch
        }

        console.log('Creating new file:', newPath)
        const createResponse = await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${newPath}`,
          createData,
          config
        )

        console.log('New file created successfully, new SHA:', createResponse.data.content.sha)

        // Then delete the old file using the latest SHA
        const deleteData = {
          message: commitMsg,
          sha: latestSha,
          branch: props.branch
        }

        console.log('Deleting old file:', currentPath, 'with SHA:', latestSha)
        await axios.delete(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${currentPath}`,
          {
            ...config,
            data: deleteData
          }
        )

        console.log('Old file deleted successfully')

        // Update the file SHA to the new file's SHA
        fileSha.value = createResponse.data.content.sha
        
        success.value = `File ${action.toLowerCase()} successfully!`
        
        // Track the operation
        trackFileOperation(action.toLowerCase(), getFileExtension(newPath))

        // Store both old and new filenames for FileExplorer to detect the rename
        localStorage.setItem('recentlyRenamedFile', JSON.stringify({
          oldName: currentFilename,
          newName: newFilename,
          action: action.toLowerCase()
        }))
        console.log('Set recentlyRenamedFile in localStorage:', { oldName: currentFilename, newName: newFilename, action: action.toLowerCase() })

        // Navigate to the new file path using correct route and encoding
        const encodedNewPath = encodeURIComponent(newPath)
        let newRoute = `/editor/${props.owner}/${props.repo}/${props.branch}/${encodedNewPath}`
        
        // Preserve directory parameter if it exists
        if (route.query.dir) {
          newRoute += `?dir=${encodeURIComponent(route.query.dir)}`
        }
        
        console.log('Navigating to new route:', newRoute)
        console.log('New path:', newPath)
        console.log('Encoded new path:', encodedNewPath)
        
        await router.push(newRoute)

      } catch (err) {
        console.error('Error toggling publish status:', err)
        console.error('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers
        })
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 422) {
          error.value = 'File state conflict. The file may have been modified. Please refresh and try again.'
        } else if (err.response?.status === 409) {
          error.value = 'A file with the target name already exists. Please check the repository.'
        } else {
          error.value = 'Failed to change publish status. Please try again.'
        }
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

      const basePath = import.meta.env.VITE_BASE_PATH || '/';
      let proxyPath;
      if (import.meta.env.VITE_PROXY_URL) {
        proxyPath = import.meta.env.VITE_PROXY_URL;
      } else {
        proxyPath = basePath.endsWith('/') ? basePath + 'proxy.php?url=' : basePath + '/proxy.php?url=';
      }

      const corsProxies = [
        proxyPath
        // Fallback proxies commented out for now - can be enabled if needed
        // ,
        // 'https://api.allorigins.win/raw?url=',
        // 'https://corsproxy.io/?',
        // 'https://api.codetabs.com/v1/proxy?quest=',
        // 'https://thingproxy.freeboard.io/fetch/'
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
      // Reset flag if this is called from regular context (not from simple editor)
      if (!isTermsModalFromSimpleEditor.value) {
        isTermsModalFromSimpleEditor.value = false
      }
      
      // Show modal immediately with loading spinner
      loadingTerms.value = true
      termsError.value = ''
      termFilter.value = ''
      filteredTerms.value = []
      const modal = new bootstrap.Modal(document.getElementById('termsModal'))
      
      // Add event listener to reset flag when modal is hidden
      const modalElement = document.getElementById('termsModal')
      const resetFlag = () => {
        isTermsModalFromSimpleEditor.value = false
        modalElement.removeEventListener('hidden.bs.modal', resetFlag)
      }
      modalElement.addEventListener('hidden.bs.modal', resetFlag)
      
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
        filteredTerms.value = terms.value.filter(term => {
          // Always search in id, aliases, and external spec name
          const basicMatch = term.id.toLowerCase().includes(filter) ||
            term.aliases.some(alias => alias.toLowerCase().includes(filter)) ||
            (term.external && term.externalSpec.toLowerCase().includes(filter))
          
          // Only search in definition text when the definition would be visible
          const definitionMatch = term.definitionText && 
            term.definitionText.toLowerCase().includes(filter) && 
            isTermDefinitionVisible(term)
          
          return basicMatch || definitionMatch
        })
      }
    }

    const toggleDefinitionsCollapse = () => {
      definitionsCollapsed.value = !definitionsCollapsed.value
      
      // If we're going from collapsed to expanded, clear individual states
      // so all terms show their definitions
      if (!definitionsCollapsed.value) {
        individualTermsExpanded.value.clear()
      }
      
      // Re-filter terms to apply the new visibility rules
      filterTerms()
    }

    const toggleIndividualTerm = (term) => {
      const termKey = term.id + (term.external ? '_' + term.externalSpec : '')
      const currentState = individualTermsExpanded.value.get(termKey) || false
      individualTermsExpanded.value.set(termKey, !currentState)
    }

    const isTermDefinitionVisible = (term) => {
      // If globally collapsed, check individual term state
      if (definitionsCollapsed.value) {
        const termKey = term.id + (term.external ? '_' + term.externalSpec : '')
        return individualTermsExpanded.value.get(termKey) || false
      }
      // If globally expanded, show all (unless we want to add individual collapse when expanded)
      return true
    }

    const insertTermReference = async (term) => {
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

      // Trigger validation after content change
      await validateContent()

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

    // Help functionality
    const showHelpModal = () => {
      const modal = new bootstrap.Modal(document.getElementById('helpModal'))
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

    const addTermAlias = () => {
      newTerm.value.aliases.push('')
    }

    const removeTermAlias = (index) => {
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

    const insertNewTerm = async () => {
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

      // Trigger validation after content change
      await validateContent()

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
      // Check if there are unsaved changes in a new file
      if (isNewFile.value && hasChanges.value) {
        const confirmLeave = confirm('You have unsaved changes in this new file. Are you sure you want to leave without creating it?')
        if (!confirmLeave) {
          return
        }
      }

      // Check if we have a directory parameter from the route query
      const sourceDir = route.query.dir
      if (sourceDir) {
        // Navigate back to the specific directory
        const encodedDir = encodeURIComponent(sourceDir)
        router.push(`/files/${props.owner}/${props.repo}/${props.branch}?dir=${encodedDir}`)
      } else {
        // Fall back to root directory
        router.push(`/files/${props.owner}/${props.repo}/${props.branch}`)
      }
    }

    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(props.owner, props.repo, props.branch)

      loadFileContent()

      // Add browser navigation guard for new files with unsaved changes
      const handleBeforeUnload = (event) => {
        if (isNewFile.value && hasChanges.value) {
          event.preventDefault()
          event.returnValue = ''
          return ''
        }
      }

      window.addEventListener('beforeunload', handleBeforeUnload)

      // Store reference for cleanup
      window.fileEditorBeforeUnload = handleBeforeUnload
    })

    onUnmounted(() => {
      // Clean up the event listener
      if (window.fileEditorBeforeUnload) {
        window.removeEventListener('beforeunload', window.fileEditorBeforeUnload)
        delete window.fileEditorBeforeUnload
      }
    })

    // Watch for path changes (when navigating after publish/unpublish)
    watch(() => props.path, (newPath, oldPath) => {
      if (newPath && newPath !== oldPath && oldPath !== undefined) {
        // Only reload content if this is a real path change (not initial load)
        // and not for new files which should keep their initial content
        if (route.query.new !== 'true') {
          // Reset state and reload content
          loading.value = true
          error.value = ''
          success.value = ''
          loadFileContent()
        }
      }
    })

    // Watch for content changes to trigger validation
    watch(content, async () => {
      if (!loading.value && !isSyncing.value) {
        await validateContent()
      }
    }, { flush: 'post' })

    // Watch for edit mode changes to sync between simple and technical editors
    watch(editMode, (newMode, oldMode) => {
      if (isTermsFile.value && !isSyncing.value) {
        if (newMode === 'simple' && oldMode !== 'simple') {
          // Switching TO simple mode - sync technical content to simple editor
          syncTechnicalToSimple()
        } else if (oldMode === 'simple' && newMode !== 'simple') {
          // Switching FROM simple mode - sync simple editor to technical content
          syncSimpleToTechnical()
        }
      }
    })

    // Initialize simple editor when content loads for terms files
    // This watcher is more conservative and only runs during initial setup
    watch(content, () => {
      if (isTermsFile.value && !loading.value && !isSyncing.value) {
        // Set default to simple mode for terms files if not already set and this looks like terms content
        if (editMode.value === 'edit' && (content.value.includes('[[def:') || content.value.includes('[[tref:'))) {
          editMode.value = 'simple'
          nextTick(() => syncTechnicalToSimple())
        }
      }
    }, { immediate: true })

    return {
      loading,
      saving,
      error,
      success,
      validationWarnings,
      showValidationWarnings,
      content,
      editMode,
      commitMessage,
      filename,
      path: decodedPath,
      isDraft,
      isMarkdown,
      hasChanges,
      renderedContent,
      editor,
      // Terms file detection
      isTermsFile,
      // Simple editor for terms files
      simpleEditor,
      definitionEditor,
      generatedTermLine,
      displayedTermsForModal,
      isTermsModalFromSimpleEditor,
      onUseExternalTermClick,
      selectExternalTermForSimpleEditor,
      syncSimpleToTechnical,
      syncSimpleToTechnicalDebounced,
      syncTechnicalToSimple,
      addAlias,
      removeAlias,
      onAliasInput,
      insertDefinitionText,
      // New file mode
      isNewFile,
      handleContentChange,
      onTechnicalEditorInput,
      onDefinitionInput,
      insertText,
      insertHeading,
      insertList,
      saveFile,
      commitChanges,
      togglePublishStatus,
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
      // Definition collapse/expand functionality
      definitionsCollapsed,
      toggleDefinitionsCollapse,
      individualTermsExpanded,
      toggleIndividualTerm,
      isTermDefinitionVisible,
      // Add Term functionality
      newTerm,
      addTermError,
      showAddTermModal,
      onTermNameChange,
      onAliasChange,
      addTermAlias,
      removeTermAlias,
      generateTermDefinition,
      insertNewTerm,
      // Help functionality
      helpContent,
      showHelpModal
    }
  }
}
</script>

<style lang="scss">
@import '../styles/custom-bootstrap.scss';
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
.external-term-reference {
  margin: 1rem 0;
  padding: 0.15rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  /* background-color: #94c3f1; */
  background-color: $success-color-transparent;
}
.external-term-reference::before {
  content: 'External';
  // font-weight: bold;
  color: #155724;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  background-color: $success-color;
  font-size: 0.85rem;
  display: block;
  margin: 0.25rem;
  float: right;
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

/* Help modal styles */
.help-content h6 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #495057;
  font-weight: 600;
}

.help-content h6:first-child {
  margin-top: 0;
}

.help-content ul {
  margin-bottom: 1rem;
}

.help-content li {
  margin-bottom: 0.25rem;
}

/* Validation warnings styles */
.alert-warning ul {
  padding-left: 1.2rem;
}

.alert-warning li {
  margin-bottom: 0.25rem;
}

/* Simple Editor Styles */
.simple-editor {
  .card {
    border-width: 2px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .card-header {
    font-weight: 600;
    
    h5 {
      margin: 0;
      display: flex;
      align-items: center;
      
      i {
        margin-right: 0.5rem;
      }
    }
  }
  
  .generated-term-line {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 0.75rem;
    margin-top: 0.5rem;
    
    code {
      background-color: white;
      border: 1px solid #e9ecef;
      padding: 0.5rem;
      border-radius: 0.25rem;
      display: block;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      color: #495057;
    }
  }
  
  .definition-editor-toolbar {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    
    .btn-group {
      .btn {
        border-color: #dee2e6;
        
        &:hover {
          background-color: #e9ecef;
        }
      }
    }
  }
  
  .form-label {
    color: #495057;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .form-text {
    color: #6c757d;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  .btn-group {
    .btn-check:checked + .btn {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }
    
    .btn-outline-primary:hover {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }
    
    .btn-outline-success:hover {
      background-color: #198754;
      border-color: #198754;
      color: white;
    }
  }
  
  .input-group {
    .btn-outline-danger:hover {
      background-color: #dc3545;
      border-color: #dc3545;
      color: white;
    }
  }
}

.alert-warning li:last-child {
  margin-bottom: 0;
}
</style>

```
