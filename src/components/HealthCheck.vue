<template>
  <div class="container mt-3">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10">

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
            <button 
              v-if="ghPageUrl" 
              @click="runLinkCheck(ghPageUrl)" 
              class="btn btn-info me-2" 
              :disabled="isCheckingLinks"
              title="Check all links on the published GitHub Pages site"
            >
              <span v-if="isCheckingLinks" class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </span>
              <i v-else class="bi bi-link-45deg"></i>
              {{ isCheckingLinks ? 'Checking...' : 'Check Links' }}
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

        <div v-if="isCheckingLinks" class="card mb-4">
          <div class="card-body text-center">
            <div class="spinner-border text-info" role="status">
              <span class="visually-hidden">Checking links...</span>
            </div>
            <p class="mt-3 mb-2">Checking links on published page...</p>
            <p v-if="linkCheckProgress" class="text-muted mb-0">
              <small>{{ linkCheckProgress }}</small>
            </p>
          </div>
        </div>

        <div v-if="linkCheckResults" class="card mb-4">
          <div class="card-header" :class="getLinkCheckHeaderClass()">
            <h5 class="mb-0">
              <i class="bi bi-link-45deg"></i>
              Link Check Results
            </h5>
          </div>
          <div class="card-body">
            <p class="text-muted mb-3">
              <i class="bi bi-clock"></i>
              Generated: {{ linkCheckResults.timestamp }}
            </p>
            <p class="mb-3">
              <strong>URL:</strong> 
              <a :href="linkCheckResults.url" target="_blank" rel="noopener noreferrer">
                {{ linkCheckResults.url }}
                <i class="bi bi-box-arrow-up-right ms-1" style="font-size: 0.8rem;"></i>
              </a>
            </p>
            <p class="mb-3">
              <strong>Summary:</strong> {{ linkCheckResults.summary }}
            </p>
            
            <!-- Broken links -->
            <div v-if="linkCheckResults.broken > 0" class="alert alert-danger">
              <h6 class="alert-heading">
                <i class="bi bi-x-circle"></i>
                Broken Links ({{ linkCheckResults.broken }})
              </h6>
              <ul class="mb-0">
                <li v-for="link in linkCheckResults.brokenLinks" :key="link.url" class="mb-2">
                  <code>{{ link.url }}</code>
                  <span class="badge bg-danger ms-2">{{ link.status }}</span>
                  <span class="text-muted ms-2">{{ link.statusText }}</span>
                  <br>
                  <small class="text-muted">Found in: {{ link.parent }}</small>
                </li>
              </ul>
            </div>
            
            <!-- Warnings -->
            <div v-if="linkCheckResults.warnings > 0" class="alert alert-warning">
              <h6 class="alert-heading">
                <i class="bi bi-exclamation-triangle"></i>
                Warnings ({{ linkCheckResults.warnings }})
              </h6>
              <ul class="mb-0">
                <li v-for="link in linkCheckResults.warningLinks" :key="link.url">
                  <code>{{ link.url }}</code>
                  <span class="text-muted ms-2">{{ link.message }}</span>
                </li>
              </ul>
            </div>
            
            <!-- Success -->
            <div v-if="linkCheckResults.broken === 0 && linkCheckResults.warnings === 0" class="alert alert-success mb-0">
              <i class="bi bi-check-circle"></i>
              All {{ linkCheckResults.ok }} links are working correctly!
            </div>
          </div>
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
      runHealthCheck,
      linkCheckResults,
      isCheckingLinks,
      linkCheckProgress,
      runLinkCheck
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

    const getLinkCheckHeaderClass = () => {
      if (!linkCheckResults.value) return 'bg-light'
      if (linkCheckResults.value.broken > 0) return 'bg-danger text-white'
      if (linkCheckResults.value.warnings > 0) return 'bg-warning text-dark'
      return 'bg-success text-white'
    }

    // For now, we'll use a placeholder. In a real implementation, 
    // this should be fetched from specs.json via the provider
    const ghPageUrl = `https://${props.owner}.github.io/${props.repo}/`

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
      linkCheckResults,
      isCheckingLinks,
      linkCheckProgress,
      runLinkCheck,
      ghPageUrl,
      getStatusClass,
      getStatusIcon,
      getStatusText,
      getRowClass,
      getSectionHeaderClass,
      getLinkCheckHeaderClass
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
