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
            
            <div class="mb-4 position-relative">
              <label for="repo" class="form-label">Repository Name</label>
              <input
                type="text"
                id="repo"
                v-model="repo"
                class="form-control"
                placeholder="e.g., Hello-World"
                required
                @focus="onRepoInputFocus"
                autocomplete="off"
              >
            </div>
            <Modal v-if="showRepoModal" @close="showRepoModal = false">
              <template #header>
                <span>Select a Repository</span>
              </template>
              <template #body>
                <div
                  style="max-height: 60vh; overflow-y: auto; min-width: 300px;"
                >
                  <div v-if="repoLoading" class="text-center my-3">
                    <span class="spinner-border spinner-border-sm me-2"></span> Loading repositories...
                  </div>
                  <div v-else-if="repoList.length === 0" class="text-center text-muted my-3">
                    No repositories found.
                  </div>
                  <ul v-else class="list-group">
                    <li v-for="item in repoList" :key="item.id" class="list-group-item list-group-item-action" style="cursor:pointer" @click="selectRepo(item.name)">
                      <i class="bi bi-git"></i> {{ item.name }}
                    </li>
                  </ul>
                </div>
              </template>
            </Modal>

            <div class="mb-4 position-relative">
              <label for="branch" class="form-label">Branch</label>
              <input
                type="text"
                id="branch"
                v-model="branch"
                class="form-control"
                placeholder="e.g., main"
                required
                @focus="onBranchInputFocus"
                autocomplete="off"
              >
            </div>
            <Modal v-if="showBranchModal" @close="showBranchModal = false">
              <template #header>
                <span>Select a Branch</span>
              </template>
              <template #body>
                <div
                  style="max-height: 60vh; overflow-y: auto; min-width: 300px;"
                >
                  <div v-if="branchLoading" class="text-center my-3">
                    <span class="spinner-border spinner-border-sm me-2"></span> Loading branches...
                  </div>
                  <div v-else-if="branchList.length === 0" class="text-center text-muted my-3">
                    No branches found.
                  </div>
                  <ul v-else class="list-group">
                    <li v-for="item in branchList" :key="item.name" class="list-group-item list-group-item-action" style="cursor:pointer" @click="selectBranch(item.name)">
                      <i class="bi bi-git"></i> {{ item.name }}
                    </li>
                  </ul>
                </div>
              </template>
            </Modal>
            
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
          
          <hr class="my-4">
          
          <div class="text-center">
            <h6 class="text-muted mb-3">
              <i class="bi bi-link-45deg"></i>
              External Specifications Management
            </h6>
            <p class="small text-muted mb-3">
              Once you access a repository, you can also manage external specifications 
              that reference terms from other repositories.
            </p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <span class="badge bg-light text-dark">
                <i class="bi bi-plus-circle"></i> Add External Specs
              </span>
              <span class="badge bg-light text-dark">
                <i class="bi bi-pencil"></i> Edit Configurations
              </span>
              <span class="badge bg-light text-dark">
                <i class="bi bi-trash"></i> Remove Specs
              </span>
            </div>
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
import Modal from './Modal.vue'

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter()
    const owner = ref('')
    const repo = ref('')
    const branch = ref('main')
    const loading = ref(false)
    const error = ref('')
    // Modal and repo/branch list state
    const showRepoModal = ref(false)
    const repoList = ref([])
    const repoLoading = ref(false)
    const showBranchModal = ref(false)
    const branchList = ref([])
    const branchLoading = ref(false)
    // Fetch branches for the selected repo
    const fetchBranches = async () => {
      if (!owner.value || !repo.value) return
      branchLoading.value = true
      branchList.value = []
      try {
        const token = localStorage.getItem('github_token')
        const config = token ? {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        } : { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        const res = await axios.get(`https://api.github.com/repos/${owner.value}/${repo.value}/branches?per_page=100`, config)
        branchList.value = (res.data || []).map(b => ({ name: b.name }))
      } catch (e) {
        branchList.value = []
      } finally {
        branchLoading.value = false
      }
    }

    // Show modal and fetch branches on input focus
    const onBranchInputFocus = async () => {
      if (!owner.value || !repo.value) return
      showBranchModal.value = true
      await fetchBranches()
    }

    // Select branch from modal
    const selectBranch = (branchName) => {
      branch.value = branchName
      showBranchModal.value = false
    }

    // Fetch repos for the given owner
    const fetchRepos = async () => {
      if (!owner.value) return
      repoLoading.value = true
      repoList.value = []
      try {
        const token = localStorage.getItem('github_token')
        const config = token ? {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        } : { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        // Try user repos first, then org repos if user fails
        let res
        try {
          res = await axios.get(`https://api.github.com/users/${owner.value}/repos?per_page=100`, config)
        } catch (e) {
          // fallback to org
          res = await axios.get(`https://api.github.com/orgs/${owner.value}/repos?per_page=100`, config)
        }
        repoList.value = res.data || []
      } catch (e) {
        repoList.value = []
      } finally {
        repoLoading.value = false
      }
    }

    // Show modal and fetch repos on input focus
    const onRepoInputFocus = async () => {
      if (!owner.value) return
      showRepoModal.value = true
      await fetchRepos()
    }

    // Select repo from modal
    const selectRepo = (repoName) => {
      repo.value = repoName
      showRepoModal.value = false
    }

    const accessRepository = async () => {
      if (!owner.value || !repo.value || !branch.value) {
        error.value = 'Please enter username/organization, repository name, and branch.'
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

        // Navigate to file explorer with branch
        router.push(`/files/${owner.value}/${repo.value}/${branch.value}`)

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
      branch,
      loading,
      error,
      accessRepository,
      showRepoModal,
      repoList,
      repoLoading,
      onRepoInputFocus,
      selectRepo,
      showBranchModal,
      branchList,
      branchLoading,
      onBranchInputFocus,
      selectBranch
    }
  },
  components: { Modal }
}
</script>
