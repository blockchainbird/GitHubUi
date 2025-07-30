<template>
  <div v-if="showWarnings" class="alert alert-warning" role="alert">
    <div class="d-flex align-items-start">
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
  props: {
    warnings: {
      type: Array,
      default: () => []
    },
    showWarnings: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
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
