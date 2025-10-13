/**
 * Composable for health check operations using spec-up-t-healthcheck
 * Handles repository health validation and analysis via GitHub API
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { secureTokenManager } from '../utils/secureTokenManager.js'
import { runHealthChecks } from 'spec-up-t-healthcheck/web'

export function useHealthCheck(props) {
  const router = useRouter()
  
  // State
  const isRunning = ref(false)
  const error = ref('')
  const results = ref([])
  const timestamp = ref('')
  const showPassing = ref(true)

  /**
   * Creates a GitHub provider that implements the spec-up-t-healthcheck provider interface
   * This allows the health check system to work with repositories hosted on GitHub
   */
  const createGitHubProvider = (owner, repo, branch) => {
    const provider = {
      type: 'github',
      repoPath: owner + '/' + repo + '/' + branch,
      
      getBasePath() {
        return this.repoPath;
      },

      async readFile(filePath) {
        try {
          const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + filePath + '?ref=' + branch;
          const response = await axios.get(url, {
            headers: {
              'Authorization': 'token ' + secureTokenManager.getToken(),
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          return atob(response.data.content);
        } catch (error) {
          if (checkAuthAndRedirect(error)) {
            throw new Error('Authentication required - redirecting to login');
          }
          throw new Error('File not found: ' + filePath);
        }
      },

      async fileExists(filePath) {
        try {
          const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + filePath + '?ref=' + branch;
          await axios.get(url, {
            headers: {
              'Authorization': 'token ' + secureTokenManager.getToken(),
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          return true;
        } catch (error) {
          if (checkAuthAndRedirect(error)) {
            throw new Error('Authentication required - redirecting to login');
          }
          return false;
        }
      },

      async directoryExists(dirPath) {
        try {
          const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + dirPath + '?ref=' + branch;
          const response = await axios.get(url, {
            headers: {
              'Authorization': 'token ' + secureTokenManager.getToken(),
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          // Check if it's an array (directory) or if the type indicates a directory
          return Array.isArray(response.data) || (response.data && response.data.type === 'dir');
        } catch (error) {
          if (checkAuthAndRedirect(error)) {
            throw new Error('Authentication required - redirecting to login');
          }
          return false;
        }
      },

      async listFiles(dirPath = '') {
        try {
          const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + dirPath + '?ref=' + branch;
          const response = await axios.get(url, {
            headers: {
              'Authorization': 'token ' + secureTokenManager.getToken(),
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (!Array.isArray(response.data)) {
            return [];
          }
          
          return response.data.map(item => ({
            name: item.name,
            path: item.path,
            isDirectory: item.type === 'dir',
            isFile: item.type === 'file'
          }));
        } catch (error) {
          if (checkAuthAndRedirect(error)) {
            throw new Error('Authentication required - redirecting to login');
          }
          return [];
        }
      }
    };
    
    return provider;
  }

  // Helper functions
  const checkAuthAndRedirect = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      router.push('/login')
      return true
    }
    return false
  }

  // Computed properties
  const filteredResults = computed(() => {
    if (showPassing.value) return results.value
    
    return results.value
      .map(section => ({
        ...section,
        results: section.results.filter(result => !result.success || result.success === 'partial')
      }))
      .filter(section => section.results.length > 0)
  })

  /**
   * Converts spec-up-t-healthcheck results to the format expected by the UI
   */
  const convertHealthCheckResults = (healthCheckResults) => {
    console.log('Converting health check results:', healthCheckResults)
    
    if (!healthCheckResults || !healthCheckResults.results) {
      console.log('No results found')
      return []
    }

    const sections = []
    const results = healthCheckResults.results
    console.log('Results array:', results)

    // Group results by check type or create sections based on the report structure
    const checkGroups = {}
    
    if (results && Array.isArray(results)) {
      console.log('Processing results array:', results)
      results.forEach(result => {
        const groupName = result.check || 'General'
        if (!checkGroups[groupName]) {
          checkGroups[groupName] = []
        }
        
        // Convert the result format
        checkGroups[groupName].push({
          name: result.check || 'Unknown Check',
          success: result.status === 'pass',
          details: result.message || '',
          status: result.status === 'warn' ? 'warning' : undefined
        })
      })
    } else {
      console.log('No results array found')
    }

    // Convert groups to sections
    Object.entries(checkGroups).forEach(([groupName, groupResults]) => {
      sections.push({
        title: groupName.charAt(0).toUpperCase() + groupName.slice(1).replace('-', ' '),
        results: groupResults
      })
    })

    console.log('Final sections:', sections)
    return sections
  }

  /**
   * Main function to run health checks using spec-up-t-healthcheck
   */
  const runHealthCheck = async () => {
    isRunning.value = true
    error.value = ''
    results.value = []

    try {
      console.log('Starting health check for:', props.owner, props.repo, props.branch)
      
      // Create GitHub provider
      const provider = createGitHubProvider(props.owner, props.repo, props.branch)
      console.log('Created provider:', provider.type, provider.repoPath)
      
      // Test provider functionality
      console.log('Testing provider.fileExists...')
      const packageExists = await provider.fileExists('package.json')
      console.log('package.json exists:', packageExists)
      
      // Run health checks using the spec-up-t-healthcheck package
      console.log('Running health checks...')
      const healthCheckResults = await runHealthChecks(provider, {
        checks: ['package-json', 'spec-files', 'specs-json', 'gitignore']
      })
      console.log('Health check results:', healthCheckResults)

      // Convert results to UI format
      results.value = convertHealthCheckResults(healthCheckResults)
      timestamp.value = new Date().toLocaleString()
      
      console.log('Converted results:', results.value)

    } catch (err) {
      console.error('Health check failed:', err)
      error.value = err.message || 'Health check failed unexpectedly'
    } finally {
      isRunning.value = false
    }
  }

  return {
    isRunning,
    error,
    results,
    timestamp,
    showPassing,
    filteredResults,
    runHealthCheck
  }
}
