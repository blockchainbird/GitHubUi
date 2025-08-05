<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i class="bi bi-play-circle me-2"></i>
            GitHub Actions
          </h2>
          <div class="repository-info d-flex align-items-center text-muted">
            <i class="bi bi-github me-2"></i>
            <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
            <span class="mx-2">•</span>
            <span class="fs-6 badge bg-secondary">{{ branch }}</span>
          </div>
        </div>

        <!-- Main Card -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-gear-fill me-2"></i>
              Run Workflow
            </h5>
          </div>
          <div class="card-body">
            <!-- Error Alert -->
            <div v-if="actionError" class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ actionError }}
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="alert alert-success" role="alert">
              <i class="bi bi-check-circle me-2"></i>
              {{ successMessage }}
            </div>

            <!-- Loading State -->
            <div v-if="triggeringWorkflow" class="alert alert-info" role="alert">
              <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-3" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <div>
                  <strong>Triggering workflow...</strong>
                  <div class="small">This may take a few moments to appear in GitHub Actions.</div>
                </div>
              </div>
            </div>

            <!-- Action Selection -->
            <div class="mb-4">
              <label class="form-label fw-semibold">Select Action Type</label>
              <p class="text-muted small mb-3">Choose the action you want to run on the specification:</p>

              <div class="row g-3">
                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio" value="render"
                        id="action-render">
                      <label class="form-check-label w-100" for="action-render">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-file-earmark-text me-2 text-primary"></i>
                          <div>
                            <strong>Render Specification</strong>
                            <div class="small text-muted">Generate HTML output from markdown files</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio" value="topdf"
                        id="action-topdf">
                      <label class="form-check-label w-100" for="action-topdf">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-file-earmark-pdf me-2 text-danger"></i>
                          <div>
                            <strong>Generate PDF</strong>
                            <div class="small text-muted">Create a PDF version of the specification</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio" value="todocx"
                        id="action-todocx">
                      <label class="form-check-label w-100" for="action-todocx">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-file-earmark-word me-2 text-info"></i>
                          <div>
                            <strong>Generate DOCX</strong>
                            <div class="small text-muted">Create a Word document version</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio" value="freeze"
                        id="action-freeze">
                      <label class="form-check-label w-100" for="action-freeze">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-lock me-2 text-warning"></i>
                          <div>
                            <strong>Freeze Specification</strong>
                            <div class="small text-muted">Lock the current version and commit changes</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio" value="custom-update"
                        id="action-custom">
                      <label class="form-check-label w-100" for="action-custom">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-wrench me-2 text-secondary"></i>
                          <div>
                            <strong>Custom Update</strong>
                            <div class="small text-muted">Run custom specification updates</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio"
                        value="collectExternalReferences" id="action-external">
                      <label class="form-check-label w-100" for="action-external">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-link-45deg me-2 text-success"></i>
                          <div>
                            <strong>Collect External References</strong>
                            <div class="small text-muted">Gather and process external term references</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Workflow Info -->
            <div class="alert alert-light" role="alert">
              <div class="d-flex align-items-start">
                <i class="bi bi-info-circle me-2 text-primary"></i>
                <div class="small">
                  <strong>Workflow Information:</strong><br>
                  The action will run on branch: <strong>{{ branch }}</strong><br>
                  Using workflow: <strong>menu.yml</strong>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-3 justify-content-end">
              <button @click="$router.back()" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i>
                Back
              </button>
              <button @click="triggerWorkflow" class="btn btn-warning"
                :disabled="!selectedAction || triggeringWorkflow">
                <span v-if="triggeringWorkflow">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Triggering...
                </span>
                <span v-else>
                  <i class="bi bi-play-circle me-1"></i>
                  Run {{ selectedAction ? selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1) : 'Action' }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- GitHub Actions Link -->
        <div class="text-center mt-4">
          <a :href="`https://github.com/${owner}/${repo}/actions`" target="_blank" rel="noopener"
            class="btn btn-outline-primary">
            <i class="bi bi-github me-1"></i>
            View on GitHub Actions
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

export default {
  name: 'GitHubActions',
  props: ['owner', 'repo', 'branch'],
  setup(props) {
    const route = useRoute()

    // State
    const selectedAction = ref('render')
    const actionError = ref('')
    const successMessage = ref('')
    const selectedWorkflow = ref('')
    const triggeringWorkflow = ref(false)

    // Helper function to check authentication and redirect if needed
    const checkAuthAndRedirect = (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('github_token')
        localStorage.removeItem('github_user')
        router.push('/login')
        return true
      }
      return false
    }

    // Set the workflow to always use menu.yml
    const loadWorkflows = async () => {
      selectedWorkflow.value = 'menu.yml'
    }

    // Trigger workflow function - always uses menu.yml
    const triggerWorkflow = async () => {
      try {
        triggeringWorkflow.value = true
        actionError.value = ''
        successMessage.value = ''

        const token = localStorage.getItem('github_token')
        if (!token) {
          actionError.value = 'GitHub token not found. Please log in again.'
          return
        }

        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }

        console.log(`� Triggering menu.yml workflow with action: ${selectedAction.value}`)

        // Build inputs for the menu.yml workflow
        const inputs = {
          action_type: selectedAction.value || 'render',
          repository: `${props.owner}/${props.repo}`,
          branch: props.branch,
          triggered_by: 'GitHubUI'
        }

        const dispatchData = {
          ref: props.branch,
          inputs
        }

        // Trigger the menu.yml workflow using workflow_dispatch
        await axios.post(
          `https://api.github.com/repos/${props.owner}/${props.repo}/actions/workflows/menu.yml/dispatches`,
          dispatchData,
          config
        )

        // Show success message
        successMessage.value = `Successfully triggered "${selectedAction.value}" action using menu.yml workflow`
        console.log(`✅ Successfully triggered menu.yml workflow with action "${selectedAction.value}" on branch ${props.branch}`)

      } catch (err) {
        console.error('❌ Error triggering workflow:', err)

        if (checkAuthAndRedirect(err)) return

        if (err.response?.status === 404) {
          actionError.value = 'menu.yml workflow not found. Please ensure the menu.yml workflow file exists in .github/workflows/'
        } else if (err.response?.status === 422) {
          const errorMsg = err.response?.data?.message || ''
          if (errorMsg.includes('workflow_dispatch')) {
            actionError.value = 'The menu.yml workflow does not support manual triggering. Please add "workflow_dispatch:" to the workflow\'s "on" section.'
          } else {
            actionError.value = `Cannot trigger menu.yml workflow: ${errorMsg}`
          }
        } else {
          actionError.value = 'Failed to trigger menu.yml workflow: ' + (err.response?.data?.message || err.message)
        }
      } finally {
        triggeringWorkflow.value = false
      }
    }

    onMounted(() => {
      loadWorkflows()
    })

    return {
      selectedAction,
      actionError,
      successMessage,
      selectedWorkflow,
      triggeringWorkflow,
      triggerWorkflow
    }
  }
}
</script>

<style scoped>
.form-check.card {
  border: 2px solid #dee2e6;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-check.card:has(input:checked) {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-check.card:hover {
  border-color: #adb5bd;
}

.form-check-input {
  margin-top: 0.125rem;
}

.card-body {
  cursor: pointer;
}
</style>
