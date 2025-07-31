<template>
  <!-- Version Update Notification Toast -->
  <div 
    v-if="hasNewVersion || debugForceShow" 
    class="version-notification-toast position-fixed"
    :class="{ 'show': hasNewVersion || debugForceShow }"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <div class="toast-content d-flex align-items-center justify-content-between p-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-arrow-up-circle-fill text-success me-2" style="font-size: 1.2rem;" aria-hidden="true"></i>
        <div>
          <div class="fw-semibold">New Version Available!</div>
          <small class="text-muted">
            Updated: {{ displayVersion?.buildDate || 'Test Version' }}
          </small>
        </div>
      </div>
      
      <div class="d-flex align-items-center gap-2">
        <button 
          @click="handleAcknowledge"
          class="btn btn-sm btn-success"
          title="Acknowledge update and reload page"
          aria-label="Acknowledge version update and reload page"
        >
          <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          Update Now
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
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useVersionCheck } from '../composables/useVersionCheck.js'

export default {
  name: 'VersionNotification',
  setup() {
    const debugForceShow = ref(false)
    const debugVersion = ref(null)
    
    const { 
      hasNewVersion, 
      newVersion, 
      dismissNotification, 
      acknowledgeUpdate 
    } = useVersionCheck()

    const displayVersion = computed(() => {
      return debugVersion.value || newVersion.value
    })

    onMounted(() => {
      console.log('🔔 VersionNotification component mounted')
      console.log('🔔 Initial state:', {
        hasNewVersion: hasNewVersion.value,
        newVersion: newVersion.value
      })

      // Listen for debug events from other components
      window.addEventListener('force-show-version-notification', (event) => {
        console.log('🚨 Received force show event:', event.detail)
        debugForceShow.value = true
        debugVersion.value = event.detail || {
          buildDate: 'Test Version',
          timestamp: new Date().toISOString()
        }
      })

      window.addEventListener('hide-version-notification', () => {
        console.log('🚨 Received hide event')
        debugForceShow.value = false
        debugVersion.value = null
      })
    })

    const handleDismiss = () => {
      if (debugForceShow.value) {
        // If this is a debug/forced notification, just hide it
        debugForceShow.value = false
        debugVersion.value = null
      } else {
        // Otherwise use normal dismiss logic
        dismissNotification()
      }
    }

    const handleAcknowledge = () => {
      if (debugForceShow.value) {
        // If this is a debug/forced notification, just hide it
        debugForceShow.value = false
        debugVersion.value = null
        console.log('🚨 Debug notification acknowledged (no reload)')
      } else {
        // Otherwise use normal acknowledge logic (which includes reload)
        acknowledgeUpdate()
      }
    }

    return {
      hasNewVersion,
      newVersion,
      debugForceShow,
      displayVersion,
      handleDismiss,
      handleAcknowledge
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
  /* Debug: make it visible even when not shown */
}

.version-notification-toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-content {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0.5rem;
}

.version-notification-toast .btn {
  transition: all 0.2s ease;
}

.version-notification-toast .btn:hover {
  transform: translateY(-1px);
}

.version-notification-toast .btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border: none;
}

.version-notification-toast .btn-success:hover {
  background: linear-gradient(135deg, #218838 0%, #1c9c7f 100%);
}

.version-notification-toast .btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

/* Animation keyframes for entrance */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  
  .toast-content {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .toast-content > div:first-child {
    align-self: flex-start;
  }
  
  .toast-content > div:last-child {
    align-self: flex-end;
  }
}
</style>
