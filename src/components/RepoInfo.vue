<template>
  <div>
    <i class="bi bi-github me-2"></i>
    <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
    <span class="mx-2">•</span>
    <span 
      class="badge bg-secondary branch-badge" 
      @click="$emit('branch-click')"
      role="button"
      tabindex="0"
      @keydown.enter="$emit('branch-click')"
      @keydown.space.prevent="$emit('branch-click')"
      title="Click to change branch">
      {{ branch }}
      <i class="bi bi-chevron-down ms-1"></i>
    </span>
    <span v-if="defaultBranch && branch === defaultBranch" class="badge rounded-pill bg-success ms-2">default</span>
  </div>
</template>

<script>
export default {
  name: 'RepoInfo',
  props: {
    owner: {
      type: String,
      required: true
    },
    repo: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      required: true
    },
    defaultBranch: {
      type: String,
      default: ''
    }
  },
  emits: ['branch-click']
}
</script>

<style scoped>
/**
 * Style for the branch badge to make it clickable
 * Provides visual feedback for user interaction
 */
.branch-badge {
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

/**
 * Hover state for branch badge
 * Provides visual feedback when user hovers over the badge
 */
.branch-badge:hover {
  background-color: #5a6268 !important;
  transform: translateY(-1px);
}

/**
 * Focus state for branch badge
 * Ensures keyboard accessibility with visible focus indicator
 */
.branch-badge:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/**
 * Active state for branch badge
 * Provides feedback when badge is being clicked
 */
.branch-badge:active {
  transform: translateY(0);
}
</style>
