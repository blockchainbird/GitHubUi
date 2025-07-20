<template>
  <div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
      <div class="card">
        <div class="card-body">
          <h2 class="card-title text-center mb-4">
            <i class="bi bi-house-door"></i>
            Repository Access
          </h2>
          
          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>
          
          <form @submit.prevent="accessRepository">
            <div class="mb-3">
              <label for="owner" class="form-label">GitHub Username/Organization</label>
              <input
                type="text"
                id="owner"
                v-model="owner"
                class="form-control"
                placeholder="e.g., octocat"
                required
              >
            </div>
            
            <div class="mb-4">
              <label for="repo" class="form-label">Repository Name</label>
              <input
                type="text"
                id="repo"
                v-model="repo"
                class="form-control"
                placeholder="e.g., Hello-World"
                required
              >
            </div>
            
            <div class="d-grid">
              <button type="submit" class="btn btn-primary" :disabled="!owner || !repo || loading">
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Accessing Repository...
                </span>
                <span v-else>
                  <i class="bi bi-folder2-open"></i>
                  Access Repository
                </span>
              </button>
            </div>
          </form>
          
          <div class="mt-4 text-center">
            <small class="text-muted">
              This will look for a <code>specs.json</code> file in the repository root
              to find the spec directory.
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter()
    const owner = ref('')
    const repo = ref('')
    const loading = ref(false)
    const error = ref('')
    
    const accessRepository = async () => {
      if (!owner.value || !repo.value) {
        error.value = 'Please enter both username/organization and repository name'
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        
        // Check if repository exists and we have access
        await axios.get(`https://api.github.com/repos/${owner.value}/${repo.value}`, config)
        
        // Navigate to file explorer
        router.push(`/files/${owner.value}/${repo.value}`)
        
      } catch (err) {
        console.error('Repository access error:', err)
        if (err.response?.status === 404) {
          error.value = 'Repository not found or you don\'t have access to it.'
        } else if (err.response?.status === 403) {
          error.value = 'Access forbidden. Please check your token permissions.'
        } else {
          error.value = 'Failed to access repository. Please try again.'
        }
      } finally {
        loading.value = false
      }
    }
    
    return {
      owner,
      repo,
      loading,
      error,
      accessRepository
    }
  }
}
</script>
