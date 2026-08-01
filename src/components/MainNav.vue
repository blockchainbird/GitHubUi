<template>
  <nav class="navbar navbar-expand-lg main-nav sticky-top bg-light" role="navigation" aria-label="Main">
    <div class="container">
      <!-- Brand/Logo -->
      <span class="navbar-brand mb-0 h1 d-flex align-items-center">
        <img src="/assets/logo.svg" alt="Spec-Up-T Logo" style="height: 2rem; width: auto; margin-right: 0.5rem;" />
        Spec-Up-T Editor
      </span>

      <!-- Hamburger button for mobile -->
      <button class="navbar-toggler" type="button" @click="toggleNavbar" :aria-expanded="isNavbarOpen"
        aria-controls="navbarNav" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Collapsible content -->
      <div class="collapse navbar-collapse" :class="{ show: isNavbarOpen }" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <!-- Home -->
          <li class="nav-item">
            <button @click="navigateAndClose('/home')"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/home') }]">
              <i class="bi bi-house"></i>
              Home
            </button>
          </li>

          <!-- Explorer -->
          <li v-if="showRepoRelatedButtons" class="nav-item">
            <button @click="navigateToFilesAndClose"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/files') }]" title="Navigate to Files">
              <i class="bi bi-folder"></i>
              Explorer
            </button>
          </li>

          <!-- Render -->
          <li v-if="showRepoRelatedButtons" class="nav-item">
            <button @click="navigateToActionsAndClose"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/actions') }]"
              title="Run GitHub Actions">
              <i class="bi bi-play-circle"></i>
              Render
            </button>
          </li>

          <!-- View -->
          <li v-if="showRepoRelatedButtons" class="nav-item">
            <button @click="navigateToViewAndClose"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/view') || isViewSectionActive }]"
              title="View options">
              <i class="bi bi-eye"></i>
              View
            </button>
          </li>

          <!-- Config -->
          <li v-if="showRepoRelatedButtons" class="nav-item">
            <button @click="navigateToConfigAndClose"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/config') || isConfigSectionActive }]"
              title="Configuration options">
              <i class="bi bi-sliders"></i>
              Config
            </button>
          </li>

          <!-- Help -->
          <li class="nav-item">
            <button @click="navigateAndClose('/help')"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/help') }]"
              title="Help and resources">
              <i class="bi bi-question-circle"></i>
              Help
            </button>
          </li>

          <!-- Sound Toggle Button -->
          <li class="nav-item d-flex align-items-center me-2">
            <button v-tooltip :title="isSoundEnabled ? 'Turn sound off' : 'Turn sound on'" @click="toggleSound"
              class="btn btn-outline-secondary btn-sm">
              <i :class="isSoundEnabled ? 'bi bi-volume-up' : 'bi bi-volume-mute'"></i>
            </button>
          </li>

          <!-- Authentication UI -->
          <li v-if="isAuthenticated" class="nav-item d-flex align-items-center ms-2">
            <div v-if="isAuthenticated" class="d-flex align-items-center">
              <span class="visually-hidden">{{ user.login }}</span>
              <button :title="user.login" @click="handleLogout" class="btn btn-outline-primary btn-sm">
                <i class="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
            <div v-else class="d-flex align-items-center">
              <span class="visually-hidden">Not logged in</span>
              <button title="Not logged in" @click="navigateAndClose('/login')"
                class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-box-arrow-in-right"></i> Login
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <Modal v-if="showModal" @close="showModal = false">
    <template #header>
      <div class="w-100">
        <h2 class="text-center">Spec-Up-T Editor</h2>
        <h3 class="mt-2 text-center">Consensus Building Tool</h3>
      </div>
    </template>
    <template #body>

      <p>
        <strong>Spec-Up-T Editor</strong> is a web-based consensus building tool running on Git.
      </p>
      <p>
        It provides an intuitive interface for editing specifications with a versioned glossary engine, making it easier
        for teams to collaborate and maintain their documentation.
      </p>
      <ul>
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
      <p>
        <a href="https://blockchainbird.github.io/spec-up-t-website/docs/introduction/how-it-came-to-be/"
          target="_blank" rel="noopener">Read more</a>
      </p>

      <!-- User Info (if logged in) -->
      <div v-if="isAuthenticated && user && user.login"
        class="alert alert-info mb-3 py-2 px-3 d-flex align-items-center" style="font-size: 0.97em;">
        <i class="bi bi-person-circle me-2" style="font-size: 1.3em;"></i>
        <div>
          <div><strong>User:</strong> {{ user.name || user.login }}</div>
          <div v-if="user.email"><strong>Email:</strong> {{ user.email }}</div>
          <div v-if="user.login && user.html_url">
            <a :href="user.html_url" target="_blank" rel="noopener" style="font-size: 0.95em;">
              <i class="bi bi-github"></i> {{ user.login }}
            </a>
          </div>
        </div>
      </div>

      <!-- API Rate Limit Indicator -->
      <RateLimitIndicator />

      <a title="Go to documentation website"
        href="https://blockchainbird.github.io/spec-up-t-website/docs/tools/spec-up-t-editor-user-guide/"
        target="_blank" rel="noopener" class="btn btn-outline-secondary w-100 mb-5" @click="closeNavbar">
        <i class="bi bi-box-arrow-up-right"></i> Go To Documentation
      </a>

      <div class="build-info mt-3 pt-3 border-top">
        <small class="text-muted">
          <strong>Build Date:</strong> {{ buildInfo.buildDate }}
        </small>
      </div>
    </template>
  </Modal>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Modal from './Modal.vue';
