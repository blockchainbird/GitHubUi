<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i class="bi bi-sliders me-2"></i>
            Config
          </h2>
          <RepoInfo :owner="owner" :repo="repo" :branch="decodedBranch" />
        </div>

        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-list-ul me-2"></i>
              Choose a configuration area
            </h5>
          </div>
          <div class="card-body">
            <p class="text-muted small mb-3">Select what you want to configure:</p>

            <div class="row g-3">
              <div class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="navigateTo('/admin')">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-shield-lock me-2 text-primary"></i>
                      <div>
                        <strong>Local config</strong>
                        <div class="small text-muted">Edit repository configuration (specs.json)</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div v-if="isAdvancedUser" class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="navigateTo('/external-specs')">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-link-45deg me-2 text-primary"></i>
                      <div>
                        <strong>External repo's</strong>
                        <div class="small text-muted">Manage external specification references</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="navigateTo('/settings')">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-gear me-2 text-secondary"></i>
                      <div>
                        <strong>Settings</strong>
                        <div class="small text-muted">Application settings</div>
                      </div>
                    </div>
                  </div>
                </button>
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
import { useAdvancedUser } from '../composables/useAdvancedUser.js'
import { decodeBranchName, buildRoutePath } from '../utils/branchUtils.js'

export default {
  name: 'ConfigMenu',
  components: { RepoInfo },
  props: {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    branch: { type: String, required: true }
  },
  setup(props) {
    const router = useRouter()
    const { isAdvancedUser } = useAdvancedUser()
    const decodedBranch = computed(() => decodeBranchName(props.branch))

    const navigateTo = (basePath) => {
      router.push(buildRoutePath(basePath, props.owner, props.repo, decodedBranch.value))
    }

    return {
      decodedBranch,
      isAdvancedUser,
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
