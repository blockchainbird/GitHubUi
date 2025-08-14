<template>
  <div v-if="showWarnings && !dismissed" class="alert alert-warning alert-dismissible position-relative" role="alert">
    <button
      type="button"
      class="btn-close position-absolute top-0 end-0 m-2"
      aria-label="Close"
      title="Dismiss"
      @click="handleClose"
    ></button>
    <div class="d-flex align-items-start pe-4">
      <i class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0 mt-1"></i>
      <div>
        <strong>Content Validation Issues:</strong>
        <ul class="mb-0 mt-2">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>
    </div>
  </div>
  
</template>

<script>
export default {
  name: 'ContentValidationAlert',
  emits: ['close', 'update:showWarnings'],
  props: {
    warnings: {
      type: Array,
      default: () => []
    },
    showWarnings: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dismissed: false
    }
  },
  watch: {
    showWarnings(newVal) {
      // Reset dismissal when new warnings are shown
      if (newVal) this.dismissed = false
    }
  },
  methods: {
    handleClose() {
      this.dismissed = true
      // Let parent react if needed (supports both a custom close event and v-model style)
      this.$emit('close')
      this.$emit('update:showWarnings', false)
    }
  }
}
</script>

<style scoped>
.alert-warning {
  position: fixed !important;
  bottom: 0em;
  left: 1em;
  z-index: 1;
}

.alert-warning ul {
  padding-left: 1.2rem;
}

.alert-warning li {
  margin-bottom: 0.25rem;
}

.alert-warning li:last-child {
  margin-bottom: 0;
}


</style>
