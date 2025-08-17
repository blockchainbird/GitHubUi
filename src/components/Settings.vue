<template>
  <div class="container mt-3">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10">
        <div class="card">
          <div class="card-header d-flex align-items-center">
            <i class="bi bi-gear me-2"></i>
            <h4 class="mb-0">Settings</h4>
          </div>
          <div class="card-body">





            <div class="settings-section">
              <h5 class="section-title">
                <i class="bi bi-person me-2"></i>
                Usertype
              </h5>
              <p class="text-muted mb-3">
                Choose between Basic and Advanced user modes.
              </p>

              <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <strong>Set the user type</strong>
                  <div class="text-muted small">
                    Advanced users will have access to additional features and settings.
                  </div>
                </div>

                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="advancedUserSwitch" v-model="isAdvancedUser">
                  <label class="form-check-label" for="advancedUserSwitch">Enable Advanced User Mode</label>
                </div>
              </div>




              <hr class="mt-5">

              <h5 class="section-title">
                <i class="bi bi-database me-2"></i>
                Storage Management
              </h5>
              <p class="text-muted mb-3">
                Clear stored application data to resolve issues after updates.
              </p>


              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <strong>Clear All Local Data</strong>
                  <div class="text-muted small">
                    This will remove all cached data, preferences, and login information.
                  </div>
                </div>
                <button @click="clearLocalStorage" class="btn btn-outline-danger" :disabled="isClearing">
                  <i class="bi bi-trash3" v-if="!isClearing"></i>
                  <div class="spinner-border spinner-border-sm" role="status" v-if="isClearing">
                    <span class="visually-hidden">Clearing...</span>
                  </div>
                  {{ isClearing ? 'Clearing...' : 'Clear Data' }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal fade" id="confirmClearModal" tabindex="-1" aria-labelledby="confirmClearModalLabel"
      aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="confirmClearModalLabel">
              <i class="bi bi-exclamation-triangle text-warning me-2"></i>
              Confirm Clear Data
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to clear all local data?</p>
            <p class="text-muted small">
              This action will:
            </p>
            <ul class="text-muted small">
              <li>Remove all cached repository data</li>
              <li>Clear your login session</li>
              <li>Reset all application preferences</li>
            </ul>
            <p class="text-warning small mb-0">
              <i class="bi bi-info-circle me-1"></i>
              You will need to log in again after this action.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="confirmClearStorage">
              <i class="bi bi-trash3 me-1"></i>
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdvancedUser } from '../composables/useAdvancedUser.js'

export default {
  name: 'Settings',
  setup() {
    const router = useRouter()
    const isClearing = ref(false)

    // Advanced User toggle via shared composable
    const { isAdvancedUser } = useAdvancedUser()

    const clearLocalStorage = () => {
      const modal = new bootstrap.Modal(document.getElementById('confirmClearModal'))
      modal.show()
    }

    const confirmClearStorage = async () => {
      isClearing.value = true
      try {
        // Clear all localStorage
        localStorage.clear()
        // Small delay for user feedback
        await new Promise(resolve => setTimeout(resolve, 500))
        // Close modal
        const modalElement = document.getElementById('confirmClearModal')
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
        modal.hide()
        // Redirect to login page
        router.push('/login')
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      } finally {
        isClearing.value = false
      }
    }

    return {
      isClearing,
      clearLocalStorage,
      confirmClearStorage,
      isAdvancedUser
    }
  }
}
</script>

<style scoped>
.settings-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  color: #495057;
  margin-bottom: 1rem;
}

.btn-outline-danger:disabled {
  opacity: 0.6;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>
