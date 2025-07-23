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
              <input type="text" id="owner" v-model="owner" class="form-control" placeholder="e.g., octocat" required>
            </div>

            <div class="mb-4 position-relative">
              <label for="repo" class="form-label">Repository Name</label>
              <input type="text" id="repo" v-model="repo" class="form-control" placeholder="e.g., Hello-World" required
                @focus="onRepoInputFocus" autocomplete="off">
            </div>
            <Modal v-if="showRepoModal" @close="showRepoModal = false">
              <template #header>
                <span>Select a Repository</span>
              </template>
              <template #body>
                <div style="max-height: 60vh; overflow-y: auto; min-width: 300px;">
                  <div v-if="repoLoading" class="text-center my-3">
                    <span class="spinner-border spinner-border-sm me-2"></span> Loading repositories...
                  </div>
                  <div v-else-if="repoList.length === 0" class="text-center text-muted my-3">
                    No repositories found.
                  </div>
                  <ul v-else class="list-group">
                    <li v-for="item in repoList" :key="item.id" class="list-group-item list-group-item-action"
                      style="cursor:pointer" @click="selectRepo(item.name)">
                      <i class="bi bi-git"></i> {{ item.name }}
                    </li>
                  </ul>
                </div>
              </template>
            </Modal>

            <div class="mb-4 position-relative">
              <label for="branch" class="form-label">Branch</label>
              <input type="text" id="branch" v-model="branch" class="form-control" placeholder="e.g., main" required
                @focus="onBranchInputFocus" autocomplete="off">
            </div>
            <Modal v-if="showBranchModal" @close="showBranchModal = false">
              <template #header>
                <span>Select a Branch</span>
              </template>
              <template #body>
                <div style="max-height: 60vh; overflow-y: auto; min-width: 300px;">
                  <div v-if="branchLoading" class="text-center my-3">
                    <span class="spinner-border spinner-border-sm me-2"></span> Loading branches...
                  </div>
                  <div v-else-if="branchList.length === 0" class="text-center text-muted my-3">
                    No branches found.
                  </div>
                  <ul v-else class="list-group">
                    <li v-for="item in branchList" :key="item.name" class="list-group-item list-group-item-action"
                      style="cursor:pointer" @click="selectBranch(item.name)">
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
    <!-- Recently Visited Repositories Section -->
    <div v-if="visitedRepos.length > 0" class="col-12 mt-4">
      <h4 class="text-center mb-3">
        <i class="bi bi-clock-history"></i>
        Recently Visited Repositories
      </h4>

      <div class="row g-3">
        <div v-for="repo in visitedRepos" :key="`${repo.owner}/${repo.name}/${repo.branch}`"
          class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card h-100 repo-card" @click="navigateToRepo(repo)"
            style="cursor: pointer; transition: transform 0.2s;"
            @mouseenter="$event.target.style.transform = 'translateY(-2px)'"
            @mouseleave="$event.target.style.transform = 'translateY(0)'">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="card-title mb-0 text-truncate">
                  <i class="bi bi-github"></i>
                  {{ repo.name }}
                </h6>
                <button @click.stop="removeRepo(repo)" class="btn btn-outline-danger btn-sm"
                  style="padding: 0.125rem 0.25rem; font-size: 0.75rem;" title="Remove from history">
                  <i class="bi bi-x"></i>
                </button>
              </div>

              <p class="card-text text-muted small mb-2">
                <i class="bi bi-person"></i>
                {{ repo.owner }}
              </p>

              <p class="card-text text-muted small mb-2">
                <i class="bi bi-git"></i>
                {{ repo.branch }}
              </p>

              <div class="mt-auto">
                <small class="text-muted">
                  <i class="bi bi-clock"></i>
                  {{ formatDate(repo.lastVisited) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-3">
        <button @click="clearAllRepos" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-trash"></i>
          Clear All History
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Modal from './Modal.vue'
// import { addToVisitedRepos } from '../utils/visitedRepos.js'
import {
  loadVisitedRepos,
  addToVisitedRepos,
  removeFromVisitedRepos,
  clearAllVisitedRepos,
  formatVisitedDate
} from '../utils/visitedRepos.js'

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

    const visitedRepos = ref([])

    // Load visited repositories
    const loadRepos = () => {
      visitedRepos.value = loadVisitedRepos()
    }

    // Remove repository from visited list
    const removeRepo = (repo) => {
      visitedRepos.value = removeFromVisitedRepos(repo.owner, repo.name, repo.branch)
    }

    // Clear all visited repositories
    const clearAllRepos = () => {
      visitedRepos.value = clearAllVisitedRepos()
    }

    // Navigate to a repository
    const navigateToRepo = (repo) => {
      // Update the visited timestamp
      visitedRepos.value = addToVisitedRepos(repo.owner, repo.name, repo.branch)

      // Navigate to the repository files
      router.push(`/files/${repo.owner}/${repo.name}/${repo.branch}`)
    }

    // Format date for display
    const formatDate = (dateString) => {
      return formatVisitedDate(dateString)
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

        // Add to visited repositories
        addToVisitedRepos(owner.value, repo.value, branch.value)

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

    // Load visited repositories when component mounts
    onMounted(() => {
      loadRepos()
    })

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
      selectBranch,
      visitedRepos,
      removeRepo,
      clearAllRepos,
      navigateToRepo,
      formatDate
    }
  },
  components: { Modal }
}
</script>
<style scoped>
.repo-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border: 1px solid #dee2e6;
}

.repo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #007bff;
}

.repo-card .card-title {
  color: #0d6efd;
  font-size: 0.95rem;
  font-weight: 600;
}

.repo-card .btn-outline-danger {
  opacity: 0.7;
  border: none;
  background: none;
}

.repo-card .btn-outline-danger:hover {
  opacity: 1;
  background-color: #dc3545;
  color: white;
}
</style>