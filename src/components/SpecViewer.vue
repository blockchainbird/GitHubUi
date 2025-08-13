<template>
  <div class="container py-3">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="h5 mb-0">
        <i class="bi bi-file-earmark-text me-2"></i>
        The Spec
      </h2>
  <RepoInfo :owner="owner" :repo="repo" :branch="branch" />
      <div class="d-flex gap-2">
        <a :href="resolvedSpecUrl" target="_blank" rel="noopener" class="btn btn-outline-primary btn-sm"
          :disabled="!resolvedSpecUrl">
          <i class="bi bi-box-arrow-up-right"></i>
          Open in new tab
        </a>
        <button class="btn btn-outline-secondary btn-sm" @click="reloadIframe" :disabled="!canEmbed">
          <i class="bi bi-arrow-clockwise"></i>
          Reload
        </button>
      </div>
    </div>

    <div v-if="loading" class="alert alert-info py-2">Checking if the specification site exists…</div>

    <div v-else-if="!pagesEnabled" class="alert alert-warning">
      <div class="d-flex align-items-start">
        <i class="bi bi-exclamation-triangle me-2 mt-1"></i>
        <div>
          <strong>Specification not generated yet.</strong>
          <div class="small text-muted">GitHub Pages is not enabled for this repository or hasn’t been published.</div>
          <div v-if="suggestedUrl" class="mt-2">
            You can try opening the expected URL:
            <a :href="suggestedUrl" target="_blank" rel="noopener">{{ suggestedUrl }}</a>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="alert alert-secondary py-1 mb-2 small">
        <i class="bi bi-clock-history me-1"></i>
        <strong>Page modified:</strong>
        <span v-if="indexHtmlCreated">{{ indexHtmlCreated }}</span>
        <span v-else class="text-muted">Loading...</span>
      </div>
      <p class="mt-2 mb-0 small text-muted">
        If the page fails to display due to browser restrictions, use “Open in new tab”.
      </p>

      <div class="border rounded bg-white border-dance" ref="containerRef" style="position:relative;">
        <iframe :key="iframeKey" ref="iframeRef" :src="resolvedSpecUrl" title="Specification"
          style="width: 100%; border: 0; display: block;"></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import RepoInfo from './RepoInfo.vue'

function setIframeHeight(container, iframe) {
  if (!container || !iframe) return;
  const rect = container.getBoundingClientRect();
  const bottom = window.innerHeight;
  const top = rect.top;
  const height = Math.max(0, bottom - top) - 25;
  iframe.style.height = height + 'px';
}

