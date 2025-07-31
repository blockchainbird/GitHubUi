<template>
  <!-- Enhanced Version Update Notification Toast -->
  <div 
    v-if="hasNewVersion" 
    class="version-notification-toast position-fixed"
    :class="{ 'show': hasNewVersion, 'updating': isUpdating }"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <div class="toast-content p-3">
      <!-- Main notification -->
      <div v-if="!showOptions" class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <i class="bi bi-arrow-up-circle-fill text-success me-2" style="font-size: 1.2rem;" aria-hidden="true"></i>
          <div>
            <div class="fw-semibold">New Version Available!</div>
            <small class="text-muted">
              Updated: {{ newVersion?.buildDate }}
            </small>
          </div>
        </div>
        
        <div class="d-flex align-items-center gap-2">
          <button 
            @click="showUpdateOptions"
            class="btn btn-sm btn-success"
            title="Update options"
            aria-label="Show update options"
          >
            <i class="bi bi-arrow-up-circle" aria-hidden="true"></i>
            Update
          </button>
          <button 
            @click="handleDismiss"
            class="btn btn-sm btn-outline-secondary"
            title="Dismiss notification"
            aria-label="Dismiss version notification"
          >
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Update options -->
      <div v-if="showOptions" class="update-options">
        <div class="mb-3">
          <div class="fw-semibold mb-2">How would you like to update?</div>
          <div class="d-grid gap-2">
            <button 
              @click="updateNow"
              class="btn btn-sm btn-success"
              :disabled="isUpdating"
            >
              <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
              <span v-if="!isUpdating">Reload Page Now</span>
              <span v-else>
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                Reloading...
              </span>
            </button>
            <button 
              @click="updateLater"
              class="btn btn-sm btn-outline-primary"
              :disabled="isUpdating"
            >
              <i class="bi bi-clock" aria-hidden="true"></i>
              Update on Next Visit
            </button>
          </div>
        </div>
        <div class="d-flex justify-content-between">
          <button 
            @click="goBack"
            class="btn btn-sm btn-outline-secondary"
            :disabled="isUpdating"
          >
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            Back
          </button>
          <button 
            @click="handleDismiss"
            class="btn btn-sm btn-outline-secondary"
            :disabled="isUpdating"
          >
            <i class="bi bi-x" aria-hidden="true"></i>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useVersionCheck } from '../composables/useVersionCheck.js'

export default {
  name: 'EnhancedVersionNotification',
  setup() {
    const showOptions = ref(false)
    const isUpdating = ref(false)
    
    const { 
      hasNewVersion, 
      newVersion, 
      dismissNotification, 
      acknowledgeUpdate 
    } = useVersionCheck({ autoReloadOnAcknowledge: false }) // Disable auto-reload

    const handleDismiss = () => {
      showOptions.value = false
      dismissNotification()
    }

    const showUpdateOptions = () => {
      showOptions.value = true
    }

    const goBack = () => {
      showOptions.value = false
    }

    const updateNow = async () => {
      isUpdating.value = true
      acknowledgeUpdate()
      
      // Show loading state briefly, then reload
      setTimeout(() => {
        window.location.reload()
      }, 800)
    }

    const updateLater = () => {
      acknowledgeUpdate() // Mark as seen without reloading
      handleDismiss()
    }

    return {
      hasNewVersion,
      newVersion,
      showOptions,
      isUpdating,
      handleDismiss,
      showUpdateOptions,
      goBack,
      updateNow,
      updateLater
    }
  }
}
</script>

<style scoped>
.version-notification-toast {
  top: 80px;
  right: 20px;
  z-index: 1055;
  min-width: 320px;
  max-width: 400px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease-in-out;
}

.version-notification-toast.show {
  opacity: 1;
  transform: translateX(0);
}

.version-notification-toast.updating {
  pointer-events: none;
  opacity: 0.8;
}

.toast-content {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0.5rem;
}

.update-options {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.version-notification-toast .btn {
  transition: all 0.2s ease;
}

.version-notification-toast .btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.version-notification-toast .btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border: none;
}

.version-notification-toast .btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838 0%, #1c9c7f 100%);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .version-notification-toast {
    top: 70px;
    right: 10px;
    left: 10px;
    min-width: unset;
    max-width: unset;
  }
}
</style>
