<template>
  <div v-if="rateLimitRemaining !== null" class="rate-limit-indicator">
    <div class="rate-limit-badge" :class="badgeClass" :title="tooltipText">
      <i class="bi bi-speedometer2"></i>
      <span class="rate-limit-text">{{ rateLimitRemaining }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRateLimit } from '../composables/useRateLimit'

export default {
  name: 'RateLimitIndicator',
  setup() {
    const {
      rateLimitRemaining,
      rateLimitLimit,
      formatTimeRemaining,
      isRateLimitLow,
      isRateLimitCritical
    } = useRateLimit()

    const badgeClass = computed(() => {
      if (isRateLimitCritical.value) return 'rate-limit-critical'
      if (isRateLimitLow.value) return 'rate-limit-low'
      return 'rate-limit-normal'
    })

    const tooltipText = computed(() => {
      if (rateLimitRemaining.value === null) return ''

      const remaining = rateLimitRemaining.value
      const total = rateLimitLimit.value || 'Unknown'
      const resetTime = formatTimeRemaining.value

      return `GitHub API: ${remaining}/${total} calls remaining. Resets in ${resetTime}`
    })

    return {
      rateLimitRemaining,
      badgeClass,
      tooltipText
    }
  }
}
</script>

<style scoped>
.rate-limit-indicator {
  display: flex;
  align-items: center;
}

.rate-limit-badge {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: help;
}

.rate-limit-badge i {
  margin-right: 0.375rem;
  font-size: 0.875rem;
}

.rate-limit-text {
  font-variant-numeric: tabular-nums;
}

.rate-limit-normal {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.rate-limit-low {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.rate-limit-critical {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c2c7;
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

/* Mobile responsiveness */
@media (max-width: 576px) {
  .rate-limit-badge {
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
  }

  .rate-limit-badge i {
    margin-right: 0.25rem;
    font-size: 0.8rem;
  }
}
</style>
