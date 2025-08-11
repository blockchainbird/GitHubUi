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
        <button @click="handleTogglePublish" class="btn me-2" :class="isDraft ? 'btn-success' : 'btn-warning'"
          :disabled="saving || isNewFile"
          :title="isNewFile ? 'Create the file first before publishing/unpublishing' : ''">
          <i class="bi" :class="isDraft ? 'bi-eye' : 'bi-eye-slash'"></i>
          {{ isDraft ? 'Publish' : 'Unpublish' }}
        </button>

        <!-- Commit button -->
        <button @click="handleCommitFile" class="btn btn-success" :disabled="saving || !hasChanges">
          <span v-if="saving">
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Saving...
          </span>
          <span v-else>
            <i class="bi" :class="isNewFile ? 'bi-plus-circle' : 'bi-cloud-arrow-up'"></i>
            {{ isNewFile ? 'Create & Commit' : 'Commit' }}
          </span>
        </button>

        <!--  -->
        <button @click="goBack" class="btn btn-outline-secondary ms-2">
          <i class="bi bi-x-circle me-2"></i>
          Close
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

    <ContentValidationAlert :warnings="validationWarnings" :show-warnings="showValidationWarnings" />

    <!-- Remote Change Alert -->
    <div v-if="remoteChangeDetected" class="alert alert-warning alert-dismissible" role="alert">
      <div class="d-flex align-items-start">
        <i class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0 mt-1"></i>
        <div class="flex-grow-1">
          <strong>Remote Change Detected!</strong>
          <p class="mb-2">{{ remoteChangeMessage }}</p>
          <div class="d-flex gap-2">
            <button @click="acceptRemoteChanges" class="btn btn-warning btn-sm">
              <i class="bi bi-download"></i>
              Load Remote Version
            </button>
            <button @click="dismissRemoteChange" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-x"></i>
              Keep Local Version
            </button>
          </div>
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
              <!-- Repository Info Row -->
              <div class="repository-info d-flex align-items-center text-muted">
                <i class="bi bi-github me-2"></i>
                <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
                <span class="mx-2">•</span>
                <span class="badge bg-secondary">{{ branch }}</span>
              </div>
            </h5>
            <div class="btn-group" role="group">
              <input type="radio" class="btn-check" id="simple-mode" v-model="editMode" value="simple"
                autocomplete="off" v-if="isTermsFileComputed">
              <label class="btn btn-outline-success btn-sm" for="simple-mode" v-if="isTermsFileComputed">
                <i class="bi bi-ui-checks"></i> Simple
              </label>

              <input type="radio" class="btn-check" id="edit-mode" v-model="editMode" value="edit" autocomplete="off">
              <label class="btn btn-outline-primary btn-sm" for="edit-mode">
                <i class="bi bi-pencil"></i> {{ isTermsFileComputed ? 'Technical' : 'Edit' }}
              </label>

              <input type="radio" class="btn-check" id="preview-mode" v-model="editMode" value="preview"
                autocomplete="off">
              <label class="btn btn-outline-primary btn-sm" for="preview-mode">
                <i class="bi bi-eye"></i> Preview
              </label>
            </div>
          </div>
          <div class="card-body p-0" style="height: calc(100vh - 300px);">
            <!-- Simple Editor (Terms Files Only) -->
            <div v-if="editMode === 'simple'" class="p-3">
              <SimpleTermsEditor v-model:termType="simpleEditor.termType"
                v-model:externalRepo="simpleEditor.externalRepo" v-model:mainTerm="simpleEditor.mainTerm"
                v-model:aliases="simpleEditor.aliases" v-model:definition="simpleEditor.definition"
                @form-change="onSimpleFormChange" @definition-input="onSimpleDefinitionInput"
                @definition-enter="handleDefinitionEnter" @show-external-terms="showExternalTermsModal"
                @insert-definition-text="insertDefinitionText" ref="simpleEditorRef" />
            </div>

            <!-- Technical/Edit Mode -->
            <div v-else-if="editMode === 'edit'" class="d-flex flex-column h-100">
              <!-- Toolbar -->
              <div class="editor-toolbar p-2 border-bottom flex-shrink-0">
                <div class="btn-group btn-group-sm me-2" role="group">
                  <button @click="handleInsertHeading" class="btn btn-outline-secondary" title="Insert Heading">
                    <i class="bi bi-type-h2"></i>
                  </button>
                  <button @click="handleInsertList" class="btn btn-outline-secondary" title="Insert List">
                    <i class="bi bi-list-ul"></i>
                  </button>
                  <button @click="handleInsertBold" class="btn btn-outline-secondary" title="Bold">
                    <i class="bi bi-type-bold"></i>
                  </button>
                  <button @click="handleInsertItalic" class="btn btn-outline-secondary" title="Italic">
                    <i class="bi bi-type-italic"></i>
                  </button>
                </div>

                <div class="btn-group btn-group-sm me-2" role="group">
                  <button @click="showTermsModal" class="btn btn-outline-info" title="Insert Term Reference">
                    <i class="bi bi-bookmark"></i>
                    Terms
                  </button>
                  <button @click="copyToNotepad" class="btn btn-outline-success" title="Copy content to Notepad">
                    <i class="bi bi-sticky"></i>
                    To Notepad
                  </button>
                  <!-- <button @click="showAddTermModal" class="btn btn-outline-success" title="Add New Term">
                    <i class="bi bi-plus-circle"></i>
                    Add Term
                  </button> -->
                </div>

                <div class="btn-group btn-group-sm" role="group">
                  <button @click="showHelpModal" class="btn btn-outline-secondary" title="Help">
                    <i class="bi bi-question-circle"></i>
                    Help
                  </button>
                </div>
              </div>

              <!-- Editor Textarea -->
              <textarea ref="editor" v-model="content" @input="handleContentChange"
                class="p-3 border-0 rounded-0 technical-editor flex-grow-1"
                style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 14px; resize: none;"></textarea>
            </div>

            <!-- Preview Mode -->
            <div v-else-if="editMode === 'preview'" class="p-3">
              <div class="markdown-preview" v-html="renderedContent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Terms Modal -->
    <TermsModal :loading="loadingTerms" :error="termsError" :proxy-info="proxyInfo" :terms="filteredTerms"
      v-model:searchFilter="termFilter" v-model:referenceType="referenceType"
      :definitions-collapsed="definitionsCollapsed" :is-definition-visible="isTermDefinitionVisible"
      :is-from-simple-editor="isTermsModalFromSimpleEditor" @filter-terms="filterTerms"
      @toggle-definitions="toggleDefinitionsCollapse" @toggle-individual-term="toggleIndividualTerm"
      @refresh-terms="refreshTerms" @insert-term="handleInsertTerm" />

    <!-- Commit Modal -->
    <div class="modal fade" id="commitModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi" :class="isNewFile ? 'bi-plus-circle' : 'bi-save'"></i>
              {{ isNewFile ? 'Create & Commit File' : 'Save & Commit Changes' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="commitMessage" class="form-label">Commit Message</label>
              <input type="text" class="form-control" id="commitMessage" v-model="commitMessage"
                :placeholder="isNewFile ? `Create ${filename}` : `Update ${filename}`" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-success" @click="commitChanges" :disabled="saving">
              <span v-if="saving">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isNewFile ? 'Creating...' : 'Saving...' }}
              </span>
              <span v-else>
                <i class="bi" :class="isNewFile ? 'bi-plus-circle' : 'bi-save'"></i>
                {{ isNewFile ? 'Create File' : 'Save Changes' }}
              </span>
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
import { addToVisitedRepos } from '../utils/visitedRepos.js'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics.js'
import { useFileContent } from '../composables/useFileContent.js'
import { useTermsManagement } from '../composables/useTermsManagement.js'
import { useSimpleEditor } from '../composables/useSimpleEditor.js'
import { useContentValidation } from '../composables/useContentValidation.js'
import { usePublishToggle } from '../composables/usePublishToggle.js'
import { useRemoteFileMonitor } from '../composables/useRemoteFileMonitor.js'
import { getNotepadInstance } from '../composables/useNotepad.js'
import {
  insertText,
  insertHeading,
  insertList,
  isTermsFile,
  processTermReferences,
  getFileExtension,
  debounce
} from '../utils/editorUtils.js'

