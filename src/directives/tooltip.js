import { computePosition, offset, flip, shift } from '@floating-ui/dom';

// Tooltip directive that automatically enhances title attributes
export const vTooltip = {
  mounted(el, binding) {
    // Get tooltip content from title attribute or binding value
    const content = binding.value || el.getAttribute('title') || el.getAttribute('data-tooltip');

    if (!content) return;

    // Remove the original title to prevent browser tooltip
    if (el.hasAttribute('title')) {
      el.setAttribute('data-original-title', el.getAttribute('title'));
      el.removeAttribute('title');
    }

    // Store tooltip data on element
    el._tooltipData = {
      content,
      delay: binding.modifiers.fast ? 200 : (binding.arg ? parseInt(binding.arg) : 500),
      placement: binding.modifiers.top ? 'top' :
        binding.modifiers.bottom ? 'bottom' :
          binding.modifiers.left ? 'left' :
            binding.modifiers.right ? 'right' : 'top',
      isVisible: false,
      showTimeout: null,
      hideTimeout: null,
      tooltipElement: null
    };

    // Check if touch device - temporarily disabled for testing
    const isTouchDevice = false; // 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      console.log('Touch device detected, skipping tooltip enhancement');
      return;
    }

    // Create tooltip element
    const createTooltip = () => {
      const tooltip = document.createElement('div');
      tooltip.className = 'enhanced-tooltip';
      tooltip.textContent = content;
      tooltip.setAttribute('role', 'tooltip');
      tooltip.style.cssText = `
        position: absolute;
        background-color: #333;
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
        pointer-events: none;
        transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        transform: translateY(4px);
        white-space: nowrap;
      `;
      document.body.appendChild(tooltip);
      el._tooltipData.tooltipElement = tooltip;
      return tooltip;
    };

    // Position tooltip using Floating UI
    const positionTooltip = async () => {
      const tooltip = el._tooltipData.tooltipElement;
      if (!tooltip) return;

      try {
        const { x, y } = await computePosition(el, tooltip, {
          placement: el._tooltipData.placement,
          middleware: [
            offset(8),
            flip(),
            shift({ padding: 8 })
          ]
        });

        console.log(`Positioning tooltip at x: ${x}, y: ${y}`);
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
      } catch (error) {
        console.error('Error positioning tooltip:', error);
      }
    };

    // Show tooltip
    const showTooltip = () => {
      clearTimeout(el._tooltipData.hideTimeout);
      el._tooltipData.showTimeout = setTimeout(async () => {
        console.log('Showing tooltip for element:', el, 'content:', el._tooltipData.content);
        if (!el._tooltipData.tooltipElement) {
          createTooltip();
        }

        el._tooltipData.isVisible = true;
        const tooltip = el._tooltipData.tooltipElement;

        // Position tooltip
        await positionTooltip();

        // Show with animation
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
        console.log('Tooltip shown:', tooltip);
      }, el._tooltipData.delay);
    };

    // Hide tooltip
    const hideTooltip = () => {
      clearTimeout(el._tooltipData.showTimeout);
      el._tooltipData.hideTimeout = setTimeout(() => {
        el._tooltipData.isVisible = false;
        const tooltip = el._tooltipData.tooltipElement;
        if (tooltip) {
          tooltip.style.opacity = '0';
          tooltip.style.transform = 'translateY(4px)';
        }
      }, 100);
    };

    // Add event listeners
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('focus', showTooltip);
    el.addEventListener('blur', hideTooltip);
  },

  unmounted(el) {
    // Cleanup
    if (el._tooltipData) {
      clearTimeout(el._tooltipData.showTimeout);
      clearTimeout(el._tooltipData.hideTimeout);

      if (el._tooltipData.tooltipElement) {
        el._tooltipData.tooltipElement.remove();
      }

      // Restore original title if it existed
      if (el.hasAttribute('data-original-title')) {
        el.setAttribute('title', el.getAttribute('data-original-title'));
        el.removeAttribute('data-original-title');
      }
    }
  },

  updated(el, binding) {
    // Update content if binding value changes
    if (el._tooltipData && binding.value !== binding.oldValue) {
      el._tooltipData.content = binding.value || el.getAttribute('title') || el.getAttribute('data-tooltip');
      if (el._tooltipData.tooltipElement) {
        el._tooltipData.tooltipElement.textContent = el._tooltipData.content;
      }
    }
  }
};

// Auto-enhance all elements with title attributes
export const autoEnhanceTooltips = (app) => {
  // Register the directive
  app.directive('tooltip', vTooltip);

  // Return the enhancement function to be called after mount
  return () => {
    const enhanceExistingTitles = () => {
      const elementsWithTitle = document.querySelectorAll('[title]');
      console.log(`Found ${elementsWithTitle.length} elements with title attributes`);
      elementsWithTitle.forEach(el => {
        // Skip if already enhanced
        if (el._tooltipData) return;

        console.log('Enhancing element:', el, 'with title:', el.getAttribute('title'));
        // Apply directive programmatically
        vTooltip.mounted(el, { value: null, modifiers: {}, arg: null });
      });
    };

    // Run enhancement
    enhanceExistingTitles();

    // Watch for dynamically added elements
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              if (node.hasAttribute && node.hasAttribute('title') && !node._tooltipData) {
                console.log('Enhancing dynamically added element:', node);
                vTooltip.mounted(node, { value: null, modifiers: {}, arg: null });
              }
              // Check children too
              const childrenWithTitle = node.querySelectorAll ? node.querySelectorAll('[title]') : [];
              childrenWithTitle.forEach(child => {
                if (!child._tooltipData) {
                  vTooltip.mounted(child, { value: null, modifiers: {}, arg: null });
                }
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  };
};
