<template>
  <nav class="main-nav">
    <button @click="$router.push('/home')" class="btn btn-outline-secondary">
      <i class="bi bi-house"></i>
      Home
    </button>
    <button @click="showModal = true" class="ms-3 btn btn-outline-secondary">
      <i class="bi bi-info-circle"></i>
      About</button>
    <a href="https://blockchainbird.github.io/spec-up-t-website/" target="_blank" rel="noopener"
      class="ms-3 btn btn-outline-secondary">
      <i class="bi bi-box-arrow-up-right"></i>
      Documentation
    </a>
    <button v-if="showRepoRelatedButtons"
      @click="$router.push(`/external-specs/${route.params.owner}/${route.params.repo}/${route.params.branch}`)"
      class="ms-3 btn btn-outline-primary me-2" title="Manage External Specifications">
      <i class="bi bi-link-45deg"></i>
      External Specs
    </button>

    <button v-if="showRepoRelatedButtons" @click="navigateToHealthCheck" class="ms-3 btn btn-outline-success"
      title="Run Health Check">
      <i class="bi bi-heart-pulse"></i>
      Health Check
    </button>
    <Modal v-if="showModal" @close="showModal = false">
      <template #header>
        <h2>About Spec-Up-T Editor</h2>
      </template>
      <template #body>
        <p>
          <strong>Spec-Up-T Editor</strong> is a web-based tool designed to help users create and manage specifications in a
          user-friendly manner. It provides an intuitive interface for editing, validating, and visualizing
          specifications, making it easier for teams to collaborate and maintain their documentation.
        </p>
        <ul style="font-size: 0.95em; margin-bottom: 0.5em;">
          <li>
            <a href="https://github.com/blockchainbird/GitHubUi" target="_blank" rel="noopener">Repository for this
              web-app</a>
          </li>
          <li>
            <a href="https://github.com/blockchainbird/spec-up-t" target="_blank" rel="noopener">Repository for
              Spec-Up-T</a>
          </li>
          <li>
            <a href="https://blockchainbird.github.io/spec-up-t-website/" target="_blank" rel="noopener">Spec-Up-T
              documentation website</a>
          </li>
        </ul>
        <p style="font-size: 0.9em; color: #888;">
          <a href="https://blockchainbird.github.io/spec-up-t-website/docs/introduction/how-it-came-to-be/"
            target="_blank" rel="noopener">Read more</a>
        </p>
        <div class="build-info mt-3 pt-3 border-top">
          <small class="text-muted">
            <strong>Build Date:</strong> {{ buildInfo.buildDate }}
          </small>
        </div>
      </template>
    </Modal>
  </nav>
</template>

<script>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Modal from './Modal.vue';

export default {
  name: 'MainNav',
  components: { Modal },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const showRepoRelatedButtons = computed(() => {
      // Show health check button only when we have repository context
      return route.params.owner && route.params.repo && route.params.branch;
    });

    const navigateToHealthCheck = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/health-check/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
    };

    // Get build info from Vite's define
    const buildInfo = __BUILD_INFO__;

    return {
      route,
      showRepoRelatedButtons,
      navigateToHealthCheck,
      buildInfo
    };
  },
  data() {
    return {
      showModal: false
    };
  }
};
</script>

<style scoped>
.main-nav {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}
</style>
