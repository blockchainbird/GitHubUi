/**
 * Composable for health check operations using spec-up-t-healthcheck
 * Handles repository health validation and analysis via GitHub API
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { secureTokenManager } from '../utils/secureTokenManager.js'
import { isAuthenticationFailure } from '../utils/authError.js'
import { runHealthChecks } from 'spec-up-t-healthcheck/web'
import { formatResultDetails } from 'spec-up-t-healthcheck/lib/formatters/result-details-formatter.js'
import { checkPublishedPage } from '../utils/webLinkChecker.js'
import { useSoundSystem } from '../composables/useSoundSystem.js'


export function useHealthCheck(props) {
  const router = useRouter()
  const { playSuccessSound } = useSoundSystem()
  
  // State
  const isRunning = ref(false)
  const error = ref('')
  const results = ref([])
  const timestamp = ref('')
  const showPassing = ref(false)
  // True when the health check ran without a GitHub token (public repos only)
  const isAnonymous = ref(!secureTokenManager.getToken())
  
  // Link checker state
  const linkCheckResults = ref(null)
  const isCheckingLinks = ref(false)
  const linkCheckProgress = ref('')

  /**
   * Decodes base64 content from the GitHub Contents API as UTF-8.
   * Bare atob() mangles multi-byte characters, which matters for rendered
   * index.html and terminology files containing non-ASCII text.
   */
  const decodeBase64Content = (content) => {
    const binary = atob(String(content).replace(/\s/g, ''))
    const bytes = Uint8Array.from(binary, char => char.codePointAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  }

  /**
   * Creates a GitHub provider that implements the spec-up-t-healthcheck provider interface
   * This allows the health check system to work with repositories hosted on GitHub
   *
   * The health check is read-only, so a token is optional: public repositories are
   * checked anonymously. Anonymous GitHub API access is capped at 60 requests per
   * hour per IP, so without a token file reads go through raw.githubusercontent.com,
   * which is not part of that budget. Directory listings have no raw equivalent and
   * always use the Contents API.
   */
  const createGitHubProvider = (owner, repo, branch) => {
    const contentsUrl = (path) =>
      'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path + '?ref=' + branch;
    const rawUrl = (path) =>
      'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' + path;

    const apiHeaders = () => {
      const token = secureTokenManager.getToken();
      const headers = { 'Accept': 'application/vnd.github.v3+json' };
      if (token) {
        headers['Authorization'] = 'token ' + token;
      }
      return headers;
    };

    const provider = {
      type: 'github',
      repoPath: owner + '/' + repo + '/' + branch,
      
      getBasePath() {
        return this.repoPath;
      },

      async readFile(filePath) {
        if (!secureTokenManager.getToken()) {
          try {
            // transformResponse keeps JSON files as raw text, which the checks parse themselves
            const response = await axios.get(rawUrl(filePath), {
              transformResponse: [(data) => data]
            });
            return response.data;
          } catch {
            throw new Error('File not found: ' + filePath);
          }
        }

        try {
          const response = await axios.get(contentsUrl(filePath), { headers: apiHeaders() });
          return decodeBase64Content(response.data.content);
        } catch (error) {
          if (checkAuthAndRedirect(error)) {
            throw new Error('Authentication required - redirecting to login');
          }
          throw new Error('File not found: ' + filePath);
        }
      },

      async fileExists(filePath) {
        if (!secureTokenManager.getToken()) {
          try {
            await axios.head(rawUrl(filePath));
            return true;
          } catch {
            return false;
          }
        }

        try {
          await axios.get(contentsUrl(filePath), { headers: apiHeaders() });
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
          const response = await axios.get(contentsUrl(dirPath), { headers: apiHeaders() });
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
          const response = await axios.get(contentsUrl(dirPath), { headers: apiHeaders() });
          
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
    // Anonymous health checks are supported, so there is no session to clear and
    // no reason to bounce to /login when the user never signed in.
    if (!secureTokenManager.getToken()) {
      return false
    }
    if (!isAuthenticationFailure(error)) {
      return false
    }
    secureTokenManager.clearToken()
    localStorage.removeItem('github_token')
    localStorage.removeItem('github_user')
    if (router.currentRoute.value.path !== '/login') {
      localStorage.setItem('intended_redirect', router.currentRoute.value.fullPath)
      router.push('/login')
    }
    return true
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
        
        // Format the details using the shared formatter
        // This creates an HTML string with errors, warnings, and success lists
        let formattedDetails = result.message || ''
        if (result.details && Object.keys(result.details).length > 0) {
          formattedDetails += formatResultDetails(result.details)
        }
        
        // Convert the result format
        checkGroups[groupName].push({
          name: result.check || 'Unknown Check',
          success: result.status === 'pass',
          details: formattedDetails,
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
    isAnonymous.value = !secureTokenManager.getToken()

    try {
      console.log('Starting health check for:', props.owner, props.repo, props.branch)
      
      // Create GitHub provider
      const provider = createGitHubProvider(props.owner, props.repo, props.branch)
      console.log('Created provider:', provider.type, provider.repoPath)
      
      // Test provider functionality
      console.log('Testing provider.fileExists...')
      const packageExists = await provider.fileExists('package.json')
      console.log('package.json exists:', packageExists)

      // Anonymous requests cannot see private repositories, so an unreachable
      // package.json is far more likely to be a permissions issue than a real finding.
      if (!packageExists && isAnonymous.value) {
        error.value =
          `Could not read ${props.owner}/${props.repo} without signing in. ` +
          'If this is a private repository, sign in with a GitHub token and run the check again.'
      }
      
      // Run health checks using the spec-up-t-healthcheck package
      console.log('Running health checks...')
      const requestedChecks = ['package-json', 'spec-files', 'specs-json', 'gitignore', 'spec-directory-and-files', 'external-specs-urls', 'markdown-tables', 'heading-hierarchy', 'term-references']
      const healthCheckResults = await runHealthChecks(provider, {
        checks: requestedChecks,
        timeout: 120000
      })
      console.log('Health check results:', healthCheckResults)

      // Detect silently skipped checks by count only.
      // Do NOT compare result.check to requested IDs: older checks store a
      // human-readable CHECK_NAME (e.g. "package.json") while newer ones use
      // CHECK_ID (e.g. "term-references"), so name/id mismatch is expected.
      const returnedCount = healthCheckResults?.results?.length
        ?? healthCheckResults?.summary?.total
        ?? 0
      if (returnedCount < requestedChecks.length) {
        console.warn(
          `Expected ${requestedChecks.length} health checks but got ${returnedCount}. ` +
          'Some requested check IDs may be missing from the installed spec-up-t-healthcheck package.'
        )
        error.value =
          `Expected ${requestedChecks.length} health checks but only ${returnedCount} ran. ` +
          'Update spec-up-t-healthcheck and rebuild/redeploy the app.'
      }

      // Convert results to UI format
      results.value = convertHealthCheckResults(healthCheckResults)
      timestamp.value = new Date().toLocaleString()
      
      console.log('Converted results:', results.value)

      // Play success sound
      playSuccessSound()

    } catch (err) {
      console.error('Health check failed:', err)
      error.value = err.message || 'Health check failed unexpectedly'
    } finally {
      isRunning.value = false
    }
  }

  /**
   * Run link check on published GitHub Pages URL
   * This checks all links on the published HTML page
   * 
   * @param {string} ghPageUrl - The GitHub Pages URL to check
   */
  const runLinkCheck = async (ghPageUrl) => {
    // Validate URL
    if (!ghPageUrl) {
      error.value = 'No GitHub Pages URL configured. Please add gh_page to your specs.json file.'
      return
    }
    
    isCheckingLinks.value = true
    error.value = ''
    linkCheckProgress.value = 'Starting link check...'
    linkCheckResults.value = null
    
    try {
      console.log('Checking links on:', ghPageUrl)
      
      // Run the web-based link checker
      const results = await checkPublishedPage(ghPageUrl, {
        onProgress: (progress) => {
          console.log(progress.message)
          linkCheckProgress.value = progress.message
        },
        timeout: 10000,
        maxLinks: 100
      })
      
      console.log('Link check results:', results)
      
      // Store results with timestamp
      linkCheckResults.value = {
        timestamp: new Date().toLocaleString(),
        url: ghPageUrl,
        ...results
      }
      
      linkCheckProgress.value = results.summary
      
    } catch (err) {
      console.error('Link check failed:', err)
      error.value = err.message || 'Link check failed unexpectedly'
      linkCheckProgress.value = ''
    } finally {
      isCheckingLinks.value = false
      // Play success sound
      playSuccessSound()

    }
  }

  return {
    isRunning,
    error,
    results,
    timestamp,
    showPassing,
    isAnonymous,
    filteredResults,
    runHealthCheck,
    // Link checker
    linkCheckResults,
    isCheckingLinks,
    linkCheckProgress,
    runLinkCheck
  }
}
