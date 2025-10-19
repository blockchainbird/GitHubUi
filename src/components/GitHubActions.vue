<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i class="bi bi-play-circle me-2"></i>
            GitHub Actions
          </h2>
          <RepoInfo :owner="owner" :repo="repo" :branch="branch" />
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
              <div style="white-space: pre-line;">{{ actionError }}</div>
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="alert alert-success" role="alert">
              <i class="bi bi-check-circle me-2"></i>
              {{ successMessage }}
            </div>

            <!-- Workflow Status -->
            <div v-if="workflowStatus" class="alert" :class="{
              'alert-info': workflowStatus.status === 'queued' || workflowStatus.status === 'in_progress',
              'alert-success': workflowStatus.conclusion === 'success',
              'alert-danger': workflowStatus.conclusion === 'failure' || workflowStatus.conclusion === 'cancelled',
              'alert-warning': workflowStatus.conclusion === 'timed_out' || workflowStatus.conclusion === 'action_required'
            }" role="alert">
              <div class="d-flex align-items-start">
                <div v-if="workflowStatus.status !== 'completed'" class="spinner-border spinner-border-sm me-3 mt-1" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <i v-else-if="workflowStatus.conclusion === 'success'" class="bi bi-check-circle-fill me-2"></i>
                <i v-else-if="workflowStatus.conclusion === 'failure'" class="bi bi-x-circle-fill me-2"></i>
                <i v-else class="bi bi-exclamation-triangle-fill me-2"></i>
                <div class="flex-grow-1">
                  <strong>Workflow Status: {{ formatStatus(workflowStatus.status) }}</strong>
                  <div v-if="workflowStatus.conclusion" class="small">
                    Result: {{ formatConclusion(workflowStatus.conclusion) }}
                  </div>
                  <div class="small text-muted">
                    {{ workflowStatus.name || 'menu.yml' }}
                  </div>
                  <div v-if="workflowStatus.html_url" class="mt-2">
                    <a :href="workflowStatus.html_url" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-box-arrow-up-right me-1"></i>
                      View Workflow Run
                    </a>
                  </div>
                </div>
              </div>
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
                <!-- <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio" value="render"
                        id="action-render">
                      <label class="form-check-label w-100" for="action-render">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-file-earmark-text me-2 text-primary"></i>
                          <div>
                            <strong>Render Specification (no external references)</strong>
                            <div class="small text-muted">Create specification without external references</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div> -->

                <div class="col-md-6">
                  <div class="form-check card h-100">
                    <div class="card-body">
                      <input v-model="selectedAction" class="form-check-input" type="radio"
                        value="collectExternalReferences" id="action-external">
                      <label class="form-check-label w-100" for="action-external">
                        <div class="d-flex align-items-start">
                          <i class="bi bi-link-45deg me-2 text-success"></i>
                          <div>
                            <strong>Render Specification</strong>
                            <div class="small text-muted">Create specification from all files</div>
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

                <!-- <div class="col-md-6">
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
                </div> -->

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

                <!-- <div class="col-md-6">
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
 -->

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
              <button @click="triggerWorkflow" class="btn btn-primary"
                :disabled="!selectedAction || triggeringWorkflow">
                <span v-if="triggeringWorkflow">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Triggering...
                </span>
                <span v-else>
                  <i class="bi bi-play-circle me-1"></i>
                  <template v-if="selectedAction === 'collectExternalReferences'">Render
                      Specification</template>
                  <template v-else-if="selectedAction === 'freeze'">Freeze Specification</template>
                  <template v-else-if="selectedAction === 'todocx'">Generate DOCX</template>
                  <template v-else>Action</template>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import RepoInfo from './RepoInfo.vue'
import { secureTokenManager } from '../utils/secureTokenManager.js'

