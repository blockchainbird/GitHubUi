<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-pencil-square"></i>
        Editing: {{ filename }}
      </h2>
      <div>
        <button @click="goBack" class="btn btn-outline-secondary me-2">
          <i class="bi bi-arrow-left"></i>
          Back to Files
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
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'FileEditor',
  props: ['owner', 'repo', 'path'],
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
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}`,
          config
        )
        
        fileSha.value = response.data.sha
        content.value = atob(response.data.content)
        originalContent.value = content.value
        
      } catch (err) {
        console.error('Error loading file:', err)
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
          sha: fileSha.value
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
        error.value = 'Failed to save file. Please try again.'
      } finally {
        saving.value = false
      }
    }
    
    const goBack = () => {
      router.push(`/files/${props.owner}/${props.repo}`)
    }
    
    onMounted(() => {
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
      goBack
    }
  }
}
</script>

<style scoped>
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
</style>
