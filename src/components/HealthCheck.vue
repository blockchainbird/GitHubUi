<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-heart-pulse"></i>
        Health Check
      </h2>
  <RepoInfo :owner="owner" :repo="repo" :branch="branch" />
      <div>
        <button @click="runHealthCheck" class="btn btn-primary me-2" :disabled="isRunning">
          <span v-if="isRunning" class="spinner-border spinner-border-sm me-2" role="status">
            <span class="visually-hidden">Loading...</span>
          </span>
          <i v-else class="bi bi-play-circle"></i>
          {{ isRunning ? 'Running...' : 'Run Health Check' }}
        </button>
        <!-- <button @click="$router.push(`/files/${owner}/${repo}/${branch}`)" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left"></i>
          Back to Files
        </button> -->
      </div>
    </div>

    <div v-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="isRunning" class="card mb-4">
      <div class="card-body text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Running health checks...</span>
        </div>
        <p class="mt-3 mb-0">Running health checks, please wait...</p>
      </div>
    </div>

    <div v-if="results.length > 0" class="mb-4">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Health Check Results</h5>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="togglePassingChecks" v-model="showPassing">
              <label class="form-check-label" for="togglePassingChecks">
                Show passing checks
              </label>
            </div>
          </div>
        </div>
        <div class="card-body">
          <p class="text-muted mb-3">
            <i class="bi bi-clock"></i>
            Generated: {{ timestamp }}
          </p>
        </div>
      </div>
    </div>

    <div v-for="section in filteredResults" :key="section.title" class="card mb-4">
      <div class="card-header" :class="getSectionHeaderClass(section)">
        <h5 class="mb-0" v-html="section.title"></h5>
      </div>
      <div class="card-body">
        <table class="table table-striped mb-0">
          <thead>
            <tr>
              <th style="width: 100px;">Status</th>
              <th>Check</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in section.results" :key="result.name" :class="getRowClass(result)">
              <td>
                <span :class="getStatusClass(result)" style="white-space: nowrap;">
                  <i :class="getStatusIcon(result)"></i>
                  {{ getStatusText(result) }}
                </span>
              </td>
              <td>{{ result.name }}</td>
              <td v-html="result.details || ''"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="results.length === 0 && !isRunning && !error" class="card">
      <div class="card-body text-center py-5">
        <i class="bi bi-heart-pulse" style="font-size: 3rem; color: #6c757d;"></i>
        <h5 class="mt-3">No Health Check Results</h5>
        <p class="text-muted">Click "Run Health Check" to analyze your repository</p>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useHealthCheck } from '../composables/useHealthCheck.js'
import { addToVisitedRepos } from '../utils/visitedRepos.js'
import RepoInfo from './RepoInfo.vue'

export default {
  name: 'HealthCheck',
  components: { RepoInfo },
  props: ['owner', 'repo', 'branch'],
  setup(props) {
    const {
      isRunning,
      error,
      results,
      timestamp,
      showPassing,
      filteredResults,
      runHealthCheck
    } = useHealthCheck(props)

    // Status display functions
    const getStatusClass = (result) => {
      if (result.status === 'warning' || result.success === 'partial') {
        return 'text-warning'
      } else if (result.success) {
        return 'text-success'
      } else {
        return 'text-danger'
      }
    }

    const getStatusIcon = (result) => {
      if (result.status === 'warning' || result.success === 'partial') {
        return 'bi bi-exclamation-triangle-fill'
      } else if (result.success) {
        return 'bi bi-check-circle-fill'
      } else {
        return 'bi bi-x-circle-fill'
      }
    }

    const getStatusText = (result) => {
      if (result.status === 'warning' || result.success === 'partial') {
        return 'Warning'
      } else if (result.success) {
        return 'Pass'
      } else {
        return 'Fail'
      }
    }

    const getRowClass = (result) => {
      if (result.status === 'warning' || result.success === 'partial') {
        return 'table-warning'
      } else if (!result.success) {
        return 'table-danger'
      }
      return ''
    }

    const getSectionHeaderClass = (section) => {
      const hasErrors = section.results.some(r => !r.success && r.status !== 'warning')
      const hasWarnings = section.results.some(r => r.status === 'warning' || r.success === 'partial')

      if (hasErrors) return 'bg-danger text-white'
      if (hasWarnings) return 'bg-warning text-dark'
      return 'bg-light'
    }

    onMounted(() => {
      // Add this repository to visited history
      addToVisitedRepos(props.owner, props.repo, props.branch)
    })

    return {
      isRunning,
      error,
      results,
      showPassing,
      timestamp,
      filteredResults,
      runHealthCheck,
      getStatusClass,
      getStatusIcon,
      getStatusText,
      getRowClass,
      getSectionHeaderClass
    }
  }
}
</script>

<style scoped>
.table th {
  border-top: none;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>
