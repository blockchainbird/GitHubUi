<template>
  <div class="tooltip-wrapper" ref="referenceRef">
    <slot />
    <div v-if="isVisible" ref="floatingRef" :style="floatingStyles" class="tooltip-content" role="tooltip">
      {{ content }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue';

export default {
  name: 'Tooltip',
  props: {
    content: {
      type: String,
      required: true
    },
    delay: {
      type: Number,
      default: 500
    },
    placement: {
      type: String,
      default: 'top'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const referenceRef = ref();
    const floatingRef = ref();
    const isVisible = ref(false);
    let showTimeout = null;
    let hideTimeout = null;

    // Detect if device has touch capability
    const isTouchDevice = computed(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });

    const { floatingStyles, update } = useFloating(referenceRef, floatingRef, {
      placement: props.placement,
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 8 })
      ]
    });

    const showTooltip = () => {
      if (props.disabled || isTouchDevice.value) return;

      clearTimeout(hideTimeout);
      showTimeout = setTimeout(() => {
        isVisible.value = true;
        update();
      }, props.delay);
    };

    const hideTooltip = () => {
      clearTimeout(showTimeout);
      hideTimeout = setTimeout(() => {
        isVisible.value = false;
      }, 100);
    };

    const handleMouseEnter = () => showTooltip();
    const handleMouseLeave = () => hideTooltip();
    const handleFocus = () => showTooltip();
    const handleBlur = () => hideTooltip();

    onMounted(() => {
      const element = referenceRef.value;
      if (element) {
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);
      }
    });

    onUnmounted(() => {
      const element = referenceRef.value;
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('focus', handleFocus);
        element.removeEventListener('blur', handleBlur);
      }
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    });

    return {
      referenceRef,
      floatingRef,
      isVisible,
      floatingStyles,
      isTouchDevice
    };
  }
};
</script>

<style scoped lang="scss">
@import "../styles/custom-bootstrap.scss";
.tooltip-wrapper {
  display: inline-block;
}

.tooltip-content {
  background-color: $primary-color-transparent !important;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.2;
  max-width: 200px;
  word-wrap: break-word;
  z-index: 1080;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  opacity: 0;
  animation: tooltip-fade-in 0.2s ease-out forwards;
}

@keyframes tooltip-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .tooltip-content {
    background-color: #f8f9fa;
    color: #212529;
  }
}
</style>
