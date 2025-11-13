// Simple Vue directive for Bootstrap tooltips
// Only use this directive explicitly with v-tooltip on elements with dynamic titles
export const vTooltip = {
  mounted(el) {
    if (window.bootstrap && window.bootstrap.Tooltip) {
      el._bsTooltip = new window.bootstrap.Tooltip(el, {
        delay: { show: 0, hide: 200 } // 200ms delay before hiding tooltip
      });
      
      // Hide tooltip on click to ensure it dismisses after interaction
      el.addEventListener('click', () => {
        el._bsTooltip.hide();
      });
    }
  },

  updated(el) {
    // Use Bootstrap's setContent method to update tooltip text
    if (el._bsTooltip) {
      const newTitle = el.getAttribute('title');
      if (newTitle) {
        el._bsTooltip.setContent({ '.tooltip-inner': newTitle });
      }
    }
  },

  unmounted(el) {
    if (el._bsTooltip) {
      el._bsTooltip.dispose();
    }
  }
};

// Minimal auto-enhancement - no observers, just direct Bootstrap initialization
export const autoEnhanceTooltips = (app) => {
  app.directive('tooltip', vTooltip);
  
  return () => {
    // Do nothing - let Bootstrap handle static tooltips via data-bs-toggle="tooltip"
    // Only use v-tooltip directive for dynamic content
  };
};
