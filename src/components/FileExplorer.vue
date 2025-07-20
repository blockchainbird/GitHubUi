<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-folder"></i>
        {{ owner }}/{{ repo }} - Spec Files
      </h2>
      <button @click="$router.push('/home')" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i>
        Back to Home
      </button>
    </div>
    
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading spec files...</p>
    </div>
    
    <div v-else-if="specDirectory">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-folder-fill"></i>
            Spec Directory: {{ specDirectory }}
          </h5>
        </div>
        <div class="card-body">
          <div v-if="files.length === 0" class="text-center py-4">
            <i class="bi bi-folder2-open" style="font-size: 3rem; color: #6c757d;"></i>
            <p class="mt-2 text-muted">No files found in the spec directory.</p>
          </div>
          
          <div v-else class="list-group list-group-flush">
            <button
              v-for="file in files"
              :key="file.path"
              @click="openFile(file)"
              class="list-group-item list-group-item-action d-flex align-items-center"
            >
              <i class="bi bi-file-text me-3" style="color: #0d6efd;"></i>
              <div class="flex-grow-1">
                <div class="fw-medium">{{ file.name }}</div>
                <small class="text-muted">{{ file.path }}</small>
              </div>
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'FileExplorer',
  props: ['owner', 'repo'],
  setup(props) {
    const router = useRouter()
    const loading = ref(true)
    const error = ref('')
    const specDirectory = ref('')
    const files = ref([])
    
    const loadSpecsConfig = async () => {
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        
        // Try to get specs.json from repository root
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/specs.json`,
          config
        )
        
        // Decode base64 content
        const content = JSON.parse(atob(response.data.content))
        specDirectory.value = content.spec_directory || 'spec'
        
        await loadSpecFiles()
        
      } catch (err) {
        console.error('Error loading specs config:', err)
        if (err.response?.status === 404) {
          error.value = 'specs.json file not found in repository root. Using default "specs" directory.'
          specDirectory.value = 'specs'
          await loadSpecFiles()
        } else {
          error.value = 'Failed to load repository configuration.'
        }
      }
    }
    
    const loadSpecFiles = async () => {
      try {
        const token = localStorage.getItem('github_token')
        const config = {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
        
        // Get files from spec directory
        const response = await axios.get(
          `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${specDirectory.value}`,
          config
        )
        
        // Filter for text files (md, txt, etc.)
        const textFileExtensions = ['.md', '.txt', '.rst', '.adoc', '.html']
        files.value = response.data
          .filter(file => file.type === 'file')
          .filter(file => textFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext)))
          .map(file => ({
            name: file.name,
            path: file.path,
            sha: file.sha,
            download_url: file.download_url
          }))
        
      } catch (err) {
        console.error('Error loading spec files:', err)
        if (err.response?.status === 404) {
          error.value = `Spec directory "${specDirectory.value}" not found in repository.`
        } else {
          error.value = 'Failed to load spec files.'
        }
      } finally {
        loading.value = false
      }
    }
    
    const openFile = (file) => {
      const encodedPath = encodeURIComponent(file.path)
      router.push(`/editor/${props.owner}/${props.repo}/${encodedPath}`)
    }
    
    onMounted(() => {
      loadSpecsConfig()
    })
    
    return {
      loading,
      error,
      specDirectory,
      files,
      openFile
    }
  }
}
</script>
