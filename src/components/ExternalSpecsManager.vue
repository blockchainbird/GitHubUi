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
              <button 
                @click="$router.push(`/health-check/${owner}/${repo}/${branch}`)" 
                class="btn btn-outline-success me-2"
                title="Run Health Check"
              >
                <i class="bi bi-heart-pulse"></i>
                Health Check
              </button>
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
                          <input 
                            v-model="spec.external_spec" 
                            class="form-control form-control-sm"
                            placeholder="e.g., toip1"
                            @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.external_spec }"
                          >
                          <div v-if="!spec.external_spec" class="invalid-feedback">
                            Spec ID is required
                          </div>
                        </td>
                        <td>
                          <input 
                            v-model="spec.gh_page" 
                            type="url"
                            class="form-control form-control-sm"
                            placeholder="https://example.github.io/spec/"
                            @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.gh_page || !isValidUrl(spec.gh_page) }"
                          >
                          <div v-if="!spec.gh_page" class="invalid-feedback">
                            GitHub Page URL is required
                          </div>
                          <div v-else-if="!isValidUrl(spec.gh_page)" class="invalid-feedback">
                            Please enter a valid URL
                          </div>
                        </td>
                        <td>
                          <input 
                            v-model="spec.url" 
                            type="url"
                            class="form-control form-control-sm"
                            placeholder="https://github.com/user/repo"
                            @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.url || !isValidUrl(spec.url) }"
                          >
                          <div v-if="!spec.url" class="invalid-feedback">
                            Repository URL is required
                          </div>
                          <div v-else-if="!isValidUrl(spec.url)" class="invalid-feedback">
                            Please enter a valid URL
                          </div>
                        </td>
                        <td>
                          <input 
                            v-model="spec.terms_dir" 
                            class="form-control form-control-sm"
                            placeholder="spec/terms-definitions"
                            @input="markAsChanged"
                            :class="{ 'is-invalid': !spec.terms_dir }"
                          >
                          <div v-if="!spec.terms_dir" class="invalid-feedback">
                            Terms directory is required
                          </div>
                        </td>
                        <td>
                          <button 
                            @click="removeSpec(index)" 
                            class="btn btn-danger btn-sm"
                            title="Remove specification"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Add New Spec Form -->
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">Add New External Specification</h6>
                </div>
                <div class="card-body">
                  <form @submit.prevent="addNewSpec">
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label for="newSpecId" class="form-label">Specification ID</label>
                        <input 
                          id="newSpecId"
                          v-model="newSpec.external_spec" 
                          class="form-control"
                          placeholder="e.g., toip1, keri1"
                          required
                        >
                        <div class="form-text">Unique identifier for this external specification</div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="newSpecGhPage" class="form-label">GitHub Page URL</label>
                        <input 
                          id="newSpecGhPage"
                          v-model="newSpec.gh_page" 
                          type="url"
                          class="form-control"
                          placeholder="https://example.github.io/spec/"
                          required
                        >
                        <div class="form-text">The GitHub Pages URL where the spec is hosted</div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="newSpecUrl" class="form-label">Repository URL</label>
                        <input 
                          id="newSpecUrl"
                          v-model="newSpec.url" 
                          type="url"
                          class="form-control"
                          placeholder="https://github.com/user/repo"
                          required
                        >
                        <div class="form-text">The GitHub repository URL</div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="newSpecTermsDir" class="form-label">Terms Directory</label>
                        <input 
                          id="newSpecTermsDir"
                          v-model="newSpec.terms_dir" 
                          class="form-control"
                          placeholder="spec/terms-definitions"
                          required
                        >
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
    
    const resetNewSpec = () => {
      newSpec.value = {
        external_spec: '',
        gh_page: '',
        url: '',
        terms_dir: 'spec/terms-definitions'
      }
    }
    
    const markAsChanged = () => {
      hasChanges.value = true
    }
    
    const isValidUrl = (url) => {
      try {
        new URL(url)
        return true
      } catch {
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
    
    const saveSpecs = async () => {
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
          throw new Error(`Failed to save specs.json: ${response.statusText}`)
        }
        
        const result = await response.json()
        originalSpecsJson.value.sha = result.content.sha
        hasChanges.value = false
        
        alert('External specifications saved successfully!')
        
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
      loadSpecs()
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
      resetNewSpec,
      markAsChanged,
      isValidUrl,
      addNewSpec,
      removeSpec,
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
</style>
