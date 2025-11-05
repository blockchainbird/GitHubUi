<template>
  <div v-if="isOpen" class="modal fade show d-block" tabindex="-1"
    style="background-color: rgba(0,0,0,0.5);" 
    @click.self="close"
    @keyup.escape="close">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-git"></i>
            Select Branch
          </h5>
          <button @click="close" type="button" class="btn-close" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Filter Input -->
          <div class="mb-3">
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                v-model="filterText" 
                class="form-control" 
                placeholder="Filter branches..."
                @input="filterBranches"
                ref="filterInput">
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center my-3">
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Loading branches...
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            {{ error }}
          </div>

          <!-- No Results -->
          <div v-else-if="filteredBranches.length === 0" class="text-center text-muted my-3">
            No branches found.
          </div>

          <!-- Branch List -->
          <div v-else class="branch-list" style="max-height: 60vh; overflow-y: auto;">
            <ul class="list-group">
              <li 
                v-for="branch in filteredBranches" 
                :key="branch.name"
                class="list-group-item list-group-item-action branch-item"
                :class="{ 'active': branch.name === currentBranch }"
                @click="selectBranch(branch.name)"
                role="button"
                tabindex="0"
                @keydown.enter="selectBranch(branch.name)"
                @keydown.space.prevent="selectBranch(branch.name)">
                <i class="bi bi-git me-2"></i>
                {{ branch.name }}
                <span v-if="branch.name === currentBranch" class="badge bg-primary ms-2">Current</span>
                <span v-if="branch.name === defaultBranch" class="badge rounded-pill bg-success ms-2">default</span>
              </li>
            </ul>
          </div>

          <!-- Branch Count Info -->
          <div v-if="!loading && !error" class="text-muted small mt-2">
            Showing {{ filteredBranches.length }} of {{ branches.length }} branch{{ branches.length !== 1 ? 'es' : '' }}
          </div>
        </div>
        <div class="modal-footer">
          <button @click="close" type="button" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import axios from 'axios'
import { secureTokenManager } from '../utils/secureTokenManager.js'
import { useDefaultBranch } from '../composables/useDefaultBranch.js'

export default {
  name: 'BranchSelector',
  props: {
    /**
     * Whether the modal is open
     */
    isOpen: {
      type: Boolean,
      required: true
    },
    /**
     * Repository owner
     */
    owner: {
      type: String,
      required: true
    },
    /**
     * Repository name
     */
    repo: {
      type: String,
      required: true
    },
    /**
     * Current branch name
     */
    currentBranch: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'branch-selected'],
  setup(props, { emit }) {
    const branches = ref([])
    const filteredBranches = ref([])
    const filterText = ref('')
    const loading = ref(false)
    const error = ref('')
    const filterInput = ref(null)

    // Use composable to fetch default branch
    const { defaultBranch, fetchDefaultBranch } = useDefaultBranch(props, { immediate: false })

    /**
     * Fetches branches from GitHub API
     * Uses authentication token if available for higher rate limits
     */
    const fetchBranches = async () => {
      if (!props.owner || !props.repo) return

      loading.value = true
      error.value = ''
      branches.value = []

      try {
        const token = secureTokenManager.getToken()
        const config = token ? {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        } : { 
          headers: { 
            'Accept': 'application/vnd.github.v3+json' 
          } 
        }

        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/branches?per_page=100`,
          config
        )

        branches.value = response.data.map(b => ({ name: b.name }))
        filteredBranches.value = [...branches.value]
      } catch (err) {
        console.error('Error fetching branches:', err)
        error.value = 'Failed to load branches. Please try again.'
        branches.value = []
        filteredBranches.value = []
      } finally {
        loading.value = false
      }
    }

    /**
     * Filters branches based on user input
     * Case-insensitive search
     */
    const filterBranches = () => {
      const filter = filterText.value.toLowerCase().trim()
      
      if (!filter) {
        filteredBranches.value = [...branches.value]
      } else {
        filteredBranches.value = branches.value.filter(branch =>
          branch.name.toLowerCase().includes(filter)
        )
      }
    }

    /**
     * Handles branch selection
     * Emits the selected branch name to parent component
     */
    const selectBranch = (branchName) => {
      emit('branch-selected', branchName)
      close()
    }

    /**
     * Closes the modal and resets state
     */
    const close = () => {
      emit('close')
      filterText.value = ''
      error.value = ''
    }

    /**
     * Watch for modal open state changes
     * Fetch branches when modal opens and focus the filter input
     */
    watch(() => props.isOpen, async (newValue) => {
      if (newValue) {
        await Promise.all([fetchDefaultBranch(), fetchBranches()])
        // Focus the filter input after modal is rendered
        await nextTick()
        filterInput.value?.focus()
      }
    })

    return {
      branches,
      filteredBranches,
      filterText,
      loading,
      error,
      filterInput,
      filterBranches,
      selectBranch,
      close,
      defaultBranch
    }
  }
}
</script>

<style scoped>
/**
 * Branch list item styling
 * Provides interactive feedback for clickable items
 */
.branch-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/**
 * Hover state for branch items
 * Provides visual feedback on hover
 */
.branch-item:hover:not(.active) {
  background-color: #f8f9fa;
}

/**
 * Focus state for branch items
 * Ensures keyboard accessibility
 */
.branch-item:focus {
  outline: 2px solid #0d6efd;
  outline-offset: -2px;
}
</style>
