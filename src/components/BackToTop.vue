<template>
  <Teleport to="body">
    <Transition name="fade">
      <button v-if="showButton" @click="scrollToTop" type="button" class="btn btn-primary back-to-top-btn"
        title="Back to top" aria-label="Scroll back to top">
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
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 1030;
  /* Below Bootstrap modals but above other fixed elements */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
