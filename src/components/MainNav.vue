<template>
  <nav class="navbar navbar-expand-lg main-nav">
    <div class="container-fluid">
      <!-- Brand/Logo -->
      <span class="navbar-brand mb-0 h1 d-flex align-items-center">
        <img src="/assets/logo.svg" alt="Spec-Up-T Logo" style="height: 2rem; width: auto; margin-right: 0.5rem;" />
        Spec-Up-T
      </span>

      <!-- Hamburger button for mobile -->
      <button class="navbar-toggler" type="button" @click="toggleNavbar" :aria-expanded="isNavbarOpen"
        aria-controls="navbarNav" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Collapsible content -->
      <div class="collapse navbar-collapse" :class="{ show: isNavbarOpen }" id="navbarNav">
        <div class="navbar-nav ms-auto">
          <button @click="navigateAndClose('/home')" class="nav-link btn btn-link">
            <i class="bi bi-house"></i>
            Home
          </button>
          <button @click="navigateAndClose('/create-project')" class="nav-link btn btn-link">
            <i class="bi bi-plus-circle"></i>
            Create Project
          </button>
          <button v-if="showRepoRelatedButtons" @click="navigateToAdminAndClose" class="nav-link btn btn-link">
            <i class="bi bi-gear"></i>
            Admin
          </button>
          <button v-if="showRepoRelatedButtons"
            @click="navigateAndClose(`/external-specs/${route.params.owner}/${route.params.repo}/${route.params.branch}`)"
            class="nav-link btn btn-link" title="Manage External Specifications">
            <i class="bi bi-link-45deg"></i>
            External Specs
          </button>
          <a v-if="showRepoRelatedButtons" :href="githubRepoUrl" target="_blank" rel="noopener" class="nav-link"
            title="View Repository on GitHub" @click="closeNavbar">
            <i class="bi bi-github"></i>
            View on GitHub
          </a>
          <button v-if="showRepoRelatedButtons" @click="navigateToHealthCheckAndClose" class="nav-link btn btn-link"
            title="Run Health Check">
            <i class="bi bi-heart-pulse"></i>
            Health Check
          </button>
          <button @click="showModalAndClose" class="nav-link btn btn-link">
            <i class="bi bi-info-circle"></i>
            About
          </button>
          <a href="https://blockchainbird.github.io/spec-up-t-website/docs/tools/spec-up-t-editor-user-guide/"
            target="_blank" rel="noopener" class="nav-link" @click="closeNavbar">
            <i class="bi bi-box-arrow-up-right"></i>
            Help
          </a>
          <button @click="navigateAndClose('/settings')" class="nav-link btn btn-link" title="Application Settings">
            <i class="bi bi-gear"></i>
            Settings
          </button>
          <!-- API Rate Limit Indicator -->
          <div class="nav-item d-flex align-items-center">
            <RateLimitIndicator />
          </div>
        </div>
      </div>
    </div>
    <Modal v-if="showModal" @close="showModal = false">
      <template #header>
        <h2>About Spec-Up-T Editor</h2>
      </template>
      <template #body>
        <p>
          <strong>Spec-Up-T Editor</strong> is a web-based tool designed to help users create and manage specifications
          in a
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
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Modal from './Modal.vue';
import RateLimitIndicator from './RateLimitIndicator.vue';

export default {
  name: 'MainNav',
  components: { Modal, RateLimitIndicator },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isNavbarOpen = ref(false);

    const showRepoRelatedButtons = computed(() => {
      // Show health check button only when we have repository context
      return route.params.owner && route.params.repo && route.params.branch;
    });

    const githubRepoUrl = computed(() => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        return `https://github.com/${route.params.owner}/${route.params.repo}/tree/${route.params.branch}`;
      }
      return '';
    });

    const toggleNavbar = () => {
      isNavbarOpen.value = !isNavbarOpen.value;
    };

    const closeNavbar = () => {
      isNavbarOpen.value = false;
    };

    const navigateAndClose = (path) => {
      router.push(path);
      closeNavbar();
    };

    const navigateToHealthCheck = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/health-check/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
    };

    const navigateToHealthCheckAndClose = () => {
      navigateToHealthCheck();
      closeNavbar();
    };

    const navigateToAdmin = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/admin/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
    };

    const navigateToAdminAndClose = () => {
      navigateToAdmin();
      closeNavbar();
    };

    // Close navbar when clicking outside on mobile
    const handleClickOutside = (event) => {
      if (isNavbarOpen.value && !event.target.closest('.navbar')) {
        closeNavbar();
      }
    };

    // Close navbar on window resize to larger screen
    const handleResize = () => {
      if (window.innerWidth >= 992 && isNavbarOpen.value) { // lg breakpoint
        closeNavbar();
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    });

    // Get build info from Vite's define
    const buildInfo = __BUILD_INFO__;

    return {
      route,
      showRepoRelatedButtons,
      githubRepoUrl,
      isNavbarOpen,
      toggleNavbar,
      closeNavbar,
      navigateAndClose,
      navigateToHealthCheck,
      navigateToHealthCheckAndClose,
      navigateToAdmin,
      navigateToAdminAndClose,
      buildInfo
    };
  },
  data() {
    return {
      showModal: false
    };
  },
  methods: {
    showModalAndClose() {
      this.showModal = true;
      this.closeNavbar();
    }
  }
};
</script>

<style scoped>
.main-nav {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: 0.5rem 0;
}

.navbar-brand {
  font-weight: 600;
  color: #495057;
}

.navbar-brand i {
  color: #0d6efd;
  margin-right: 0.5rem;
}

/* Custom navbar toggler */
.navbar-toggler {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2833, 37, 41, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

/* Navigation items styling */
.navbar-nav .nav-link {
  color: #495057;
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  text-decoration: none;
  border: none;
  background: transparent;
}

.navbar-nav .nav-link:hover {
  background-color: #e9ecef;
  color: #0d6efd;
}

.navbar-nav .nav-link i {
  margin-right: 0.5rem;
  font-size: 1rem;
}

/* Button-style nav links */
.navbar-nav .btn.nav-link {
  border: none;
  background: transparent;
  font-size: inherit;
  line-height: inherit;
}

.navbar-nav .btn.nav-link:focus {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Mobile-specific styles */
@media (max-width: 991.98px) {
  .navbar-nav {
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    margin-top: 1rem;
  }
  
  .navbar-nav .nav-link {
    margin: 0.25rem 0;
    padding: 0.75rem 1rem;
    border: 1px solid #dee2e6;
    background-color: #fff;
  }
  
  .navbar-nav .nav-link:hover {
    background-color: #f8f9fa;
    border-color: #0d6efd;
  }

  .navbar-nav .nav-item {
    margin: 0.25rem 0;
    padding: 0.5rem 1rem;
    justify-content: center;
  }

  /* Animation for collapse - mobile only */
  .navbar-collapse {
    transition: all 0.3s ease;
  }

  .navbar-collapse:not(.show) {
    max-height: 0;
    overflow: hidden;
  }

  .navbar-collapse.show {
    max-height: 500px;
  }
}

/* Desktop-specific styles */
@media (min-width: 992px) {
  .navbar-nav {
    flex-direction: row;
  }
  
  .navbar-nav .nav-item {
    margin-left: 0.5rem;
  }
  
  /* Ensure navbar is always visible on desktop */
  .navbar-collapse {
    display: flex !important;
    max-height: none;
    overflow: visible;
  }
}
</style>
