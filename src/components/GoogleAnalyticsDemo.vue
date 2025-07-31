<template>
  <div class="analytics-demo-card p-3 border rounded mb-3">
    <h5 class="mb-3">
      <i class="bi bi-bar-chart"></i>
      Google Analytics Demo
    </h5>

    <div class="row">
      <div class="col-md-6">
        <div class="mb-3">
          <h6>Analytics Status</h6>
          <div class="alert" :class="analyticsStatusClass" role="alert">
            <i :class="analyticsIcon"></i>
            {{ analyticsStatus }}
          </div>
        </div>

        <div class="mb-3">
          <h6>Test Custom Event</h6>
          <button @click="trackCustomEvent" class="btn btn-primary btn-sm me-2" :disabled="!isAnalyticsEnabled()">
            <i class="bi bi-cursor-fill"></i>
            Track Button Click
          </button>
          <small class="text-muted d-block mt-1">
            Tracks: custom_button_click event
          </small>
        </div>
      </div>

      <div class="col-md-6">
        <div class="mb-3">
          <h6>File Operation Tracking</h6>
          <div class="btn-group-vertical d-grid gap-1">
            <button @click="trackFileView" class="btn btn-outline-secondary btn-sm" :disabled="!isAnalyticsEnabled()">
              <i class="bi bi-eye"></i>
              Track File View
            </button>
            <button @click="trackFileEdit" class="btn btn-outline-warning btn-sm" :disabled="!isAnalyticsEnabled()">
              <i class="bi bi-pencil"></i>
              Track File Edit
            </button>
            <button @click="trackFileSave" class="btn btn-outline-success btn-sm" :disabled="!isAnalyticsEnabled()">
              <i class="bi bi-check-circle"></i>
              Track File Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="alert alert-info" role="alert">
      <small>
        <strong>Note:</strong>
        {{ isAnalyticsEnabled()
          ? 'Events are being tracked. Open browser dev tools → Network tab to see requests to Google Analytics.'
          : 'Set VITE_GA_MEASUREMENT_ID in your .env file to enable tracking.'
        }}
      </small>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics.js'

export default {
  name: 'GoogleAnalyticsDemo',
  setup() {
    const { trackEvent, trackFileOperation, isAnalyticsEnabled } = useGoogleAnalytics()

    const analyticsStatus = computed(() => {
      return isAnalyticsEnabled()
        ? 'Google Analytics is enabled and tracking events'
        : 'Google Analytics is disabled (no measurement ID configured)'
    })

    const analyticsStatusClass = computed(() => {
      return isAnalyticsEnabled()
        ? 'alert-success'
        : 'alert-warning'
    })

    const analyticsIcon = computed(() => {
      return isAnalyticsEnabled()
        ? 'bi bi-check-circle-fill me-2'
        : 'bi bi-exclamation-triangle-fill me-2'
    })

    const trackCustomEvent = () => {
      trackEvent('custom_button_click', {
        button_type: 'demo',
        page: 'home',
        timestamp: new Date().toISOString()
      })

      // Show feedback
      alert('Custom event tracked! Check browser dev tools → Network tab for Google Analytics requests.')
    }

    const trackFileView = () => {
      trackFileOperation('view', 'markdown')
      alert('File view event tracked!')
    }

    const trackFileEdit = () => {
      trackFileOperation('edit', 'json')
      alert('File edit event tracked!')
    }

    const trackFileSave = () => {
      trackFileOperation('save', 'typescript')
      alert('File save event tracked!')
    }

    return {
      analyticsStatus,
      analyticsStatusClass,
      analyticsIcon,
      trackCustomEvent,
      trackFileView,
      trackFileEdit,
      trackFileSave,
      isAnalyticsEnabled
    }
  }
}
</script>

<style scoped>
.analytics-demo-card {
  background-color: var(--bs-gray-50);
  border: 1px solid var(--bs-gray-200);
}

.btn-group-vertical .btn {
  text-align: left;
}
</style>
