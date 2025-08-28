<template>
  <div class="container mt-3">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">
              <i class="bi bi-plus-circle"></i>
              Create New Spec-Up-T Project
            </h4>
            <button @click="goBack" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left"></i> Back
            </button>
          </div>

          <div class="card-body">
            <!-- Project Creation Form -->
            <form @submit.prevent="createProject" v-if="!isCreating && !creationComplete">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="projectName" class="form-label">Project Name <span class="text-danger">*</span></label>
                  <input id="projectName" v-model="projectForm.name" class="form-control"
                    placeholder="e.g., my-spec-project" pattern="[a-zA-Z0-9\-_]+"
                    title="Only letters, numbers, hyphens, and underscores allowed" required>
                  <div class="form-text">Repository name (letters, numbers, hyphens, underscores only)</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="projectDescription" class="form-label">Description</label>
                  <input id="projectDescription" v-model="projectForm.description" class="form-control"
                    placeholder="Brief description of your specification">
                  <div class="form-text">Optional description for the repository</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="isPrivate" class="form-label">Repository Visibility</label>
                  <select id="isPrivate" v-model="projectForm.isPrivate" class="form-select">
                    <option :value="false">Public</option>
                    <option :value="true">Private</option>
                  </select>
                  <div class="form-text">Choose repository visibility</div>
                </div>
              </div>

              <!-- Advanced Options -->
              <div class="card mt-4">
                <div class="card-header">
                  <button type="button" class="btn btn-link p-0 text-decoration-none d-flex align-items-center"
                    @click="showAdvanced = !showAdvanced">
                    <i class="bi" :class="showAdvanced ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                    <span class="ms-2">Advanced Options</span>
                  </button>
                </div>
                <div v-if="showAdvanced" class="card-body">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="specTitle" class="form-label">Specification Title</label>
                      <input id="specTitle" v-model="projectForm.specTitle" class="form-control"
                        placeholder="My Specification">
                      <div class="form-text">Title for your specification document</div>
                    </div>

                    <div class="col-md-6 mb-3">
                      <label for="specVersion" class="form-label">Initial Version</label>
                      <input id="specVersion" v-model="projectForm.specVersion" class="form-control"
                        placeholder="1.0.0">
                      <div class="form-text">Starting version number</div>
                    </div>

                    <div class="col-12 mb-3">
                      <label for="authors" class="form-label">Authors</label>
                      <input id="authors" v-model="projectForm.authors" class="form-control"
                        placeholder="John Doe, Jane Smith">
                      <div class="form-text">Comma-separated list of authors</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" @click="resetForm" class="btn btn-outline-secondary me-2">
                  Reset
                </button>
                <button type="submit" class="btn btn-primary" :disabled="!projectForm.name">
                  <i class="bi bi-rocket"></i>
                  Create Project
                </button>
              </div>
            </form>

            <!-- Creation Progress -->
            <div v-if="isCreating" class="text-center py-5">
              <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Creating project...</span>
              </div>
              <h5>Creating Your Spec-Up-T Project</h5>
              <div class="progress mt-3" style="height: 20px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                  :style="{ width: `${creationProgress}%` }" :aria-valuenow="creationProgress" aria-valuemin="0"
                  aria-valuemax="100">
                  {{ creationProgress }}%
                </div>
              </div>
              <div class="mt-2 text-muted">{{ currentStep }}</div>
            </div>

            <!-- Creation Complete -->
            <div v-if="creationComplete" class="text-center py-4">
              <div class="alert alert-success">
                <i class="bi bi-check-circle-fill fs-1 text-success"></i>
                <h4 class="mt-3">Project Created Successfully!</h4>
                <p class="mb-3">Your new Spec-Up-T project has been created and is ready to use.</p>

                <div class="d-flex justify-content-center gap-3">
                  <button @click="openRepository" class="btn btn-primary">
                    <i class="bi bi-folder-open"></i>
                    Open Project Files
                  </button>
                  <a :href="createdRepoUrl" target="_blank" class="btn btn-outline-primary">
                    <i class="bi bi-github"></i>
                    View on GitHub
                  </a>
                  <a :href="`${createdRepoUrl}/settings/pages`" target="_blank" class="btn btn-outline-secondary">
                    <i class="bi bi-gear"></i>
                    Setup Pages
                  </a>
                  <button @click="createAnother" class="btn btn-outline-secondary">
                    <i class="bi bi-plus"></i>
                    Create Another
                  </button>
                </div>
              </div>

              <!-- Quick Info -->
              <div class="card mt-4 text-start">
                <div class="card-header">
                  <h6 class="mb-0">
                    <i class="bi bi-info-circle"></i>
                    Your Spec-Up-T Project
                  </h6>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <p class="mb-2"><strong>Repository:</strong> {{ projectForm.name }}</p>
                      <p class="mb-2"><strong>Title:</strong> {{ projectForm.specTitle || projectForm.name }}</p>
                      <p class="mb-2"><strong>Version:</strong> {{ projectForm.specVersion || '1.0.0' }}</p>
                    </div>
                    <div class="col-md-6">
                      <p class="mb-2"><strong>Authors:</strong> {{ projectForm.authors || 'Not specified' }}</p>
                      <p class="mb-2"><strong>Actions:</strong> Enabled (from template)</p>
                      <p class="mb-2"><strong>Visibility:</strong> {{ projectForm.isPrivate ? 'Private' : 'Public' }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-3">
                    <small class="text-muted">
                      Click "Open Project Files" above to start editing your specification files, or visit GitHub to set
                      up Pages deployment.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="alert alert-danger mt-4">
              <i class="bi bi-exclamation-triangle"></i>
              <strong>Error:</strong> {{ error }}
            </div>
          </div>
        </div>

        <!-- Info Card -->
        <div class="card mt-4">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-info-circle"></i>
              About Spec-Up-T Projects
            </h6>
          </div>
          <div class="card-body">
            <p class="mb-2">
              Spec-Up-T is a tool for creating beautiful, interactive specification documents from markdown files.
              This wizard will create a new repository with:
            </p>
            <ul class="list-unstyled">
              <li><i class="bi bi-check text-success"></i> Pre-configured Spec-Up-T environment</li>
              <li><i class="bi bi-check text-success"></i> GitHub Actions workflows from template</li>
              <li><i class="bi bi-check text-success"></i> Sample specification structure</li>
              <li><i class="bi bi-check text-success"></i> Ready for GitHub Pages deployment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'CreateSpecUpProject',
  setup() {
    const router = useRouter()

    // Form state
    const projectForm = ref({
      name: '',
      description: '',
      isPrivate: false,
      specTitle: '',
      specVersion: '1.0.0',
      authors: ''
    })

    // UI state
    const showAdvanced = ref(false)
    const isCreating = ref(false)
    const creationComplete = ref(false)
    const creationProgress = ref(0)
    const currentStep = ref('')
    const error = ref('')
    const createdRepoUrl = ref('')

    const resetForm = () => {
      projectForm.value = {
        name: '',
        description: '',
        isPrivate: false,
        specTitle: '',
        specVersion: '1.0.0',
        authors: ''
      }
    }

    const createAnother = () => {
      creationComplete.value = false
      creationProgress.value = 0
      currentStep.value = ''
      error.value = ''
      createdRepoUrl.value = ''
      resetForm()
    }

    const goBack = () => {
      router.push('/')
    }

    const openRepository = () => {
      // Navigate to file explorer with the newly created repository
      const user = JSON.parse(localStorage.getItem('github_user') || '{}')
      if (user.login && projectForm.value.name) {
        // Go to the correct project files route
        router.push({
          path: `/files/${user.login}/${projectForm.value.name}/main`
        })
      }
    }

    // Helper function to check authentication
    const checkAuthAndRedirect = (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('github_token')
        localStorage.removeItem('github_user')
        router.push('/login')
        return true
      }
      return false
    }

    const updateProgress = (progress, step) => {
      creationProgress.value = progress
      currentStep.value = step
    }

    const createRepository = async (token, username) => {
      // Check if repository already exists
      try {
        const checkResponse = await fetch(`https://api.github.com/repos/${username}/${projectForm.value.name}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        if (checkResponse.ok) {
          throw new Error(`Repository '${projectForm.value.name}' already exists in your account. Please choose a different name.`)
        }
      } catch (checkError) {
        // If it's not a "repository exists" error, continue with creation
        if (checkError.message.includes('already exists')) {
          throw checkError
        }
        // 404 is expected if repository doesn't exist, so continue
      }
      
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectForm.value.name,
          description: projectForm.value.description || 'Spec-Up-T project created via GitHubUi',
          private: projectForm.value.isPrivate,
          auto_init: true, // Initialize with a commit so Actions can run
          has_issues: true,
          has_projects: true,
          has_wiki: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Extract specific error messages
        let errorMessage = errorData.message || `Failed to create repository: ${response.statusText}`
        if (errorData.errors && errorData.errors.length > 0) {
          const specificErrors = errorData.errors.map(err => {
            if (err.field && err.code) {
              return `${err.field}: ${err.code} - ${err.message || ''}`
            }
            return err.message || err.code || JSON.stringify(err)
          }).join('; ')
          errorMessage += ` (Details: ${specificErrors})`
        }
        
        throw new Error(errorMessage)
      }

      const repo = await response.json()

      // Enable GitHub Actions permissions for the repository
      try {
        await fetch(`https://api.github.com/repos/${username}/${projectForm.value.name}/actions/permissions`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            enabled: true,
            allowed_actions: "all"
          })
        })

        // Also set workflow permissions to allow Actions to write to the repository
        await fetch(`https://api.github.com/repos/${username}/${projectForm.value.name}/actions/permissions/workflow`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            default_workflow_permissions: "write",
            can_approve_pull_request_reviews: false
          })
        })

        // Wait a moment for permissions to propagate
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (permissionError) {
        console.warn('Could not set Actions permissions:', permissionError)
        // Continue anyway - the user might need to manually enable Actions
      }

      return repo
    }

    const triggerProjectCreationWorkflow = async (token, username, repoName) => {
      // Create a much simpler workflow that uses environment variables to avoid YAML escaping issues
      const workflowContent = `name: Initialize Spec-Up-T Project

on:
  workflow_dispatch:

env:
  PROJECT_NAME: "${projectForm.value.name}"
  PROJECT_DESCRIPTION: "${(projectForm.value.description || 'A Spec-Up-T specification project').replace(/"/g, '')}"
  SPEC_TITLE: "${(projectForm.value.specTitle || projectForm.value.name).replace(/"/g, '')}"
  SPEC_VERSION: "${projectForm.value.specVersion || '1.0.0'}"
  AUTHORS: "${(projectForm.value.authors || '').replace(/"/g, '')}"

jobs:
  initialize:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      actions: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install create-spec-up-t
        run: npm install -g create-spec-up-t

      - name: Create project structure
        run: |
          npx create-spec-up-t temp-project
          # Copy everything except .github/workflows to avoid permission issues
          find temp-project -maxdepth 1 -not -name temp-project -not -name .git -not -name .github -exec cp -r {} . \\;
          # Copy .github directory but exclude workflows
          mkdir -p .github
          find temp-project/.github -maxdepth 1 -not -name .github -not -name workflows -exec cp -r {} .github/ \\; 2>/dev/null || true
          rm -rf temp-project

      - name: Customize configuration
        run: |
          if [ -f "specs.json" ]; then
            node -e "
              const fs = require('fs');
              const config = JSON.parse(fs.readFileSync('specs.json', 'utf8'));
              if (config.specs && config.specs[0]) {
                config.specs[0].title = process.env.SPEC_TITLE;
                config.specs[0].version = process.env.SPEC_VERSION;
                if (process.env.AUTHORS) {
                  config.specs[0].editors = process.env.AUTHORS.split(',').map(a => ({name: a.trim()}));
                }
              }
              fs.writeFileSync('specs.json', JSON.stringify(config, null, 2));
            "
          fi

      - name: Update package.json
        run: |
          if [ -f "package.json" ]; then
            node -e "
              const fs = require('fs');
              const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
              pkg.name = process.env.PROJECT_NAME;
              pkg.description = process.env.PROJECT_DESCRIPTION;
              pkg.version = process.env.SPEC_VERSION;
              fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
            "
          fi

      - name: Update README
        run: |
          if [ -f "README.md" ]; then
            echo "# $PROJECT_NAME" > README.md
            if [ -n "$PROJECT_DESCRIPTION" ]; then
              echo "" >> README.md
              echo "$PROJECT_DESCRIPTION" >> README.md
            fi
            if [ -n "$AUTHORS" ]; then
              echo "" >> README.md
              echo "## Authors" >> README.md
              echo "" >> README.md
              echo "$AUTHORS" >> README.md
            fi
          fi

      - name: Commit and push changes
        run: |
          git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          # Show what files we're about to commit for debugging
          echo "Files to be committed:"
          git status --porcelain
          git add .
          git commit -m "Initialize Spec-Up-T project: $PROJECT_NAME" || echo "No changes to commit"
          git push origin main

      - name: Clean up
        run: |
          git rm .github/workflows/initialize-spec-up-t.yml || echo "File not found"
          git commit -m "Remove initialization workflow" || echo "No changes to commit"
          git push origin main || echo "Nothing to push"
`

      // Use the login token (which can be either PAT or OAuth)
      const effectiveToken = token
      
      // Detect if we're using a PAT (login token that starts with ghp_)
      const isUsingPAT = token && token.startsWith('ghp_')

      // Upload the workflow file
      try {
        await uploadFile(
          effectiveToken,
          username,
          repoName,
          '.github/workflows/initialize-spec-up-t.yml',
          workflowContent,
          'Add project initialization workflow'
        )
      } catch (error) {
        // Provide helpful error message based on token type and error
        if (error.message.includes('Not Found') || error.message.includes('insufficient permissions')) {
          if (isUsingPAT) {
            throw new Error(`Failed to create GitHub Actions workflow. Please ensure your Personal Access Token has the following scopes enabled:
• repo (Full control of private repositories)
• workflow (Update GitHub Action workflows)

You can check and update your token scopes at: https://github.com/settings/tokens`)
          } else {
            throw new Error(`Failed to create GitHub Actions workflow. OAuth tokens don't have sufficient permissions for workflow creation. Please use a Personal Access Token with 'repo' and 'workflow' scopes instead.`)
          }
        }
        throw error
      }

      // Trigger the workflow
      const response = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/actions/workflows/initialize-spec-up-t.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${effectiveToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ref: 'main'
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to trigger workflow: ${errorData.message}`)
      }

      return true
    }

    const waitForWorkflowCompletion = async (token, username, repoName, maxWaitTime = 300000) => {
      const startTime = Date.now()

      while (Date.now() - startTime < maxWaitTime) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${username}/${repoName}/actions/runs?per_page=1`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            if (data.workflow_runs && data.workflow_runs.length > 0) {
              const latestRun = data.workflow_runs[0]

              if (latestRun.status === 'completed') {
                if (latestRun.conclusion === 'success') {
                  return true
                } else {
                  throw new Error(`Workflow failed with conclusion: ${latestRun.conclusion}`)
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error checking workflow status:', err)
        }

        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      throw new Error('Workflow did not complete within the expected time')
    }

    // Helper function to safely encode UTF-8 strings to Base64
    const encodeToBase64 = (str) => {
      try {
        // First try btoa for simple ASCII content
        return btoa(str)
      } catch (e) {
        // If btoa fails, use TextEncoder to handle UTF-8
        const encoder = new TextEncoder()
        const bytes = encoder.encode(str)
        let binary = ''
        bytes.forEach(byte => {
          binary += String.fromCharCode(byte)
        })
        return btoa(binary)
      }
    }

    const uploadFile = async (token, username, repoName, filePath, content, message) => {
      const response = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            content: encodeToBase64(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        
        // Check for permission-related errors
        if (response.status === 403 || response.status === 404) {
          throw new Error(`Failed to upload ${filePath}: ${errorData.message}`)
        }
        
        throw new Error(`Failed to upload ${filePath}: ${errorData.message}`)
      }

      return await response.json()
    }

    // Read specs.json from the created repository and return specs[0].output_path or a sensible default
    const getSpecsOutputPath = async (token, username, repoName) => {
      try {
        const resp = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/specs.json`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })

        if (!resp.ok) {
          // If not found or forbidden, default to 'docs'
          return '/docs'
        }

        const data = await resp.json()
        if (!data.content) return '/docs'

        const b64 = (data.content || '').replace(/\n/g, '')
        let jsonStr = ''
        try {
          jsonStr = atob(b64)
        } catch (e) {
          // Fallback decode for UTF-8
          const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
          jsonStr = new TextDecoder().decode(bytes)
        }

        const config = JSON.parse(jsonStr)
        const outputPath = config?.specs?.[0]?.output_path
        if (typeof outputPath === 'string' && outputPath.trim()) {
          const path = outputPath.trim()
          return path.startsWith('/') ? path : `/${path}`
        }
        return '/docs'
      } catch (e) {
        console.warn('Could not read specs.json output_path, defaulting to /docs:', e)
        return '/docs'
      }
    }

    // Enable or update GitHub Pages to deploy from a branch and path
    const configureGitHubPages = async (token, username, repoName, branch, path) => {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      }

      // Normalize candidate paths. GitHub Pages branch sources only support '/' or '/docs'.
      const norm = (p) => {
        if (!p) return '/docs'
        const t = p.trim()
        const withSlash = t.startsWith('/') ? t : `/${t}`
        return withSlash === '/' || withSlash === '/docs' ? withSlash : withSlash
      }
      const requestedPath = norm(path)
      const candidates = Array.from(new Set([requestedPath, '/docs', '/']))

      // Determine whether a Pages site already exists
      const existsResp = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
        method: 'GET',
        headers
      })

      const siteExists = existsResp.ok

      const tryConfigure = async (candidatePath, method) => {
        const body = JSON.stringify({
          build_type: 'legacy',
          source: { branch, path: candidatePath }
        })
        const resp = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
          method,
          headers,
          body
        })
        return resp
      }

      // Try to create or update using candidate paths
      let lastErr = null
      for (const candidate of candidates) {
        try {
          let resp
          if (!siteExists) {
            resp = await tryConfigure(candidate, 'POST')
            if (resp.status === 422) {
              // Possibly invalid path or conflicting mode; try next candidate
              lastErr = await resp.text()
              continue
            }
            if (!resp.ok) {
              lastErr = await resp.text()
              // If creation fails with conflict, attempt update path
              if (resp.status === 409 || resp.status === 403) {
                const upd = await tryConfigure(candidate, 'PUT')
                if (upd.ok) return true
                lastErr = await upd.text()
                continue
              }
              continue
            }
            return true
          } else {
            resp = await tryConfigure(candidate, 'PUT')
            if (resp.status === 422) {
              lastErr = await resp.text()
              continue
            }
            if (!resp.ok) {
              lastErr = await resp.text()
              continue
            }
            return true
          }
        } catch (e) {
          lastErr = e?.message || String(e)
          continue
        }
      }

      throw new Error(`Failed to configure GitHub Pages: ${lastErr || 'unknown error'}`)
    }

    // Set the repository homepage to the GitHub Pages URL (Website field)
    const setRepositoryHomepage = async (token, username, repoName) => {
      const pagesUrl = `https://${username}.github.io/${repoName}/`
      const resp = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ homepage: pagesUrl })
      })

      if (!resp.ok) {
        const err = await resp.text()
        throw new Error(`Failed to set repository Website: ${err}`)
      }
      return pagesUrl
    }

    const fetchMenuYmlFromBoilerplate = async () => {
      const boilerplateUrl = 'https://raw.githubusercontent.com/blockchainbird/spec-up-t/master/src/install-from-boilerplate/boilerplate/.github/workflows/menu.yml'
      
      try {
        const response = await fetch(boilerplateUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch menu.yml: ${response.statusText}`)
        }
        
        return await response.text()
      } catch (error) {
        console.error('Error fetching menu.yml from boilerplate:', error)
        throw new Error(`Could not retrieve menu.yml from boilerplate: ${error.message}`)
      }
    }

    const addWorkflowFilesFromTemplate = async (token, username, repoName) => {
      try {
        // Fetch menu.yml content from the boilerplate repository
        const menuYmlContent = await fetchMenuYmlFromBoilerplate()
        
        // Use the login token for uploading workflow file
        const patToken = token
        
        // Detect if we're using a PAT (login token that starts with ghp_)
        const isUsingPAT = token && token.startsWith('ghp_')
        
        try {
          // Upload the menu.yml workflow file
          await uploadFile(
            patToken,
            username,
            repoName,
            '.github/workflows/menu.yml',
            menuYmlContent,
            'Add menu.yml workflow from boilerplate'
          )
          
        } catch (uploadError) {
          // If upload fails and we're not using PAT, provide helpful error message
          if (!isUsingPAT && (uploadError.message.includes('insufficient permissions') || uploadError.message.includes('Not Found'))) {
            console.warn('Failed to upload menu.yml workflow file due to permissions. This is non-critical.')
            // Don't throw error for menu.yml - it's not critical for project creation
            return
          }
          throw uploadError
        }
        
      } catch (error) {
        console.error('Failed to add workflow files:', error.message)
        
        // Don't fail the entire project creation if workflow upload fails
        // Just log the error and continue
        if (error.message.includes('insufficient permissions') || error.message.includes('Not Found')) {
          console.warn('Workflow file upload failed - this is non-critical for project setup')
          return
        }
        
        throw new Error(`Failed to add workflow files: ${error.message}`)
      }
    }

    const createProject = async () => {
      try {
        isCreating.value = true
        error.value = ''
        creationProgress.value = 0

        const token = localStorage.getItem('github_token')
        const user = JSON.parse(localStorage.getItem('github_user') || '{}')

        if (!token || !user.login) {
          throw new Error('No GitHub authentication found')
        }

        updateProgress(10, 'Creating GitHub repository...')

        // Create the repository
        const repo = await createRepository(token, user.login)
        createdRepoUrl.value = repo.html_url

        updateProgress(25, 'Setting up project initialization workflow...')

        // Trigger the NPX-based project creation workflow
        await triggerProjectCreationWorkflow(token, user.login, projectForm.value.name)

        updateProgress(40, 'Running npx create-spec-up-t...')

        // Wait for the workflow to complete
        await waitForWorkflowCompletion(token, user.login, projectForm.value.name)

        updateProgress(80, 'Fetching and adding menu.yml workflow from template...')
        /*
          Fetch and add the menu.yml workflow file from the boilerplate repository.
          The web app uses a PAT to fetch the file content directly and upload it to the repository.

          How it now works:
          1. Repository Creation: Creates empty GitHub repository with proper permissions
          2. Project Initialization: Runs npx create-spec-up-t but excludes workflow files
          3. Content Customization: Updates specs.json, package.json, README.md with user details
          4. Main Content Commit: Commits all project files except workflows
          5. Workflow File Addition: Fetches menu.yml from boilerplate and uploads via GitHub API using PAT
          6. Cleanup: Removes the initialization workflow
        */

        await addWorkflowFilesFromTemplate(token, user.login, projectForm.value.name)

        updateProgress(85, 'Configuring GitHub Pages (Deploy from a branch)...')

        // Determine branch and output path
        const branch = repo?.default_branch || 'main'
        const outputPath = await getSpecsOutputPath(token, user.login, projectForm.value.name)

        // Try using PAT if available and token fails
        const effectiveToken = token

        try {
          await configureGitHubPages(effectiveToken, user.login, projectForm.value.name, branch, outputPath)
        } catch (pagesErr) {
          console.warn('Could not auto-configure GitHub Pages. You may set it manually in Settings > Pages.', pagesErr)
          // Non-fatal: continue setup; user can configure Pages manually
        }

        updateProgress(90, 'Linking repository Website to GitHub Pages URL...')

        try {
          await setRepositoryHomepage(effectiveToken, user.login, projectForm.value.name)
        } catch (homeErr) {
          console.warn('Could not set repository Website field:', homeErr)
          // Non-fatal; continue
        }

        updateProgress(95, 'Finalizing project setup...')

        // Small delay for final setup
        await new Promise(resolve => setTimeout(resolve, 1000))

        updateProgress(100, 'Project created successfully!')

        // Show completion
        setTimeout(() => {
          creationComplete.value = true
          isCreating.value = false
        }, 500)

      } catch (err) {
        console.error('Error creating project:', err)
        console.error('Error details:', { 
          message: err.message, 
          stack: err.stack,
          name: err.name
        })
        isCreating.value = false

        if (checkAuthAndRedirect(err)) {
          return
        }

        // Provide more specific error messages
        if (err.message.includes('Failed to create repository')) {
          error.value = `Repository creation failed: ${err.message}`
        } else if (err.message.includes('No GitHub authentication')) {
          error.value = 'Authentication error: Please log in again with your GitHub token.'
        } else {
          error.value = `Project creation failed: ${err.message}`
        }
        
        creationProgress.value = 0
        currentStep.value = ''
      }
    }

    return {
      projectForm,
      showAdvanced,
      isCreating,
      creationComplete,
      creationProgress,
      currentStep,
      error,
      createdRepoUrl,
      resetForm,
      createAnother,
      goBack,
      openRepository,
      createProject
    }
  }
}
</script>

<style scoped>
.progress {
  background-color: #e9ecef;
}

.card-header .btn-link {
  color: inherit;
  text-decoration: none;
}

.card-header .btn-link:hover {
  color: #0d6efd;
}

.list-group-numbered {
  counter-reset: section;
}

.list-group-numbered .list-group-item::before {
  counter-increment: section;
  content: counter(section);
}

.alert {
  border-left: 4px solid;
}

.alert-success {
  border-left-color: #198754;
}

.alert-danger {
  border-left-color: #dc3545;
}

.spinner-border {
  animation: spinner-border 1s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
