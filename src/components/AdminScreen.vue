<template>
  <div class="admin-screen container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Admin Configuration</h2>
            <!-- Repository Info Row -->
            <div class="repository-info d-flex align-items-center text-muted">
              <i class="bi bi-github me-2"></i>
              <code class="bg-light px-2 py-1 rounded border">{{ owner }}/{{ repo }}</code>
              <span class="mx-2">•</span>
              <span class="badge bg-secondary">{{ branch }}</span>
            </div>
          </div>
          <!-- <button @click="$router.go(-1)" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i>
            Back
          </button> -->
        </div>

        <div v-if="error" class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle"></i>
          {{ error }}
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading configuration from repository...</p>
        </div>

        <div v-if="!loading" class="card">
          <div class="card-header">
            <h5>Specs Configuration</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveConfiguration">
              <div v-for="(spec, index) in specs" :key="index" class="spec-entry mb-4 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6>Specification {{ index + 1 }}</h6>
                  <button type="button" class="btn btn-outline-danger btn-sm" @click="removeSpec(index)"
                    v-if="specs.length > 1">
                    <i class="bi bi-trash"></i> Remove
                  </button>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label :for="`title-${index}`" class="form-label">Title</label>
                    <input type="text" class="form-control" :id="`title-${index}`" v-model="spec.title" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label :for="`author-${index}`" class="form-label">Author</label>
                    <input type="text" class="form-control" :id="`author-${index}`" v-model="spec.author" required>
                  </div>
                </div>

                <div class="mb-3">
                  <label :for="`description-${index}`" class="form-label">Description</label>
                  <textarea class="form-control" :id="`description-${index}`" v-model="spec.description" rows="3"
                    required></textarea>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label :for="`logo-${index}`" class="form-label">Logo URL</label>
                    <input type="url" class="form-control" :id="`logo-${index}`" v-model="spec.logo" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label :for="`logo-link-${index}`" class="form-label">Logo Link</label>
                    <input type="url" class="form-control" :id="`logo-link-${index}`" v-model="spec.logo_link" required>
                  </div>
                </div>

                <div class="mb-3">
                  <label :for="`favicon-${index}`" class="form-label">Favicon URL</label>
                  <input type="url" class="form-control" :id="`favicon-${index}`" v-model="spec.favicon" required>
                </div>

                <div class="mb-3">
                  <label :for="`anchorsymbol-${index}`" class="form-label">Anchor Symbol</label>
                  <input type="text" class="form-control" :id="`anchorsymbol-${index}`" v-model="spec.anchor_symbol" required>
                </div>

                <div class="source-section">
                  <label class="form-label">
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    Source Configuration
                    <span class="badge bg-warning text-dark ms-2">DANGER ZONE</span>
                  </label>
                  <div class="alert alert-warning" role="alert">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>Danger zone:</strong> Make sure you know what you are doing when modifying source
                    configuration.
                  </div>

                  <div class="row">
                    <div class="col-md-4 mb-3">
                      <label :for="`host-${index}`" class="form-label">Host</label>
                      <select class="form-select" :id="`host-${index}`" v-model="spec.source.host" required>
                        <option value="github">GitHub</option>
                        <!-- <option value="gitlab">GitLab</option>
                        <option value="bitbucket">Bitbucket</option> -->
                      </select>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label :for="`account-${index}`" class="form-label">Account</label>
                      <input type="text" class="form-control" :id="`account-${index}`" v-model="spec.source.account"
                        required>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label :for="`repo-${index}`" class="form-label">Repository</label>
                      <input type="text" class="form-control" :id="`repo-${index}`" v-model="spec.source.repo" required>
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center">
                <!-- <button type="button" class="btn btn-outline-primary" @click="addSpec">
                  <i class="bi bi-plus-circle"></i> Add Specification
                </button> -->

                <div>
                  <button type="button" class="btn btn-outline-secondary me-2" @click="loadConfiguration">
                    <i class="bi bi-arrow-clockwise"></i> Reload
                  </button>
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="bi bi-save"></i>
                    {{ saving ? 'Saving...' : 'Save Configuration' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- <div class="mt-4">
          <div class="card">
            <div class="card-header">
              <h6>JSON Preview</h6>
            </div>
            <div class="card-body">
              <pre class="bg-light p-3 rounded"><code>{{ JSON.stringify({ specs }, null, 2) }}</code></pre>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'AdminScreen',
  props: {
    owner: {
      type: String,
      required: true
    },
    repo: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const specs = ref([])
    const saving = ref(false)
    const loading = ref(false)
    const error = ref('')
    const currentSha = ref('')

    const createDefaultSpec = () => ({
      title: "Spec-Up-T Starterpack",
      description: "Create technical specifications in markdown. Based on the original Spec-Up, extended with Terminology tooling",
      author: "Trust over IP Foundation",
      logo: "https://raw.githubusercontent.com/trustoverip/spec-up-t/refs/heads/master/src/install-from-boilerplate/boilerplate/static/logo.svg",
      logo_link: "https://github.com/trustoverip/spec-up-t",
      favicon: "https://raw.githubusercontent.com/trustoverip/spec-up-t/refs/heads/master/src/install-from-boilerplate/boilerplate/static/favicon.ico",
      anchor_symbol: "§",
      source: {
        host: "github",
        account: "trustoverip",
        repo: "spec-up-t-starter-pack"
      }
    })

    const checkAuthAndRedirect = (err) => {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('github_token')
        localStorage.removeItem('github_user')
        window.location.href = '#/login'
        return true
      }
      return false
    }

    const loadConfiguration = async () => {
      loading.value = true
      error.value = ''

      try {
        const token = localStorage.getItem('github_token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const config = {
          headers: {
            'Authorization': `token ${token}`
          }
        }

        // Load specs.json from the repository
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json?ref=${props.branch}`,
          config
        )

        // Decode base64 content
        const content = JSON.parse(atob(response.data.content))
        specs.value = content.specs || [createDefaultSpec()]
        currentSha.value = response.data.sha

      } catch (err) {
        console.error('Error loading configuration:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        if (err.response?.status === 404) {
          error.value = 'specs.json file not found in repository. Using default configuration.'
          specs.value = [createDefaultSpec()]
          currentSha.value = ''
        } else {
          error.value = 'Failed to load configuration from repository.'
          specs.value = [createDefaultSpec()]
        }
      } finally {
        loading.value = false
      }
    }

    const saveConfiguration = async () => {
      saving.value = true
      error.value = ''

      try {
        const token = localStorage.getItem('github_token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const config = {
          headers: {
            'Authorization': `token ${token}`
          }
        }

        const configData = { specs: specs.value }
        const updateData = {
          message: `Update specs.json configuration`,
          content: btoa(JSON.stringify(configData, null, 2)),
          branch: props.branch
        }

        // Include SHA if we have it (for updates)
        if (currentSha.value) {
          updateData.sha = currentSha.value
        }

        const response = await axios.put(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json`,
          updateData,
          config
        )

        currentSha.value = response.data.content.sha
        alert('Configuration saved successfully to repository!')

      } catch (err) {
        console.error('Error saving configuration:', err)
        if (checkAuthAndRedirect(err)) {
          return
        }
        error.value = 'Failed to save configuration to repository. Please try again.'
      } finally {
        saving.value = false
      }
    }

    const addSpec = () => {
      specs.value.push(createDefaultSpec())
    }

    const removeSpec = (index) => {
      if (specs.value.length > 1) {
        specs.value.splice(index, 1)
      }
    }

    onMounted(() => {
      loadConfiguration()
    })

    return {
      specs,
      saving,
      loading,
      error,
      loadConfiguration,
      saveConfiguration,
      addSpec,
      removeSpec
    }
  }
}
</script>

<style scoped>
.admin-screen {
  padding: 2rem 0;
}

.spec-entry {
  background-color: #f8f9fa;
}

.source-section {
  background-color: #fff3cd;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #ffeaa7;
}

.source-section .alert {
  margin-bottom: 1rem;
}

pre {
  max-height: 400px;
  overflow-y: auto;
}
</style>