// Components
import SimpleTermsEditor from './SimpleTermsEditor.vue'
import TermsModal from './TermsModal.vue'
import ContentValidationAlert from './ContentValidationAlert.vue'

export default {
  name: 'FileEditor',
  components: {
    SimpleTermsEditor,
    TermsModal,
    ContentValidationAlert
  },
  props: ['owner', 'repo', 'branch', 'path'],
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const { trackFileOperation } = useGoogleAnalytics()

    // File content management
    const fileContent = useFileContent(props)
    const {
      loading,
      saving,
      error,
      success,
      content,
      originalContent,
      fileSha,
      commitMessage,
      isNewFile,
      filename,
      decodedPath,
      isDraft,
      isMarkdown,
      hasChanges,
      loadFileContent,
      saveFile,
      checkAuthAndRedirect
    } = fileContent

    // Terms management
    const termsManagement = useTermsManagement(props, checkAuthAndRedirect)
    const {
      terms,
      filteredTerms,
      termFilter,
      loadingTerms,
      termsError,
      referenceType,
      definitionsCollapsed,
      individualTermsExpanded,
      specsConfig,
      filterTerms,
      isTermDefinitionVisible,
      toggleDefinitionsCollapse,
      toggleIndividualTerm,
      showTermsModal,
      refreshTerms,
      initializeTerms
    } = termsManagement

    // Simple editor
    const simpleEditorState = useSimpleEditor()
    const {
      simpleEditor,
      definitionEditor,
      isTermsModalFromSimpleEditor,
      isSyncing,
      generatedTermLine,
      syncSimpleToTechnical,
      syncTechnicalToSimple,
      addAlias: addSimpleAlias,
      removeAlias: removeSimpleAlias,
      onAliasInputChange,
      insertDefinitionText
    } = simpleEditorState

    // Content validation
    const contentValidation = useContentValidation(props)
    const {
      validationWarnings,
      showValidationWarnings,
      validateContent
    } = contentValidation

    // Publish toggle
    const publishToggle = usePublishToggle(props, checkAuthAndRedirect)
    const { togglePublishStatus } = publishToggle

    // Remote file monitoring
    const remoteMonitor = useRemoteFileMonitor(props)
    const {
      remoteChangeDetected,
      remoteChangeMessage,
      checkingRemote,
      initializeRemoteMonitoring,
      checkForRemoteChanges,
      checkBeforeCommit,
      handleRemoteChange,
      dismissRemoteChange,
      updateAfterSave
    } = remoteMonitor

    // Notepad integration
    const { addContent: addToNotepad } = getNotepadInstance()

    // Editor state
    const editMode = ref('edit')
    const editor = ref(null)
    const proxyInfo = ref('')

    // State to track if file was detected as terms file (for stability)
    const wasDetectedAsTermsFile = ref(false)

    // Check if file is terms file
    const isTermsFileComputed = computed(() => {
      // For new files, check if we're in a terms directory or if filename suggests terms
      const isCreatingNewFile = isNewFile.value || route.query.new === 'true'

      if (isCreatingNewFile) {
        // Handle both string and array cases for path
        let path = ''
        if (typeof props.path === 'string') {
          path = props.path
        } else if (Array.isArray(props.path) && props.path.length > 0) {
          path = props.path[0]
        }

        const name = filename.value || ''

        // Check if path contains terms directory patterns
        const isInTermsDirectory = path.toLowerCase().includes('term') ||
          path.toLowerCase().includes('/terms/') ||
          path.toLowerCase().includes('/terms-definitions/') ||
          path.toLowerCase().includes('definitions')

        // Check if filename suggests it's a terms file
        const isTermsFileName = name.toLowerCase().includes('term') ||
          name.toLowerCase().includes('definition') ||
          name.toLowerCase().includes('def-')

        // Check if we're creating a markdown file (new files typically don't have extension in path initially)
        const isMarkdownFile = name.toLowerCase().endsWith('.md') ||
          path.toLowerCase().endsWith('.md') ||
          (!name.includes('.') && !path.includes('.')) // Assume .md for files without extension

        // For new files in terms context, enable terms mode
        const result = (isInTermsDirectory || isTermsFileName) && isMarkdownFile
        if (result) {
          wasDetectedAsTermsFile.value = true
        }
        return result
      }

      // For existing files, check multiple conditions for stability
      const hasTermsContent = isTermsFile(filename.value, content.value)
      const isCurrentlyInSimpleMode = editMode.value === 'simple'
      const hasSimpleEditorContent = simpleEditor.value.mainTerm.trim() !== '' ||
        simpleEditor.value.definition.trim() !== ''

      // Once detected as terms file, remain stable unless clearly not a terms file
      if (hasTermsContent) {
        wasDetectedAsTermsFile.value = true
        return true
      }

      // If we're in simple mode or have simple editor content, it's a terms file
      if (isCurrentlyInSimpleMode || hasSimpleEditorContent) {
        wasDetectedAsTermsFile.value = true
        return true
      }

      // If previously detected as terms file and we're still loading or syncing, remain stable
      if (wasDetectedAsTermsFile.value && (loading.value || isSyncing.value)) {
        return true
      }

      // Default check for filename patterns (fallback)
      if (filename.value && filename.value.toLowerCase().includes('term') &&
        filename.value.toLowerCase().endsWith('.md')) {
        wasDetectedAsTermsFile.value = true
        return true
      }

      return wasDetectedAsTermsFile.value
    })

    // Rendered content for preview
    const renderedContent = computed(() => {
      if (!isMarkdown.value) return content.value
      return processTermReferences(content.value, terms.value)
    })

    // Help content
    const helpContent = ref(`
<div class="alert alert-info">
  <strong>Tip:</strong> The editor will help you insert these definitions and references.
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

    // Debounced sync functions
    const syncSimpleToTechnicalDebounced = debounce(() => {
      if (!isSyncing.value && editMode.value === 'simple') {
        syncSimpleToTechnical((newContent) => {
          content.value = newContent
        })
      }
    }, 200)

    const onDefinitionInputDebounced = debounce(() => {
      if (!isSyncing.value && editMode.value === 'simple') {
        syncSimpleToTechnical((newContent) => {
          content.value = newContent
        })
      }
    }, 500)

    // Event handlers
    const handleContentChange = async () => {
      if (isSyncing.value) return
      error.value = ''
      success.value = ''
      await validateContent(content.value, filename.value, specsConfig.value)
    }

    const onSimpleFormChange = () => {
      syncSimpleToTechnicalDebounced()
    }

    const onSimpleDefinitionInput = () => {
      onDefinitionInputDebounced()
    }

    const handleDefinitionEnter = async (event) => {
      setTimeout(async () => {
        await syncSimpleToTechnical((newContent) => {
          content.value = newContent
        })
      }, 100)
    }

    const showExternalTermsModal = async () => {
      isTermsModalFromSimpleEditor.value = true
      await showTermsModal()
    }

    const handleInsertTerm = async (term) => {
      if (isTermsModalFromSimpleEditor.value) {
        selectExternalTermForSimpleEditor(term)
      } else {
        await insertTermReference(term)
      }
    }

    const selectExternalTermForSimpleEditor = (term) => {
      if (!term.external) {
        console.warn('Non-external term selected in simple editor mode')
        return
      }

      simpleEditor.value.externalRepo = term.externalSpec || ''
      simpleEditor.value.mainTerm = term.id || ''

      if (term.aliases && term.aliases.length > 0) {
        simpleEditor.value.aliases = [...term.aliases, null]
      } else {
        simpleEditor.value.aliases = [null]
      }

      syncSimpleToTechnical((newContent) => {
        content.value = newContent
      })

      const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'))
      if (modal) {
        modal.hide()
      }

      isTermsModalFromSimpleEditor.value = false
    }

    const insertTermReference = async (term) => {
      const textarea = editor.value
      if (!textarea) return

      let refText
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
        case 'auto':
        default:
          if (term.external) {
            refText = `[[xref: ${term.externalSpec}, ${term.id}]]`
          } else {
            refText = `[[ref: ${term.id}]]`
          }
          break
      }

      const result = await insertText(textarea, content.value, refText)
      content.value = result.newContent

      await validateContent(content.value, filename.value, specsConfig.value)

      const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'))
      modal.hide()
    }

    // Text insertion handlers
    const handleInsertHeading = async () => {
      const result = await insertHeading(editor.value, content.value)
      content.value = result.newContent
      await handleContentChange()
    }

    const handleInsertList = async () => {
      const result = await insertList(editor.value, content.value)
      content.value = result.newContent
      await handleContentChange()
    }

    const handleInsertBold = async () => {
      const result = await insertText(editor.value, content.value, '**', '**')
      content.value = result.newContent
      await handleContentChange()
    }

    const handleInsertItalic = async () => {
      const result = await insertText(editor.value, content.value, '_', '_')
      content.value = result.newContent
      await handleContentChange()
    }

    // File operations
    const handleCommitFile = async () => {
      if (!hasChanges.value) return

      // Check for remote changes before committing
      const hasRemoteChanges = await checkBeforeCommit()
      if (hasRemoteChanges) {
        error.value = 'Remote changes detected! Please resolve them before committing.'
        // Watch for remoteChangeDetected and clear error when it disappears
        const unwatch = watch(remoteChangeDetected, (val) => {
          if (!val) {
            error.value = ''
            unwatch()
          }
        })
        return
      }

      commitMessage.value = `${isNewFile.value ? 'Create' : 'Update'} ${filename.value}`
      const modal = new bootstrap.Modal(document.getElementById('commitModal'))
      modal.show()
    }

    const commitChanges = async () => {
      await saveFile()

      // Update remote monitoring after successful save
      if (!error.value) {
        updateAfterSave(fileSha.value)
      }

      trackFileOperation(isNewFile.value ? 'create_complete' : 'save', getFileExtension(decodedPath.value))

      const modal = bootstrap.Modal.getInstance(document.getElementById('commitModal'))
      modal.hide()
    }

    const handleTogglePublish = async () => {
      saving.value = true
      error.value = ''
      success.value = ''

      try {
        const result = await togglePublishStatus(content.value, fileSha.value, decodedPath.value, filename.value)

        if (result.success) {
          success.value = result.message
          fileSha.value = result.newSha
          trackFileOperation(result.message.includes('Published') ? 'published' : 'unpublished', getFileExtension(decodedPath.value))
        } else {
          error.value = result.error
        }
      } finally {
        saving.value = false
      }
    }

    // Modal handlers
    const showAddTermModal = () => {
      // Implementation for add term modal
      console.log('Add term modal not implemented yet')
    }

    const showHelpModal = () => {
      const modal = new bootstrap.Modal(document.getElementById('helpModal'))
      modal.show()
    }

    // Notepad integration
    const copyToNotepad = () => {
      if (!content.value || !content.value.trim()) {
        return
      }

      const fileName = filename.value || 'Unnamed file'
      addToNotepad(content.value, ` (${fileName}) File Editor`, true)
    }

    // Remote change handling
    const acceptRemoteChanges = async () => {
      // Add animation class to the editor
      if (editor.value) {
        editor.value.classList.add('content-moving-to-notepad')

        // Wait for animation to complete before updating content
        setTimeout(async () => {
          const success = await handleRemoteChange(content.value, (newContent, newSha) => {
            content.value = newContent
            originalContent.value = newContent
            fileSha.value = newSha
          })

          if (success) {
            success.value = 'Remote changes loaded. Your previous content was moved to the notepad.'
            setTimeout(() => {
              if (success.value.includes('Remote changes loaded')) {
                success.value = ''
              }
            }, 4000)
          } else {
            error.value = 'Failed to load remote changes. Please try again.'
          }

          // Remove animation class
          if (editor.value) {
            editor.value.classList.remove('content-moving-to-notepad')
          }
        }, 400) // Half of animation duration
      } else {
        // Fallback if no editor ref
        const success = await handleRemoteChange(content.value, (newContent, newSha) => {
          content.value = newContent
          originalContent.value = newContent
          fileSha.value = newSha
        })

        if (success) {
          success.value = 'Remote changes loaded. Your previous content was moved to the notepad.'
          setTimeout(() => {
            if (success.value.includes('Remote changes loaded')) {
              success.value = ''
            }
          }, 4000)
        } else {
          error.value = 'Failed to load remote changes. Please try again.'
        }
      }
    }

    const goBack = () => {
      if (isNewFile.value && hasChanges.value) {
        const confirmLeave = confirm(
          'You have unsaved changes in this new file. If you leave, your changes will be saved to the notepad. Are you sure you want to leave without creating it?'
        );
        if (!confirmLeave) {
          return;
        }
      }
      // Navigate away
      const sourceDir = route.query.dir;
      if (sourceDir) {
        const encodedDir = encodeURIComponent(sourceDir);
        router.push(`/files/${props.owner}/${props.repo}/${props.branch}?dir=${encodedDir}`);
      } else {
        router.push(`/files/${props.owner}/${props.repo}/${props.branch}`);
      }
    };

    // Lifecycle
    onMounted(async () => {
      addToVisitedRepos(props.owner, props.repo, props.branch)

      // Load file content
      await loadFileContent()

      // Initialize remote monitoring for existing files
      if (!isNewFile.value && fileSha.value) {
        await initializeRemoteMonitoring(fileSha.value)
      }

      // Initialize terms for preview mode
      await initializeTerms()

      // Browser navigation guard
      const handleBeforeUnload = (event) => {
        if (hasChanges.value && content.value.trim()) {
          // Save unsaved changes to notepad before leaving
          const fileName = filename.value || 'Unnamed file'
          const source = `File Editor (${fileName}) - Unsaved Changes`
          addToNotepad(content.value, source) // Message will be shown automatically for script-added content
        }

        if (isNewFile.value && hasChanges.value) {
          event.preventDefault()
          event.returnValue = ''
          return ''
        }
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      window.fileEditorBeforeUnload = handleBeforeUnload
    })

    onUnmounted(() => {
      // Save unsaved changes to notepad before component unmounts
      if (hasChanges.value && content.value.trim()) {
        const fileName = filename.value || 'Unnamed file'
        const source = ` (${fileName}) - Unsaved Changes from File Editor`
        addToNotepad(content.value, source) // Message will be shown automatically for script-added content
      }

      if (window.fileEditorBeforeUnload) {
        window.removeEventListener('beforeunload', window.fileEditorBeforeUnload)
        delete window.fileEditorBeforeUnload
      }
    })

    // Watchers
    watch(() => props.path, (newPath, oldPath) => {
      if (newPath && newPath !== oldPath && oldPath !== undefined) {
        // Save unsaved changes to notepad before switching files
        if (hasChanges.value && content.value.trim()) {
          const fileName = filename.value || 'Unnamed file'
          const source = ` (${fileName}) - Unsaved Changes from File Editor`
          addToNotepad(content.value, source) // Message will be shown automatically for script-added content
        }

        // Reset terms file detection state when switching files
        wasDetectedAsTermsFile.value = false

        if (route.query.new !== 'true') {
          loading.value = true
          error.value = ''
          success.value = ''
          loadFileContent()
        }
      }
    })

    watch(content, async () => {
      if (!loading.value && !isSyncing.value) {
        await validateContent(content.value, filename.value, specsConfig.value)
      }
    }, { flush: 'post' })

    watch(editMode, (newMode, oldMode) => {
      if (isTermsFileComputed.value && !isSyncing.value) {
        if (newMode === 'simple' && oldMode !== 'simple') {
          syncTechnicalToSimple(content.value)
        } else if (oldMode === 'simple' && newMode !== 'simple') {
          syncSimpleToTechnical((newContent) => {
            content.value = newContent
          })
        }
      }
    })

    return {
      // State
      loading,
      saving,
      error,
      success,
      content,
      commitMessage,
      isNewFile,
      editMode,
      editor,
      proxyInfo,

      // Computed
      filename,
      decodedPath,
      isDraft,
      isMarkdown,
      hasChanges,
      isTermsFileComputed,
      renderedContent,
      helpContent,

      // Simple editor
      simpleEditor,
      definitionEditor,
      isTermsModalFromSimpleEditor,
      generatedTermLine,

      // Terms
      terms,
      filteredTerms,
      termFilter,
      loadingTerms,
      termsError,
      referenceType,
      definitionsCollapsed,
      individualTermsExpanded,

      // Validation
      validationWarnings,
      showValidationWarnings,

      // Remote monitoring
      remoteChangeDetected,
      remoteChangeMessage,
      checkingRemote,

      // Methods
      handleContentChange,
      onSimpleFormChange,
      onSimpleDefinitionInput,
      handleDefinitionEnter,
      showExternalTermsModal,
      handleInsertTerm,
      insertDefinitionText,
      handleInsertHeading,
      handleInsertList,
      handleInsertBold,
      handleInsertItalic,
      handleCommitFile,
      commitChanges,
      handleTogglePublish,
      showAddTermModal,
      showHelpModal,
      copyToNotepad,
      acceptRemoteChanges,
      dismissRemoteChange,
      goBack,

      // Terms methods
      filterTerms,
      isTermDefinitionVisible,
      toggleDefinitionsCollapse,
      toggleIndividualTerm,
      showTermsModal,
      refreshTerms
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

/* Term reference styles */
.external-term-reference {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: $success-color-transparent;
}

.external-term-reference::before {
  content: 'External';
  color: #155724;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  background-color: $success-color;
  font-size: 0.85rem;
  display: block;
  margin: -0.75rem -0.75rem 0.5rem auto;
  width: fit-content;
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

/* Term reference inline styles */
.term-reference {
  font-weight: 500;
  text-decoration: underline;
  cursor: help;
}

.term-reference.external {
  color: #28a745;
  border-bottom: 1px dotted #28a745;
}

.term-reference.local {
  color: #0d6efd;
  border-bottom: 1px dotted #0d6efd;
}

.term-reference.local.missing {
  color: #dc3545;
  border-bottom: 1px dotted #dc3545;
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

/* Definition paragraph styles */
.definition-paragraph {
  margin: 0.5rem 0;
  padding-left: 1rem;
  border-left: 3px solid #0d6efd;
  background-color: #f8f9fa;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-radius: 0 0.25rem 0.25rem 0;
  line-height: 1.6;
}

.technical-editor {
  resize: none;
  width: 100%;
  transition: all 0.3s ease;
}

/* Animation for content moving to notepad */
.content-moving-to-notepad {
  animation: moveToNotepad 0.8s ease-out;
}

@keyframes moveToNotepad {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(0.95) translateX(20px);
    opacity: 0.7;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
