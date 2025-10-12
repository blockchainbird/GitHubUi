import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Generate build timestamp
  const buildInfo = {
    timestamp: new Date().toISOString(),
    buildDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }
  
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue()],
    define: {
      __BUILD_INFO__: JSON.stringify(buildInfo)
    },
    server: {
      port: 3000,
      open: true
    },
    // Optimize dependency handling for spec-up-t-healthcheck
    optimizeDeps: {
      include: ['spec-up-t-healthcheck/web', 'axios']
    },
    resolve: {
      dedupe: ['axios'] // Prevent duplicate axios instances between packages
    },
    // sets the Rollup output option manualChunks to undefined during the build process. This disables code splitting for dynamic imports, so all code will be bundled into a single output file instead of splitting into multiple chunks. This can be useful if you want a single JavaScript file for deployment, but it may increase the bundle size and affect loading performance for larger apps.
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})
