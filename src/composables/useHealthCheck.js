/**
 * Composable for health check operations
 * Handles repository health validation and analysis
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export function useHealthCheck(props) {
  const router = useRouter()
  
  // State
  const isRunning = ref(false)
  const error = ref('')
  const results = ref([])
  const timestamp = ref('')
  const showPassing = ref(true)

  // Configuration constants
  const DEFAULT_SPEC_DIR = 'spec'
  const COMMON_TERMS_INTRO_PATHS = [
    'terms-and-definitions-intro.md',
    'spec/terms-and-definitions-intro.md',
    'specs/terms-and-definitions-intro.md'
  ]
  const IMPORTANT_GITIGNORE_PATTERNS = [
    { pattern: 'node_modules', description: 'Node.js dependencies' },
    { pattern: '.cache', description: 'Cache directory' },
    { pattern: 'dist', description: 'Distribution/build directory' }
  ]

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

  // Helper functions
  const getGitHubConfig = () => ({
    headers: {
      'Authorization': `token ${localStorage.getItem('github_token')}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  const checkAuthAndRedirect = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('github_token')
      localStorage.removeItem('github_user')
      router.push('/login')
      return true
    }
    return false
  }

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

  const checkUrlExists = async (url) => {
    try {
      if (url.includes('github.com')) {
        return await checkGitHubUrl(url)
      }
      
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      })
      return response.status >= 200 && response.status < 500
    } catch (error) {
      if (error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
        return 'unknown'
      }
      return false
    }
  }

  const checkGitHubUrl = async (url) => {
    try {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) return false

      const [, owner, repo] = match
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
          timeout: 10000
        }
      )
      return response.status === 200
    } catch (error) {
      return error.response?.status === 404 ? false : 'unknown'
    }
  }

  // Result creation helpers
  const createResult = (name, success, details, status = undefined) => ({
    name,
    success,
    details,
    ...(status && { status })
  })

  const createSection = (title, results) => ({ title, results })

  // Check functions
  const checkRepositoryInfo = async () => {
    const results = []

    try {
      const repoResponse = await axios.get(
        `https://api.github.com/repos/${props.owner}/${props.repo}`,
        getGitHubConfig()
      )

      results.push(createResult(
        'Repository accessible',
        true,
        `Repository: ${repoResponse.data.full_name}`
      ))

      try {
        await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/branches/${props.branch}`,
          getGitHubConfig()
        )
        results.push(createResult(
          'Branch exists',
          true,
          `Branch '${props.branch}' exists`
        ))
      } catch (branchError) {
        if (checkAuthAndRedirect(branchError)) {
          throw new Error('Authentication required - redirecting to login')
        }
        results.push(createResult(
          'Branch exists',
          false,
          `Branch '${props.branch}' not found`
        ))
      }
    } catch (error) {
      if (checkAuthAndRedirect(error)) {
        throw new Error('Authentication required - redirecting to login')
      }
      results.push(createResult(
        'Repository accessible',
        false,
        `Cannot access repository: ${error.message}`
      ))
    }

    return results
  }

  const checkSpecsConfiguration = async () => {
    const results = []

    try {
      const specsContent = await fetchFileContent('specs.json')
      if (!specsContent) {
        results.push(createResult(
          'specs.json exists',
          false,
          'specs.json file not found in repository root'
        ))
        return results
      }

      results.push(createResult('specs.json exists', true, 'specs.json file found'))

      let specs
      try {
        specs = JSON.parse(specsContent)
        results.push(createResult('specs.json is valid JSON', true, 'JSON syntax is valid'))
      } catch (error) {
        results.push(createResult(
          'specs.json is valid JSON',
          false,
          `JSON parsing error: ${error.message}`
        ))
        return results
      }

      if (!Array.isArray(specs.specs)) {
        results.push(createResult(
          'specs.specs is an array',
          false,
          'specs.specs field is missing or not an array'
        ))
      } else {
        results.push(createResult(
          'specs.specs is an array',
          true,
          `Found ${specs.specs.length} spec configuration(s)`
        ))

        // Check logo field inside first spec object
        const firstSpec = specs.specs[0]
        if (firstSpec && firstSpec.logo) {
          const urlPattern = /^(https?:\/\/[^\s]+)$/
          const isValidUrl = urlPattern.test(firstSpec.logo)
          results.push(createResult(
            'logo field is a valid URL',
            isValidUrl,
            isValidUrl ? `logo: ${firstSpec.logo}` : `logo field is not a valid URL: ${firstSpec.logo}`
          ))
          if (isValidUrl) {
            let status = 'unknown'
            try {
              const response = await axios.get(firstSpec.logo, {
                timeout: 5000,
                validateStatus: s => s === 200 || s === 404
              })
              status = response.status
            } catch (err) {
              status = err.response?.status || 'unknown'
            }
            results.push(createResult(
              'logo URL status',
              status === 200,
              `logo URL returned status: ${status}`
            ))
          }
        } else {
          results.push(createResult(
            'logo field exists',
            false,
            'logo field not found in specs.json'
          ))
        }

        if (specs.specs.length > 0) {
          const spec = specs.specs[0]
          const requiredFields = ['spec_directory', 'output_path', 'markdown_paths']
          requiredFields.forEach(field => {
            const isDefined = spec[field] !== undefined
            results.push(createResult(
              `${field} is defined`,
              isDefined,
              isDefined ? `${field}: ${JSON.stringify(spec[field])}` : `${field} is missing from spec configuration`
            ))
          })

          if (spec.source) {
            const sourceFields = ['host', 'account', 'repo']
            sourceFields.forEach(field => {
              const isDefined = !!spec.source[field]
              results.push(createResult(
                `source.${field} is defined`,
                isDefined,
                isDefined ? `${field}: ${spec.source[field]}` : `source.${field} is missing`
              ))
            })
          }
        }
      }
    } catch (error) {
      results.push(createResult(
        'specs.json check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  const checkExternalSpecs = async () => {
    const results = []

    try {
      const specsContent = await fetchFileContent('specs.json')
      
      if (!specsContent) {
        results.push(createResult(
          'External specs check',
          false,
          'Cannot check external specs - specs.json not found'
        ))
        return results
      }

      const specs = JSON.parse(specsContent)
      
      if (!specs.specs || !Array.isArray(specs.specs) || specs.specs.length === 0) {
        results.push(createResult(
          'External specs configuration',
          false,
          'No specs configuration found in specs.json'
        ))
        return results
      }

      const firstSpec = specs.specs[0]
      
      if (firstSpec.external_specs && Array.isArray(firstSpec.external_specs)) {
        if (firstSpec.external_specs.length === 0) {
          results.push(createResult(
            'External specs defined',
            true,
            'No external specs defined (this is normal)'
          ))
        } else {
          results.push(createResult(
            'External specs defined',
            true,
            `Found ${firstSpec.external_specs.length} external spec(s)`
          ))

          for (const [index, spec] of firstSpec.external_specs.entries()) {
            await checkExternalSpecUrl(results, index, spec, 'url')
            await checkExternalSpecUrl(results, index, spec, 'gh_page', 'GitHub page')
            
            checkExternalSpecField(results, index, spec, 'external_spec')
            checkExternalSpecField(results, index, spec, 'terms_dir')
          }
        }
      } else {
        results.push(createResult(
          'External specs configuration',
          true,
          'No external_specs field defined (this is normal if no external specs are used)'
        ))
      }
    } catch (error) {
      results.push(createResult(
        'External specs check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  const checkExternalSpecUrl = async (results, index, spec, field, displayName = 'URL') => {
    if (spec[field]) {
      const urlExists = await checkUrlExists(spec[field])
      let success, details

      if (urlExists === true) {
        success = true
        details = `${displayName}: ${spec[field]} - Accessible`
      } else if (urlExists === 'unknown') {
        success = 'partial'
        details = `${displayName}: ${spec[field]} - Cannot verify accessibility (CORS/Network restriction)`
      } else {
        success = false
        details = `${displayName}: ${spec[field]} - Not accessible or not found`
      }

      results.push(createResult(
        `External spec ${index + 1} ${displayName.toLowerCase()} accessible`,
        success,
        details
      ))
    } else {
      results.push(createResult(
        `External spec ${index + 1} has ${field} field`,
        false,
        `Missing ${field} field`
      ))
    }
  }

  const checkExternalSpecField = (results, index, spec, field) => {
    const hasField = !!spec[field]
    results.push(createResult(
      `External spec ${index + 1} has ${field} field`,
      hasField,
      hasField ? `${field}: ${spec[field]}` : `Missing ${field} field`
    ))
  }

  const checkTermsIntroFile = async () => {
    const results = []

    try {
      let found = false
      let content = ''

      for (const path of COMMON_TERMS_INTRO_PATHS) {
        const fileContent = await fetchFileContent(path)
        if (fileContent) {
          found = true
          content = fileContent
          results.push(createResult(
            'terms-and-definitions-intro.md exists',
            true,
            `Found at ${path}`
          ))
          break
        }
      }

      if (!found) {
        results.push(createResult(
          'terms-and-definitions-intro.md exists',
          false,
          'terms-and-definitions-intro.md not found in common locations'
        ))
        return results
      }

      const hasContent = content.trim().length > 0
      results.push(createResult(
        'terms-and-definitions-intro.md has content',
        hasContent,
        hasContent ? `File contains ${content.length} characters` : 'File is empty'
      ))

      const hasHeaders = content.includes('#')
      results.push(createResult(
        'Contains markdown headers',
        hasHeaders,
        hasHeaders ? 'Markdown headers found' : 'No markdown headers found - consider adding structure',
        hasHeaders ? undefined : 'warning'
      ))
    } catch (error) {
      results.push(createResult(
        'Terms intro file check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  const checkGitignore = async () => {
    const results = []

    try {
      const gitignoreContent = await fetchFileContent('.gitignore')
      
      if (!gitignoreContent) {
        results.push(createResult('.gitignore exists', false, '.gitignore file not found'))
        return results
      }

      results.push(createResult('.gitignore exists', true, '.gitignore file found'))

      IMPORTANT_GITIGNORE_PATTERNS.forEach(({ pattern, description }) => {
        const hasPattern = gitignoreContent.includes(pattern)
        results.push(createResult(
          `Ignores ${pattern}`,
          hasPattern,
          `${description} ${hasPattern ? 'ignored' : 'not ignored - consider adding'}`,
          hasPattern ? undefined : 'warning'
        ))
      })
    } catch (error) {
      results.push(createResult(
        'Gitignore check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  const checkSpecDirectory = async () => {
    const results = []

    try {
      const specDirectory = await getSpecDirectoryFromConfig() || DEFAULT_SPEC_DIR
      const dirContents = await getDirectoryContents(specDirectory)

      if (!dirContents) {
        results.push(createResult(
          'Spec directory exists',
          false,
          `Spec directory '${specDirectory}' not found`
        ))
        return results
      }

      results.push(createResult(
        'Spec directory exists',
        true,
        `Spec directory '${specDirectory}' found with ${dirContents.length} items`
      ))

      const markdownFiles = dirContents.filter(item =>
        item.type === 'file' && item.name.toLowerCase().endsWith('.md')
      )

      if (markdownFiles.length === 0) {
        results.push(createResult(
          'Markdown files in spec directory',
          false,
          'No markdown files found in spec directory'
        ))
      } else {
        results.push(createResult(
          'Markdown files in spec directory',
          true,
          `Found ${markdownFiles.length} markdown file(s): ${markdownFiles.map(f => f.name).join(', ')}`
        ))

        await checkMarkdownFilesForTerms(results, markdownFiles)
      }

      const subdirs = dirContents.filter(item => item.type === 'dir')
      if (subdirs.length > 0) {
        results.push(createResult(
          'Spec subdirectories',
          true,
          `Found ${subdirs.length} subdirectory(ies): ${subdirs.map(d => d.name).join(', ')}`
        ))
      }
    } catch (error) {
      results.push(createResult(
        'Spec directory check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  const checkMarkdownFilesForTerms = async (results, markdownFiles) => {
    const filesToCheck = markdownFiles.slice(0, 3)
    let totalTermRefs = 0

    for (const file of filesToCheck) {
      const content = await fetchFileContent(file.path)
      if (content) {
        const termRefs = (content.match(/\[\[([^\]]+)\]\]/g) || []).length
        totalTermRefs += termRefs

        if (termRefs > 0) {
          results.push(createResult(
            `${file.name} contains term references`,
            true,
            `Found ${termRefs} term reference(s) in ${file.name}`
          ))
        }
      }
    }

    if (totalTermRefs === 0 && filesToCheck.length > 0) {
      results.push(createResult(
        'Term references in markdown files',
        true,
        'No term references ([[term]]) found in checked files. This may be normal if terms are not used.',
        'warning'
      ))
    }
  }

  const getSpecDirectoryFromConfig = async () => {
    try {
      const specsContent = await fetchFileContent('specs.json')
      if (specsContent) {
        const specs = JSON.parse(specsContent)
        return specs.specs?.[0]?.spec_directory
      }
    } catch (error) {
      // Return null if config can't be read
    }
    return null
  }

  const checkTrefTermReferences = async () => {
    const results = []

    try {
      const specDirectory = await getSpecDirectoryFromConfig() || DEFAULT_SPEC_DIR
      const dirContents = await getDirectoryContents(specDirectory)

      if (!dirContents) {
        results.push(createResult(
          'Term reference check',
          false,
          `Cannot check term references - spec directory '${specDirectory}' not found`
        ))
        return results
      }

      const markdownFiles = dirContents.filter(item =>
        item.type === 'file' && item.name.toLowerCase().endsWith('.md')
      )

      if (markdownFiles.length === 0) {
        results.push(createResult(
          'Term reference check',
          true,
          'No markdown files found to check for term references',
          'warning'
        ))
        return results
      }

      const { allTermRefs, allTermDefs, fileTermRefs } = await analyzeTermsInFiles(markdownFiles)
      
      await addExternalSpecTermInfo(results)
      
      createTermAnalysisResults(results, allTermRefs, allTermDefs, fileTermRefs)
    } catch (error) {
      results.push(createResult(
        'Term reference check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  const analyzeTermsInFiles = async (markdownFiles) => {
    const allTermRefs = new Set()
    const allTermDefs = new Set()
    const fileTermRefs = new Map()

    for (const file of markdownFiles) {
      const content = await fetchFileContent(file.path)
      if (content) {
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

        extractTermDefinitions(content, allTermDefs)
      }
    }

    return { allTermRefs, allTermDefs, fileTermRefs }
  }

  const extractTermDefinitions = (content, allTermDefs) => {
    const lines = content.split('\n')
    
    lines.forEach(line => {
      const trimmedLine = line.trim()

      // Header definitions like "## Term Name"
      const headerMatch = trimmedLine.match(/^#+\s*(.+)$/)
      if (headerMatch) {
        allTermDefs.add(headerMatch[1].trim().toLowerCase())
      }

      // Bold definitions like "**Term Name**:"
      const boldMatch = trimmedLine.match(/^\*\*([^*]+)\*\*\s*:/)
      if (boldMatch) {
        allTermDefs.add(boldMatch[1].trim().toLowerCase())
      }

      // Simple definitions like "Term Name:"
      const simpleMatch = trimmedLine.match(/^([^:]+):\s*$/)
      if (simpleMatch && simpleMatch[1].length < 50) {
        allTermDefs.add(simpleMatch[1].trim().toLowerCase())
      }
    })
  }

  const addExternalSpecTermInfo = async (results) => {
    try {
      const specsContent = await fetchFileContent('specs.json')
      if (specsContent) {
        const specs = JSON.parse(specsContent)
        const externalSpecs = specs.specs?.[0]?.external_specs
        
        if (externalSpecs) {
          externalSpecs.forEach(extSpec => {
            if (extSpec.terms_dir) {
              results.push(createResult(
                'External spec terms available',
                true,
                `External spec "${extSpec.external_spec}" defines terms in "${extSpec.terms_dir}"`
              ))
            }
          })
        }
      }
    } catch (error) {
      // Ignore errors in external spec checking
    }
  }

  const createTermAnalysisResults = (results, allTermRefs, allTermDefs, fileTermRefs) => {
    results.push(createResult(
      'Term references found',
      allTermRefs.size > 0,
      allTermRefs.size === 0 ?
        'No term references ([[term]]) found in markdown files' :
        `Found ${allTermRefs.size} unique term reference(s): ${Array.from(allTermRefs).slice(0, 10).join(', ')}${allTermRefs.size > 10 ? '...' : ''}`,
      allTermRefs.size === 0 ? 'warning' : undefined
    ))

    results.push(createResult(
      'Term definitions found',
      allTermDefs.size > 0,
      allTermDefs.size === 0 ?
        'No term definitions found in markdown files' :
        `Found ${allTermDefs.size} potential term definition(s)`,
      allTermDefs.size === 0 ? 'warning' : undefined
    ))

    const undefinedTerms = new Set()
    allTermRefs.forEach(term => {
      if (!allTermDefs.has(term)) {
        undefinedTerms.add(term)
      }
    })

    if (undefinedTerms.size > 0) {
      results.push(createResult(
        'All term references have definitions',
        false,
        `${undefinedTerms.size} term reference(s) may not have definitions: ${Array.from(undefinedTerms).slice(0, 5).join(', ')}${undefinedTerms.size > 5 ? '...' : ''}. Note: External spec terms cannot be validated from this check.`
      ))
    } else if (allTermRefs.size > 0) {
      results.push(createResult(
        'All term references have definitions',
        true,
        'All term references appear to have corresponding definitions'
      ))
    }

    if (fileTermRefs.size > 0) {
      results.push(createResult(
        'Files with term references',
        true,
        `${fileTermRefs.size} file(s) contain term references: ${Array.from(fileTermRefs.keys()).join(', ')}`
      ))
    }

    const orphanedDefs = new Set()
    allTermDefs.forEach(term => {
      if (!allTermRefs.has(term)) {
        orphanedDefs.add(term)
      }
    })

    if (orphanedDefs.size > 0) {
      results.push(createResult(
        'Unused term definitions',
        true,
        `${orphanedDefs.size} term definition(s) may not be referenced: ${Array.from(orphanedDefs).slice(0, 5).join(', ')}${orphanedDefs.size > 5 ? '...' : ''}. This may be normal if terms are used in external specs.`,
        'warning'
      ))
    }
  }

  // Version comparison helper
  const checkSpecUpTVersion = async () => {
    const results = []

    try {
      // Get local package.json content
      const packageContent = await fetchFileContent('package.json')
      if (!packageContent) {
        results.push(createResult(
          'package.json exists',
          false,
          'package.json file not found in repository root'
        ))
        return results
      }

      results.push(createResult('package.json exists', true, 'package.json file found'))

      let packageData
      try {
        packageData = JSON.parse(packageContent)
      } catch (error) {
        results.push(createResult(
          'package.json is valid JSON',
          false,
          `JSON parsing error: ${error.message}`
        ))
        return results
      }

      results.push(createResult('package.json is valid JSON', true, 'JSON syntax is valid'))

      // Check if spec-up-t is in dependencies
      const specUpTVersion = packageData.dependencies?.['spec-up-t']
      if (!specUpTVersion) {
        results.push(createResult(
          'spec-up-t dependency exists',
          false,
          'spec-up-t not found in dependencies'
        ))
        return results
      }

      results.push(createResult(
        'spec-up-t dependency exists',
        true,
        `Local spec-up-t version: ${specUpTVersion}`
      ))

      // Get latest version from npm registry
      try {
        const npmResponse = await axios.get('https://registry.npmjs.org/spec-up-t/latest', {
          timeout: 10000
        })
        const latestVersion = npmResponse.data.version

        results.push(createResult(
          'Latest spec-up-t version retrieved',
          true,
          `Latest npm version: ${latestVersion}`
        ))

        // Check if local version will install the latest version
        const willInstallLatest = checkVersionCompatibility(specUpTVersion, latestVersion)
        results.push(createResult(
          'spec-up-t version is up to date',
          willInstallLatest,
          willInstallLatest ? 
            `Version ${specUpTVersion} will install latest version ${latestVersion}` :
            `Version ${specUpTVersion} will NOT install latest version ${latestVersion}. Consider updating dependency.`
        ))

      } catch (npmError) {
        results.push(createResult(
          'Latest spec-up-t version check',
          false,
          `Failed to fetch latest version from npm: ${npmError.message}`
        ))
      }

    } catch (error) {
      results.push(createResult(
        'spec-up-t version check failed',
        false,
        `Error: ${error.message}`
      ))
    }

    return results
  }

  // Helper to check if a version range includes the latest version
  const checkVersionCompatibility = (versionRange, latestVersion) => {
    // Remove any whitespace
    const range = versionRange.trim()
    const latest = latestVersion.trim()

    // If exact version match
    if (range === latest) return true

    // Parse version numbers for comparison
    const parseVersion = (version) => {
      const cleaned = version.replace(/^[^\d]*/, '') // Remove leading non-digits (^, ~, etc.)
      const parts = cleaned.split('.').map(Number)
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 }
    }

    const rangeVersion = parseVersion(range)
    const latestParsed = parseVersion(latest)

    // Handle caret range (^1.2.3 - compatible within major version)
    if (range.startsWith('^')) {
      return rangeVersion.major === latestParsed.major &&
             (latestParsed.major > rangeVersion.major ||
              latestParsed.minor > rangeVersion.minor ||
              (latestParsed.minor === rangeVersion.minor && latestParsed.patch >= rangeVersion.patch))
    }

    // Handle tilde range (~1.2.3 - compatible within minor version)
    if (range.startsWith('~')) {
      return rangeVersion.major === latestParsed.major &&
             rangeVersion.minor === latestParsed.minor &&
             latestParsed.patch >= rangeVersion.patch
    }

    // Handle greater than or equal (>=)
    if (range.startsWith('>=')) {
      const rangeNum = parseVersion(range.substring(2))
      return latestParsed.major > rangeNum.major ||
             (latestParsed.major === rangeNum.major && latestParsed.minor > rangeNum.minor) ||
             (latestParsed.major === rangeNum.major && latestParsed.minor === rangeNum.minor && latestParsed.patch >= rangeNum.patch)
    }

    // Handle greater than (>)
    if (range.startsWith('>')) {
      const rangeNum = parseVersion(range.substring(1))
      return latestParsed.major > rangeNum.major ||
             (latestParsed.major === rangeNum.major && latestParsed.minor > rangeNum.minor) ||
             (latestParsed.major === rangeNum.major && latestParsed.minor === rangeNum.minor && latestParsed.patch > rangeNum.patch)
    }

    // Handle less than or equal (<=)
    if (range.startsWith('<=')) {
      return false // Latest version is by definition newer, so <= will not include it
    }

    // Handle less than (<)
    if (range.startsWith('<')) {
      return false // Latest version is by definition newer, so < will not include it
    }

    // If no prefix, treat as exact version
    return range === latest
  }

  // Main health check runner
  const runHealthCheck = async () => {
    isRunning.value = true
    error.value = ''
    results.value = []
    timestamp.value = new Date().toLocaleString()

    try {
      const checkResults = [
        createSection('Repository Information', await checkRepositoryInfo()),
        createSection('Check <code>specs.json</code> configuration', await checkSpecsConfiguration()),
        createSection('Check Spec Directory and Files', await checkSpecDirectory()),
        createSection('Check External Specs URLs', await checkExternalSpecs()),
        createSection('Check Term References ([[term]])', await checkTrefTermReferences()),
        createSection('Check <code>terms-and-definitions-intro.md</code>', await checkTermsIntroFile()),
        createSection('Check <code>.gitignore</code>', await checkGitignore()),
        createSection('Check <code>spec-up-t</code> Version', await checkSpecUpTVersion())
      ]

      results.value = checkResults
    } catch (err) {
      console.error('Health check error:', err)
      if (err.message?.includes('Authentication required')) {
        error.value = 'Authentication required. Redirecting to login...'
        return
      }
      error.value = `Failed to run health check: ${err.message}`
    } finally {
      isRunning.value = false
    }
  }

  return {
    // State
    isRunning,
    error,
    results,
    timestamp,
    showPassing,
    
    // Computed
    filteredResults,
    
    // Methods
    runHealthCheck
  }
}
