<template>
  <div class="security-dashboard">
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="bi bi-shield-check"></i>
          Security Dashboard
        </h5>
      </div>
      <div class="card-body">
        
        <!-- Token Status -->
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="card border-success">
              <div class="card-body">
                <h6 class="card-title">
                  <i class="bi bi-key"></i>
                  Token Status
                </h6>
                <div v-if="tokenInfo">
                  <div class="badge bg-success mb-2">{{ tokenInfo.type }}</div>
                  <div class="small text-muted">
                    <div>Stored: {{ formatDate(tokenInfo.storedAt) }}</div>
                    <div v-if="tokenInfo.expiresAt">
                      Expires: {{ formatDate(tokenInfo.expiresAt) }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-danger">
                  <i class="bi bi-exclamation-triangle"></i>
                  No token found
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card border-info">
              <div class="card-body">
                <h6 class="card-title">
                  <i class="bi bi-shield-lock"></i>
                  Security Score
                </h6>
                <div class="h3" :class="securityScoreClass">
                  {{ securityScore }}/10
                </div>
                <div class="small text-muted">
                  {{ securityScoreText }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Events -->
        <div class="mb-4">
          <h6>
            <i class="bi bi-clock-history"></i>
            Recent Security Events
          </h6>
          <div v-if="securityLog.length === 0" class="text-muted">
            No security events recorded
          </div>
          <div v-else class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in recentEvents" :key="event.timestamp" 
                    :class="getEventRowClass(event.event)">
                  <td class="small">{{ formatTime(event.timestamp) }}</td>
                  <td>
                    <span :class="getEventBadgeClass(event.event)">
                      {{ formatEventName(event.event) }}
                    </span>
                  </td>
                  <td class="small">{{ formatEventDetails(event) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Security Recommendations -->
        <div class="mb-4">
          <h6>
            <i class="bi bi-lightbulb"></i>
            Security Recommendations
          </h6>
          <div class="list-group list-group-flush">
            <div v-for="recommendation in recommendations" :key="recommendation.id"
                 class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-bold">{{ recommendation.title }}</div>
                <div class="small text-muted">{{ recommendation.description }}</div>
              </div>
              <span :class="recommendation.priority === 'high' ? 'badge bg-danger' : 
                           recommendation.priority === 'medium' ? 'badge bg-warning' : 'badge bg-info'">
                {{ recommendation.priority }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="d-flex gap-2">
          <button @click="clearSecurityLog" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-trash"></i>
            Clear Log
          </button>
          <button @click="refreshData" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
          <button @click="exportSecurityReport" class="btn btn-outline-success btn-sm">
            <i class="bi bi-download"></i>
            Export Report
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { secureTokenManager } from '../utils/secureTokenManager.js'

export default {
  name: 'SecurityDashboard',
  setup() {
    const securityLog = ref([])
    const tokenInfo = ref(null)

    const loadData = () => {
      // Load security log
      securityLog.value = secureTokenManager.getSecurityLog()
      
      // Get token info
      const token = secureTokenManager.getToken()
      if (token) {
        const validation = secureTokenManager.validateToken(token)
        tokenInfo.value = {
          type: validation.tokenType,
          storedAt: new Date().toISOString(), // Could be enhanced to track actual storage time
          expiresAt: null // Could be enhanced to detect token expiration
        }
      }
    }

    const recentEvents = computed(() => {
      return securityLog.value
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    })

    const securityScore = computed(() => {
      let score = 5 // Base score
      
      // Add points for good practices
      if (tokenInfo.value?.type === 'personal_access_token') score += 2
      if (securityLog.value.some(e => e.event === 'token_stored')) score += 1
      
      // Subtract points for security issues
      const failedLogins = securityLog.value.filter(e => e.event === 'login_failed').length
      if (failedLogins > 3) score -= 2
      
      const expiredTokens = securityLog.value.filter(e => e.event === 'token_expired_or_invalid').length
      if (expiredTokens > 0) score -= 1
      
      return Math.max(0, Math.min(10, score))
    })

    const securityScoreClass = computed(() => {
      if (securityScore.value >= 8) return 'text-success'
      if (securityScore.value >= 6) return 'text-warning'
      return 'text-danger'
    })

    const securityScoreText = computed(() => {
      if (securityScore.value >= 8) return 'Excellent security'
      if (securityScore.value >= 6) return 'Good security'
      if (securityScore.value >= 4) return 'Fair security'
      return 'Poor security - needs attention'
    })

    const recommendations = computed(() => {
      const recs = []
      
      if (!tokenInfo.value) {
        recs.push({
          id: 'no-token',
          title: 'No Authentication Token',
          description: 'Please login with a secure GitHub Personal Access Token',
          priority: 'high'
        })
      }
      
      if (tokenInfo.value?.type === 'oauth_token') {
        recs.push({
          id: 'oauth-token',
          title: 'Use Personal Access Token',
          description: 'OAuth tokens have limited permissions. Consider using a PAT for better security.',
          priority: 'medium'
        })
      }
      
      const failedLogins = securityLog.value.filter(e => e.event === 'login_failed').length
      if (failedLogins > 3) {
        recs.push({
          id: 'failed-logins',
          title: 'Multiple Failed Login Attempts',
          description: 'Consider regenerating your token if you suspect it may be compromised',
          priority: 'high'
        })
      }
      
      if (securityLog.value.length === 0) {
        recs.push({
          id: 'no-activity',
          title: 'No Security Activity Logged',
          description: 'Security monitoring is active and will track authentication events',
          priority: 'low'
        })
      }
      
      return recs
    })

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleString()
    }

    const formatEventName = (event) => {
      const eventNames = {
        'token_stored': 'Token Stored',
        'token_cleared': 'Token Cleared',
        'token_migrated': 'Token Migrated',
        'login_failed': 'Login Failed',
        'token_expired_or_invalid': 'Token Invalid',
        'secure_login_success': 'Login Success'
      }
      return eventNames[event] || event
    }

    const getEventBadgeClass = (event) => {
      const successEvents = ['token_stored', 'token_migrated', 'secure_login_success']
      const warningEvents = ['token_cleared']
      const dangerEvents = ['login_failed', 'token_expired_or_invalid']
      
      if (successEvents.includes(event)) return 'badge bg-success'
      if (warningEvents.includes(event)) return 'badge bg-warning'
      if (dangerEvents.includes(event)) return 'badge bg-danger'
      return 'badge bg-secondary'
    }

    const getEventRowClass = (event) => {
      const dangerEvents = ['login_failed', 'token_expired_or_invalid']
      if (dangerEvents.includes(event)) return 'table-danger'
      return ''
    }

    const formatEventDetails = (event) => {
      const details = []
      if (event.tokenType) details.push(`Type: ${event.tokenType}`)
      if (event.error) details.push(`Error: ${event.error}`)
      if (event.status) details.push(`Status: ${event.status}`)
      if (event.from && event.to) details.push(`${event.from} → ${event.to}`)
      return details.join(', ') || 'No additional details'
    }

    const clearSecurityLog = () => {
      if (confirm('Are you sure you want to clear the security log?')) {
        secureTokenManager.clearSecurityLog()
        loadData()
      }
    }

    const refreshData = () => {
      loadData()
    }

    const exportSecurityReport = () => {
      const report = {
        timestamp: new Date().toISOString(),
        tokenInfo: tokenInfo.value,
        securityScore: securityScore.value,
        recommendations: recommendations.value,
        securityLog: securityLog.value
      }
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    onMounted(() => {
      loadData()
    })

    return {
      securityLog,
      tokenInfo,
      recentEvents,
      securityScore,
      securityScoreClass,
      securityScoreText,
      recommendations,
      formatDate,
      formatTime,
      formatEventName,
      getEventBadgeClass,
      getEventRowClass,
      formatEventDetails,
      clearSecurityLog,
      refreshData,
      exportSecurityReport
    }
  }
}
</script>

<style scoped>
.security-dashboard {
  max-width: 800px;
  margin: 0 auto;
}

.table-responsive {
  max-height: 300px;
  overflow-y: auto;
}

.list-group-item {
  border-left: none;
  border-right: none;
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}
</style>
