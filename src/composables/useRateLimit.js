/**
 * Composable for tracking GitHub API rate limits
 * Provides real-time rate limit information from GitHub API responses
 */

import { ref, computed } from 'vue'

// Global reactive state for rate limit information
const rateLimitRemaining = ref(null)
const rateLimitReset = ref(null)
const rateLimitLimit = ref(null)
const lastUpdated = ref(null)

export function useRateLimit() {
  // Update rate limit info from response headers
  const updateRateLimit = (headers) => {
    if (!headers) return

    const remaining = headers['x-ratelimit-remaining']
    const reset = headers['x-ratelimit-reset']
    const limit = headers['x-ratelimit-limit']

    if (remaining !== undefined) {
      rateLimitRemaining.value = parseInt(remaining)
    }
    if (reset !== undefined) {
      rateLimitReset.value = parseInt(reset) * 1000 // Convert to milliseconds
    }
    if (limit !== undefined) {
      rateLimitLimit.value = parseInt(limit)
    }
    lastUpdated.value = new Date()
  }

  // Calculate time until reset
  const timeUntilReset = computed(() => {
    if (!rateLimitReset.value) return null
    const now = Date.now()
    const resetTime = rateLimitReset.value
    const diff = resetTime - now
    return diff > 0 ? diff : 0
  })

  // Format time remaining as human readable
  const formatTimeRemaining = computed(() => {
    const time = timeUntilReset.value
    if (!time) return 'Unknown'
    
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  })

  // Check if rate limit is low (less than 100 calls remaining)
  const isRateLimitLow = computed(() => {
    return rateLimitRemaining.value !== null && rateLimitRemaining.value < 100
  })

  // Check if rate limit is critical (less than 10 calls remaining)
  const isRateLimitCritical = computed(() => {
    return rateLimitRemaining.value !== null && rateLimitRemaining.value < 10
  })

  return {
    rateLimitRemaining,
    rateLimitLimit,
    timeUntilReset,
    formatTimeRemaining,
    isRateLimitLow,
    isRateLimitCritical,
    lastUpdated,
    updateRateLimit
  }
}
