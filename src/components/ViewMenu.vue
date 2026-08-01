<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i class="bi bi-eye me-2"></i>
            View
          </h2>
          <RepoInfo :owner="owner" :repo="repo" :branch="decodedBranch" />
        </div>

        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-list-ul me-2"></i>
              Choose a view
            </h5>
          </div>
          <div class="card-body">
            <p class="text-muted small mb-3">Select how you want to view this specification:</p>

            <div class="row g-3">
              <div class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="navigateTo('/terms-preview')">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-book-half me-2 text-primary"></i>
                      <div>
                        <strong>Preview</strong>
                        <div class="small text-muted">Browse terms and definitions</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="navigateTo('/spec')">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-journal-text me-2 text-primary"></i>
                      <div>
                        <strong>Final view</strong>
                        <div class="small text-muted">Open the rendered specification</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="navigateTo('/health-check')">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-heart-pulse me-2 text-danger"></i>
                      <div>
                        <strong>Health</strong>
                        <div class="small text-muted">Check repository and spec health</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div class="col-md-6">
                <a v-if="githubRepoUrl" class="menu-option card h-100 w-100 text-start text-decoration-none"
                  :href="githubRepoUrl" target="_blank" rel="noopener">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-box-arrow-up-right me-2 text-secondary"></i>
                      <div>
                        <strong>Repo (new tab)</strong>
                        <div class="small text-muted">Open this branch on GitHub</div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end mt-4">
          <button type="button" class="btn btn-outline-secondary" @click="$router.back()">
            <i class="bi bi-arrow-left me-1"></i>
            Back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import RepoInfo from './RepoInfo.vue'
import { decodeBranchName, buildRoutePath } from '../utils/branchUtils.js'

export default {
  name: 'ViewMenu',
  components: { RepoInfo },
  props: {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    branch: { type: String, required: true }
  },
  setup(props) {
    const router = useRouter()
    const decodedBranch = computed(() => decodeBranchName(props.branch))

    const githubRepoUrl = computed(() =>
      `https://github.com/${props.owner}/${props.repo}/tree/${decodedBranch.value}`
    )

    const navigateTo = (basePath) => {
      router.push(buildRoutePath(basePath, props.owner, props.repo, decodedBranch.value))
    }

    return {
      decodedBranch,
      githubRepoUrl,
      navigateTo
    }
  }
}
</script>

<style scoped>
.menu-option {
  border: 1px solid var(--bs-border-color, #dee2e6);
  background: var(--bs-body-bg, #fff);
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.menu-option:hover {
  border-color: var(--bs-primary, #0d6efd);
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}
</style>