export default {
  name: 'GitHubActions',
  components: { RepoInfo },
  props: ['owner', 'repo', 'branch'],
  setup(props) {
    const route = useRoute()

    // State
    const selectedAction = ref('render')
    const actionError = ref('')
    const successMessage = ref('')
    const selectedWorkflow = ref('')
    const triggeringWorkflow = ref(false)
    const workflowStatus = ref(null)
    const pollingInterval = ref(null)

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

    /**
     * Formats workflow status for display
     *
     * 1. Real-time Status Updates
     * - After triggering a workflow, the app automatically finds and tracks it
     * - Polls the GitHub API every 5 seconds to check status
     * - Displays current status: Queued → In Progress → Completed
     *
     * 2. Visual Feedback
     *
     * - Info alert (blue) for queued/in-progress workflows with spinner
     * - Success alert (green) for successful completion
     * - Danger alert (red) for failures
     * - Warning alert (yellow) for timeouts or action required
     *
     * 3. Smart Workflow Detection
     *
     * - Records exact trigger time when workflow is dispatched
     * - Retries up to 6 times with 3-second delays to find new runs
     * - Only tracks runs created after the trigger time (prevents false positives)
     *
     * 4. Safety Features
     *
     * - Auto-stop: Polling stops when workflow completes
     * - Timeout: Maximum 10 minutes of polling (120 polls × 5 seconds)
     * - Cleanup: Automatically stops polling when component unmounts
     * - Error handling: Gracefully handles API errors
     *
     * 5. User Experience
     *
     * - Shows workflow name and status
     * - Displays final result (Success/Failed/Cancelled, etc.)
     * - Provides "View Workflow Run" button linking to GitHub
     *
     * 🎯 How It Works:
     * - User triggers workflow → Records trigger time
     * - Retries finding new runs → Starts polling once found
     * - Every 5 seconds → Checks and updates status
     * - On completion → Shows final result with link to GitHub
     *
     * @param {string} status - The workflow status
     * @returns {string} Formatted status string
     */
    const formatStatus = (status) => {
      const statusMap = {
        'queued': 'Queued',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'waiting': 'Waiting'
      }
      return statusMap[status] || status
    }

    /**
     * Formats workflow conclusion for display
     * @param {string} conclusion - The workflow conclusion
     * @returns {string} Formatted conclusion string
     */
    const formatConclusion = (conclusion) => {
      const conclusionMap = {
        'success': 'Success',
        'failure': 'Failed',
        'cancelled': 'Cancelled',
        'timed_out': 'Timed Out',
        'action_required': 'Action Required',
        'neutral': 'Neutral',
        'skipped': 'Skipped'
      }
      return conclusionMap[conclusion] || conclusion
    }

    /**
     * Finds the most recent workflow run for the current branch
     * Retries multiple times to find a newly created run
     * @param {object} config - Axios config with auth headers
     * @param {Date} triggerTime - When the workflow was triggered
     * @returns {object|null} The workflow run object or null
     */
    const findRecentWorkflowRun = async (config, triggerTime) => {
      const maxAttempts = 6 // Try 6 times
      const delayBetweenAttempts = 3000 // 3 seconds between attempts
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`🔍 Attempt ${attempt}/${maxAttempts} to find workflow run...`)
          
          // Get recent workflow runs for menu.yml
          const response = await axios.get(
            `https://api.github.com/repos/${props.owner}/${props.repo}/actions/workflows/menu.yml/runs`,
            {
              ...config,
              params: {
                branch: props.branch,
                per_page: 10
              }
            }
          )

          const runs = response.data.workflow_runs
          if (runs && runs.length > 0) {
            // Find runs created after we triggered the workflow
            const newRuns = runs.filter(run => {
              const createdAt = new Date(run.created_at)
              return createdAt >= triggerTime
            })
            
            if (newRuns.length > 0) {
              console.log(`✅ Found new workflow run #${newRuns[0].id}`)
              return newRuns[0]
            }
          }
          
          // If not the last attempt, wait before trying again
          if (attempt < maxAttempts) {
            console.log(`⏳ No new run found yet, waiting ${delayBetweenAttempts}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts))
          }
        } catch (err) {
          console.error(`Error finding workflow run (attempt ${attempt}):`, err)
        }
      }
      
      console.warn('⚠️ Could not find new workflow run after all attempts')
      return null
    }

    /**
     * Polls the workflow status until completion or timeout
     * @param {number} runId - The workflow run ID
     * @param {object} config - Axios config with auth headers
     */
    const pollWorkflowStatus = async (runId, config) => {
      let pollCount = 0
      const maxPolls = 120 // Poll for up to 10 minutes (120 * 5 seconds)
      
      const poll = async () => {
        try {
          pollCount++
          
          const response = await axios.get(
            `https://api.github.com/repos/${props.owner}/${props.repo}/actions/runs/${runId}`,
            config
          )

          const run = response.data
          workflowStatus.value = {
            status: run.status,
            conclusion: run.conclusion,
            name: run.name,
            html_url: run.html_url
          }

          console.log(`📊 Workflow status: ${run.status}, conclusion: ${run.conclusion}`)

          // Stop polling if workflow is completed or max polls reached
          if (run.status === 'completed' || pollCount >= maxPolls) {
            if (pollingInterval.value) {
              clearInterval(pollingInterval.value)
              pollingInterval.value = null
            }
            
            if (pollCount >= maxPolls && run.status !== 'completed') {
              console.warn('⚠️ Polling timeout reached')
            }
          }
        } catch (err) {
          console.error('Error polling workflow status:', err)
          // Stop polling on error
          if (pollingInterval.value) {
            clearInterval(pollingInterval.value)
            pollingInterval.value = null
          }
        }
      }

      // Start polling every 5 seconds
      await poll() // Poll immediately
      pollingInterval.value = setInterval(poll, 5000)
    }

    /**
     * Stops polling when component is unmounted
     */
    const stopPolling = () => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
        pollingInterval.value = null
      }
    }

    // Trigger workflow function - always uses menu.yml
    const triggerWorkflow = async () => {
      try {
        triggeringWorkflow.value = true
        actionError.value = ''
        successMessage.value = ''

        const token = secureTokenManager.getToken()
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

        // Record when we triggered the workflow
        const triggerTime = new Date()
        
        // Show success message
        successMessage.value = `Successfully triggered "${selectedAction.value}" action using menu.yml workflow`
        console.log(`✅ Successfully triggered menu.yml workflow with action "${selectedAction.value}" on branch ${props.branch}`)

        // Find and poll the workflow run (this will retry internally)
        const run = await findRecentWorkflowRun(config, triggerTime)
        if (run) {
          console.log(`🔍 Found workflow run #${run.id}, starting status polling...`)
          await pollWorkflowStatus(run.id, config)
        } else {
          console.warn('⚠️ Could not find the workflow run to track')
          successMessage.value = `Workflow triggered successfully. Visit GitHub Actions to see the status.`
        }

      } catch (err) {
        console.error('❌ Error triggering workflow:', err)

        if (checkAuthAndRedirect(err)) return

        if (err.response?.status === 404) {
          actionError.value = 'menu.yml workflow not found. Please ensure the menu.yml workflow file exists in .github/workflows/'
        } else if (err.response?.status === 422) {
          const errorData = err.response?.data
          const errorMsg = errorData?.message || ''

          console.log('422 Error details:', errorData)

          // Check for specific workflow_dispatch error
          if (errorMsg.toLowerCase().includes('workflow_dispatch') ||
            errorMsg.toLowerCase().includes('does not support') ||
            errorData?.errors?.some(e => e.message?.includes('workflow_dispatch'))) {
            actionError.value = `The menu.yml workflow does not support manual triggering. 
            
To fix this, add the following to the top of your .github/workflows/menu.yml file:

on:
  workflow_dispatch:
    inputs:
      action_type:
        description: 'Action to perform'
        required: true
        default: 'render'
        type: choice
        options:
          - render
          - topdf
          - todocx
          - freeze
          - custom-update
          - collectExternalReferences
      repository:
        description: 'Repository'
        required: false
      branch:
        description: 'Branch'
        required: false
      triggered_by:
        description: 'Triggered by'
        required: false`
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

    // Cleanup polling on component unmount
    onUnmounted(() => {
      stopPolling()
    })

    return {
      selectedAction,
      actionError,
      successMessage,
      selectedWorkflow,
      triggeringWorkflow,
      workflowStatus,
      triggerWorkflow,
      formatStatus,
      formatConclusion
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
