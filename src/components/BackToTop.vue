<template>
  <Teleport to="body">
    <Transition name="fade">
      <button 
        v-if="showButton"
        @click="scrollToTop"
        class="back-to-top-btn"
        title="Back to top"
        aria-label="Scroll back to top"
      >
        <i class="bi bi-arrow-up"></i>
      </button>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'BackToTop',
  setup() {
    const showButton = ref(false)
    const scrollThreshold = 300 // Show button after scrolling 300px
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          showButton.value = window.scrollY > scrollThreshold
          ticking = false
        })
        ticking = true
      }
    }

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll, { passive: true })
      // Check initial scroll position
      handleScroll()
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      showButton,
      scrollToTop
    }
  }
}
</script>

<style scoped>
.back-to-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 50%;
  background: #0d6efd;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 1050; /* Above Bootstrap modals */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-to-top-btn:hover {
  background: #0b5ed7;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.back-to-top-btn:active {
  transform: translateY(0);
}

.back-to-top-btn:focus {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

/* Vue transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .back-to-top-btn {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .back-to-top-btn {
    border: 2px solid white;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .back-to-top-btn {
    transition: none;
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
