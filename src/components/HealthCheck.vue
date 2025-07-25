<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-heart-pulse"></i>
        Health Check - {{ owner }}/{{ repo }}
      </h2>
      <div>
        <button @click="runHealthCheck" class="btn btn-primary me-2" :disabled="isRunning">
          <span v-if="isRunning" class="spinner-border spinner-border-sm me-2" role="status">
            <span class="visually-hidden">Loading...</span>
          </span>
          <i v-else class="bi bi-play-circle"></i>
          {{ isRunning ? 'Running...' : 'Run Health Check' }}
        </button>
        <button @click="$router.push(`/files/${owner}/${repo}/${branch}`)" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left"></i>
          Back to Files
        </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { addToVisitedRepos } from '../utils/visitedRepos.js'

export default {
  name: 'HealthCheck',
  props: ['owner', 'repo', 'branch'],
  setup(props) {
    const router = useRouter()
    const isRunning = ref(false)
    const error = ref('')
    const results = ref([])
    const showPassing = ref(true)
    const timestamp = ref('')

    // GitHub API configuration
    const getGitHubConfig = () => ({
      headers: {
        'Authorization': `token ${localStorage.getItem('github_token')}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    // Filtered results based on showPassing toggle
    const filteredResults = computed(() => {
      if (showPassing.value) {
        return results.value
      }

      return results.value.map(section => ({
        ...section,
        results: section.results.filter(result => !result.success || result.success === 'partial')
      })).filter(section => section.results.length > 0)
    })

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

    // Helper function to check authentication and redirect if needed
    const checkAuthAndRedirect = (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Token is invalid or expired, clear it and redirect to login
        localStorage.removeItem('github_token')
        localStorage.removeItem('github_user')
        router.push('/login')
        return true
      }
      return false
    }

    // Helper function to fetch file content from GitHub
    const fetchFileContent = async (filePath) => {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${filePath}?ref=${props.branch}`,
          getGitHubConfig()
        )
        return atob(response.data.content)
      } catch (error) {
        if (checkAuthAndRedirect(error)) {
          throw new Error('Authentication required - redirecting to login')
        }
        return null
      }
    }

    // Helper function to check if URL exists
    const checkUrlExists = async (url) => {
      try {
        // For GitHub URLs, use the API instead of direct HTTP requests
        if (url.includes('github.com')) {
          return await checkGitHubUrl(url)
        }

        // For other URLs, try a GET request with a shorter timeout
        const response = await axios.get(url, {
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept any status < 500 as "accessible"
        })
        return response.status >= 200 && response.status < 500
      } catch (error) {
        // If it's a CORS error, we can't determine accessibility from client-side
        if (error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
          return 'unknown'
        }
        return false
      }
    }

    // Helper function to check GitHub URLs using the API
    const checkGitHubUrl = async (url) => {
      try {
        // Parse GitHub URL to extract owner and repo
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return false;

        const [, owner, repo] = match;

        // Use GitHub API to check if repository exists
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json'
              // Don't include auth token as external repos might be public
            },
            timeout: 10000
          }
        );

        return response.status === 200;
      } catch (error) {
        // If 404, repo doesn't exist or is private
        if (error.response?.status === 404) {
          return false;
        }
        // For other errors (403 rate limit, etc.), assume it exists but is inaccessible
        return 'unknown';
      }
    }

    // Helper function to get directory contents
    const getDirectoryContents = async (dirPath) => {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${dirPath}?ref=${props.branch}`,
          getGitHubConfig()
        )
        return response.data
      } catch (error) {
        if (checkAuthAndRedirect(error)) {
          throw new Error('Authentication required - redirecting to login')
        }
        return null
      }
    }

    // Health check functions
    const checkSpecsConfiguration = async () => {
      const results = []

      try {
        const specsContent = await fetchFileContent('specs.json')

        if (!specsContent) {
          results.push({
            name: 'specs.json exists',
            success: false,
            details: 'specs.json file not found in repository root'
          })
          return results
        }

        results.push({
          name: 'specs.json exists',
          success: true,
          details: 'specs.json file found'
        })

        let specs
        try {
          specs = JSON.parse(specsContent)
          results.push({
            name: 'specs.json is valid JSON',
            success: true,
            details: 'JSON syntax is valid'
          })
        } catch (error) {
          results.push({
            name: 'specs.json is valid JSON',
            success: false,
            details: `JSON parsing error: ${error.message}`
          })
          return results
        }

        // Check specs array
        if (!Array.isArray(specs.specs)) {
          results.push({
            name: 'specs.specs is an array',
            success: false,
            details: 'specs.specs field is missing or not an array'
          })
        } else {
          results.push({
            name: 'specs.specs is an array',
            success: true,
            details: `Found ${specs.specs.length} spec configuration(s)`
          })

          // Check first spec configuration
          if (specs.specs.length > 0) {
            const spec = specs.specs[0]

            // Check required fields
            const requiredFields = ['spec_directory', 'output_path', 'markdown_paths']
            requiredFields.forEach(field => {
              if (spec[field] !== undefined) {
                results.push({
                  name: `${field} is defined`,
                  success: true,
                  details: `${field}: ${JSON.stringify(spec[field])}`
                })
              } else {
                results.push({
                  name: `${field} is defined`,
                  success: false,
                  details: `${field} is missing from spec configuration`
                })
              }
            })

            // Check source configuration if present
            if (spec.source) {
              const sourceFields = ['host', 'account', 'repo']
              sourceFields.forEach(field => {
                if (spec.source[field]) {
                  results.push({
                    name: `source.${field} is defined`,
                    success: true,
                    details: `${field}: ${spec.source[field]}`
                  })
                } else {
                  results.push({
                    name: `source.${field} is defined`,
                    success: false,
                    details: `source.${field} is missing`
                  })
                }
              })
            }
          }
        }

      } catch (error) {
        results.push({
          name: 'specs.json check failed',
          success: false,
          details: `Error: ${error.message}`
        })
      }

      return results
    }

    const checkExternalSpecs = async () => {
      const results = []

      try {
        const specsContent = await fetchFileContent('specs.json')

        if (!specsContent) {
          results.push({
            name: 'External specs check',
            success: false,
            details: 'Cannot check external specs - specs.json not found'
          })
          return results
        }

        const specs = JSON.parse(specsContent)

        // Check if specs array exists and has at least one item
        if (!specs.specs || !Array.isArray(specs.specs) || specs.specs.length === 0) {
          results.push({
            name: 'External specs configuration',
            success: false,
            details: 'No specs configuration found in specs.json'
          })
          return results
        }

        const firstSpec = specs.specs[0]

        if (firstSpec.external_specs && Array.isArray(firstSpec.external_specs)) {
          if (firstSpec.external_specs.length === 0) {
            results.push({
              name: 'External specs defined',
              success: true,
              details: 'No external specs defined (this is normal)'
            })
          } else {
            results.push({
              name: 'External specs defined',
              success: true,
              details: `Found ${firstSpec.external_specs.length} external spec(s)`
            })

            // Check each external spec URL
            for (const [index, spec] of firstSpec.external_specs.entries()) {
              if (spec.url) {
                const urlExists = await checkUrlExists(spec.url)
                let urlStatus, urlDetails

                if (urlExists === true) {
                  urlStatus = true
                  urlDetails = `URL: ${spec.url} - Accessible`
                } else if (urlExists === 'unknown') {
                  urlStatus = 'partial'
                  urlDetails = `URL: ${spec.url} - Cannot verify accessibility (CORS/Network restriction)`
                } else {
                  urlStatus = false
                  urlDetails = `URL: ${spec.url} - Not accessible or not found`
                }

                results.push({
                  name: `External spec ${index + 1} URL accessible`,
                  success: urlStatus,
                  details: urlDetails
                })
              } else {
                results.push({
                  name: `External spec ${index + 1} has URL`,
                  success: false,
                  details: 'External spec missing URL field'
                })
              }

              // Check other required fields
              if (spec.external_spec) {
                results.push({
                  name: `External spec ${index + 1} has external_spec field`,
                  success: true,
                  details: `external_spec: ${spec.external_spec}`
                })
              } else {
                results.push({
                  name: `External spec ${index + 1} has external_spec field`,
                  success: false,
                  details: 'Missing external_spec field'
                })
              }

              if (spec.gh_page) {
                const ghPageExists = await checkUrlExists(spec.gh_page)
                let ghStatus, ghDetails

                if (ghPageExists === true) {
                  ghStatus = true
                  ghDetails = `GitHub page: ${spec.gh_page} - Accessible`
                } else if (ghPageExists === 'unknown') {
                  ghStatus = 'partial'
                  ghDetails = `GitHub page: ${spec.gh_page} - Cannot verify accessibility (CORS/Network restriction)`
                } else {
                  ghStatus = false
                  ghDetails = `GitHub page: ${spec.gh_page} - Not accessible or not found`
                }

                results.push({
                  name: `External spec ${index + 1} GitHub page accessible`,
                  success: ghStatus,
                  details: ghDetails
                })
              } else {
                results.push({
                  name: `External spec ${index + 1} has gh_page field`,
                  success: false,
                  details: 'Missing gh_page field'
                })
              }

              if (spec.terms_dir) {
                results.push({
                  name: `External spec ${index + 1} has terms_dir field`,
                  success: true,
                  details: `terms_dir: ${spec.terms_dir}`
                })
              } else {
                results.push({
                  name: `External spec ${index + 1} has terms_dir field`,
                  success: false,
                  details: 'Missing terms_dir field'
                })
              }
            }
          }
        } else {
          results.push({
            name: 'External specs configuration',
            success: true,
            details: 'No external_specs field defined (this is normal if no external specs are used)'
          })
        }

      } catch (error) {
        results.push({
          name: 'External specs check failed',
          success: false,
          details: `Error: ${error.message}`
        })
      }

      return results
    }

    const checkTermsIntroFile = async () => {
      const results = []

      try {
        // Try common paths for terms intro file
        const possiblePaths = [
          'terms-and-definitions-intro.md',
          'spec/terms-and-definitions-intro.md',
          'specs/terms-and-definitions-intro.md'
        ]

        let found = false
        let content = ''

        for (const path of possiblePaths) {
          const fileContent = await fetchFileContent(path)
          if (fileContent) {
            found = true
            content = fileContent
            results.push({
              name: 'terms-and-definitions-intro.md exists',
              success: true,
              details: `Found at ${path}`
            })
            break
          }
        }

        if (!found) {
          results.push({
            name: 'terms-and-definitions-intro.md exists',
            success: false,
            details: 'terms-and-definitions-intro.md not found in common locations'
          })
          return results
        }

        // Basic content checks
        if (content.trim().length > 0) {
          results.push({
            name: 'terms-and-definitions-intro.md has content',
            success: true,
            details: `File contains ${content.length} characters`
          })
        } else {
          results.push({
            name: 'terms-and-definitions-intro.md has content',
            success: false,
            details: 'File is empty'
          })
        }

        // Check for common markdown elements
        const hasHeaders = content.includes('#')
        results.push({
          name: 'Contains markdown headers',
          success: hasHeaders,
          status: hasHeaders ? undefined : 'warning',
          details: hasHeaders ? 'Markdown headers found' : 'No markdown headers found - consider adding structure'
        })

      } catch (error) {
        results.push({
          name: 'Terms intro file check failed',
          success: false,
          details: `Error: ${error.message}`
        })
      }

      return results
    }

    const checkGitignore = async () => {
      const results = []

      try {
        const gitignoreContent = await fetchFileContent('.gitignore')

        if (!gitignoreContent) {
          results.push({
            name: '.gitignore exists',
            success: false,
            details: '.gitignore file not found'
          })
          return results
        }

        results.push({
          name: '.gitignore exists',
          success: true,
          details: '.gitignore file found'
        })

        // Check for common spec-up-t ignore patterns
        const importantPatterns = [
          { pattern: 'node_modules', description: 'Node.js dependencies' },
          { pattern: '.cache', description: 'Cache directory' },
          { pattern: 'dist', description: 'Distribution/build directory' }
        ]

        importantPatterns.forEach(({ pattern, description }) => {
          const hasPattern = gitignoreContent.includes(pattern)
          results.push({
            name: `Ignores ${pattern}`,
            success: hasPattern,
            status: hasPattern ? undefined : 'warning',
            details: `${description} ${hasPattern ? 'ignored' : 'not ignored - consider adding'}`
          })
        })

      } catch (error) {
        results.push({
          name: 'Gitignore check failed',
          success: false,
          details: `Error: ${error.message}`
        })
      }

      return results
    }

    const checkRepositoryInfo = async () => {
      const results = []

      try {
        // Check if repository is accessible
        const repoResponse = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}`,
          getGitHubConfig()
        )

        results.push({
          name: 'Repository accessible',
          success: true,
          details: `Repository: ${repoResponse.data.full_name}`
        })

        // Check branch exists
        try {
          await axios.get(
            `https://api.github.com/repos/${props.owner}/${props.repo}/branches/${props.branch}`,
            getGitHubConfig()
          )
          results.push({
            name: 'Branch exists',
            success: true,
            details: `Branch '${props.branch}' exists`
          })
        } catch (branchError) {
          if (checkAuthAndRedirect(branchError)) {
            throw new Error('Authentication required - redirecting to login')
          }
          results.push({
            name: 'Branch exists',
            success: false,
            details: `Branch '${props.branch}' not found`
          })
        }

      } catch (error) {
        if (checkAuthAndRedirect(error)) {
          throw new Error('Authentication required - redirecting to login')
        }
        results.push({
          name: 'Repository accessible',
          success: false,
          details: `Cannot access repository: ${error.message}`
        })
      }

      return results
    }

    const checkSpecDirectory = async () => {
      const results = []

      try {
        // First, get the spec directory from specs.json
        const specsContent = await fetchFileContent('specs.json')
        let specDirectory = 'spec' // default

        if (specsContent) {
          try {
            const specs = JSON.parse(specsContent)
            if (specs.specs && specs.specs.length > 0 && specs.specs[0].spec_directory) {
              specDirectory = specs.specs[0].spec_directory
            }
          } catch (error) {
            // Use default if parsing fails
          }
        }

        // Check if spec directory exists
        const dirContents = await getDirectoryContents(specDirectory)

        if (!dirContents) {
          results.push({
            name: 'Spec directory exists',
            success: false,
            details: `Spec directory '${specDirectory}' not found`
          })
          return results
        }

        results.push({
          name: 'Spec directory exists',
          success: true,
          details: `Spec directory '${specDirectory}' found with ${dirContents.length} items`
        })

        // Check for markdown files
        const markdownFiles = dirContents.filter(item =>
          item.type === 'file' && item.name.toLowerCase().endsWith('.md')
        )

        if (markdownFiles.length === 0) {
          results.push({
            name: 'Markdown files in spec directory',
            success: false,
            details: 'No markdown files found in spec directory'
          })
        } else {
          results.push({
            name: 'Markdown files in spec directory',
            success: true,
            details: `Found ${markdownFiles.length} markdown file(s): ${markdownFiles.map(f => f.name).join(', ')}`
          })

          // Check a few markdown files for term references
          const filesToCheck = markdownFiles.slice(0, 3) // Check first 3 files to avoid too many API calls
          let totalTermRefs = 0

          for (const file of filesToCheck) {
            const content = await fetchFileContent(file.path)
            if (content) {
              // Count term references like [[term]]
              const termRefs = (content.match(/\[\[([^\]]+)\]\]/g) || []).length
              totalTermRefs += termRefs

              if (termRefs > 0) {
                results.push({
                  name: `${file.name} contains term references`,
                  success: true,
                  details: `Found ${termRefs} term reference(s) in ${file.name}`
                })
              }
            }
          }

          if (totalTermRefs === 0 && filesToCheck.length > 0) {
            results.push({
              name: 'Term references in markdown files',
              success: true,
              status: 'warning',
              details: `No term references ([[term]]) found in checked files. This may be normal if terms are not used.`
            })
          }
        }

        // Check for subdirectories
        const subdirs = dirContents.filter(item => item.type === 'dir')
        if (subdirs.length > 0) {
          results.push({
            name: 'Spec subdirectories',
            success: true,
            details: `Found ${subdirs.length} subdirectory(ies): ${subdirs.map(d => d.name).join(', ')}`
          })
        }

      } catch (error) {
        results.push({
          name: 'Spec directory check failed',
          success: false,
          details: `Error: ${error.message}`
        })
      }

      return results
    }

    const checkTrefTermReferences = async () => {
      const results = []

      try {
        // First, get the spec directory from specs.json
        const specsContent = await fetchFileContent('specs.json')
        let specDirectory = 'spec' // default

        if (specsContent) {
          try {
            const specs = JSON.parse(specsContent)
            if (specs.specs && specs.specs.length > 0 && specs.specs[0].spec_directory) {
              specDirectory = specs.specs[0].spec_directory
            }
          } catch (error) {
            // Use default if parsing fails
          }
        }

        // Get all markdown files in the spec directory
        const dirContents = await getDirectoryContents(specDirectory)

        if (!dirContents) {
          results.push({
            name: 'Term reference check',
            success: false,
            details: `Cannot check term references - spec directory '${specDirectory}' not found`
          })
          return results
        }

        const markdownFiles = dirContents.filter(item =>
          item.type === 'file' && item.name.toLowerCase().endsWith('.md')
        )

        if (markdownFiles.length === 0) {
          results.push({
            name: 'Term reference check',
            success: true,
            status: 'warning',
            details: 'No markdown files found to check for term references'
          })
          return results
        }

        // Collect all term references and definitions
        const allTermRefs = new Set()
        const allTermDefs = new Set()
        const fileTermRefs = new Map()

        // First pass: collect all term references [[term]] and definitions
        for (const file of markdownFiles) {
          const content = await fetchFileContent(file.path)
          if (content) {
            // Find all [[term]] references
            const termRefs = content.match(/\[\[([^\]]+)\]\]/g) || []
            const termsInFile = []

            termRefs.forEach(ref => {
              const term = ref.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
              allTermRefs.add(term)
              termsInFile.push(term)
            })

            if (termsInFile.length > 0) {
              fileTermRefs.set(file.name, termsInFile)
            }

            // Find term definitions (lines that define terms)
            // Look for patterns like "## Term Name" or "**Term Name**:" or "Term Name:" at start of line
            const lines = content.split('\n')
            lines.forEach(line => {
              const trimmedLine = line.trim()

              // Check for header definitions like "## Term Name"
              const headerMatch = trimmedLine.match(/^#+\s*(.+)$/)
              if (headerMatch) {
                const term = headerMatch[1].trim().toLowerCase()
                allTermDefs.add(term)
              }

              // Check for bold definitions like "**Term Name**:"
              const boldMatch = trimmedLine.match(/^\*\*([^*]+)\*\*\s*:/)
              if (boldMatch) {
                const term = boldMatch[1].trim().toLowerCase()
                allTermDefs.add(term)
              }

              // Check for simple definitions like "Term Name:"
              const simpleMatch = trimmedLine.match(/^([^:]+):\s*$/)
              if (simpleMatch && simpleMatch[1].length < 50) { // Avoid matching long sentences
                const term = simpleMatch[1].trim().toLowerCase()
                allTermDefs.add(term)
              }
            })
          }
        }

        // Also check external specs for term definitions
        if (specsContent) {
          try {
            const specs = JSON.parse(specsContent)
            if (specs.specs && specs.specs.length > 0 && specs.specs[0].external_specs) {
              for (const extSpec of specs.specs[0].external_specs) {
                if (extSpec.terms_dir) {
                  // For external specs, we can't easily check the actual terms
                  // but we can note that they exist
                  results.push({
                    name: `External spec terms available`,
                    success: true,
                    details: `External spec "${extSpec.external_spec}" defines terms in "${extSpec.terms_dir}"`
                  })
                }
              }
            }
          } catch (error) {
            // Ignore parsing errors
          }
        }

        // Summary results
        results.push({
          name: 'Term references found',
          success: allTermRefs.size > 0,
          status: allTermRefs.size === 0 ? 'warning' : undefined,
          details: allTermRefs.size === 0 ?
            'No term references ([[term]]) found in markdown files' :
            `Found ${allTermRefs.size} unique term reference(s): ${Array.from(allTermRefs).slice(0, 10).join(', ')}${allTermRefs.size > 10 ? '...' : ''}`
        })

        results.push({
          name: 'Term definitions found',
          success: allTermDefs.size > 0,
          status: allTermDefs.size === 0 ? 'warning' : undefined,
          details: allTermDefs.size === 0 ?
            'No term definitions found in markdown files' :
            `Found ${allTermDefs.size} potential term definition(s)`
        })

        // Check for undefined term references
        const undefinedTerms = new Set()
        allTermRefs.forEach(term => {
          if (!allTermDefs.has(term)) {
            undefinedTerms.add(term)
          }
        })

        if (undefinedTerms.size > 0) {
          results.push({
            name: 'All term references have definitions',
            success: false,
            details: `${undefinedTerms.size} term reference(s) may not have definitions: ${Array.from(undefinedTerms).slice(0, 5).join(', ')}${undefinedTerms.size > 5 ? '...' : ''}. Note: External spec terms cannot be validated from this check.`
          })
        } else if (allTermRefs.size > 0) {
          results.push({
            name: 'All term references have definitions',
            success: true,
            details: 'All term references appear to have corresponding definitions'
          })
        }

        // Per-file breakdown
        if (fileTermRefs.size > 0) {
          results.push({
            name: 'Files with term references',
            success: true,
            details: `${fileTermRefs.size} file(s) contain term references: ${Array.from(fileTermRefs.keys()).join(', ')}`
          })
        }

        // Check for orphaned definitions (definitions without references)
        const orphanedDefs = new Set()
        allTermDefs.forEach(term => {
          if (!allTermRefs.has(term)) {
            orphanedDefs.add(term)
          }
        })

        if (orphanedDefs.size > 0) {
          results.push({
            name: 'Unused term definitions',
            success: true,
            status: 'warning',
            details: `${orphanedDefs.size} term definition(s) may not be referenced: ${Array.from(orphanedDefs).slice(0, 5).join(', ')}${orphanedDefs.size > 5 ? '...' : ''}. This may be normal if terms are used in external specs.`
          })
        }

      } catch (error) {
        results.push({
          name: 'Term reference check failed',
          success: false,
          details: `Error: ${error.message}`
        })
      }

      return results
    }

    // Main health check runner
    const runHealthCheck = async () => {
      isRunning.value = true
      error.value = ''
      results.value = []
      timestamp.value = new Date().toLocaleString()

      try {
        const checkResults = []

        // Run repository info check
        const repoResults = await checkRepositoryInfo()
        checkResults.push({
          title: 'Repository Information',
          results: repoResults
        })

        // Run specs.json configuration check
        const specsResults = await checkSpecsConfiguration()
        checkResults.push({
          title: 'Check <code>specs.json</code> configuration',
          results: specsResults
        })

        // Run spec directory check
        const specDirResults = await checkSpecDirectory()
        checkResults.push({
          title: 'Check Spec Directory and Files',
          results: specDirResults
        })

        // Run external specs check
        const externalResults = await checkExternalSpecs()
        checkResults.push({
          title: 'Check External Specs URLs',
          results: externalResults
        })

        // Run term reference check
        const trefResults = await checkTrefTermReferences()
        checkResults.push({
          title: 'Check Term References ([[term]])',
          results: trefResults
        })

        // Run terms intro check
        const termsResults = await checkTermsIntroFile()
        checkResults.push({
          title: 'Check <code>terms-and-definitions-intro.md</code>',
          results: termsResults
        })

        // Run gitignore check
        const gitignoreResults = await checkGitignore()
        checkResults.push({
          title: 'Check <code>.gitignore</code>',
          results: gitignoreResults
        })

        results.value = checkResults

      } catch (err) {
        console.error('Health check error:', err)
        // Check if it's an authentication error
        if (err.message && err.message.includes('Authentication required')) {
          // Already redirected, just show a message
          error.value = 'Authentication required. Redirecting to login...'
          return
        }
        error.value = `Failed to run health check: ${err.message}`
      } finally {
        isRunning.value = false
      }
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
