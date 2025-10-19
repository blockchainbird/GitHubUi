<template>
  <nav class="navbar navbar-expand-lg main-nav sticky-top bg-light" role="navigation" aria-label="Main">
    <div class="container">
      <!-- Brand/Logo -->
      <span class="navbar-brand mb-0 h1 d-flex align-items-center">
        <img src="/assets/logo.svg" alt="Spec-Up-T Logo" style="height: 2rem; width: auto; margin-right: 0.5rem;" />
        Spec-Up-T Editor <i role="button" @click="showModalAndClose" class="ms-3 bi bi-info-circle"></i>
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

          <!-- File Explorer Toggle -->
          <li v-if="showRepoRelatedButtons" class="nav-item">
            <button @click="toggleFileExplorerAndClose" class="nav-link btn btn-link" title="Toggle File Explorer">
              <i class="bi bi-folder2-open"></i>
              Explorer
            </button>
          </li>

          <!-- File menu -->
          <li v-if="showRepoRelatedButtons" class="nav-item dropdown" data-menu="file"
            @mouseenter="onHoverMenu('file', true)" @mouseleave="onHoverMenu('file', false)">
            <button :class="['nav-link', 'btn', 'btn-link', 'dropdown-toggle', { active: isFileSectionActive }]"
              id="fileMenuButton" aria-haspopup="true" :aria-expanded="isFileOpen.toString()"
              aria-controls="fileMenuDropdown" @click="toggleMenu('file')" @keydown="handleMenuKeydown('file', $event)"
              ref="fileToggle">
              File
            </button>
            <ul id="fileMenuDropdown" class="dropdown-menu" :class="{ show: isFileOpen }"
              aria-labelledby="fileMenuButton" ref="fileMenuEl" @keydown="handleMenuListKeydown('file', $event)">
              <li>
                <button class="dropdown-item" @click="navigateToFilesAndClose">
                  <i class="bi bi-folder"></i> Files
                </button>
              </li>
            </ul>
          </li>

          <!-- Render (single item) -->
          <li v-if="showRepoRelatedButtons" class="nav-item">
            <button @click="navigateToActionsAndClose"
              :class="['nav-link', 'btn', 'btn-link', { active: isActiveRoute('/actions') }]"
              title="Run GitHub Actions">
              <i class="bi bi-play-circle"></i>
              Render
            </button>
          </li>

          <!-- View menu -->
          <li v-if="showRepoRelatedButtons" class="nav-item dropdown" data-menu="view"
            @mouseenter="onHoverMenu('view', true)" @mouseleave="onHoverMenu('view', false)">
            <button :class="['nav-link', 'btn', 'btn-link', 'dropdown-toggle', { active: isViewSectionActive }]"
              id="viewMenuButton" aria-haspopup="true" :aria-expanded="isViewOpen.toString()"
              aria-controls="viewMenuDropdown" @click="toggleMenu('view')" @keydown="handleMenuKeydown('view', $event)"
              ref="viewToggle">
              View
            </button>
            <ul id="viewMenuDropdown" class="dropdown-menu" :class="{ show: isViewOpen }"
              aria-labelledby="viewMenuButton" ref="viewMenuEl" @keydown="handleMenuListKeydown('view', $event)">
              <li>
                <button class="dropdown-item"
                  @click="navigateAndClose(buildRoutePath('/terms-preview', currentOwner, currentRepo, currentBranch))">
                  <i class="bi bi-book-half"></i> Preview
                </button>
              </li>
              <li>
                <button class="dropdown-item"
                  @click="navigateAndClose(buildRoutePath('/spec', currentOwner, currentRepo, currentBranch))">
                  <i class="bi bi-journal-text"></i> Final view
                </button>
              </li>
              <li>
                <button class="dropdown-item" @click="navigateToHealthCheckAndClose">
                  <i class="bi bi-heart-pulse"></i> Health
                </button>
              </li>
              <li>
                <a class="dropdown-item" v-if="githubRepoUrl" :href="githubRepoUrl" target="_blank" rel="noopener"
                  @click="closeNavbar">
                  <i class="bi bi-box-arrow-up-right"></i> Repo (new tab)
                </a>
              </li>
            </ul>
          </li>

          <!-- Config menu -->
          <li v-if="showRepoRelatedButtons" class="nav-item dropdown" data-menu="config"
            @mouseenter="onHoverMenu('config', true)" @mouseleave="onHoverMenu('config', false)">
            <button :class="['nav-link', 'btn', 'btn-link', 'dropdown-toggle', { active: isConfigSectionActive }]"
              id="configMenuButton" aria-haspopup="true" :aria-expanded="isConfigOpen.toString()"
              aria-controls="configMenuDropdown" @click="toggleMenu('config')"
              @keydown="handleMenuKeydown('config', $event)" ref="configToggle">
              Config
            </button>
            <ul id="configMenuDropdown" class="dropdown-menu" :class="{ show: isConfigOpen }"
              aria-labelledby="configMenuButton" ref="configMenuEl" @keydown="handleMenuListKeydown('config', $event)">
              <li>
                <button class="dropdown-item" @click="navigateToAdminAndClose">
                  <i class="bi bi-shield-lock"></i> Local config
                </button>
              </li>
              <li v-if="isAdvancedUser">
                <button class="dropdown-item"
                  @click="navigateAndClose(buildRoutePath('/external-specs', currentOwner, currentRepo, currentBranch))">
                  <i class="bi bi-link-45deg"></i> External repo's
                </button>
              </li>
              <li>
                <button class="dropdown-item"
                  @click="navigateAndClose(buildRoutePath('/settings', currentOwner, currentRepo, currentBranch))"
                  title="Application Settings">
                  <i class="bi bi-gear"></i> Settings
                </button>
              </li>
            </ul>
          </li>

          <!-- Sound Toggle Button -->
          <li class="nav-item d-flex align-items-center me-2">
            <button :title="isSoundEnabled ? 'Turn sound off' : 'Turn sound on'" @click="toggleSound"
              class="btn btn-outline-secondary btn-sm">
              <i :class="isSoundEnabled ? 'bi bi-volume-up' : 'bi bi-volume-mute'"></i>
            </button>
          </li>

          <!-- Authentication UI -->
          <li class="nav-item d-flex align-items-center ms-2">
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Modal from './Modal.vue';
import RateLimitIndicator from './RateLimitIndicator.vue';
import { useSoundSystem } from '../composables/useSoundSystem.js';
import { useAdvancedUser } from '../composables/useAdvancedUser.js';
import { buildRoutePath, decodeBranchName } from '../utils/branchUtils.js';

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
    // Dropdown open states and refs
    const isFileOpen = ref(false);
    const isViewOpen = ref(false);
    const isConfigOpen = ref(false);
    // Element refs for focus management
    const fileToggle = ref(null);
    const viewToggle = ref(null);
    const configToggle = ref(null);
    const fileMenuEl = ref(null);
    const viewMenuEl = ref(null);
    const configMenuEl = ref(null);
    // Advanced user reactive state
    const { isAdvancedUser } = useAdvancedUser();

    // Sound system
    const { isSoundEnabled, toggleSound } = useSoundSystem();

    // Helper computed properties for route-based navigation with URL encoding support
    const currentOwner = computed(() => route.params.owner)
    const currentRepo = computed(() => route.params.repo)
    const currentBranch = computed(() => {
      return route.params.branch ? decodeBranchName(route.params.branch) : null
    })

    const showRepoRelatedButtons = computed(() => {
      // Show repository-specific buttons only when we have repository context
      return route.params.owner && route.params.repo && route.params.branch;
    });

    // const showAlwaysVisibleButtons = computed(() => {
    //   // These buttons should always be visible regardless of route
    //   return true;
    // });

    const githubRepoUrl = computed(() => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        return `https://github.com/${route.params.owner}/${route.params.repo}/tree/${route.params.branch}`;
      }
      return '';
    });

    // Create reactive computed properties for authentication state
    const isAuthenticated = computed(() => props.isAuthenticated);
    const user = computed(() => props.user);

    const toggleNavbar = () => {
      isNavbarOpen.value = !isNavbarOpen.value;
      // Close dropdowns when toggling navbar
      if (!isNavbarOpen.value) closeAllMenus();
    };

    const closeNavbar = () => {
      isNavbarOpen.value = false;
      closeAllMenus();
    };

    const navigateAndClose = (path) => {
      router.push(path);
      closeNavbar();
    };

    const navigateToHealthCheck = () => {
      if (currentOwner.value && currentRepo.value && currentBranch.value) {
        router.push(buildRoutePath('/health-check', currentOwner.value, currentRepo.value, currentBranch.value));
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

    const navigateToFiles = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/files/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
    };

    const navigateToFilesAndClose = () => {
      navigateToFiles();
      closeNavbar();
    };

    const navigateToActions = () => {
      if (route.params.owner && route.params.repo && route.params.branch) {
        router.push(`/actions/${route.params.owner}/${route.params.repo}/${route.params.branch}`);
      }
    };

    const navigateToActionsAndClose = () => {
      navigateToActions();
      closeNavbar();
    };

    const toggleFileExplorerAndClose = () => {
      emit('toggle-file-explorer')
      closeNavbar()
    }

    const handleLogout = () => {
      console.log('MainNav: Logout clicked');
      emit('logout');
      closeNavbar();
    };

    // Debug authentication state
    const logAuthState = () => {
      console.log('MainNav Auth State:', {
        isAuthenticated: isAuthenticated.value,
        user: user.value
      });
    };

    // Close navbar when clicking outside on mobile
    const handleClickOutside = (event) => {
      const clickedInsideNavbar = !!event.target.closest('.navbar');
      if (!clickedInsideNavbar) {
        // Clicked outside navbar: close navbar and dropdowns
        closeNavbar();
        return;
      }
      // Inside navbar: close any open dropdown if click is outside it
      const insideFile = !!event.target.closest('[data-menu="file"]');
      const insideView = !!event.target.closest('[data-menu="view"]');
      const insideConfig = !!event.target.closest('[data-menu="config"]');
      if (!insideFile) isFileOpen.value = false;
      if (!insideView) isViewOpen.value = false;
      if (!insideConfig) isConfigOpen.value = false;
    };

    // Close navbar on window resize to larger screen
    const handleResize = () => {
      if (window.innerWidth >= 992 && isNavbarOpen.value) { // lg breakpoint
        closeNavbar();
      }
      // Always close dropdowns on resize to avoid misplacement
      closeAllMenus();
    };

    const closeAllMenus = () => {
      isFileOpen.value = false;
      isViewOpen.value = false;
      isConfigOpen.value = false;
    };

    const toggleMenu = (menu) => {
      if (menu === 'file') {
        isFileOpen.value = !isFileOpen.value;
        isViewOpen.value = false;
        isConfigOpen.value = false;
      } else if (menu === 'view') {
        isViewOpen.value = !isViewOpen.value;
        isFileOpen.value = false;
        isConfigOpen.value = false;
      } else if (menu === 'config') {
        isConfigOpen.value = !isConfigOpen.value;
        isFileOpen.value = false;
        isViewOpen.value = false;
      }
    };

    // Keyboard support for toggles: Enter/Space to open, Escape to close
    const handleMenuKeydown = (menu, e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu(menu);
        // Focus first item when opening
        nextTickFocusFirst(menu);
      } else if (e.key === 'Escape') {
        closeWithFocusReturn(menu);
      }
    };

    const nextTickFocusFirst = (menu) => {
      requestAnimationFrame(() => {
        const list = getMenuEl(menu);
        if (!list) return;
        const firstBtn = list.querySelector('.dropdown-item, a.dropdown-item, button.dropdown-item');
        if (firstBtn) firstBtn.focus();
      });
    };

    const getMenuEl = (menu) => {
      if (menu === 'file') return fileMenuEl.value;
      if (menu === 'view') return viewMenuEl.value;
      if (menu === 'config') return configMenuEl.value;
      return null;
    };

    const getToggleEl = (menu) => {
      if (menu === 'file') return fileToggle.value;
      if (menu === 'view') return viewToggle.value;
      if (menu === 'config') return configToggle.value;
      return null;
    };

    const closeWithFocusReturn = (menu) => {
      closeAllMenus();
      const toggle = getToggleEl(menu);
      if (toggle) toggle.focus();
    };

    // Keyboard support inside open menus: ArrowDown/ArrowUp cycle, Home/End jump, Esc closes
    const handleMenuListKeydown = (menu, e) => {
      const items = Array.from(getMenuEl(menu)?.querySelectorAll('.dropdown-item')) || [];
      if (!items.length) return;
      const currentIndex = items.findIndex(el => el === document.activeElement);
      const moveFocus = (idx) => items[Math.max(0, Math.min(items.length - 1, idx))]?.focus();
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(currentIndex < 0 ? 0 : (currentIndex + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length);
          break;
        case 'Home':
          e.preventDefault();
          moveFocus(0);
          break;
        case 'End':
          e.preventDefault();
          moveFocus(items.length - 1);
          break;
        case 'Escape':
          e.preventDefault();
          closeWithFocusReturn(menu);
          break;
        default:
          break;
      }
    };

    // Hover to open for desktop (pointer: fine)
    const isDesktopLike = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onHoverMenu = (menu, entering) => {
      if (!isDesktopLike()) return;
      if (!showRepoRelatedButtons.value) return;
      if (entering) {
        if (menu === 'file') { isFileOpen.value = true; isViewOpen.value = false; isConfigOpen.value = false; }
        if (menu === 'view') { isViewOpen.value = true; isFileOpen.value = false; isConfigOpen.value = false; }
        if (menu === 'config') { isConfigOpen.value = true; isFileOpen.value = false; isViewOpen.value = false; }
      } else {
        // delay close slightly to allow into menu area
        setTimeout(() => {
          // If pointer left both toggle and menu, close
          const el = getMenuEl(menu);
          const toggle = getToggleEl(menu);
          const active = document.activeElement;
          const overNavbar = !!document.querySelector('.navbar:hover');
          if (!overNavbar && active !== toggle && !el?.matches(':hover')) {
            if (menu === 'file') isFileOpen.value = false;
            if (menu === 'view') isViewOpen.value = false;
            if (menu === 'config') isConfigOpen.value = false;
          }
        }, 100);
      }
    };

    onMounted(() => {
      logAuthState();
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', onGlobalKeydown);
    });

    // Watch for changes in authentication state
    watch(() => props.isAuthenticated, (newVal, oldVal) => {
      console.log('MainNav: Authentication state changed from', oldVal, 'to', newVal);
      logAuthState();
    });

    watch(() => props.user, (newVal, oldVal) => {
      console.log('MainNav: User changed from', oldVal, 'to', newVal);
    }, { deep: true });

    // Close menus when route changes
    watch(() => route.fullPath, () => {
      closeAllMenus();
      // Don't force-close navbar on mobile to avoid jarring UX; user can see route highlight
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onGlobalKeydown);
    });

    // Get build info from Vite's define
    const buildInfo = __BUILD_INFO__;

    // Function to check if a route is active
    const isActiveRoute = (routePath) => {
      const currentPath = route.path;

      // Handle exact matches for static routes
      if (routePath === '/home' || routePath === '/settings') {
        return currentPath === routePath;
      }

      // Handle parametric routes that include owner/repo/branch
      if (route.params.owner && route.params.repo && route.params.branch) {
        const expectedPath = `${routePath}/${route.params.owner}/${route.params.repo}/${route.params.branch}`;
        return currentPath.startsWith(expectedPath);
      }

      return false;
    };

    // Section active states for dropdown toggles
    const isFileSectionActive = computed(() => isActiveRoute('/files'));
    const isViewSectionActive = computed(() => (
      isActiveRoute('/terms-preview') || isActiveRoute('/spec') || isActiveRoute('/health-check')
    ));
    const isConfigSectionActive = computed(() => (
      isActiveRoute('/admin') || isActiveRoute('/external-specs') || isActiveRoute('/settings')
    ));

    // Accessibility: ESC closes any open menu
    const onGlobalKeydown = (e) => {
      if (e.key === 'Escape') {
        closeAllMenus();
      }
    };

    return {
      isAdvancedUser,
      route,
      showRepoRelatedButtons,
      isFileOpen,
      isViewOpen,
      isConfigOpen,
      // showAlwaysVisibleButtons,
      fileToggle,
      viewToggle,
      configToggle,
      fileMenuEl,
      viewMenuEl,
      configMenuEl,
      githubRepoUrl,
      isNavbarOpen,
      toggleNavbar,
      closeNavbar,
      navigateAndClose,
      handleMenuKeydown,
      handleMenuListKeydown,
      onHoverMenu,
      toggleMenu,
      navigateToHealthCheck,
      navigateToHealthCheckAndClose,
      navigateToAdmin,
      navigateToAdminAndClose,
      navigateToFiles,
      navigateToFilesAndClose,
      navigateToActions,
      navigateToActionsAndClose,
      toggleFileExplorerAndClose,
      handleLogout,
      buildInfo,
      buildRoutePath,
      currentOwner,
      currentRepo,
      currentBranch,
      isAuthenticated,
      user,
      isActiveRoute,
      isFileSectionActive,
      isViewSectionActive,
      isConfigSectionActive,
      isSoundEnabled,
      toggleSound,
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
  background-color: #e9ecef;
  color: #0d6efd;
}

.navbar-nav .nav-link.active {
  background-color: $dark-color;
  color: white;
  /* font-weight: 500; */
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
    background-color: #f8f9fa;
    border-color: #0d6efd;
  }

  .navbar-nav .nav-link.active {
    background-color: $primary-color-transparent;
    border-color: #0d6efd;
    color: white;
    font-weight: 500;
  }

  .navbar-nav .nav-link.active:hover {
    /* background-color: #0b5ed7; */
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

/* Mobile-friendly dropdown behavior: stack items instead of overlay */
@media (max-width: 991.98px) {
  .nav-item.dropdown .dropdown-menu {
    position: static;
    float: none;
    box-shadow: none;
    width: 100%;
    margin: 0.25rem 0 0.5rem;
  }
}
</style>
