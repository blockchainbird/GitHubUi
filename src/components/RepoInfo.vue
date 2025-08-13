<template>
    <!-- Repository Info Row -->
    <!-- <div class=" "> -->
        <i class="bi bi-github me-2"></i>
        <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
        <span class="mx-2">•</span>
        <span class="badge bg-secondary">{{ branch }}</span>
    <!-- </div> -->
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
    }
  }
}
</script>