import RateLimitIndicator from './RateLimitIndicator.vue';
import { useSoundSystem } from '../composables/useSoundSystem.js';
import { decodeBranchName, buildRoutePath } from '../utils/branchUtils.js';

export default {
  name: 'MainNav',
  components: { Modal, RateLimitIndicator },
  props: {
    isAuthenticated: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['logout', 'toggle-file-explorer'],
  setup(props, { emit }) {
    const route = useRoute();
    const router = useRouter();
    const isNavbarOpen = ref(false);

    // Sound system
    const { isSoundEnabled, toggleSound } = useSoundSystem();

    const currentOwner = computed(() => route.params.owner)
    const currentRepo = computed(() => route.params.repo)
    const currentBranch = computed(() => {
      return route.params.branch ? decodeBranchName(route.params.branch) : null
    })

    const showRepoRelatedButtons = computed(() => {
      return route.params.owner && route.params.repo && route.params.branch;
    });

    const isAuthenticated = computed(() => props.isAuthenticated);
    const user = computed(() => props.user);

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

    const navigateToFilesAndClose = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/files/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
      closeNavbar();
    };

    const navigateToActionsAndClose = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/actions/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
      closeNavbar();
    };

    const navigateToViewAndClose = () => {
      if (currentOwner.value && currentRepo.value && currentBranch.value) {
        router.push(buildRoutePath('/view', currentOwner.value, currentRepo.value, currentBranch.value));
      }
      closeNavbar();
    };

    const navigateToConfigAndClose = () => {
      if (currentOwner.value && currentRepo.value && currentBranch.value) {
        router.push(buildRoutePath('/config', currentOwner.value, currentRepo.value, currentBranch.value));
      }
      closeNavbar();
    };

    const handleLogout = () => {
      console.log('MainNav: Logout clicked');
      emit('logout');
      closeNavbar();
    };

    const handleClickOutside = (event) => {
      const clickedInsideNavbar = !!event.target.closest('.navbar');
      if (!clickedInsideNavbar) {
        closeNavbar();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 992 && isNavbarOpen.value) {
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

    const buildInfo = {
      buildDate: 'Production Build'
    };

    const isActiveRoute = (routePath) => {
      const currentPath = route.path;

      if (routePath === '/home' || routePath === '/help') {
        return currentPath === routePath;
      }

      if (route.params.owner && route.params.repo && route.params.branch) {
        const expectedPath = `${routePath}/${route.params.owner}/${route.params.repo}/${route.params.branch}`;
        return currentPath.startsWith(expectedPath);
      }

      return false;
    };

    // Keep menu items highlighted when on nested destination pages
    const isViewSectionActive = computed(() => (
      isActiveRoute('/terms-preview') || isActiveRoute('/spec') || isActiveRoute('/health-check')
    ));
    const isConfigSectionActive = computed(() => (
      isActiveRoute('/admin') || isActiveRoute('/external-specs') || isActiveRoute('/settings')
    ));

    const showModal = ref(false);

    return {
      route,
      showRepoRelatedButtons,
      isNavbarOpen,
      toggleNavbar,
      closeNavbar,
      navigateAndClose,
      navigateToFilesAndClose,
      navigateToActionsAndClose,
      navigateToViewAndClose,
      navigateToConfigAndClose,
      handleLogout,
      buildInfo,
      isAuthenticated,
      user,
      isActiveRoute,
      isViewSectionActive,
      isConfigSectionActive,
      isSoundEnabled,
      toggleSound,
      showModal,
    };
  },
  data() {
    return {};
  }
};
</script>

<style scoped lang="scss">
@import "../styles/custom-bootstrap.scss";

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
  /* use theme-aware variables so dark mode works correctly */
  background-color: var(--card-hover-bg, #e9ecef);
  color: var(--bs-navbar-hover-color, #0d6efd);
}

.navbar-nav .nav-link.active {
  background-color: $dark-color;
  color: white;
}

.navbar-nav .nav-link.active:hover {
  background-color: #0b5ed7;
  color: white;
}

.navbar-nav .nav-link i {
  margin-right: 0.5rem;
  font-size: 1rem;
}

/* Button-style nav links */
.navbar-nav .nav-link {
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
    /* theme-aware hover on mobile */
    background-color: var(--card-hover-bg, #f8f9fa);
    border-color: var(--bs-navbar-hover-color, #0d6efd);
  }

  .navbar-nav .nav-link.active {
    background-color: $primary-color-transparent;
    border-color: #0d6efd;
    color: white;
    font-weight: 500;
  }

  .navbar-nav .nav-link.active:hover {
    border-color: #0b5ed7;
    color: white;
  }

  .navbar-nav .nav-item {
    margin: 0.25rem 0;
    padding: 0.5rem 1rem;
    justify-content: center;
  }

  /* Authentication UI for mobile */
  .nav-item .navbar-text {
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .nav-item .btn {
    width: 100%;
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
    max-height: 100vh;
    overflow-y: auto;
  }
}

/* Desktop-specific styles */
@media (min-width: 992px) {
  .navbar-nav {
    flex-direction: row;
    flex-wrap: wrap;
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

  /* Authentication UI for desktop */
  .nav-item .navbar-text {
    color: #495057;
    font-weight: 500;
  }

  .nav-item .btn {
    white-space: nowrap;
  }
}
</style>