export default {
  name: 'SpecViewer',
  components: { RepoInfo },
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
      default: 'main'
    }
  },
  setup() {
    const route = useRoute()
    const loading = ref(true)
    const pagesEnabled = ref(false)
    const baseSpecUrl = ref('')
    const cacheBuster = ref(Date.now())
    const iframeKey = ref(0)
    const iframeRef = ref(null)
    const containerRef = ref(null)
    const indexHtmlCreated = ref("")
    // Fetch timestamp of the index.html file being served at baseSpecUrl
    const fetchIndexHtmlCreated = async () => {
      if (!baseSpecUrl.value) return;
      console.log('Fetching timestamp for URL:', baseSpecUrl.value)
      try {
        const proxy = getProxyBase()
        const target = encodeURIComponent(baseSpecUrl.value)
        console.log('Using proxy URL:', `${proxy}${target}`)

        // Try GET request first to get headers including Last-Modified
        const resp = await axios.get(`${proxy}${target}`, {
          validateStatus: () => true,
          timeout: 8000
        })
        console.log('Response status:', resp.status)
        console.log('Response headers:', resp.headers)

        // Check multiple possible header names
        const lastModified = resp.headers['last-modified'] ||
          resp.headers['Last-Modified'] ||
          resp.headers['lastmodified']
        console.log('Last-Modified header:', lastModified)

        if (lastModified) {
          const d = new Date(lastModified)
          if (!isNaN(d.getTime())) {
            const pad = n => n.toString().padStart(2, '0')
            indexHtmlCreated.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
            console.log('Set indexHtmlCreated to:', indexHtmlCreated.value)
          } else {
            console.log('Invalid date format:', lastModified)
            indexHtmlCreated.value = `Raw: ${lastModified}`
          }
        } else {
          console.log('No Last-Modified header found, trying direct request')
          // Try direct request without proxy
          try {
            const directResp = await axios.head(baseSpecUrl.value, {
              validateStatus: () => true,
              timeout: 8000
            })
            console.log('Direct response headers:', directResp.headers)
            const directLastModified = directResp.headers['last-modified']
            if (directLastModified) {
              const d = new Date(directLastModified)
              const pad = n => n.toString().padStart(2, '0')
              indexHtmlCreated.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
              console.log('Set indexHtmlCreated from direct request to:', indexHtmlCreated.value)
            } else {
              indexHtmlCreated.value = 'No timestamp in headers'
            }
          } catch (directError) {
            console.log('Direct request failed:', directError)
            indexHtmlCreated.value = 'No timestamp available'
          }
        }

      } catch (e) {
        console.error('Failed to fetch index.html timestamp:', e)
        indexHtmlCreated.value = 'Error loading timestamp'
      }
    }

    const owner = computed(() => route.params.owner)
    const repo = computed(() => route.params.repo)

    const resolvedSpecUrl = computed(() => {
      if (!baseSpecUrl.value) return ''
      try {
        const url = new URL(baseSpecUrl.value)
        url.searchParams.set('_cb', cacheBuster.value.toString())
        return url.toString()
      } catch (_) {
        // If URL constructor fails, fallback to original URL
        return baseSpecUrl.value
      }
    })

    const suggestedUrl = computed(() => {
      if (owner.value && repo.value) {
        return `https://${owner.value}.github.io/${repo.value}/`
      }
      return ''
    })

    const canEmbed = computed(() => pagesEnabled.value && !!resolvedSpecUrl.value)

    const getProxyBase = () => {
      const basePath = import.meta.env.VITE_BASE_PATH || '/'
      if (import.meta.env.VITE_PROXY_URL) return import.meta.env.VITE_PROXY_URL
      return basePath.endsWith('/') ? basePath + 'proxy.php?url=' : basePath + '/proxy.php?url='
    }

    const checkUrlViaProxy = async (url) => {
      try {
        const proxy = getProxyBase()
        const target = encodeURIComponent(url)
        const resp = await axios.get(`${proxy}${target}`, { validateStatus: () => true, timeout: 8000 })
        return resp.status
      } catch (_) {
        return 0
      }
    }

    const checkGitHubPages = async () => {
      loading.value = true
      pagesEnabled.value = false
      baseSpecUrl.value = ''
      try {
        // Requires repo read access; use token if present
        const token = localStorage.getItem('github_token')
        const headers = token ? { Authorization: `token ${token}` } : {}
        const { data } = await axios.get(`https://api.github.com/repos/${owner.value}/${repo.value}/pages`, { headers })
        // data.html_url typically ends with a trailing slash
        if (data && data.html_url) {
          pagesEnabled.value = true
          baseSpecUrl.value = data.html_url
        } else {
          // Fallback to the conventional URL if html_url missing
          pagesEnabled.value = true
          baseSpecUrl.value = suggestedUrl.value
        }
        // Double-check the resolved URL actually returns 200, otherwise treat as not ready yet
        if (baseSpecUrl.value) {
          const status = await checkUrlViaProxy(baseSpecUrl.value)
          if (status && status >= 400) {
            pagesEnabled.value = false
          }
        }
      } catch (err) {
        // 404 means Pages not enabled; treat as not generated yet
        pagesEnabled.value = false
        baseSpecUrl.value = ''
        console.debug('SpecViewer: GitHub Pages check failed', err?.response?.status)
      } finally {
        loading.value = false
      }
    }

    const reloadIframe = () => {
      // Update cache buster to force URL change and reload
      cacheBuster.value = Date.now()
      // Also bump key to force iframe recreation
      iframeKey.value += 1
    }


    function resizeHandler() {
      setIframeHeight(containerRef.value, iframeRef.value)
    }

    onMounted(() => {
      checkGitHubPages().then(() => {
        // Fetch timestamp after we have the baseSpecUrl
        if (baseSpecUrl.value) {
          fetchIndexHtmlCreated()
        }
      })
      window.addEventListener('resize', resizeHandler)
      // Set initial height after next tick
      setTimeout(resizeHandler, 0)
    })

    // Watch for iframeKey changes to re-apply height after reload
    // (not using watch() to keep code simple and low complexity)
    setInterval(() => {
      setIframeHeight(containerRef.value, iframeRef.value)
    }, 1000)

    return {
      loading,
      pagesEnabled,
      resolvedSpecUrl,
      suggestedUrl,
      canEmbed,
      iframeKey,
      iframeRef,
      containerRef,
      reloadIframe,
      indexHtmlCreated
    }
  }
}
</script>

<style scoped>
.ratio {
  background-color: #fff;
}

.border-dance {
  position: relative;
  padding: 10px;
}

.border-dance::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
  padding: 0;
  background:
    linear-gradient(90deg, rgb(189, 189, 249) 50%, transparent 50%) repeat-x,
    linear-gradient(90deg, rgb(189, 189, 249) 50%, transparent 50%) repeat-x,
    linear-gradient(0deg, rgb(189, 189, 249) 50%, transparent 50%) repeat-y,
    linear-gradient(0deg, rgb(189, 189, 249) 50%, transparent 50%) repeat-y;
  background-size:
    15px 4px,
    15px 4px,
    4px 15px,
    4px 15px;
  background-position:
    0 0,
    100% 100%,
    0 100%,
    100% 0;
  animation: border-dance 80s linear infinite;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

@keyframes border-dance {
  0% {
    background-position:
      0 0,
      100% 100%,
      0 100%,
      100% 0;
  }

  100% {
    background-position:
      100% 0,
      0 100%,
      0 0,
      100% 100%;
  }
}
</style>
